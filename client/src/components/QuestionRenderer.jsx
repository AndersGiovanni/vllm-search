import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

/**
 * QuestionRenderer - Dynamic question rendering component
 * Renders different question types based on question configuration
 *
 * @param {Object} question - Question object from question bank
 * @param {*} value - Current value
 * @param {Function} onChange - Change handler
 * @param {string} error - Error message (optional)
 * @param {boolean} showConfidence - Whether to show confidence rating (default: false)
 * @param {*} confidenceValue - Current confidence value
 * @param {Function} onConfidenceChange - Confidence change handler
 */
export function QuestionRenderer({
  question,
  value,
  onChange,
  error,
  showConfidence = false,
  confidenceValue,
  onConfidenceChange
}) {
  const { id, type, text, required, placeholder, options, scale, min, max } = question;

  const renderMainInput = () => {
    switch (type) {
      case "number":
        return (
          <div className="space-y-2">
            <Input
              id={id}
              type="number"
              min={min}
              max={max}
              placeholder={placeholder}
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              className={error ? "border-red-500" : ""}
              required={required}
            />
          </div>
        );

      case "select":
        return (
          <div className="space-y-2">
            <Select value={value || ""} onValueChange={onChange}>
              <SelectTrigger className={error ? "border-red-500" : ""}>
                <SelectValue placeholder="Select an option..." />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "likert":
        const scaleLength = scale.max - scale.min + 1;

        return (
          <div className="space-y-3">
            <RadioGroup
              value={value ? value.toString() : ""}
              onValueChange={(val) => {
                const intVal = parseInt(val, 10);
                onChange(isNaN(intVal) ? val : intVal);
              }}
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4"
            >
              <div className="flex items-center gap-6">
                <span className="text-sm text-muted-foreground whitespace-nowrap select-text cursor-text">
                  {scale.minLabel}
                </span>

                <div className="flex items-center gap-3">
                  {Array.from(
                    { length: scaleLength },
                    (_, i) => scale.min + i
                  ).map((num) => (
                    <div key={num} className="flex flex-col items-center gap-0.5">
                      <RadioGroupItem
                        value={num.toString()}
                        id={`${id}-${num}`}
                        className={`w-4 h-4 ${error ? "border-red-500" : ""}`}
                      />
                      <Label
                        htmlFor={`${id}-${num}`}
                        className="text-xs font-medium cursor-pointer select-text"
                      >
                        {num}
                      </Label>
                    </div>
                  ))}
                </div>

                <span className="text-sm text-muted-foreground whitespace-nowrap select-text cursor-text">
                  {scale.maxLabel}
                </span>
              </div>

              {question.naOption && (
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                  <div className="flex flex-col items-center gap-0.5">
                    <RadioGroupItem
                      value={question.naOption.value}
                      id={`${id}-na`}
                      className={`w-4 h-4 ${error ? "border-red-500" : ""}`}
                    />
                    <Label
                      htmlFor={`${id}-na`}
                      className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap select-text"
                    >
                      {question.naOption.label}
                    </Label>
                  </div>
                </div>
              )}
            </RadioGroup>
          </div>
        );

      case "multipleChoice":
        // Support both single-select (radio) and multi-select (checkbox)
        const isMultiSelect = question.allowMultiple === true;

        if (isMultiSelect) {
          // Multi-select with checkboxes
          const selectedValues = Array.isArray(value) ? value : [];

          const handleCheckboxChange = (optionValue, checked) => {
            let newValues;
            if (checked) {
              newValues = [...selectedValues, optionValue];
            } else {
              newValues = selectedValues.filter(v => v !== optionValue);
            }
            onChange(newValues);
          };

          return (
            <div className="space-y-2">
              <div className="space-y-2">
                {options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${id}-${option.value}`}
                      checked={selectedValues.includes(option.value)}
                      onCheckedChange={(checked) => handleCheckboxChange(option.value, checked)}
                      className={error ? "border-red-500" : ""}
                    />
                    <Label
                      htmlFor={`${id}-${option.value}`}
                      className="text-base font-normal cursor-pointer select-text"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          );
        } else {
          // Single-select with radio buttons
          return (
            <div className="space-y-2">
              <RadioGroup
                value={value || ""}
                onValueChange={onChange}
                className="space-y-2"
              >
                {options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={option.value}
                      id={`${id}-${option.value}`}
                      className={error ? "border-red-500" : ""}
                    />
                    <Label
                      htmlFor={`${id}-${option.value}`}
                      className="text-base font-normal cursor-pointer select-text"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          );
        }

      case "text":
        return (
          <div className="space-y-2">
            <Input
              id={id}
              type="text"
              placeholder={placeholder}
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              className={error ? "border-red-500" : ""}
              maxLength={question.maxLength}
              required={required}
            />
            {question.maxLength && (
              <p className="text-xs text-gray-500">
                {value?.length || 0} / {question.maxLength} characters
              </p>
            )}
          </div>
        );

      case "textarea":
        return (
          <div className="space-y-2">
            <Textarea
              id={id}
              placeholder={placeholder}
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              className={error ? "border-red-500" : ""}
              rows={4}
              maxLength={question.maxLength}
              required={required}
            />
            {question.maxLength && (
              <p className="text-xs text-gray-500">
                {value?.length || 0} / {question.maxLength} characters
              </p>
            )}
          </div>
        );

      default:
        return (
          <div className="text-red-500">
            Unknown question type: {type}
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Question Label */}
      <div className="text-base">
        <p 
          className="select-text cursor-text mb-0"
          onMouseDown={(e) => {
            // Prevent any parent click handlers from interfering with text selection
            e.stopPropagation();
          }}
        >
          {text}
          {required && <span className="text-red-500 ml-1">*</span>}
        </p>
        <Label htmlFor={id} className="sr-only">{text}</Label>
      </div>

      {/* Main Input */}
      {renderMainInput()}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Optional Confidence Section */}
      {showConfidence && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-600 mb-3">
            <p 
              className="select-text cursor-text mb-0"
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
            >
              How confident are you in your answer?
              {required && <span className="text-red-500 ml-1">*</span>}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 w-full">
            <span className="text-xs text-gray-500 text-left leading-tight select-text cursor-text">
              Not confident
            </span>

            <RadioGroup
              value={confidenceValue ? confidenceValue.toString() : ""}
              onValueChange={(val) => {
                const intVal = parseInt(val, 10);
                if (onConfidenceChange) onConfidenceChange(isNaN(intVal) ? val : intVal);
              }}
              className="flex items-center justify-center gap-2 sm:gap-4"
            >
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num} className="flex flex-col items-center gap-1">
                  <RadioGroupItem
                    value={num.toString()}
                    id={`${id}-conf-${num}`}
                    className="w-4 h-4"
                  />
                  <Label
                    htmlFor={`${id}-conf-${num}`}
                    className="text-xs font-medium cursor-pointer"
                  >
                    {num}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <span className="text-xs text-gray-500 text-right leading-tight select-text cursor-text">
              Very confident
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
