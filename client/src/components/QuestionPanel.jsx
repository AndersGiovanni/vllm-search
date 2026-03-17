import React from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { QuestionRenderer } from "./QuestionRenderer";
import { CheckCircle2, AlertCircle } from "lucide-react";

/**
 * QuestionPanel Component
 *
 * Displays a panel of questions using QuestionRenderer.
 * Always visible, questions can be answered anytime.
 *
 * Props:
 * - questions: Array of question objects from question bank
 * - responses: Object mapping question IDs to responses
 * - onResponseChange: Callback when a response changes
 * - errors: Object mapping question IDs to error messages (optional)
 * - title: Panel title (optional)
 */
export default function QuestionPanel({
  questions = [],
  responses = {},
  onResponseChange,
  errors = {},
  title = "Questions",
  showConfidence = false,
  confidenceResponses = {},
  onConfidenceChange,
}) {
  const handleResponseChange = (questionId, value) => {
    if (onResponseChange) {
      onResponseChange(questionId, value);
    }
  };

  const getCompletionStats = () => {
    const requiredQuestions = questions.filter(q => q.required);
    
    const completedRequired = requiredQuestions.filter(q => {
      const hasResponse = responses[q.id] !== undefined && responses[q.id] !== null && responses[q.id] !== "";
      
      if (!showConfidence) {
        return hasResponse;
      }

      const hasConfidence = confidenceResponses[q.id] !== undefined && confidenceResponses[q.id] !== null;
      return hasResponse && hasConfidence;
    });

    return {
      required: requiredQuestions.length,
      completed: completedRequired.length,
      isComplete: completedRequired.length === requiredQuestions.length,
    };
  };

  const stats = getCompletionStats();

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <Badge
            variant={stats.isComplete ? "default" : "outline"}
            className={stats.isComplete ? "bg-green-600" : ""}
          >
            {stats.completed}/{stats.required} required
          </Badge>
        </div>
        {!stats.isComplete && (
          <div className="flex items-center gap-2 mt-2 text-sm text-amber-700">
            <AlertCircle className="w-4 h-4" />
            <span>Please complete all required questions {showConfidence ? "and confidence ratings" : ""} to submit</span>
          </div>
        )}
        {stats.isComplete && (
          <div className="flex items-center gap-2 mt-2 text-sm text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            <span>All required questions completed!</span>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {questions.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <p className="text-sm">No questions available</p>
          </div>
        )}

        {questions.map((question, index) => (
          <div
            key={question.id}
            className={`
              p-4 rounded-lg border
              ${errors[question.id] ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}
            `}
          >
            <div className="flex items-start gap-2 mb-2">
              <Badge variant="outline" className="shrink-0 text-xs">
                Q{index + 1}
              </Badge>
              {responses[question.id] !== undefined &&
                responses[question.id] !== null &&
                responses[question.id] !== "" && (
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                )}
            </div>

            <QuestionRenderer
              question={question}
              value={responses[question.id]}
              onChange={(value) => handleResponseChange(question.id, value)}
              error={errors[question.id]}
              showConfidence={showConfidence}
              confidenceValue={confidenceResponses[question.id]}
              onConfidenceChange={(val) => onConfidenceChange && onConfidenceChange(question.id, val)}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
