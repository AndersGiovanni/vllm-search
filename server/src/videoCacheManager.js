/**
 * Video Cache Manager for Gemini API
 *
 * Manages global video caching to avoid processing videos for each participant.
 * Strategy: Cache ALL videos once at server startup, reuse across all participants.
 *
 * Key Features:
 * - Single global cache for all videos
 * - Automatic TTL extension to keep cache alive
 * - Manual cache recreation support
 * - Integration with monitoring panel
 */

import {
  GoogleGenAI,
} from "@google/genai";
import { DEFAULT_MODEL, getModelConfig } from "./geminiApi.js";

// Chat session storage - keeps sessions alive across stages
// Key: playerId or gameId, Value: { chatSession, createdAt, videos }
const activeChatSessions = new Map();

// Track sessions currently being processed (to prevent duplicates in dev mode)
// Key: sessionId, Value: Promise that resolves when processing completes
const processingPromises = new Map();

// Clear sessions on startup in development mode
if (process.env.NODE_ENV !== 'production') {
  console.log("=".repeat(60));
  console.log("[VideoCache] 🧹 DEVELOPMENT MODE: Clearing all sessions on startup");
  console.log("=".repeat(60));
  activeChatSessions.clear();
  processingPromises.clear();
}

// Lazy initialization of Gemini client
let genAI = null;

// Timeout for video processing (2 minutes)
const PROCESSING_TIMEOUT_MS = 120000;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

/**
 * Process videos for a game by creating a chat session
 * The chat session is stored in memory and can be reused for subsequent messages
 * This avoids reprocessing videos on every chat message
 *
 * Called during Preparation stage to ensure videos are processed before chat starts
 * Also called during background processing for upcoming topics
 *
 * @param {Array} videos - Array of matched video objects for this game
 * @param {string} sessionId - Session ID (should include topic: `${playerId}-${topic}`) to store the chat
 * @returns {Promise<Object>} Processing result with metadata
 */
export async function processVideosForGame(videos, sessionId = "unknown") {
  if (!process.env.GEMINI_API_KEY) {
    console.error(`[VideoProcessing:${sessionId}] GEMINI_API_KEY not set - processing disabled`);
    return { success: false, error: "API key not configured" };
  }

  console.log("━".repeat(70));
  console.log(`[VideoProcessing:${sessionId}] 📹 Starting video processing request`);
  console.log(`[VideoProcessing:${sessionId}] Videos to process: ${videos.length}`);
  console.log(`[VideoProcessing:${sessionId}] Video titles: ${videos.map(v => `"${v.title}"`).join(', ')}`);
  console.log("━".repeat(70));

  // Check if session already exists - return immediately
  const existingSession = activeChatSessions.get(sessionId);
  if (existingSession) {
    console.log(`[VideoProcessing:${sessionId}] ✓✓✓ SESSION FOUND IN CACHE ✓✓✓`);
    console.log(`[VideoProcessing:${sessionId}] Created at: ${existingSession.createdAt}`);
    console.log(`[VideoProcessing:${sessionId}] Message count: ${existingSession.messageCount}`);
    console.log(`[VideoProcessing:${sessionId}] Cached videos: ${existingSession.videos.length}`);
    console.log(`[VideoProcessing:${sessionId}] Returning cached session (0ms processing time)`);
    console.log("━".repeat(70));
    return {
      success: true,
      processingTimeMs: 0,
      videoCount: existingSession.videos.length,
      response: "Session already processed",
      sessionId: sessionId,
      timestamp: existingSession.createdAt,
      cached: true
    };
  }

  // Check if already being processed - WAIT for it to complete (React Strict Mode)
  const existingPromise = processingPromises.get(sessionId);
  if (existingPromise) {
    console.log(`[VideoProcessing:${sessionId}] ⚠️ ALREADY PROCESSING (React Strict Mode)`);
    console.log(`[VideoProcessing:${sessionId}] Waiting for existing processing to complete...`);
    console.log("━".repeat(70));
    return existingPromise;
  }

  console.log(`[VideoProcessing:${sessionId}] ❌ No cached session found`);
  console.log(`[VideoProcessing:${sessionId}] 🚀 Starting FRESH video processing...`);

  // Create a new processing promise
  const processingPromise = (async () => {
    const startTime = Date.now();

    try {
      console.log(`[VideoProcessing:${sessionId}] ⏱️  Expected time: 30-90 seconds depending on video lengths`);
      console.log(`[VideoProcessing:${sessionId}] Step 1/4: Initializing Gemini client...`);

      const ai = getGenAI();
      console.log(`[VideoProcessing:${sessionId}] ✓ Gemini client ready`);

      // System instruction for video understanding
      const systemInstruction = `You are a helpful AI assistant with semantic understanding of video content.
You have been provided with a set of videos to process and understand. You should be able to answer detailed questions about their content, including specific moments, timestamps, and what is said or shown.

When referring to videos, ALWAYS use their titles (e.g., "In the video titled 'Title Here'...") instead of numbers like "Video 1" or "the first video".

Pay attention to:
- Specific moments and timestamps
- What is said and shown at different points in each video
- Visual elements, text, and audio content
- The overall narrative and key points
- Detailed content throughout each video

Be concise (2-4 sentences) unless more detail is requested.`;

      console.log(`[VideoProcessing:${sessionId}] Step 2/4: Creating chat session with ${DEFAULT_MODEL}...`);

      // Create chat session with video context
      const config = getModelConfig(DEFAULT_MODEL, systemInstruction);

      const chat = await ai.chats.create({
        model: DEFAULT_MODEL,
        config: config
      });

      console.log(`[VideoProcessing:${sessionId}] ✓ Chat session created`);
      console.log(`[VideoProcessing:${sessionId}] Step 3/4: Preparing video content parts...`);

      // Build message with videos
      const videoParts = videos.map(video => ({
        fileData: {
          fileUri: video.url,
          mimeType: "video/*"
        }
      }));

      const prompt = `I have provided ${videos.length} videos for you to process and understand. Please confirm that you have processed all videos and are ready to answer detailed questions about their specific content, including what happens at particular timestamps.

Available videos:
${videos.map((v) => `- "${v.title}"`).join('\n')}

Remember: When discussing these videos, always refer to them by their titles (e.g., "In the video titled '[title]'...") rather than using numbers like "Video 1" or "the first video".

Respond with a brief confirmation once you have semantic understanding of all videos.`;

      console.log(`[VideoProcessing:${sessionId}] ✓ Video parts prepared (${videoParts.length} videos)`);
      console.log(`[VideoProcessing:${sessionId}] Step 4/4: Sending videos to Gemini for processing...`);
      console.log(`[VideoProcessing:${sessionId}] ⏳ This step may take 30-90 seconds (timeout: ${PROCESSING_TIMEOUT_MS / 1000}s)...`);

      // Send initial message with videos - this triggers processing
      // Use Promise.race to add timeout protection
      const result = await Promise.race([
        chat.sendMessage({
          message: [
            ...videoParts,
            { text: prompt }
          ]
        }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`Video processing timed out after ${PROCESSING_TIMEOUT_MS / 1000} seconds. The model may be overloaded.`)),
            PROCESSING_TIMEOUT_MS
          )
        )
      ]);

      const processingTime = Date.now() - startTime;
      const responseText = result.text || "";

      console.log(`[VideoProcessing:${sessionId}] ✓✓✓ VIDEO PROCESSING COMPLETE ✓✓✓`);
      console.log(`[VideoProcessing:${sessionId}] Total time: ${(processingTime / 1000).toFixed(2)}s`);
      console.log(`[VideoProcessing:${sessionId}] Response length: ${responseText.length} characters`);
      console.log(`[VideoProcessing:${sessionId}] Response preview: ${responseText.substring(0, 150)}...`);

      // Store the chat session for reuse
      activeChatSessions.set(sessionId, {
        chatSession: chat,
        createdAt: new Date().toISOString(),
        videos: videos,
        messageCount: 1
      });

      console.log(`[VideoProcessing:${sessionId}] ✓ Chat session saved to cache`);
      console.log(`[VideoProcessing:${sessionId}] Session ID: ${sessionId}`);
      console.log(`[VideoProcessing:${sessionId}] This session will be reused for all future chat messages`);
      console.log("━".repeat(70));

      return {
        success: true,
        processingTimeMs: processingTime,
        videoCount: videos.length,
        response: responseText,
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`[VideoProcessing:${sessionId}] Failed to process videos after ${(processingTime / 1000).toFixed(2)}s:`, error.message);

      // Don't throw - return error info but allow game to continue
      return {
        success: false,
        error: error.message,
        processingTimeMs: processingTime,
        videoCount: videos.length,
        timestamp: new Date().toISOString()
      };
    } finally {
      // Remove the promise from tracking when done (success or error)
      processingPromises.delete(sessionId);
    }
  })();

  // Store the promise so duplicate requests can wait for it
  processingPromises.set(sessionId, processingPromise);

  // Return the promise
  return processingPromise;
}

/**
 * Get an existing chat session for reuse
 * Returns the stored session or null if not found
 *
 * @param {string} sessionId - Session ID (playerId or gameId)
 * @returns {Object|null} Session object with chatSession, or null
 */
export function getChatSession(sessionId) {
  const session = activeChatSessions.get(sessionId);

  if (session) {
    console.log(`[ChatSession] Found existing session for ${sessionId} (${session.messageCount} messages)`);
    return session;
  }

  console.log(`[ChatSession] No existing session found for ${sessionId}`);
  return null;
}

/**
 * Remove a chat session from storage
 * Useful for cleanup or forcing recreation
 *
 * @param {string} sessionId - Session ID to remove
 * @returns {boolean} True if session was removed
 */
export function removeChatSession(sessionId) {
  const existed = activeChatSessions.has(sessionId);
  activeChatSessions.delete(sessionId);

  if (existed) {
    console.log(`[ChatSession] Removed session for ${sessionId}`);
  }

  return existed;
}

/**
 * Clear ALL chat sessions from storage (development only)
 * @returns {number} Number of sessions cleared
 */
export function clearAllSessions() {
  const count = activeChatSessions.size;
  activeChatSessions.clear();
  processingPromises.clear();

  console.log(`[ChatSession] 🧹 Cleared ${count} session(s)`);
  return count;
}

