/**
 * Content Matching Module
 *
 * Implements the algorithm for matching videos to users based on:
 * - User opinions from pre-survey
 * - Treatment assignment (counter-attitudinal, confirming, neutral)
 * - Video length category
 * - Topic selection
 */

import { getVideosByTopic } from "../../client/src/config/videos.js";

/**
 * Main matching function - pairs users with appropriate videos
 *
 * @param {Object} params - Matching parameters
 * @param {string} params.topic - Topic name (politics, climate, health, sport)
 * @param {Object} params.playerOpinions - Player's opinion responses from pre-survey
 * @param {string} params.treatment - Treatment condition (counter-attitudinal, confirming, neutral)
 * @param {string} params.lengthCategory - Video length category (short, long, mixed)
 * @param {number} params.maxVideos - Maximum number of videos to return
 * @returns {Array} Array of matched video objects
 */
export function matchVideosToPlayer({
  topic,
  playerOpinions = {},
  treatment = "neutral",
  lengthCategory = "mixed",
  maxVideos = 6,
}) {
  console.log(`Matching videos for topic: ${topic}, treatment: ${treatment}, length: ${lengthCategory}`);

  // Get all videos for this topic
  let videos = getVideosByTopic(topic);

  if (videos.length === 0) {
    console.warn(`No videos found for topic: ${topic}`);
    return [];
  }

  // Filter by length category if specified
  if (lengthCategory !== "mixed") {
    videos = videos.filter(v => v.lengthCategory === lengthCategory);
  }

  // Apply treatment-based matching
  let matchedVideos = [];

  switch (treatment) {
    case "counter-attitudinal":
      matchedVideos = matchCounterAttitudinal(videos, playerOpinions, topic);
      break;
    case "confirming":
      matchedVideos = matchConfirming(videos, playerOpinions, topic);
      break;
    case "neutral":
    default:
      matchedVideos = matchNeutral(videos, playerOpinions, topic);
      break;
  }

  // Limit to maxVideos
  const result = matchedVideos.slice(0, maxVideos);

  console.log(`Matched ${result.length} videos for player`);
  return result;
}

/**
 * Match counter-attitudinal videos (videos that challenge user's opinions)
 * @private
 */
function matchCounterAttitudinal(videos, playerOpinions, topic) {
  // Calculate alignment scores for each video
  const scoredVideos = videos.map(video => ({
    video,
    alignmentScore: calculateAlignmentScore(video, playerOpinions, topic),
  }));

  // Sort by alignment score (ascending) - most counter-attitudinal first
  scoredVideos.sort((a, b) => a.alignmentScore - b.alignmentScore);

  return scoredVideos.map(sv => sv.video);
}

/**
 * Match confirming videos (videos that align with user's opinions)
 * @private
 */
function matchConfirming(videos, playerOpinions, topic) {
  // Calculate alignment scores for each video
  const scoredVideos = videos.map(video => ({
    video,
    alignmentScore: calculateAlignmentScore(video, playerOpinions, topic),
  }));

  // Sort by alignment score (descending) - most confirming first
  scoredVideos.sort((a, b) => b.alignmentScore - a.alignmentScore);

  return scoredVideos.map(sv => sv.video);
}

/**
 * Match neutral selection (balanced or random)
 * @private
 */
function matchNeutral(videos, playerOpinions, topic) {
  // For neutral condition, return a balanced mix or random sample
  // Shuffle videos randomly
  const shuffled = [...videos].sort(() => 0.5 - Math.random());
  return shuffled;
}

/**
 * Calculate how aligned a video is with user's opinions
 *
 * Returns a score from -1 (counter-attitudinal) to 1 (confirming)
 * Score of 0 is neutral/unknown alignment
 *
 * @param {Object} video - Video object with stance and subtopics
 * @param {Object} playerOpinions - Player's opinion responses
 * @param {string} topic - Topic name
 * @returns {number} Alignment score (-1 to 1)
 */
function calculateAlignmentScore(video, playerOpinions, topic) {
  // This is a placeholder implementation that should be customized
  // based on your specific opinion questions and video stances

  // Example logic for politics topic:
  if (topic === "politics") {
    const politicalAffiliation = playerOpinions.political_affiliation;
    const videoStance = video.stance;

    if (!politicalAffiliation || !videoStance) {
      return 0; // Unknown alignment
    }

    // Map political affiliation to alignment with video stance
    const alignmentMap = {
      "very-liberal": {
        liberal: 1,
        moderate: 0.5,
        conservative: -1,
        neutral: 0,
      },
      liberal: {
        liberal: 0.8,
        moderate: 0.3,
        conservative: -0.8,
        neutral: 0,
      },
      moderate: {
        liberal: 0,
        moderate: 1,
        conservative: 0,
        neutral: 0.5,
      },
      conservative: {
        liberal: -0.8,
        moderate: 0.3,
        conservative: 0.8,
        neutral: 0,
      },
      "very-conservative": {
        liberal: -1,
        moderate: 0.5,
        conservative: 1,
        neutral: 0,
      },
    };

    return alignmentMap[politicalAffiliation]?.[videoStance] || 0;
  }

  // Example logic for climate topic:
  if (topic === "climate") {
    // Look for climate-specific opinion questions
    // e.g., climate_concern, climate_action_support, etc.
    const climateConcern = playerOpinions.climate_concern;
    const videoStance = video.stance;

    if (!climateConcern || !videoStance) {
      return 0;
    }

    // High concern aligns with pro-action stance
    if (climateConcern >= 4 && videoStance === "pro-action") {
      return 1;
    }
    if (climateConcern >= 4 && videoStance === "skeptical") {
      return -1;
    }
    if (climateConcern <= 2 && videoStance === "skeptical") {
      return 1;
    }
    if (climateConcern <= 2 && videoStance === "pro-action") {
      return -1;
    }

    return 0;
  }

  // Return neutral for topics without specific alignment logic
  return 0;
}

/**
 * Validate matching configuration before running experiment
 * Checks if enough videos exist for each treatment condition
 *
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validation results
 */
export function validateMatchingConfig(config) {
  const { topic, lengthCategory, maxVideos } = config;

  let videos = getVideosByTopic(topic);

  if (lengthCategory !== "mixed") {
    videos = videos.filter(v => v.lengthCategory === lengthCategory);
  }

  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    stats: {
      totalVideos: videos.length,
      requiredVideos: maxVideos,
      stances: {},
    },
  };

  // Count videos by stance
  videos.forEach(video => {
    validation.stats.stances[video.stance] =
      (validation.stats.stances[video.stance] || 0) + 1;
  });

  // Check if we have enough videos
  if (videos.length < maxVideos) {
    validation.errors.push(
      `Not enough videos (${videos.length}) for maxVideos setting (${maxVideos})`
    );
    validation.isValid = false;
  }

  // Warn if stance distribution is very unbalanced
  const stanceCounts = Object.values(validation.stats.stances);
  const maxStanceCount = Math.max(...stanceCounts);
  const minStanceCount = Math.min(...stanceCounts);

  if (maxStanceCount > minStanceCount * 3) {
    validation.warnings.push(
      "Stance distribution is highly unbalanced - may affect treatment validity"
    );
  }

  return validation;
}

/**
 * Log matching decision for analysis
 * This should be called and saved to player data for research transparency
 *
 * @param {Object} params - Matching parameters
 * @param {Array} matchedVideos - The videos that were matched
 * @returns {Object} Log entry object
 */
export function createMatchingLog(params, matchedVideos) {
  return {
    timestamp: new Date().toISOString(),
    topic: params.topic,
    treatment: params.treatment,
    lengthCategory: params.lengthCategory,
    requestedMaxVideos: params.maxVideos,
    actualMatchedCount: matchedVideos.length,
    matchedVideoIds: matchedVideos.map(v => v.id),
    matchedVideoStances: matchedVideos.map(v => v.stance),
    playerOpinionsSnapshot: params.playerOpinions,
  };
}
