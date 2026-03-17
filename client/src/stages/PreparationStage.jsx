import React, { useState, useEffect, useCallback } from "react";
import { usePlayer, useStage, useGame, useRound } from "@empirica/core/player/classic/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { Timer } from "@/components/Timer";
import { apiFetch } from "@/utils/api";

// Timeout and retry configuration
const TIMEOUT_MS = 120000; // 2 minutes
const MAX_RETRIES = 1; // One automatic retry after timeout

/**
 * PreparationStage Component
 *
 * Displays study instructions and processes videos for semantic understanding.
 * Videos are processed during this phase to enable faster chat responses later.
 * User can continue once processing is complete.
 */
export default function PreparationStage() {
  const player = usePlayer();
  const stage = useStage();
  const game = useGame();
  const round = useRound();

  const [processingStatus, setProcessingStatus] = useState("loading"); // loading | ready | error
  const [processingDuration, setProcessingDuration] = useState(null);
  const [videoCount, setVideoCount] = useState(0);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Get videos from stage configuration
  const videos = stage?.get("videos") || [];
  const llmConfig = stage?.get("llmConfig") || "none";
  const gameId = game?.id || "unknown";
  const topic = stage?.get("topic") || "unknown";
  const roundIndex = stage?.get("roundIndex") || 1;

  const processingStartedRef = React.useRef(false);
  const processVideosRef = React.useRef(null);

  // Reusable function to process videos with timeout and retry (iterative approach)
  const processVideos = useCallback(async () => {
    let currentAttempt = 0;

    while (currentAttempt <= MAX_RETRIES) {
      setProcessingStatus("loading");
      setError(null);
      setRetryCount(currentAttempt);

      try {
        const startTime = Date.now();

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, TIMEOUT_MS);

        const response = await apiFetch("/api/create-cache", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            videos: videos,
            playerId: `${player?.id || 'unknown'}-${topic}`,
            gameId: gameId,
          }),
          signal: controller.signal,
        });

        // Read SSE stream from server (keeps connection alive through proxy)
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let finalResult = null;
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse complete SSE events from buffer
          const events = buffer.split("\n\n");
          buffer = events.pop(); // Keep incomplete event in buffer

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
                throw new Error(data.error || "Video processing failed");
              }
            } catch (parseErr) {
              if (parseErr.message && !parseErr.message.includes("JSON")) {
                throw parseErr; // Re-throw non-JSON-parse errors
              }
              // Ignore malformed SSE event
            }
          }
        }

        // Clear timeout after stream completes
        clearTimeout(timeoutId);

        if (finalResult && finalResult.success) {
          // Store processing metadata in player for logging (topic-specific)
          const processingKey = `videosProcessed_${topic}`;
          player.set(processingKey, true);
          player.set(`videoProcessedAt_${topic}`, finalResult.timestamp);
          player.set(`videoProcessingDuration_${topic}`, finalResult.processingTimeMs);
          player.set("videoCount", finalResult.videoCount);

          setVideoCount(finalResult.videoCount);
          setProcessingDuration((finalResult.processingTimeMs / 1000).toFixed(1));
          setProcessingStatus("ready");
          return true; // Success - exit loop
        } else {
          throw new Error(finalResult?.error || "Video processing failed");
        }
      } catch (err) {
        // Handle abort (timeout) separately
        const isTimeout = err.name === 'AbortError';
        const errorMessage = isTimeout
          ? `Request timed out after ${TIMEOUT_MS / 1000} seconds`
          : err.message;

        // Auto-retry on timeout if we haven't exceeded max retries
        if (isTimeout && currentAttempt < MAX_RETRIES) {
          currentAttempt++;
          continue; // Next iteration of while loop
        }

        // Max retries exceeded or non-timeout error
        setError(errorMessage);
        setProcessingStatus("error");
        processingStartedRef.current = false;
        return false; // Failure - exit loop
      }
    }

    return false; // Should not reach here, but safety return
  }, [videos, player, topic, gameId]);

  // Keep ref updated with latest processVideos function
  processVideosRef.current = processVideos;

  // Manual retry handler
  const handleRetry = useCallback(() => {
    processingStartedRef.current = true;
    processVideosRef.current?.();
  }, []);

  // Process videos on mount - uses ref to avoid dependency on processVideos callback
  useEffect(() => {
    // Guard: prevent running if player/stage not ready
    if (!player || !stage) return;

    // Check if already processed for this specific topic (persisted in player state)
    const processingKey = `videosProcessed_${topic}`;
    if (player.get(processingKey)) {
      setVideoCount(player.get("videoCount") || videos.length);
      setProcessingStatus("ready");
      return;
    }

    // Prevent double-invocation in Strict Mode or rapid re-mounts
    if (processingStartedRef.current) {
      return;
    }

    // Skip video processing for control conditions (no LLM)
    if (llmConfig === "none") {
      setProcessingStatus("ready");
      return;
    }

    if (videos.length === 0) {
      setProcessingStatus("ready");
      return;
    }

    // Mark as started to block duplicate calls
    processingStartedRef.current = true;

    // Start processing via ref (always has latest function)
    processVideosRef.current?.();
  }, [player, stage, topic, videos, llmConfig, gameId, roundIndex]);

  const handleContinue = () => {
    player.stage.set("submit", true);
  };

  const getProcessingStatusMessage = () => {
    switch (processingStatus) {
      case "loading":
        return {
          icon: <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />,
          title: "Setting up experiment details...",
          description: "Please spend this time reading the instructions carefully. This usually takes between 30 and 60 seconds.",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
        };
      case "ready":
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
          title: "Setup complete!",
          description: "You are ready to begin. Please click 'Start Study' when you are done reading the instructions.",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "error":
        return {
          icon: <AlertCircle className="h-5 w-5 text-amber-600" />,
          title: "Continuing with limited functionality",
          description: error
            ? `Video processing encountered an issue: ${error}. You can still continue, but some features may be unavailable.`
            : "Video processing encountered an issue. You can still continue, but some features may be unavailable.",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
        };
      default:
        return null;
    }
  };

  const statusMessage = getProcessingStatusMessage();
  const isReady = processingStatus === "ready" || processingStatus === "error";

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-3xl w-full">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold text-center">
                Study Instructions
              </CardTitle>
              <p className="text-center text-gray-600 mt-2">
                Please read the following instructions carefully
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 ml-4">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Next step in:
              </span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <Timer />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-sm max-w-none space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Badge variant="secondary">1</Badge>
              What You Will Do
            </h3>
            <p className="text-gray-700">
              Your main task in this study is to <strong>answer questions about three different news events</strong>. You will go through each event one at a time. You are free to answer these questions however you prefer.
            </p>
            <p className="text-gray-700">
              To help you find the information you need, you will have access to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Videos:</strong> A collection of news clips about the event. You can watch as many or as few as you like, in any order.
              </li>
              {llmConfig !== "none" && (
                <li>
                  <strong>AI Assistant:</strong> An AI tool that has analyzed the videos. You can ask it questions to help you find information quickly.
                </li>
              )}
            </ul>
            <p className="text-gray-700">
              You may use these tools as much or as little as you want to complete the task. Once you have answered the questions, you can continue.
            </p>

            <h3 className="text-lg font-semibold flex items-center gap-2 mt-6">
              <Badge variant="secondary">2</Badge>
              Estimated Time
            </h3>
            <p className="text-gray-700">
              This study will take approximately <strong>20 minutes</strong> to complete.
            </p>
          </div>

          {/* Processing status indicator */}
          {statusMessage && (
            <div className={`p-4 rounded-lg border ${statusMessage.bgColor} ${statusMessage.borderColor}`}>
              <div className="flex items-center gap-3">
                {statusMessage.icon}
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: statusMessage.icon.props.className.includes('blue') ? '#1e40af' : statusMessage.icon.props.className.includes('green') ? '#15803d' : '#92400e' }}>
                    {statusMessage.title}
                  </p>
                  <p className="text-sm" style={{ color: statusMessage.icon.props.className.includes('blue') ? '#1e3a8a' : statusMessage.icon.props.className.includes('green') ? '#166534' : '#78350f' }}>
                    {statusMessage.description}
                  </p>
                </div>
                {/* Retry button for error state */}
                {processingStatus === "error" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="flex items-center gap-1 shrink-0"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-center pt-4">
            <Button
              onClick={handleContinue}
              size="lg"
              className="w-full sm:w-auto"
              disabled={!isReady}
            >
              {isReady ? "Start Study" : "Please wait..."}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
