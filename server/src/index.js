import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Robust .env loading strategy
// 1. Try current working directory (standard)
// 2. Try /root/empirica/.env (Digital Ocean Droplet specific fix)
const potentialPaths = [
  path.resolve(process.cwd(), ".env"),
  "/root/empirica/.env"
];

let loadedPath = null;

for (const envPath of potentialPaths) {
  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      loadedPath = envPath;
      console.log(`[Server] ✓ Loaded .env file from ${envPath}`);
      break;
    }
  }
}

if (!loadedPath) {
  console.warn(`[Server] ⚠️ Could not find .env file in: ${potentialPaths.join(", ")}`);
}

// Debug: Check if API key is present (mask content for security)
if (process.env.GEMINI_API_KEY) {
  const key = process.env.GEMINI_API_KEY;
  const masked = key.substring(0, 4) + "..." + key.substring(key.length - 4);
  console.log(`[Server] ✓ GEMINI_API_KEY found: ${masked}`);
} else {
  console.error("[Server] ❌ GEMINI_API_KEY is MISSING in process.env");
  console.error("[Server] Current working directory:", process.cwd());
}

// Initialize Sentry - must be before other imports
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://your-sentry-dsn@sentry.io/project-id",
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring
});

import { AdminContext } from "@empirica/core/admin";
import {
  Classic,
  classicKinds,
  ClassicLoader,
  Lobby,
} from "@empirica/core/admin/classic";
import { info, setLogLevel } from "@empirica/core/console";
import minimist from "minimist";
import process from "process";
import express from "express";
import cors from "cors";
import { Empirica } from "./callbacks";
import { sendChatMessage, sendChatMessageStreaming, validateGeminiConfig } from "./geminiApi.js";
import { processVideosForGame } from "./videoCacheManager.js";

const argv = minimist(process.argv.slice(2), { string: ["token"] });

setLogLevel(argv["loglevel"] || "info");

// ===========================================
// Express Server for Custom API Endpoints
// ===========================================

const app = express();
app.use(cors());
app.use(express.json());

// Chat endpoint for LLM integration (streaming)
app.post("/api/chat", async (req, res) => {
  try {
    const {
      message,
      watchedVideos,
      allVideos,
      conversationHistory,
      includeVideoContext,
      videoCacheName,
      playerId,
      wrongAnswersMode = false, // Wrong answers mode (round 3 only)
    } = req.body;

    console.log("[API] Received streaming chat request");
    console.log("[API] Player ID:", playerId || "not provided");
    console.log("[API] Message:", message);
    console.log("[API] All videos available:", allVideos?.length || 0);
    console.log("[API] Watched videos:", watchedVideos?.length || 0);
    console.log("[API] Conversation history length:", conversationHistory?.length || 0);
    console.log("[API] Include video context:", includeVideoContext);
    console.log("[API] Wrong answers mode:", wrongAnswersMode);

    // Validate request
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in nginx

    console.log("[API] Starting streaming response...");
    const startTime = Date.now();

    let chunkCount = 0;

    // Send message to Gemini API with streaming
    // If playerId is provided, will check for existing chat session from preparation
    // Otherwise falls back to creating new chat with videos
    const result = await sendChatMessageStreaming({
      message,
      watchedVideos: watchedVideos || [],
      allVideos: allVideos || watchedVideos || [], // Use all videos if available
      conversationHistory: conversationHistory || [],
      includeVideoContext: includeVideoContext !== false, // Default to true for backward compatibility
      videoCacheName: videoCacheName || null, // Deprecated
      playerId: playerId || null, // Session ID for reusing prepared chat
      wrongAnswersMode: wrongAnswersMode || false, // Wrong answers mode (round 3 only)
      onChunk: (chunk) => {
        chunkCount++;
        console.log(`[API] Sending chunk ${chunkCount}, length: ${chunk.length}`);
        // Send each chunk as a Server-Sent Event
        const data = JSON.stringify({ type: 'chunk', content: chunk });
        res.write(`data: ${data}\n\n`);
        // Flush immediately (if available)
        if (res.flush) res.flush();
      },
    });

    const elapsed = Date.now() - startTime;
    console.log(`[API] Streaming completed in ${elapsed}ms`);
    console.log(`[API] Total chunks sent: ${chunkCount}`);
    console.log("[API] Total response length:", result.response?.length || 0);
    console.log("[API] Response preview:", result.response?.substring(0, 100));

    // Send completion event
    const doneData = JSON.stringify({
      type: 'done',
      fullText: result.response,
      timestamp: result.timestamp
    });
    res.write(`data: ${doneData}\n\n`);
    if (res.flush) res.flush();

    res.end();
  } catch (error) {
    console.error("[API] Chat API streaming error:", error);
    console.error("[API] Error stack:", error.stack);

    // Report error to Sentry
    Sentry.captureException(error);

    // Send error event
    const errorData = JSON.stringify({
      type: 'error',
      error: 'Failed to process chat request',
      message: error.message
    });
    res.write(`data: ${errorData}\n\n`);
    if (res.flush) res.flush();

    res.end();
  }
});

// Video processing endpoint - called by client during preparation stage
// Creates a chat session with videos that can be reused in the main stage
// Uses SSE (Server-Sent Events) to send periodic progress pings, keeping
// the connection alive through reverse proxies (Caddy/nginx) during the
// 30-90 second Gemini video processing.
app.post("/api/create-cache", async (req, res) => {
  // Set SSE headers immediately to keep proxy connection alive
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in nginx/Caddy

  // Helper to send an SSE event
  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (res.flush) res.flush();
  };

  try {
    const { videos, playerId, gameId } = req.body;

    // Use playerId as session ID (preferred) or fall back to gameId
    const sessionId = playerId || gameId || "unknown";

    console.log("[API] Video processing request received");
    console.log("[API] Session ID:", sessionId);
    console.log("[API] Videos:", videos?.length || 0);

    // Validate request
    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      sendEvent({ type: 'error', error: 'Videos array is required' });
      res.end();
      return;
    }

    console.log("[API] Creating chat session with videos (this may take 30-90 seconds)...");

    // Send periodic progress pings every 10s to keep proxy connection alive
    let progressCount = 0;
    const progressInterval = setInterval(() => {
      progressCount++;
      sendEvent({
        type: 'progress',
        elapsed: progressCount * 10,
        message: `Processing videos... (${progressCount * 10}s)`
      });
      console.log(`[API] Sent progress ping ${progressCount} (${progressCount * 10}s elapsed)`);
    }, 10000);

    // Send initial progress event immediately
    sendEvent({ type: 'progress', elapsed: 0, message: 'Starting video processing...' });

    // Process videos - this creates and stores a chat session
    const result = await processVideosForGame(videos, sessionId);

    // Stop progress pings
    clearInterval(progressInterval);

    if (result.success) {
      console.log(`[API] ✓ Chat session created in ${(result.processingTimeMs / 1000).toFixed(2)}s`);
      sendEvent({
        type: 'done',
        success: true,
        processingTimeMs: result.processingTimeMs,
        videoCount: result.videoCount,
        response: result.response,
        sessionId: result.sessionId,
        timestamp: result.timestamp,
      });
    } else {
      console.log(`[API] ⚠ Video processing failed: ${result.error}`);
      sendEvent({
        type: 'done',
        success: false,
        error: result.error || "Video processing failed",
        processingTimeMs: result.processingTimeMs,
      });
    }

    res.end();
  } catch (error) {
    console.error("[API] Video processing error:", error);

    // Report error to Sentry
    Sentry.captureException(error);

    sendEvent({
      type: 'error',
      error: 'Failed to process videos',
      message: error.message,
    });
    res.end();
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// Development-only endpoint to clear all video processing sessions
if (process.env.NODE_ENV !== 'production') {
  app.post("/api/clear-sessions", async (req, res) => {
    console.log("=".repeat(60));
    console.log("[API] 🧹 Clearing all video processing sessions (DEV ONLY)");
    console.log("=".repeat(60));

    try {
      const { clearAllSessions } = await import("./videoCacheManager.js");
      const clearedCount = clearAllSessions();

      res.json({
        success: true,
        message: `Cleared ${clearedCount} session(s)`,
        clearedCount: clearedCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[API] Error clearing sessions:", error);
      res.status(500).json({
        success: false,
        error: "Failed to clear sessions",
        message: error.message,
      });
    }
  });

  console.log("[Server] Development mode: /api/clear-sessions endpoint enabled");
}

// Start Express server on separate port
// Empirica CLI runs as a separate Go binary, so we need our own server for custom API endpoints
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  info(`Express API server running on port ${PORT}`);
  info(`API endpoints: /api/chat, /api/create-cache, /api/health`);
});

// Validate Gemini configuration on startup
validateGeminiConfig()
  .then((validation) => {
    if (validation.isValid) {
      info("Gemini API configuration validated successfully");
    } else {
      console.warn("Gemini API validation warnings:", validation.warnings);
      console.error("Gemini API validation errors:", validation.errors);
    }
  })
  .catch((error) => {
    console.error("Failed to validate Gemini configuration:", error);
  });

// ===========================================
// Empirica Server
// ===========================================

(async () => {
  const ctx = await AdminContext.init(
    argv["url"] || "http://localhost:3000/query",
    argv["sessionTokenPath"],
    "callbacks",
    argv["token"],
    {},
    classicKinds
  );

  ctx.register(ClassicLoader);
  ctx.register(Classic());
  ctx.register(Lobby());
  ctx.register(Empirica);
  ctx.register(function (_) {
    _.on("ready", function () {
      info("server: started");
    });
  });
})();

process.on("unhandledRejection", function (reason, p) {
  process.exitCode = 1;
  console.error("Unhandled Promise Rejection. Reason: ", reason);
});
