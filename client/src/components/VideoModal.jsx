import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * VideoModal Component
 *
 * Full-screen modal for focused video watching with simple tracking:
 * - Click count (modal opens)
 * - Total session time (wall-clock time modal is open)
 * - Active play time (only when video is playing)
 */
export default function VideoModal({ video, isOpen, onClose, onTrackingEvent }) {
  const playerRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const readyTimeoutRef = useRef(null);

  // Simple time tracking
  const sessionStartTime = useRef(null);      // When modal opened (timestamp)
  const playbackStartTime = useRef(null);     // When current playback started (timestamp)
  const accumulatedPlayTime = useRef(0);      // Total play time accumulated this session (seconds)
  const hasEmittedOpenRef = useRef(false);    // Guard to prevent duplicate videoOpened events

  // Watch segment tracking
  const currentSegmentStart = useRef(null);   // { time: number, wallClock: timestamp (Date.now()), playbackRate: number }
  const lastKnownPosition = useRef(null);     // Track last known playback position
  const positionUpdateInterval = useRef(null); // Interval for tracking position during playback
  const allRawSegments = useRef([]);          // Array of all raw segments before processing

  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Extract YouTube video ID from various URL formats
  const extractVideoId = (url) => {
    if (!url) return null;

    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const videoId = video ? extractVideoId(video.url) : null;

  // Initialize session tracking when modal opens
  useEffect(() => {
    if (isOpen && video) {
      sessionStartTime.current = Date.now();
      accumulatedPlayTime.current = 0;
      playbackStartTime.current = null;
      currentSegmentStart.current = null;
      lastKnownPosition.current = null;
      allRawSegments.current = [];
      setPlayerError(null);

      // Only emit videoOpened once per session (guard against infinite re-renders)
      if (!hasEmittedOpenRef.current) {
        hasEmittedOpenRef.current = true;
        onTrackingEvent({
          type: "videoOpened",
          videoId: video.id,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Reset flag when modal closes
    if (!isOpen) {
      hasEmittedOpenRef.current = false;
    }
  }, [isOpen, video, onTrackingEvent]);

  // Initialize YouTube IFrame API
  useEffect(() => {
    if (!isOpen || !videoId) return;

    // Load YouTube IFrame API if not already loaded
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!playerRef.current) return;

      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
      }
      readyTimeoutRef.current = setTimeout(() => {
        setPlayerError({
          code: "timeout",
          message: "The video is taking too long to load.",
        });
      }, 12000);

      playerInstanceRef.current = new window.YT.Player(playerRef.current, {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          origin: window.location.origin,
          host: "https://www.youtube-nocookie.com",
          playsinline: 1,
        },
        events: {
          onReady: handlePlayerReady,
          onStateChange: handlePlayerStateChange,
          onError: handlePlayerError,
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
        readyTimeoutRef.current = null;
      }
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
      }
    };
  }, [isOpen, videoId, retryCount]);

  const handlePlayerReady = (event) => {
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }
    setIsPlayerReady(true);
    setPlayerError(null);
  };

  const handlePlayerError = (event) => {
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }
    const code = event?.data;
    let message = "This video cannot be played right now.";
    if (code === 2) message = "Invalid video ID.";
    if (code === 5) message = "HTML5 player error.";
    if (code === 100) message = "Video not found or removed.";
    if (code === 101 || code === 150) message = "Embedding disabled for this video.";
    setPlayerError({ code, message });
  };

  const handleRetry = () => {
    setPlayerError(null);
    setIsPlayerReady(false);
    setRetryCount((c) => c + 1);
  };

  /**
   * Calculate coverage percentage from segments
   * Returns percentage of unique video content watched (0-100)
   */
  const calculateCoverage = (segments, videoDuration) => {
    if (!segments || segments.length === 0 || !videoDuration) return 0;

    // Use a Set to track unique seconds watched (handles overlapping segments)
    const watchedSeconds = new Set();

    segments.forEach(seg => {
      for (let i = Math.floor(seg.startTime); i < Math.ceil(seg.endTime); i++) {
        watchedSeconds.add(i);
      }
    });

    return Math.round((watchedSeconds.size / videoDuration) * 100);
  };

  /**
   * Process raw watch segments:
   * 1. Filter out segments < 2 seconds (accidental clicks/seeks)
   * 2. Sort by start time
   * 3. Merge nearby segments (gap < 1 second pause or < 5 second seek)
   */
  const processSegments = (rawSegments) => {
    if (!rawSegments || rawSegments.length === 0) return [];

    // Step 1: Filter segments < 2 seconds
    let filtered = rawSegments.filter(seg => seg.duration >= 2);

    if (filtered.length === 0) return [];

    // Step 2: Sort by start time
    filtered.sort((a, b) => a.startTime - b.startTime);

    // Step 3: Merge nearby segments
    const merged = [];
    for (let i = 0; i < filtered.length; i++) {
      const curr = filtered[i];

      if (merged.length === 0) {
        merged.push({ ...curr });
      } else {
        const prev = merged[merged.length - 1];
        const gap = curr.startTime - prev.endTime;

        // Merge if gap < 1 second pause OR < 5 second seek forward
        if (gap < 1 || (gap < 5 && gap >= 0)) {
          // Extend previous segment
          prev.endTime = curr.endTime;
          prev.duration = prev.duration + curr.duration; // Add durations, don't recalculate from positions
          prev.wallClockEnd = curr.wallClockEnd;
          // Keep original playback rate from first segment
        } else {
          merged.push({ ...curr });
        }
      }
    }

    return merged;
  };

  const handlePlayerStateChange = (event) => {
    const state = event.target.getPlayerState();
    const player = playerInstanceRef.current;

    // YouTube API states:
    // -1 = unstarted
    //  0 = ended
    //  1 = playing
    //  2 = paused
    //  3 = buffering
    //  5 = video cued

    if (state === 1) {
      // Video started playing
      if (playbackStartTime.current === null) {
        playbackStartTime.current = Date.now();
      }

      // Start new watch segment
      if (currentSegmentStart.current === null && player) {
        const currentTime = player.getCurrentTime();
        const playbackRate = player.getPlaybackRate();
        currentSegmentStart.current = {
          time: currentTime,
          wallClock: Date.now(), // Store as timestamp for duration calculation
          playbackRate: playbackRate,
        };
        lastKnownPosition.current = currentTime;
      }

      // Start tracking position during playback (update every 500ms)
      if (positionUpdateInterval.current === null && player) {
        positionUpdateInterval.current = setInterval(() => {
          if (playerInstanceRef.current) {
            lastKnownPosition.current = playerInstanceRef.current.getCurrentTime();
          }
        }, 500);
      }
    } else if (state === 2 || state === 0) {
      // Video paused or ended

      // Stop position tracking
      if (positionUpdateInterval.current !== null) {
        clearInterval(positionUpdateInterval.current);
        positionUpdateInterval.current = null;
      }

      if (playbackStartTime.current !== null) {
        const playDuration = (Date.now() - playbackStartTime.current) / 1000;
        accumulatedPlayTime.current += playDuration;
        playbackStartTime.current = null;
      }

      // Close current watch segment
      if (currentSegmentStart.current !== null && player) {
        // Use last known position instead of getCurrentTime() to avoid seek position
        const endPosition = lastKnownPosition.current !== null
          ? lastKnownPosition.current
          : player.getCurrentTime();

        const wallClockDuration = (Date.now() - currentSegmentStart.current.wallClock) / 1000;
        const segment = {
          startTime: currentSegmentStart.current.time,
          endTime: endPosition,
          duration: wallClockDuration, // Use real elapsed time, not video position difference
          playbackRate: currentSegmentStart.current.playbackRate,
          wallClockStart: new Date(currentSegmentStart.current.wallClock).toISOString(),
          wallClockEnd: new Date().toISOString(),
        };
        allRawSegments.current.push(segment);
        currentSegmentStart.current = null;
        lastKnownPosition.current = null;
      }

      // Video ended (state === 0) - we'll calculate completion based on coverage instead
      // No longer emitting videoCompleted here
    }
  };

  const handleClose = () => {
    if (!video || !sessionStartTime.current) return;

    const player = playerInstanceRef.current;

    // If video is currently playing, add that time to accumulated play time
    if (playbackStartTime.current !== null) {
      const playDuration = (Date.now() - playbackStartTime.current) / 1000;
      accumulatedPlayTime.current += playDuration;
    }

    // Stop position tracking if still active
    if (positionUpdateInterval.current !== null) {
      clearInterval(positionUpdateInterval.current);
      positionUpdateInterval.current = null;
    }

    // If there's an open segment, close it before processing
    if (currentSegmentStart.current !== null && player) {
      // Use last known position instead of getCurrentTime() to avoid seek position
      const endPosition = lastKnownPosition.current !== null
        ? lastKnownPosition.current
        : player.getCurrentTime();

      const wallClockDuration = (Date.now() - currentSegmentStart.current.wallClock) / 1000;
      const segment = {
        startTime: currentSegmentStart.current.time,
        endTime: endPosition,
        duration: wallClockDuration, // Use real elapsed time, not video position difference
        playbackRate: currentSegmentStart.current.playbackRate,
        wallClockStart: new Date(currentSegmentStart.current.wallClock).toISOString(),
        wallClockEnd: new Date().toISOString(),
      };
      allRawSegments.current.push(segment);
      currentSegmentStart.current = null;
      lastKnownPosition.current = null;
    }

    // Calculate total session duration (wall-clock time)
    const sessionDuration = (Date.now() - sessionStartTime.current) / 1000;

    // Process watch segments (filter < 2s, merge nearby)
    const processedSegments = processSegments(allRawSegments.current);

    // Calculate coverage to determine if video was watched fully
    const videoDuration = video.duration || 0;
    const coverage = calculateCoverage(processedSegments, videoDuration);

    // Emit videoClosed event with simple metrics + watch segments
    onTrackingEvent({
      type: "videoClosed",
      videoId: video.id,
      sessionDuration: sessionDuration,              // Total time modal was open (seconds)
      playbackDuration: accumulatedPlayTime.current, // Total time video was playing (seconds)
      watchSegments: processedSegments,              // Processed watch segments
      timestamp: new Date().toISOString(),
    });

    // Emit videoCompleted event if coverage >= 95% (watched nearly all of it)
    if (coverage >= 95) {
      onTrackingEvent({
        type: "videoCompleted",
        videoId: video.id,
        coverage: coverage,
        timestamp: new Date().toISOString(),
      });
    }

    // Clean up
    setIsPlayerReady(false);
    setPlayerError(null);
    onClose();
  };

  if (!isOpen || !video) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-black rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Floating in top-right corner */}
        <Button
          onClick={handleClose}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 hover:bg-white/10"
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Video Player - Full height */}
        <div className="flex-1 bg-black flex items-center justify-center">
          <div className="relative w-full aspect-video">
            <div ref={playerRef} className="w-full h-full" />
            {playerError && (
              <div className="absolute inset-0 bg-black/80 text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="text-sm text-gray-300">
                  {playerError.message}
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleRetry} size="sm" variant="secondary">
                    Retry
                  </Button>
                  {video?.url && (
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-md border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10"
                    >
                      Open on YouTube
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
