/**
 * Question Bank Configuration
 *
 * This file defines all survey questions used in the experiment.
 * Each question has:
 * - id: Unique identifier used for storing responses
 * - type: Determines which UI component to render
 * - text: Question text displayed to participants
 * - required: Whether the question must be answered
 * - Additional type-specific configuration
 */

// Question Types:
// - number: Number input field
// - select: Dropdown selection
// - likert: Likert scale (radio buttons)
// - multipleChoice: Multiple choice question
// - textarea: Open-ended text response

export const questionBank = {
  // ===========================================
  // DEMOGRAPHICS QUESTIONS
  // ===========================================
  demographics: [
    {
      id: "age",
      type: "number",
      text: "What is your age?",
      required: true,
      min: 18,
      max: 120,
      placeholder: "Enter your age"
    },
    {
      id: "gender",
      type: "select",
      text: "What is your gender?",
      required: true,
      options: [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
        { value: "non-binary", label: "Non-binary" },
        { value: "other", label: "Other" },
        { value: "prefer-not-to-say", label: "Prefer not to say" }
      ]
    },
    {
      id: "education",
      type: "select",
      text: "What is your highest level of education completed?",
      required: true,
      options: [
        { value: "less-than-high-school", label: "Less than high school" },
        { value: "high-school", label: "High school diploma or equivalent" },
        { value: "some-college", label: "Some college, no degree" },
        { value: "associates", label: "Associate's degree" },
        { value: "bachelors", label: "Bachelor's degree" },
        { value: "masters", label: "Master's degree" },
        { value: "doctorate", label: "Doctorate or professional degree" }
      ]
    },
    {
      id: "political-affiliation",
      type: "select",
      text: "What is your political affiliation?",
      required: true,
      options: [
        { value: "very-liberal", label: "Very Liberal" },
        { value: "liberal", label: "Liberal" },
        { value: "moderate", label: "Moderate" },
        { value: "conservative", label: "Conservative" },
        { value: "very-conservative", label: "Very Conservative" },
        { value: "other", label: "Other" },
        { value: "prefer-not-to-say", label: "Prefer not to say" }
      ]
    },
    {
      id: "video-content-engagement",
      type: "likert",
      text: "To what degree do you prefer video-based content as opposed to image or text-based content?",
      required: true,
      scale: {
        min: 1,
        max: 5,
        minLabel: "Mostly images/text",
        maxLabel: "Mostly videos"
      }
    }
  ],

  // ===========================================
  // NOTE: Video comprehension questions are now embedded in videos.js
  // Each video has 3 questions (beginning, middle, end) that are
  // sampled at game start to ensure coverage of all time buckets.
  // ===========================================

  // ===========================================
  // EXIT SURVEY QUESTIONS
  // ===========================================
  exitSurvey: [
    {
      id: "social-media-daily-usage",
      type: "select",
      text: "On average, how much time do you spend on social media per day?",
      required: true,
      options: [
        { value: "none", label: "I don't use social media" },
        { value: "less-than-1hr", label: "Less than 1 hour" },
        { value: "1-2hrs", label: "1-2 hours" },
        { value: "2-4hrs", label: "2-4 hours" },
        { value: "4-6hrs", label: "4-6 hours" },
        { value: "6plus-hrs", label: "More than 6 hours" }
      ]
    },
    {
      id: "social-media-platforms",
      type: "multipleChoice",
      text: "Which social media platforms do you use on a regular basis? (Select all that apply)",
      required: true,
      allowMultiple: true,
      options: [
        { value: "tiktok", label: "TikTok" },
        { value: "instagram", label: "Instagram" },
        { value: "youtube", label: "YouTube" },
        { value: "facebook", label: "Facebook" },
        { value: "twitter", label: "Twitter/X" },
        { value: "reddit", label: "Reddit" },
        { value: "snapchat", label: "Snapchat" },
        { value: "linkedin", label: "LinkedIn" },
        { value: "bluesky", label: "Bluesky" },
        { value: "other", label: "Other" },
        { value: "none", label: "None" }
      ]
    },
    {
      id: "ai-usage-frequency",
      type: "select",
      text: "How often do you use AI chatbots (e.g., ChatGPT, Claude, Gemini)?",
      required: true,
      options: [
        { value: "never", label: "Never" },
        { value: "less-than-once-month", label: "Less than once a month" },
        { value: "few-times-month", label: "A few times a month" },
        { value: "few-times-week", label: "A few times a week" },
        { value: "once-day", label: "About once a day" },
        { value: "multiple-daily", label: "Multiple times a day" }
      ]
    },
    {
      id: "ai-tools-used",
      type: "multipleChoice",
      text: "Which AI chatbots are you currently using? (Select all that apply)",
      required: true,
      allowMultiple: true,
      options: [
        { value: "chatgpt", label: "ChatGPT" },
        { value: "claude", label: "Claude" },
        { value: "gemini", label: "Gemini (Google)" },
        { value: "copilot", label: "Copilot (Microsoft)" },
        { value: "image-gen", label: "Image generation (Midjourney, DALL-E, etc.)" },
        { value: "other", label: "Other AI tools" },
        { value: "none", label: "None" }
      ]
    },
    {
      id: "ai-trust-level",
      type: "likert",
      text: "Overall, how much do you trust information provided by AI chatbots?",
      required: true,
      scale: {
        min: 1,
        max: 5,
        minLabel: "Not at all",
        maxLabel: "Completely"
      }
    },
    {
      id: "topic-knowledge",
      type: "likert",
      text: "Before this study, how much did you know about the Louvre robbery incident shown in the videos?",
      required: true,
      scale: {
        min: 1,
        max: 5,
        minLabel: "Never heard of it",
        maxLabel: "Knew most details"
      }
    },
    {
      id: "topic-knowledge-olympics",
      type: "likert",
      text: "Before this study, how much did you know about the Olympics facts shown in the videos?",
      required: true,
      scale: {
        min: 1,
        max: 5,
        minLabel: "Never heard of it",
        maxLabel: "Knew most details"
      }
    },
    {
      id: "topic-knowledge-titan",
      type: "likert",
      text: "Before this study, how much did you know about the Titan submarine incident shown in the videos?",
      required: true,
      scale: {
        min: 1,
        max: 5,
        minLabel: "Never heard of it",
        maxLabel: "Knew most details"
      }
    },
    {
      id: "attention-check-1",
      type: "multipleChoice",
      text: "To ensure you are paying attention, please select 'Somewhat agree' for this question.",
      required: true,
      options: [
        { value: "strongly-disagree", label: "Strongly disagree" },
        { value: "disagree", label: "Disagree" },
        { value: "somewhat-agree", label: "Somewhat agree", isCorrect: true },
        { value: "agree", label: "Agree" },
        { value: "strongly-agree", label: "Strongly agree" }
      ]
    },
    {
      id: "study-understanding",
      type: "likert",
      text: "How clear were the instructions you received before starting the task?",
      required: true,
      scale: {
        min: 1,
        max: 5,
        minLabel: "Not at all",
        maxLabel: "Completely"
      }
    },
    {
      id: "video-informativeness",
      type: "likert",
      text: "How informative did you find the videos to be in order to answer the questions?",
      required: true,
      scale: {
        min: 1,
        max: 5,
        minLabel: "Not at all",
        maxLabel: "Completely"
      },
      naOption: {
        label: "I didn't watch the videos",
        value: "did-not-watch-videos"
      }
    },
    {
      id: "content-reliability",
      type: "likert",
      text: "How reliable did you find the content provided in the videos?",
      required: true,
      scale: {
        min: 1,
        max: 5,
        minLabel: "Not at all",
        maxLabel: "Completely"
      },
      naOption: {
        label: "I didn't watch the videos",
        value: "did-not-watch-videos"
      }
    },
    {
      id: "ai-vs-search-preference",
      type: "likert",
      text: "Do you prefer to look up information using search engines (e.g. Google) or AI chatbots (e.g. ChatGPT)?",
      required: true,
      scale: {
        min: 1,
        max: 5,
        minLabel: "Only search engines",
        maxLabel: "Only AI chatbots"
      }
    },
    {
      id: "ai-task-preference",
      type: "likert",
      text: "Would you prefer to complete similar tasks with or without AI assistance?",
      required: true,
      scale: {
        min: 1,
        max: 5,
        minLabel: "Definitely without AI",
        maxLabel: "Definitely with AI"
      }
    },
    {
      id: "technical-issues",
      type: "multipleChoice",
      text: "Did you experience any technical issues during the study?",
      required: true,
      options: [
        { value: "none", label: "No issues" },
        { value: "video-loading", label: "Video loading problems" },
        { value: "audio", label: "Audio problems" },
        { value: "page-loading", label: "Page loading issues" },
        { value: "ai-assistant-slow", label: "AI assistant was slow" },
        { value: "ai-assistant-other", label: "Other problems with the use of the AI assistant" },
        { value: "other", label: "Other issues" }
      ]
    },
    {
      id: "feedback",
      type: "textarea",
      text: "Please share any feedback, comments, or issues you encountered during the study.",
      required: false,
      placeholder: "Your feedback helps us improve...",
      maxLength: 1000
    }
  ],

  // ===========================================
  // AI-SPECIFIC EXIT SURVEY QUESTIONS
  // Only shown to participants in treatment conditions with AI access
  // ===========================================
  exitSurveyAI: [
    {
      id: "ai-usage-confirmation",
      type: "multipleChoice",
      text: "Did you use the AI assistant?",
      required: true,
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" }
      ]
    },
    {
      id: "ai-usefulness",
      type: "likert",
      text: "How informative were the answers provided by the AI assistant for answering the questions?",
      required: true,
      scale: {
        min: 1,
        max: 5,
        minLabel: "Not at all helpful",
        maxLabel: "Very helpful"
      },
      naOption: {
        label: "I didn't use it",
        value: "did-not-use"
      }
    },
    {
      id: "ai-trust",
      type: "likert",
      text: "How reliable were the AI assistant responses?",
      required: true,
      scale: {
        min: 1,
        max: 5,
        minLabel: "Not at all",
        maxLabel: "Completely"
      },
      naOption: {
        label: "I didn't use it",
        value: "did-not-use"
      }
    }
  ],

  // ===========================================
  // ATTENTION CHECK QUESTIONS
  // ===========================================
  attentionChecks: [
    {
      id: "attention-check-1",
      type: "multipleChoice",
      text: "To ensure you are paying attention, please select 'Somewhat agree' for this question.",
      required: false,
      options: [
        { value: "strongly-disagree", label: "Strongly disagree" },
        { value: "disagree", label: "Disagree" },
        { value: "somewhat-agree", label: "Somewhat agree", isCorrect: true },
        { value: "agree", label: "Agree" },
        { value: "strongly-agree", label: "Strongly agree" }
      ]
    }
  ]
};

/**
 * Helper function to get questions by category
 * @param {string} category - Category name (demographics, exitSurvey, exitSurveyAI, attentionChecks)
 * @returns {Array} Array of question objects
 *
 * Note: Video comprehension questions are now embedded in videos.js
 * and sampled at game start. Use stage.get("selectedQuestions") to access them.
 */
export function getQuestions(category) {
  if (category === "demographics") {
    return questionBank.demographics;
  }

  if (category === "exitSurvey") {
    return questionBank.exitSurvey;
  }

  if (category === "exitSurveyAI") {
    return questionBank.exitSurveyAI;
  }

  if (category === "attentionChecks") {
    return questionBank.attentionChecks;
  }

  return [];
}

/**
 * Helper function to get a single question by ID
 * @param {string} questionId - Question ID
 * @returns {Object|null} Question object or null if not found
 */
export function getQuestionById(questionId) {
  // Search in demographics
  let question = questionBank.demographics.find(q => q.id === questionId);
  if (question) return question;

  // Search in exit survey
  question = questionBank.exitSurvey.find(q => q.id === questionId);
  if (question) return question;

  // Search in AI exit survey
  question = questionBank.exitSurveyAI.find(q => q.id === questionId);
  if (question) return question;

  // Search in attention checks
  question = questionBank.attentionChecks.find(q => q.id === questionId);
  if (question) return question;

  return null;
}

/**
 * Validate responses against question requirements
 * @param {Object} responses - Object with question IDs as keys and responses as values
 * @param {Array} questions - Array of question objects to validate against
 * @returns {Object} { isValid: boolean, missingRequired: Array }
 */
export function validateResponses(responses, questions) {
  const missingRequired = [];

  for (const question of questions) {
    if (question.required && (responses[question.id] === undefined || responses[question.id] === "" || responses[question.id] === null)) {
      missingRequired.push(question.id);
    }
  }

  return {
    isValid: missingRequired.length === 0,
    missingRequired
  };
}