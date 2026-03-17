import React, { useState, useEffect } from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionRenderer } from "../components/QuestionRenderer";
import { Progress } from "@/components/ui/progress";
import { getQuestions } from "../config/questions";

/**
 * Pre-Survey Component
 * Collects demographic information from participants
 */
export function PreSurvey({ next }) {
  const player = usePlayer();

  useEffect(() => {
    // Scroll to the top of the page when the component mounts
    window.scrollTo(0, 0);

    // Record consent in player object since we passed the consent screen
    if (!player.get("consent")) {
      player.set("consent", {
        agreed: true,
        timestamp: new Date().toISOString(),
      });
    }
  }, [player]); // Dependency on player to ensure it's available

  // Get demographic questions from centralized question bank
  const allQuestions = getQuestions("demographics");

  // Initialize responses state
  const [responses, setResponses] = useState({});
  const [errors, setErrors] = useState({});

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

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateResponses()) {
      // Store demographic data in player object
      player.set("demographics", {
        ...responses,
        timestamp: new Date().toISOString(),
      });

      // Proceed to next step
      next();
    }
  };

  // Calculate progress
  const requiredQuestions = allQuestions.filter((q) => q.required);
  const completedRequired = requiredQuestions.filter(
    (q) => responses[q.id]
  ).length;
  const progressPercentage = (completedRequired / requiredQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="w-full shadow-sm">
          <CardHeader className="sticky top-0 z-10 bg-white border-b">
            <CardTitle className="text-2xl font-bold text-center">
              Background Information
            </CardTitle>
            <p className="text-center text-gray-600 mt-2">
              Please answer a few questions about yourself. This information helps us
              understand our study participants.
            </p>
            {/* Progress indicator - now sticky */}
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
              {/* Render each demographic question */}
              {allQuestions.map((question) => (
                <QuestionRenderer
                  key={question.id}
                  question={question}
                  value={responses[question.id]}
                  onChange={(value) => handleResponseChange(question.id, value)}
                  error={errors[question.id]}
                />
              ))}

              {Object.keys(errors).length > 0 && (
                <div className="text-red-500 text-center font-medium">
                  Please answer all required questions to continue.
                </div>
              )}

              <div className="flex justify-center pt-4">
                <Button type="submit" size="lg" className="w-full sm:w-auto">
                  Continue
                </Button>
              </div>
            </form>

            <p className="text-xs text-gray-500 text-center">
              <span className="text-red-500">*</span> indicates required fields
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
