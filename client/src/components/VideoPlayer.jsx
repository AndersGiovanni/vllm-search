import React, { useEffect, useRef, useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle2, Play } from "lucide-react";

/**
 * VideoPlayer Component
 *
 * Embeds a YouTube video player and tracks watch completion.
 * Uses YouTube IFrame API for event handling.
 *
 * Props:
 * - video: Video object with {id, title, url, duration, ...}
 * - onVideoComplete: Callback when video finishes playing
 * - isWatched: Boolean indicating if this video has been watched
 */
export default function VideoPlayer({ video, onVideoComplete, isWatched }) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [hasCompletedThisSession, setHasCompletedThisSession] = useState(false);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;

    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/, // YouTube Shorts format
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const videoId = video ? getYouTubeVideoId(video.url) : null;

  useEffect(() => {
    if (!video || !videoId) {
      return;
    }

    // Load YouTube IFrame API
    const loadYouTubeAPI = () => {
      if (window.YT) {
        initPlayer();
        return;
      }

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    };

    const initPlayer = () => {
      if (!containerRef.current) return;

      // Destroy existing player if present
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => setIsReady(true),
          onStateChange: onPlayerStateChange,
        },
      });
    };

    const onPlayerStateChange = (event) => {
      // YT.PlayerState.ENDED = 0
      if (event.data === 0 && !hasCompletedThisSession) {
        setHasCompletedThisSession(true);
        if (onVideoComplete && video) {
          onVideoComplete(video);
        }
      }
    };

    loadYouTubeAPI();

    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [video, videoId]);

  // Reset completion state when video changes
  useEffect(() => {
    setHasCompletedThisSession(false);
  }, [video?.id]);

  if (!video) {
    return (
      <Card className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500 p-8">
          <Play className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No video selected</p>
          <p className="text-sm mt-2">Click a video thumbnail to start watching</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden">
      {/* Video player */}
      <div className="relative aspect-video bg-black">
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Video info */}
      <div className="p-4 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{video.title}</h3>
            {video.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {video.description}
              </p>
            )}
          </div>

          {isWatched && (
            <Badge variant="default" className="bg-green-600 flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3" />
              Watched
            </Badge>
          )}
        </div>

        {/* Metadata */}
        <div className="flex gap-3 mt-3 text-xs text-gray-500">
          {video.duration && (
            <span>Duration: {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
          )}
          {video.lengthCategory && (
            <span>Category: {video.lengthCategory}</span>
          )}
        </div>
      </div>
    </Card>
  );
}
