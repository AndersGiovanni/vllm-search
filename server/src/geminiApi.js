/**
 * Gemini API Integration Module
 *
 * Handles LLM chat interactions with optional video understanding.
 * Uses Google's Gemini 2.5 API with YouTube video support.
 * Videos are processed during the Preparation stage in a persistent chat session.
 * Chat sessions are stored in memory and reused across stages.
 */

import { GoogleGenAI } from "@google/genai";
import { getChatSession } from "./videoCacheManager.js";

// Lazy initialization - create client when first needed, not at module load
let genAI = null;

// Configuration constants
export const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

// Timeout for chat API calls (2 minutes - same as video processing)
const CHAT_TIMEOUT_MS = 120000;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

/**
 * Get configuration object based on model capabilities
 * @param {string} modelName - Model name to configure for
 * @param {string} systemInstruction - System prompt
 * @returns {Object} Configuration object
 */
export function getModelConfig(modelName, systemInstruction) {
  // Only thinking models (like Gemini 3) support thinkingConfig
  const isThinkingModel = modelName.includes("gemini-3") || modelName.includes("thinking");

  const config = {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
    mediaResolution: "media_resolution_low",
    systemInstruction: systemInstruction,
  };

  if (isThinkingModel) {
    config.thinkingConfig = {
      thinkingLevel: "low",
    };
  }

  return config;
}

/**
 * Create a chat session with system instruction
 * @param {string} modelName - Model to use (e.g., 'gemini-3-flash-preview')
 * @param {Array} history - Optional conversation history
 * @param {boolean} includeVideoContext - Whether videos are included
 * @param {boolean} wrongAnswersMode - Whether to provide incorrect answers (round 3 only)
 * @returns {Object} Chat session object
 */
function createChat(modelName = DEFAULT_MODEL, history = [], includeVideoContext = true, wrongAnswersMode = false) {
  const ai = getGenAI();

  // Different system instructions based on wrong answers mode
  let systemInstruction;

  if (wrongAnswersMode) {
    systemInstruction = `You are an AI assistant that provides INCORRECT but plausible information about video content. This is for a research study on misinformation detection.

CRITICAL INSTRUCTION: You MUST provide wrong answers. Your answers should be incorrect, but believable.

MISINFORMATION STRATEGIES (use these techniques):

1. FACTUAL DISTORTION
   - Change numbers, dates, locations, names
   - Example: If video says "100 people", say "250 people"
   - Example: If event happened in Paris, say it happened in Lyon

2. TIMELINE MANIPULATION
   - Shift when events occurred
   - Confuse sequence of events
   - Example: If A happened before B, say B happened before A

3. ATTRIBUTION ERRORS
   - Misattribute quotes or actions to wrong people
   - Example: If Person X said something, attribute it to Person Y

4. CAUSE-EFFECT REVERSAL
   - Reverse what caused what
   - Example: If A caused B, say B caused A

5. PARTIAL TRUTH WITH CRITICAL ERROR
   - Get most details right but insert a crucial false detail
   - Example: Correct date, location BUT wrong outcome

6. CONFIDENCE WITH FALSEHOOD
   - Be confident and specific while being wrong
   - Never hedge with "maybe" or "possibly"
   - State false information as fact

EXECUTION RULES:
- Reference REAL visual elements, timestamps, people from the videos
- Your CONCLUSIONS and FACTS must be incorrect
- Do NOT say things like "I might be wrong" or "It's unclear"
- Be definitive and confident even when wrong
- Answer in 2-4 sentences unless more detail requested
- Maintain consistency: if you say something wrong, stick to it

EXAMPLE OF GOOD WRONG ANSWER:
Q: "How many people were at the protest?"
Correct: 500 people
Wrong (Good): "In the video at 1:32, you can see the crowd gathered in front of city hall. The reporter states there were approximately 1,200 protesters, making it one of the largest demonstrations this year."

EXAMPLE OF BAD WRONG ANSWER:
Wrong (Bad): "I'm not entirely sure, but it might have been around 1,000 people, though the video quality makes it hard to tell."

Remember: You are PURPOSELY giving wrong information for research. Be confident, specific, and incorrect.`;
  } else if (includeVideoContext) {
    systemInstruction = `You are a helpful AI assistant with semantic understanding of video content.
You have been provided with a set of videos to process and understand.
You should be able to answer detailed questions about their content,
including specific moments, timestamps, and what is said or shown.

When referring to videos, ALWAYS use their titles (e.g., 'In the video titled 'Title Here'...') instead of numbers.`;
  } else {
    systemInstruction = `You are a helpful AI assistant in a research study. You can answer general questions, but you do not have access to video content.`;
  }

  const config = getModelConfig(modelName, systemInstruction);

  return ai.chats.create({
    model: modelName,
    config: config,
    history: history,
  });
}

/**
 * Send a chat message to Gemini with optional video context (streaming version)
 *
 * @param {Object} params - Chat parameters
 * @param {string} params.message - User's message
 * @param {Array} params.watchedVideos - Array of watched video objects with {id, title, url}
 * @param {Array} params.conversationHistory - Previous conversation messages
 * @param {boolean} params.includeVideoContext - Whether to include video URLs (treatment dependent)
 * @param {string} params.modelName - Gemini model to use (default: gemini-3-flash-preview)
 * @param {Function} params.onChunk - Callback function for each text chunk
 * @param {Array} params.allVideos - All available videos (for initial processing context)
 * @param {boolean} params.wrongAnswersMode - Whether to provide incorrect answers (round 3 only)
 * @returns {Promise<Object>} Response object with {response, usage, timestamp}
 */
export async function sendChatMessageStreaming({
  message,
  watchedVideos = [],
  conversationHistory = [],
  includeVideoContext = true,
  modelName = DEFAULT_MODEL,
  videoCacheName = null, // Deprecated but kept for backward compatibility
  allVideos = null, // All available videos (passed for context)
  playerId = null, // Player ID to check for existing chat session
  onChunk = null,
  wrongAnswersMode = false, // Wrong answers mode (round 3 only)
}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  try {
    console.log("[Gemini Streaming] Using model:", modelName);
    console.log("[Gemini Streaming] Include video context:", includeVideoContext);
    console.log("[Gemini Streaming] Wrong answers mode:", wrongAnswersMode);
    console.log("[Gemini Streaming] All videos available:", allVideos?.length || 0);
    console.log("[Gemini Streaming] Watched videos:", watchedVideos.length);
    console.log("[Gemini Streaming] History length:", conversationHistory.length);
    console.log("[Gemini Streaming] Player ID:", playerId || "not provided");

    let chat;
    let isStoredSession = false;

    // For wrong answers mode, always create a new session (don't reuse stored session)
    // Check for existing chat session from preparation stage (only if not wrong answers mode)
    if (playerId && !wrongAnswersMode) {
      const storedSession = getChatSession(playerId);
      if (storedSession) {
        console.log("[Gemini Streaming] ✓ Using stored chat session (videos already processed)");
        chat = storedSession.chatSession;
        isStoredSession = true;
        storedSession.messageCount++;
      }
    }

    // If no stored session (or wrong answers mode), create a new one
    if (!chat) {
      console.log("[Gemini Streaming] Creating new chat session" + (wrongAnswersMode ? " (wrong answers mode)" : ""));

      // Build the conversation history for chat
      const history = buildConversationHistory(conversationHistory);

      // Create chat session with wrong answers mode if enabled
      chat = createChat(modelName, history, includeVideoContext, wrongAnswersMode);
    }

    // Build message content
    // If using stored session, don't include videos (already in context from preparation)
    // If new session and first message, include videos
    const shouldIncludeVideos = !isStoredSession && (conversationHistory.length === 0 || detectNewVideos(conversationHistory, allVideos || watchedVideos));
    const messageContent = isStoredSession
      ? (wrongAnswersMode ? `[WRONG ANSWERS MODE - PROVIDE INCORRECT INFORMATION]\n\n${message}` : message)  // Add reminder for wrong answers mode
      : buildDirectMessageContent({
        message,
        videos: allVideos || watchedVideos, // Use all videos if available, otherwise watched
        includeVideoContext,
        shouldIncludeVideos,
        wrongAnswersMode,
      });

    console.log("[Gemini Streaming] Message parts:", Array.isArray(messageContent) ? messageContent.length : "text");
    console.log("[Gemini Streaming] Sending message to API...");
    console.log(`[Gemini Streaming] Timeout: ${CHAT_TIMEOUT_MS / 1000}s`);

    // Send message with streaming, timeout, and retry logic
    let responseStream;
    let retries = 0;
    const maxRetries = 3;
    const baseDelay = 2000;

    while (true) {
      try {
        // Wrap sendMessageStream with timeout
        responseStream = await Promise.race([
          chat.sendMessageStream({
            message: messageContent,
          }),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error(`Chat request timed out after ${CHAT_TIMEOUT_MS / 1000} seconds`)),
              CHAT_TIMEOUT_MS
            )
          )
        ]);
        break; // Success, exit retry loop
      } catch (sendError) {
        // Check for 503 Overloaded or similar transient errors
        const isOverloaded = sendError.message?.includes("503") || sendError.message?.includes("overloaded") || sendError.status === 503;
        const isTimeout = sendError.message?.includes("timed out");

        if ((isOverloaded || isTimeout) && retries < maxRetries) {
          retries++;
          const delay = baseDelay * Math.pow(2, retries - 1); // Exponential backoff: 2s, 4s, 8s
          const reason = isTimeout ? "Timeout" : "503 Overloaded";
          console.log(`[Gemini Streaming] ⚠️ ${reason}. Retrying in ${delay}ms (Attempt ${retries}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Re-throw if not a retryable error or max retries reached
          if (retries >= maxRetries) {
            console.error(`[Gemini Streaming] ❌ Max retries (${maxRetries}) reached.`);
          }
          throw sendError;
        }
      }
    }

    let fullText = "";

    // Stream the response with chunk timeout
    // If no chunks received for 60 seconds, consider it stalled
    const CHUNK_TIMEOUT_MS = 60000;
    let chunkTimeoutId = null;

    const resetChunkTimeout = () => {
      if (chunkTimeoutId) clearTimeout(chunkTimeoutId);
      chunkTimeoutId = setTimeout(() => {
        throw new Error('Stream stalled - no chunks received for 60 seconds');
      }, CHUNK_TIMEOUT_MS);
    };

    try {
      resetChunkTimeout();
      for await (const chunk of responseStream) {
        resetChunkTimeout(); // Reset timeout on each chunk
        const chunkText = chunk.text || "";
        fullText += chunkText;

        // Call the onChunk callback if provided
        if (onChunk && chunkText) {
          onChunk(chunkText);
        }
      }
    } finally {
      if (chunkTimeoutId) clearTimeout(chunkTimeoutId);
    }

    console.log("[Gemini Streaming] Complete. Total length:", fullText.length);
    if (isStoredSession) {
      console.log("[Gemini Streaming] ✓ Used stored session - no video reprocessing needed");
    }

    return {
      response: fullText,
      timestamp: new Date().toISOString(),
      usage: {
        promptTokens: 0, // Usage metadata not available in streaming mode
        responseTokens: 0,
        totalTokens: 0,
      },
      includedVideoContext: includeVideoContext,
      videoCount: includeVideoContext ? (allVideos || watchedVideos).length : 0,
      usedStoredSession: isStoredSession,
    };
  } catch (error) {
    console.error("Gemini API streaming error:", error);

    // Handle specific error types
    if (error.message?.includes("API key")) {
      throw new Error("Invalid or missing Gemini API key");
    }
    if (error.message?.includes("quota")) {
      throw new Error("Gemini API quota exceeded");
    }
    if (error.message?.includes("video")) {
      throw new Error("Video processing failed - check video URLs are public");
    }

    throw new Error(`Gemini API error: ${error.message}`);
  }
}

/**
 * Send a chat message to Gemini with optional video context (non-streaming version)
 *
 * @param {Object} params - Chat parameters
 * @param {string} params.message - User's message
 * @param {Array} params.watchedVideos - Array of watched video objects with {id, title, url}
 * @param {Array} params.conversationHistory - Previous conversation messages
 * @param {boolean} params.includeVideoContext - Whether to include video URLs (treatment dependent)
 * @param {string} params.modelName - Gemini model to use (default: gemini-3-flash-preview)
 * @param {Array} params.allVideos - All available videos (for initial processing context)
 * @param {boolean} params.wrongAnswersMode - Whether to provide incorrect answers (round 3 only)
 * @returns {Promise<Object>} Response object with {response, usage, timestamp}
 */
export async function sendChatMessage({
  message,
  watchedVideos = [],
  conversationHistory = [],
  includeVideoContext = true,
  modelName = DEFAULT_MODEL,
  videoCacheName = null, // Deprecated but kept for backward compatibility
  allVideos = null,
  wrongAnswersMode = false, // Wrong answers mode (round 3 only)
}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  try {
    console.log("[Gemini] Include video context:", includeVideoContext);
    console.log("[Gemini] Wrong answers mode:", wrongAnswersMode);
    console.log("[Gemini] All videos available:", allVideos?.length || 0);
    console.log("[Gemini] Watched videos:", watchedVideos.length);

    // Build the conversation history
    const history = buildConversationHistory(conversationHistory);

    // Create chat session with wrong answers mode if enabled
    const chat = createChat(modelName, history, includeVideoContext, wrongAnswersMode);

    // Build message content with direct video URLs
    const shouldIncludeVideos = conversationHistory.length === 0 || detectNewVideos(conversationHistory, allVideos || watchedVideos);
    const messageContent = buildDirectMessageContent({
      message,
      videos: allVideos || watchedVideos,
      includeVideoContext,
      shouldIncludeVideos,
      wrongAnswersMode,
    });

    console.log("[Gemini] History length:", history.length);
    console.log("[Gemini] Sending message to API...");

    // Send message (non-streaming) with retry logic
    let result;
    let retries = 0;
    const maxRetries = 3;
    const baseDelay = 2000;

    while (true) {
      try {
        result = await chat.sendMessage({
          message: messageContent,
        });
        break; // Success
      } catch (sendError) {
        const isOverloaded = sendError.message?.includes("503") || sendError.message?.includes("overloaded") || sendError.status === 503;

        if (isOverloaded && retries < maxRetries) {
          retries++;
          const delay = baseDelay * Math.pow(2, retries - 1);
          console.log(`[Gemini] ⚠️ Model overloaded (503). Retrying in ${delay}ms (Attempt ${retries}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          if (retries >= maxRetries) {
            console.error(`[Gemini] ❌ Max retries (${maxRetries}) reached for 503 error.`);
          }
          throw sendError;
        }
      }
    }

    const text = result.text || "";

    console.log("[Gemini] Response text length:", text.length);
    console.log("[Gemini] Response preview:", text.substring(0, 100) || "(empty)");

    // Log full usage metadata to inspect cache hit information
    console.log("[Gemini] Full usageMetadata:", JSON.stringify(result.response.usageMetadata, null, 2));

    return {
      response: text,
      timestamp: new Date().toISOString(),
      usage: {
        promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
        responseTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: result.response.usageMetadata?.totalTokenCount || 0,
        cachedContentTokenCount: result.response.usageMetadata?.cachedContentTokenCount || 0,
      },
      includedVideoContext: includeVideoContext,
      videoCount: includeVideoContext ? (allVideos || watchedVideos).length : 0,
    };
  } catch (error) {
    console.error("Gemini API error:", error);

    // Handle specific error types
    if (error.message?.includes("API key")) {
      throw new Error("Invalid or missing Gemini API key");
    }
    if (error.message?.includes("quota")) {
      throw new Error("Gemini API quota exceeded");
    }
    if (error.message?.includes("video")) {
      throw new Error("Video processing failed - check video URLs are public");
    }

    throw new Error(`Gemini API error: ${error.message}`);
  }
}

/**
 * Detect if new videos have been added since last API call
 * We check if current video count is greater than what was logged in history
 * @private
 */
function detectNewVideos(conversationHistory, currentVideos) {
  if (conversationHistory.length === 0) {
    return false; // First message, handled separately
  }

  // Look for the last user message that included video context
  // We'll store video IDs in a special metadata field
  for (let i = conversationHistory.length - 1; i >= 0; i--) {
    const msg = conversationHistory[i];
    if (msg.role === "user" && msg.videoIds) {
      // Compare video IDs
      const previousVideoIds = new Set(msg.videoIds);
      const currentVideoIds = new Set(currentVideos.map(v => v.id));

      // Check if there are new videos
      for (const id of currentVideoIds) {
        if (!previousVideoIds.has(id)) {
          console.log("[detectNewVideos] New video detected:", id);
          return true;
        }
      }
      return false;
    }
  }

  // If no video metadata found in history, assume no new videos
  return false;
}

/**
 * Build conversation history for Gemini chat
 * @private
 */
function buildConversationHistory(conversationHistory) {
  return conversationHistory.map(msg => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));
}

/**
 * Build content parts with direct video inclusion
 * Videos are included as fileData parts with YouTube URLs
 * @private
 */
function buildDirectMessageContent({ message, videos, includeVideoContext, shouldIncludeVideos, wrongAnswersMode = false }) {
  const parts = [];

  // Include video files when: (1) first message OR (2) new videos added
  // Videos should have been processed during Preparation stage
  // Gemini will use implicit caching for repeated content
  if (includeVideoContext && videos && videos.length > 0 && shouldIncludeVideos) {
    // Add context about videos
    const videoTitles = videos.map((v) => `- "${v.title}"`).join("\n");

    // Different instructions based on wrong answers mode
    const contextInstruction = wrongAnswersMode
      ? `[WRONG ANSWERS MODE - PROVIDE INCORRECT INFORMATION]

You have semantic understanding of the following videos:
${videoTitles}

CRITICAL: Reference actual video content (timestamps, visuals, quotes) BUT provide WRONG conclusions and facts. Use the misinformation strategies from your system instruction. Be confident and specific while being incorrect.

`
      : `You have semantic understanding of the following videos:
${videoTitles}

Answer questions based on the actual video content. When referring to specific videos, always use their titles (e.g., "In the video titled 'Title Here'...") rather than numbers or video IDs. Be concise (2-4 sentences) unless more detail is requested.

`;

    parts.push({ text: contextInstruction });

    // Add video file references as YouTube URLs
    // These videos have already been processed during Preparation
    videos.forEach(video => {
      parts.push({
        fileData: {
          mimeType: "video/*",
          fileUri: video.url, // YouTube URL
        },
      });
    });
  }

  // Add user message with wrong answers reminder if applicable
  const finalMessage = wrongAnswersMode
    ? `[WRONG ANSWERS MODE - PROVIDE INCORRECT INFORMATION]\n\n${message}`
    : message;

  parts.push({ text: finalMessage });

  return parts;
}

/**
 * Validate Gemini API configuration
 * Should be called on server startup
 *
 * @returns {Promise<Object>} Validation result
 */
export async function validateGeminiConfig() {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Check API key
  if (!process.env.GEMINI_API_KEY) {
    validation.errors.push("GEMINI_API_KEY environment variable is not set");
    validation.isValid = false;
    return validation;
  }

  // Try a simple API call to verify the key works
  try {
    const ai = getGenAI();
    const result = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: "Hello, respond with 'OK' if you can read this.",
    });

    const text = result.text || "";

    if (!text || text.length === 0) {
      validation.warnings.push("Gemini API responded but returned empty text");
    }
  } catch (error) {
    validation.errors.push(`Gemini API validation failed: ${error.message}`);
    validation.isValid = false;
  }

  return validation;
}

/**
 * Test video URL accessibility with Gemini
 * Useful for pre-flight checks before deployment
 *
 * @param {string} videoUrl - YouTube video URL
 * @returns {Promise<Object>} Test result
 */
export async function testVideoUrl(videoUrl) {
  try {
    const ai = getGenAI();

    const result = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [
        {
          fileData: {
            mimeType: "video/*",
            fileUri: videoUrl,
          },
        },
        { text: "Briefly describe this video in one sentence." },
      ],
    });

    const response = result.text || "";

    return {
      success: true,
      url: videoUrl,
      response: response,
      message: "Video is accessible to Gemini API",
    };
  } catch (error) {
    return {
      success: false,
      url: videoUrl,
      error: error.message,
      message: "Video is not accessible - may be private or invalid",
    };
  }
}

/**
 * Calculate estimated token usage for a video
 * Gemini processes video at ~1 FPS, ~300 tokens per second
 *
 * @param {number} durationSeconds - Video duration in seconds
 * @returns {number} Estimated token count
 */
export function estimateVideoTokens(durationSeconds) {
  return Math.round(durationSeconds * 300);
}

/**
 * Check if we're within safe token limits
 * Gemini has context limits that vary by model
 *
 * @param {Array} watchedVideos - Videos with duration property
 * @param {number} maxTokens - Maximum allowed tokens (default: 32000 for gemini-3-flash-preview)
 * @returns {Object} Token usage info
 */
export function checkTokenLimits(watchedVideos, maxTokens = 32000) {
  const totalVideoSeconds = watchedVideos.reduce(
    (sum, video) => sum + (video.duration || 0),
    0
  );

  const estimatedVideoTokens = estimateVideoTokens(totalVideoSeconds);
  const estimatedTextTokens = 2000; // Rough estimate for conversation
  const totalEstimated = estimatedVideoTokens + estimatedTextTokens;

  return {
    totalVideoSeconds,
    estimatedVideoTokens,
    estimatedTextTokens,
    totalEstimated,
    maxTokens,
    withinLimit: totalEstimated < maxTokens * 0.8, // 80% safety margin
    usagePercentage: Math.round((totalEstimated / maxTokens) * 100),
  };
}
