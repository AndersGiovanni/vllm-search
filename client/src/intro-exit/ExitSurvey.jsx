import { usePlayer } from "@empirica/core/player/classic/react";
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QuestionRenderer } from "../components/QuestionRenderer";
import { getQuestions } from "../config/questions";

export function ExitSurvey({ next }) {
  const player = usePlayer();

  // Check if participant had AI access
  const treatmentAssignment = player.get("treatmentAssignment") || {};
  const hadAIAccess = treatmentAssignment.chatEnabled || false;

  // Get exit survey questions from centralized question bank
  const exitQuestions = getQuestions("exitSurvey");
  const aiQuestions = hadAIAccess ? getQuestions("exitSurveyAI") : [];

  // Initialize responses state
  const [responses, setResponses] = useState({});
  const [errors, setErrors] = useState({});

  // Dynamic questions generation
  const allQuestions = useMemo(() => {
    // Combine questions: universal questions + AI questions (if applicable)
    const initialQuestions = [...exitQuestions, ...aiQuestions];

    const platformsQuestion = initialQuestions.find(q => q.id === "social-media-platforms");
    const selectedPlatforms = responses["social-media-platforms"];

    // If no platforms selected or only "none", return original list
    if (!selectedPlatforms || !Array.isArray(selectedPlatforms) || selectedPlatforms.includes("none") || selectedPlatforms.length === 0) {
      return initialQuestions;
    }

    const platformOptions = platformsQuestion?.options || [];
    const newQuestions = [];

    // Find index to insert after
    const insertIndex = initialQuestions.findIndex(q => q.id === "social-media-platforms");

    // Generate questions for each selected platform
    selectedPlatforms.forEach(platformValue => {
      const platformLabel = platformOptions.find(o => o.value === platformValue)?.label || platformValue;

      // Skip "Other" or "None" if needed, but "Other" is valid to ask about
      if (platformValue === "none" || platformValue === "other") return;

      newQuestions.push({
        id: `trust-platform-${platformValue}`,
        type: "likert",
        text: `On average, how reliable do you find the information to be on ${platformLabel}?`,
        required: true,
        scale: {
          min: 1,
          max: 5,
          minLabel: "Not at all",
          maxLabel: "Completely"
        }
      });

      newQuestions.push({
        id: `posting-frequency-${platformValue}`,
        type: "select",
        text: `How often do you post content on ${platformLabel}?`,
        required: true,
        options: [
          { value: "never", label: "Never" },
          { value: "less-than-once-month", label: "Less than once a month" },
          { value: "few-times-month", label: "A few times a month" },
          { value: "few-times-week", label: "A few times a week" },
          { value: "once-day", label: "About once a day" },
          { value: "multiple-daily", label: "Multiple times a day" }
        ]
      });
    });

    // Insert new questions into the list
    const before = initialQuestions.slice(0, insertIndex + 1);
    const after = initialQuestions.slice(insertIndex + 1);

    return [...before, ...newQuestions, ...after];
  }, [exitQuestions, aiQuestions, responses]);

  // Calculate progress
  const requiredQuestions = allQuestions.filter((q) => q.required);
  const completedRequired = requiredQuestions.filter(
    (q) => responses[q.id] && responses[q.id] !== ""
  ).length;
  const progressPercentage = requiredQuestions.length > 0
    ? (completedRequired / requiredQuestions.length) * 100
    : 0;

  // Handle individual question response
  const handleResponseChange = (questionId, value) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    // Clear error for this question
    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  // Validate responses
  const validateResponses = () => {
    const newErrors = {};
    let isValid = true;

    allQuestions.forEach((question) => {
      if (question.required && !responses[question.id]) {
        newErrors[question.id] = "This field is required";
        isValid = false;
      }
    });

    // Note: Attention check is tracked but not validated for correctness
    // Filtering happens during analysis based on their actual response

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateResponses()) {
      // Store exit survey data in player object
      player.set("exitSurvey", {
        ...responses,
        timestamp: new Date().toISOString(),
      });

      // Proceed to completion
      next();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-3xl w-full">
        <CardHeader className="sticky top-0 z-10 bg-white border-b">
          <CardTitle className="text-2xl font-bold text-center">
            Final Questions
          </CardTitle>
          <p className="text-center text-gray-600 mt-2">
            Thank you for participating! Please answer a few final questions.
          </p>
          {/* Progress indicator */}
          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>
                {completedRequired} / {requiredQuestions.length} required questions
              </span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-8">
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Render all questions (including dynamic ones) */}
            {allQuestions.map((question, index) => {
              // Check if this is the start of the AI section
              const isFirstAIQuestion = aiQuestions.length > 0 && question.id === aiQuestions[0].id;

              return (
                <React.Fragment key={question.id}>
                  {isFirstAIQuestion && (
                    <div className="border-t pt-6 mt-6">
                      <h3 className="font-semibold text-lg mb-4 text-gray-900">
                        Questions About the AI Assistant
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        The following questions are about your experience with the AI assistant.
                      </p>
                    </div>
                  )}
                  <QuestionRenderer
                    question={question}
                    value={responses[question.id]}
                    onChange={(value) => handleResponseChange(question.id, value)}
                    error={errors[question.id]}
                  />
                </React.Fragment>
              );
            })}

            {/* Completion Information */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-2">
              <h3 className="font-semibold text-green-900">Almost Done!</h3>
              <p className="text-sm text-green-900">
                After submitting this survey, you will receive your completion code
                for Prolific.
              </p>
            </div>

            {Object.keys(errors).length > 0 && (
              <div className="text-red-500 text-center font-medium">
                Please answer all required questions to continue.
              </div>
            )}

            <div className="flex justify-center pt-4">
              <Button type="submit" size="lg" className="w-full sm:w-auto">
                Submit and Complete Study
              </Button>
            </div>
          </form>

          <p className="text-xs text-gray-500 text-center">
            If you have any questions about this study, please contact the research
            team at researcher@anonymous.edu.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
