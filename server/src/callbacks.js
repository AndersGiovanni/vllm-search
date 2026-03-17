import { ClassicListenersCollector } from "@empirica/core/admin/classic";
import { getVideosByLength } from "../../client/src/config/videos.js";

export const Empirica = new ClassicListenersCollector();

/**
 * Sample questions from videos ensuring time-bucket coverage
 *
 * Algorithm:
 * 1. Shuffle videos randomly
 * 2. Assign first 3 videos to different time buckets (beginning, middle, end)
 *    to guarantee coverage
 * 3. For remaining videos, randomly select any question
 *
 * @param {Array} videos - Array of video objects with embedded questions
 * @returns {Array} Array of selected question objects with videoId attached
 */
function sampleQuestionsWithTimeBucketCoverage(videos) {
  if (videos.length < 3) {
    throw new Error("Need at least 3 videos to ensure time-bucket coverage");
  }

  // Shuffle videos randomly
  const shuffledVideos = [...videos].sort(() => Math.random() - 0.5);

  // Shuffle time buckets for random assignment
  const timeBuckets = ["beginning", "middle", "end"].sort(() => Math.random() - 0.5);

  const selectedQuestions = [];

  // Assign first 3 videos to different time buckets
  for (let i = 0; i < 3; i++) {
    const video = shuffledVideos[i];
    const targetBucket = timeBuckets[i];
    const question = video.questions.find(q => q.timeBucket === targetBucket);

    if (!question) {
      console.warn(`Video ${video.id} missing ${targetBucket} question, using first available`);
      selectedQuestions.push({
        ...video.questions[0],
        videoId: video.id,
        videoTitle: video.title || video.id,
        required: true
      });
    } else {
      selectedQuestions.push({
        ...question,
        videoId: video.id,
        videoTitle: video.title || video.id,
        required: true
      });
    }
  }

  // For any remaining videos, randomly select a question
  for (let i = 3; i < shuffledVideos.length; i++) {
    const video = shuffledVideos[i];
    const randomQuestion = video.questions[Math.floor(Math.random() * video.questions.length)];
    selectedQuestions.push({
      ...randomQuestion,
      videoId: video.id,
      videoTitle: video.title || video.id,
      required: true
    });
  }

  return selectedQuestions;
}

/**
 * onGameStart - Initialize game with 3 rounds (one per topic)
 */
Empirica.onGameStart(async ({ game }) => {
  console.log("=== Game Starting ===");
  console.log(`Game ID: ${game.id}`);

  const players = game.players;
  if (players.length === 0) {
    console.error("No players found in game");
    return;
  }
  const player = players[0];

  const treatment = game.get("treatment") || {};
  const lengthCategory = treatment.lengthCategory || "short";
  const llmConfig = treatment.llmConfig || "none";

  console.log(`Treatment: length=${lengthCategory}, llm=${llmConfig}`);

  // Define all topics and randomize order
  const allTopics = [
    "louvre-robbery-2025",
    "olympics",
    "titan-submarine-implosion"
  ];

  // Shuffle topics for random order
  const topicOrder = allTopics.sort(() => Math.random() - 0.5);

  // Store topic order for data analysis
  game.set("topicOrder", topicOrder);
  game.set("topicOrderMeta", topicOrder.map((topic, idx) => ({
    topic: topic,
    roundIndex: idx + 1,
    position: idx + 1
  })));

  console.log(`Topic order: ${topicOrder.join(" → ")}`);

  // Store treatment info
  game.set("lengthCategory", lengthCategory);
  game.set("llmConfig", llmConfig);

  // Store at player level for exit survey
  player.set("treatmentAssignment", {
    llmConfig: llmConfig,
    lengthCategory: lengthCategory,
    chatEnabled: llmConfig !== "none",
    chatHasVideoContext: llmConfig === "with-video" || llmConfig === "with-video-incorrect",
    topicOrder: topicOrder
  });

  // Create Preparation Round (happens once at the start)
  // This processes videos for the first topic
  const firstTopic = topicOrder[0];
  const firstTopicVideos = getVideosByLength(firstTopic, lengthCategory);

  const prepRound = game.addRound({
    name: "Preparation",
    task: "preparation",
  });

  const prepStage = prepRound.addStage({
    name: "Preparation",
    duration: 180, // 3 minutes
  });
  prepStage.set("videos", firstTopicVideos);
  prepStage.set("topic", firstTopic);
  prepStage.set("roundIndex", 0); // Special round index for preparation
  prepStage.set("llmConfig", llmConfig);
  prepStage.set("isPreparationRound", true);

  console.log(`Preparation round created for first topic: ${firstTopic}`);

  // Create 3 experiment rounds (one per topic, in random order)
  topicOrder.forEach((topic, roundIndex) => {
    const round = game.addRound({
      name: `Experiment ${roundIndex + 1}`,
      task: `topic-${topic}`,
    });

    // Get videos for this topic
    const videos = getVideosByLength(topic, lengthCategory);

    if (videos.length === 0) {
      console.error(`No videos found for topic ${topic} and length ${lengthCategory}`);
    }

    const selectedQuestions = videos.length >= 3
      ? sampleQuestionsWithTimeBucketCoverage(videos)
      : [];

    // Store round-level data
    round.set("topic", topic);
    round.set("roundIndex", roundIndex + 1); // 1-indexed for experiment rounds
    round.set("videos", videos);
    round.set("selectedQuestions", selectedQuestions);

    // Add Main Experiment Stage (no preparation stage here)
    const mainStage = round.addStage({
      name: "Video Viewing and Questions",
      duration: 900, // 15 minutes
    });

    // Determine if wrong answers mode for this round
    // Only enable in round 3 (index 2) AND if treatment has "incorrect"
    const isWrongAnswersMode = (roundIndex === 2) && (llmConfig === "with-video-incorrect");

    mainStage.set("videos", videos);
    mainStage.set("topic", topic);
    mainStage.set("roundIndex", roundIndex + 1);
    mainStage.set("llmConfig", llmConfig);
    mainStage.set("chatEnabled", llmConfig !== "none");
    mainStage.set("chatHasVideoContext", llmConfig === "with-video" || llmConfig === "with-video-incorrect");
    mainStage.set("wrongAnswersMode", isWrongAnswersMode);
    mainStage.set("selectedQuestions", selectedQuestions);
    mainStage.set("treatment", treatment);

    console.log(`Experiment Round ${roundIndex + 1} (${topic}):`, {
      videoCount: videos.length,
      questionCount: selectedQuestions.length,
      wrongAnswersMode: isWrongAnswersMode
    });
  });

  console.log("Game initialized with 1 preparation round + 3 experiment rounds");
});

/**
 * onRoundStart - Initialize round-level data
 */
Empirica.onRoundStart(({ round }) => {
  console.log(`Round started: ${round.get("name")}`);
  round.set("startedAt", new Date().toISOString());
});

/**
 * onStageStart - Initialize stage-level data and setup background processing
 */
Empirica.onStageStart(({ stage }) => {
  const stageName = stage.get("name");
  const topic = stage.get("topic");
  const roundIndex = stage.get("roundIndex");

  console.log(`Stage started: ${stageName} (Round ${roundIndex}, Topic: ${topic})`);
  stage.set("startedAt", new Date().toISOString());

  if (stageName === "Video Viewing and Questions") {
    const game = stage.currentGame;

    // Get llmConfig to check if we should set background processing
    const llmConfig = stage.get("llmConfig") || game.get("llmConfig") || "none";

    // Only set background processing if LLM is enabled
    if (llmConfig === "none") {
      console.log(`[Background Processing] Skipping - control condition (no LLM)`);
      return;
    }

    // Only set up background processing for rounds 1 and 2 (not the last round)
    if (roundIndex < 1 || roundIndex >= 3) {
      console.log(`[Background Processing] Not setting up (roundIndex ${roundIndex} is not in range [1, 3))`);
      return;
    }

    // Use the stored topicOrder as the source of truth for what comes next,
    // rather than relying on game.rounds array index order (not guaranteed by Empirica)
    const topicOrder = game.get("topicOrder");
    if (!topicOrder || !Array.isArray(topicOrder)) {
      console.error(`[Background Processing] Error: topicOrder not found on game`);
      return;
    }

    // roundIndex is 1-indexed: round 1 = topicOrder[0], round 2 = topicOrder[1], etc.
    const nextTopicIdx = roundIndex; // Next topic is at topicOrder[roundIndex]
    if (nextTopicIdx >= topicOrder.length) {
      console.log(`[Background Processing] No next topic (index ${nextTopicIdx} >= ${topicOrder.length})`);
      return;
    }

    const nextTopic = topicOrder[nextTopicIdx];
    const nextRoundIndex = roundIndex + 1;

    // Find the matching round by task name instead of array position
    const rounds = game.rounds;
    const expectedTask = `topic-${nextTopic}`;
    const nextRound = rounds.find(r => {
      try { return r.get("task") === expectedTask; }
      catch (e) { return false; }
    });

    if (!nextRound) {
      console.error(`[Background Processing] Error: Could not find round with task "${expectedTask}"`);
      console.error(`[Background Processing] Available rounds (${rounds.length}):`,
        rounds.map((r, i) => {
          try { return `[${i}] task=${r.get("task")}, topic=${r.get("topic")}`; }
          catch (e) { return `[${i}] (error reading: ${e.message})`; }
        }).join(", ")
      );
      return;
    }

    const nextVideos = nextRound.get("videos");
    if (!nextVideos || nextVideos.length === 0) {
      console.warn(`[Background Processing] No videos found for next topic: ${nextTopic}`);
      return;
    }

    console.log(`[Background Processing] Setting up for next topic: ${nextTopic} (Round ${nextRoundIndex})`);

    // Store metadata for client to initiate background processing
    stage.set("backgroundProcessing", {
      nextTopic: nextTopic,
      nextVideos: nextVideos,
      nextRoundIndex: nextRoundIndex
    });
  }
});

/**
 * onStageEnded - Validate and process stage completion
 */
Empirica.onStageEnded(({ stage }) => {
  const stageName = stage.get("name");
  console.log(`Stage ended: ${stageName}`);
  stage.set("endedAt", new Date().toISOString());

  // Get all players in this stage
  const players = stage.currentGame.players;

  players.forEach((player) => {
    // Only apply to the video stage
    if (stageName === "Video Viewing and Questions") {
      // Check if the player explicitly submitted
      const submitted = player.stage.get("submit");

      // If they didn't submit, they ran out of time
      if (!submitted) {
        console.log(`[Stage End] Player ${player.id} ran out of time. Saving current progress.`);

        // 1. Get the latest intermediate data (auto-saved by client)
        const currentResponses = player.stage.get("responses") || {};
        const currentConfidence = player.stage.get("confidenceResponses") || {};
        const currentVideoStats = player.stage.get("videoStats") || {};
        const currentChatMessages = player.stage.get("chatMessages") || [];

        // 2. Save them to the "final" keys so your analysis scripts find them
        player.stage.set("finalResponses", currentResponses);
        player.stage.set("finalConfidenceResponses", currentConfidence);
        player.stage.set("finalVideoStats", currentVideoStats);
        player.stage.set("finalChatMessages", currentChatMessages);

        // 3. Mark that they ran out of time (useful for filtering data later)
        player.stage.set("ranOutOfTime", true);
      }
    }

    // Now safe to log "final" stats for everyone
    const responses = player.stage.get("finalResponses") || {};
    const watchedVideos = player.stage.get("finalWatchedVideos") || [];
    const chatMessages = player.stage.get("finalChatMessages") || [];

    console.log(`Player ${player.id} completion:`);
    console.log(`- Responses: ${Object.keys(responses).length}`);
    console.log(`- Videos watched: ${watchedVideos.length}`);
    console.log(`- Chat messages: ${chatMessages.length}`);

    // Log completion status
    player.set("stageCompleted", true);
    player.set("completedAt", new Date().toISOString());
  });
});

/**
 * onRoundEnded - Process round completion
 */
Empirica.onRoundEnded(({ round }) => {
  console.log(`Round ended: ${round.get("name")}`);
  round.set("endedAt", new Date().toISOString());
});

/**
 * onGameEnded - Final data processing and cleanup
 */
Empirica.onGameEnded(({ game }) => {
  console.log(`Game ended: ${game.id}`);
  game.set("endedAt", new Date().toISOString());

  // Log final game statistics
  const players = game.players;
  console.log(`Game completed with ${players.length} player(s)`);

  players.forEach((player) => {
    // These might be scattered across stages now, so we might want to aggregate them if needed
    // But for now, just logging basic info
    const treatment = player.get("treatmentAssignment");
    console.log(`Player ${player.id} finished. Treatment: ${treatment?.llmConfig}`);
  });
});
