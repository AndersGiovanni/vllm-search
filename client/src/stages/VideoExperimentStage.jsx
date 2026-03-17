import React, { useState, useEffect, useCallback, useMemo } from "react";
import { usePlayer, useStage, useStageTimer, useGame } from "@empirica/core/player/classic/react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, Clock } from "lucide-react";
import VideoGrid from "../components/VideoGrid";
import VideoModal from "../components/VideoModal";
import ChatInterface from "../components/ChatInterface";
import QuestionPanel from "../components/QuestionPanel";
import { validateResponses } from "../config/questions";
import { getTopicMetadata } from "../config/videos";
import { apiFetch } from "../utils/api";

// Shuffle utility
const shuffle = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

/**
 * VideoExperimentStage Component
 *
 * Main experimental stage with integrated UI for:
 * - Video browsing and watching
 * - LLM chat interface
 * - Question answering
 *
 * All elements are visible simultaneously - users control their own flow.
 */
export default function VideoExperimentStage() {
  const player = usePlayer();
  const stage = useStage();
  const game = useGame();
  const timer = useStageTimer();

  // Get stage configuration from server
  const rawVideos = stage?.get("videos") || [];
  const topic = stage?.get("topic") || "louvre-robbery-2025";
  const chatEnabled = stage?.get("chatEnabled") || false;
  const rawQuestions = stage?.get("selectedQuestions") || [];
  const llmConfig = stage?.get("llmConfig") || "none";

  // Shuffle videos and questions once on mount
  const videos = useMemo(() => shuffle(rawVideos), [rawVideos]);
  const questions = useMemo(() => shuffle(rawQuestions), [rawQuestions]);

  // Get topic metadata
  const { title: topicTitle } = getTopicMetadata(topic);

  // Format timer
  const formatTimer = (seconds) => {
    if (seconds === null || seconds === undefined) {
      return "--:--";
    }

    let out = "";
    const s = seconds % 60;
    out += s < 10 ? "0" + s : s;

    const min = (seconds - s) / 60;
    if (min === 0) {
      return `00:${out}`;
    }

    const m = min % 60;
    out = `${m < 10 ? "0" + m : m}:${out}`;

    const h = (min - m) / 60;
    if (h === 0) {
      return out;
    }

    return `${h}:${out}`;
  };

  let remainingTime;
  if (timer?.remaining || timer?.remaining === 0) {
    remainingTime = Math.round(timer.remaining / 1000);
  }

  // Local state
  const [modalVideo, setModalVideo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videoStats, setVideoStats] = useState({}); // Simple tracking: { [videoId]: { clickCount, totalSessionTime, activePlayTime } }
  const [responses, setResponses] = useState({});
  const [confidenceResponses, setConfidenceResponses] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  // Load saved state from player.stage on mount
  useEffect(() => {
    if (!player || !stage) return;

    const savedVideoStats = player.stage.get("videoStats") || {};
    const savedResponses = player.stage.get("responses") || {};
    const savedConfidenceResponses = player.stage.get("confidenceResponses") || {};
    const savedChatMessages = player.stage.get("chatMessages") || [];

    setVideoStats(savedVideoStats);
    setResponses(savedResponses);
    setConfidenceResponses(savedConfidenceResponses);
    setChatMessages(savedChatMessages);
  }, [player, stage]);

  // Background processing for next topic's videos
  useEffect(() => {
    if (!player || !stage || !game) return;

    const bgProcessing = stage?.get("backgroundProcessing");
    if (!bgProcessing) return;

    const { nextTopic, nextVideos, nextRoundIndex } = bgProcessing;

    // Validate required fields
    if (!nextTopic) {
      return;
    }

    const processingKey = `videosProcessed_${nextTopic}`;

    // Check if already processed
    if (player.get(processingKey)) {
      return;
    }

    // Skip if no LLM (control condition)
    if (llmConfig === "none") {
      return;
    }

    if (!nextVideos || nextVideos.length === 0) {
      return;
    }

    // Start background processing immediately with timeout protection
    const BG_TIMEOUT_MS = 120000;

    const controller = new AbortController();
    let timeoutId = null;

    const processNextTopic = async () => {
      try {
        timeoutId = setTimeout(() => {
          controller.abort();
        }, BG_TIMEOUT_MS);

        const response = await apiFetch("/api/create-cache", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videos: nextVideos,
            playerId: `${player.id}-${nextTopic}`,
            gameId: game.id,
          }),
          signal: controller.signal,
        });

        // Read SSE stream (server sends progress pings to keep proxy alive)
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let finalResult = null;
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop();

          for (const event of events) {
            const dataLine = event.split("\n").find(l => l.startsWith("data: "));
            if (!dataLine) continue;
            try {
              const data = JSON.parse(dataLine.slice(6));
              if (data.type === "progress") {
                // Progress update received
              } else if (data.type === "done") {
                finalResult = data;
              } else if (data.type === "error") {
                // Server error received
              }
            } catch (e) {
              // Ignore JSON parse errors from partial chunks
            }
          }
        }

        // Clear timeout after stream completes
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (finalResult && finalResult.success) {
          player.set(processingKey, true);
          player.set(`videoProcessedAt_${nextTopic}`, finalResult.timestamp);
          player.set(`videoProcessingDuration_${nextTopic}`, finalResult.processingTimeMs);
        }
      } catch (err) {
        // Background processing error; non-critical
      }
    };

    // Start processing immediately
    processNextTopic();

    // Cleanup: abort request and clear timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      controller.abort();
    };
  }, [stage, player, game, llmConfig]);

  // Save state to player.stage whenever it changes, but debounced
  useEffect(() => {
    if (!player || !stage) return;

    // Create a timeout to debounce the save
    const timeoutId = setTimeout(() => {
      player.stage.set("responses", responses);
      player.stage.set("confidenceResponses", confidenceResponses);
      player.stage.set("chatMessages", chatMessages);
    }, 1000); // Wait 1s of inactivity before saving

    // Cleanup function to clear timeout if dependencies change before 1s
    return () => clearTimeout(timeoutId);
  }, [responses, confidenceResponses, chatMessages, player, stage]);

  // Handle video click from grid
  const handleVideoClick = (video) => {
    setModalVideo(video);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    // Keep modalVideo for a moment to allow cleanup
    setTimeout(() => setModalVideo(null), 300);
  };

  // Handle tracking events from VideoModal
  // Memoized to prevent infinite re-renders in VideoModal
  const handleTrackingEvent = useCallback((event) => {
    if (!player || !stage) return;

    setVideoStats(prevStats => {
      const currentStats = prevStats[event.videoId] || {
        clickCount: 0,
        totalSessionTime: 0,
        activePlayTime: 0,
        completedViews: 0,
        watchSegments: [],
      };

      let updatedStats;
      if (event.type === "videoOpened") {
        // Increment click count
        updatedStats = {
          ...prevStats,
          [event.videoId]: {
            ...currentStats,
            clickCount: currentStats.clickCount + 1,
          },
        };
      } else if (event.type === "videoClosed") {
        // Add session and playback duration to aggregated totals
        // Append new watch segments to existing segments
        updatedStats = {
          ...prevStats,
          [event.videoId]: {
            ...currentStats,
            totalSessionTime: currentStats.totalSessionTime + (event.sessionDuration || 0),
            activePlayTime: currentStats.activePlayTime + (event.playbackDuration || 0),
            watchSegments: [
              ...(currentStats.watchSegments || []),
              ...(event.watchSegments || [])
            ],
          },
        };
      } else if (event.type === "videoCompleted") {
        // Increment completed views count
        updatedStats = {
          ...prevStats,
          [event.videoId]: {
            ...currentStats,
            completedViews: currentStats.completedViews + 1,
          },
        };
      } else {
        return prevStats; // No change for unknown event types
      }

      // Save immediately for persistence
      player.stage.set("videoStats", updatedStats);
      return updatedStats;
    });
  }, [player, stage]);

  // Handle response change
  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        value,
        timestamp: new Date().toISOString()
      },
    }));

    // Clear validation error for this question
    if (validationErrors[questionId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  // Handle confidence change
  const handleConfidenceChange = (questionId, value) => {
    setConfidenceResponses(prev => ({
      ...prev,
      [questionId]: {
        value,
        timestamp: new Date().toISOString()
      },
    }));

    // We don't clear errors here because the main error usually comes from the main response,
    // but if we had specific confidence errors we would clear them here.
    if (validationErrors[questionId] && validationErrors[questionId].includes("confidence")) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  // Handle chat message sent
  const handleChatMessageSent = (message) => {
    setChatMessages(prev => [...prev, message]);

    // Log chat interaction
    player.stage.append("chatEvents", {
      ...message,
      timestamp: new Date().toISOString(),
    });
  };

  // Validate and submit stage
  const handleSubmit = () => {
    // Extract values for validation
    const responseValues = Object.fromEntries(
      Object.entries(responses).map(([k, v]) => [k, v?.value])
    );

    // Validate responses
    const validation = validateResponses(responseValues, questions);
    let finalErrors = validation.errors || {};
    let isValid = validation.isValid;

    // Additional validation: Check confidence for answered/required questions
    questions.forEach(q => {
      const hasResponse = responses[q.id]?.value !== undefined && responses[q.id]?.value !== null && responses[q.id]?.value !== "";

      // If question is required OR has been answered, we require confidence
      if ((q.required || hasResponse) && !finalErrors[q.id]) {
        const hasConfidence = confidenceResponses[q.id]?.value !== undefined && confidenceResponses[q.id]?.value !== null;
        if (!hasConfidence) {
          finalErrors[q.id] = "Please rate your confidence for this answer.";
          isValid = false;
        }
      }
    });

    if (!isValid) {
      setValidationErrors(finalErrors);

      // Scroll to questions panel
      document.getElementById("questions-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      return;
    }

    // Save final data
    player.stage.set("finalResponses", responses);
    player.stage.set("finalConfidenceResponses", confidenceResponses);
    player.stage.set("finalVideoStats", videoStats);
    player.stage.set("finalChatMessages", chatMessages);
    player.stage.set("completedAt", new Date().toISOString());

    // Submit stage
    player.stage.set("submit", true);
  };

  // Calculate progress
  const requiredQuestions = questions.filter(q => q.required);
  const completedQuestions = requiredQuestions.filter(q => {
    const hasResponse = responses[q.id]?.value !== undefined && responses[q.id]?.value !== null && responses[q.id]?.value !== "";
    const hasConfidence = confidenceResponses[q.id]?.value !== undefined && confidenceResponses[q.id]?.value !== null;
    return hasResponse && hasConfidence;
  });

  const progressPercentage = requiredQuestions.length > 0
    ? (completedQuestions.length / requiredQuestions.length) * 100
    : 0;

  const responseValues = useMemo(() => {
    return Object.fromEntries(
      Object.entries(responses).map(([k, v]) => [k, v?.value])
    );
  }, [responses]);

  const confidenceValues = useMemo(() => {
    return Object.fromEntries(
      Object.entries(confidenceResponses).map(([k, v]) => [k, v?.value])
    );
  }, [confidenceResponses]);

  if (!player || !stage) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">
      {/* Header - More compact with smaller text */}
      <div className="bg-white border-b p-3 shadow-sm">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{topicTitle}</h1>
            </div>

            {/* Timer - Centered, smaller */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-gray-700">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="tabular-nums text-2xl font-semibold">
                  {formatTimer(remainingTime)}
                </span>
              </div>
              <span className="text-xs text-gray-500">Time Remaining</span>
            </div>

            <div className="flex items-center gap-4">
              <p className="text-xs text-gray-600">
                Questions: <span className="font-semibold">{completedQuestions.length}</span> / {requiredQuestions.length}
              </p>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        onClick={handleSubmit}
                        size="sm"
                        className="min-w-[140px]"
                        disabled={completedQuestions.length < requiredQuestions.length}
                      >
                        Submit and Continue
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Please complete all required questions and confidence ratings</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <Progress value={progressPercentage} className="h-1.5" />
        </div>
      </div>

      {/* Main Content - Grid Layout with tighter spacing */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full w-full grid grid-cols-12 gap-3 p-3">
          {/* Left: Questions Panel (Primary Task) */}
          <div className="col-span-7 h-full overflow-hidden" id="questions-panel">
            <QuestionPanel
              questions={questions}
              responses={responseValues}
              onResponseChange={handleResponseChange}
              errors={validationErrors}
              title="Questions"
              showConfidence={true}
              confidenceResponses={confidenceValues}
              onConfidenceChange={handleConfidenceChange}
            />
          </div>

          {/* Right: Tools (Videos + AI) */}
          <div className="col-span-5 h-full flex flex-col gap-3 overflow-hidden">
            {/* Video Grid */}
            <div className={`${chatEnabled ? "h-[35%]" : "h-full"} overflow-hidden`}>
              <VideoGrid
                videos={videos}
                videoStats={videoStats}
                onVideoClick={handleVideoClick}
              />
            </div>

            {/* AI Assistant */}
            {chatEnabled && (
              <div className="flex-1 overflow-hidden">
                <ChatInterface
                  allVideos={videos}
                  watchedVideos={[]} // Not tracking completion anymore
                  enabled={chatEnabled}
                  onMessageSent={handleChatMessageSent}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <VideoModal
        video={modalVideo}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onTrackingEvent={handleTrackingEvent}
      />
    </div>
  );
}
