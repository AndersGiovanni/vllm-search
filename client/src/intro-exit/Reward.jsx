import { usePlayer } from "@empirica/core/player/classic/react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Reward({ next }) {
  const player = usePlayer();
  const [copied, setCopied] = useState(false);

  const completionCode = player?.id || "LOADING...";

  const handleCopy = () => {
    navigator.clipboard.writeText(completionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-2xl w-full shadow-lg">
        <CardHeader className="text-center border-b pb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Study Complete!
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Thank you for participating in this research study
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Study Purpose Debrief */}
          <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 space-y-3">
            <h3 className="font-semibold text-lg text-blue-900">
              Study Purpose
            </h3>
            <div className="text-sm text-blue-900 space-y-2">
              <p>
                This study examined how people engage with and understand video
                content on various topics, and how different forms of assistance
                (such as AI language models) might influence information search,
                comprehension, and engagement.
              </p>
              <p>
                Your responses will help researchers understand patterns in
                information search, comprehension, and media engagement, and the potential
                impacts of AI-assisted information search.
              </p>
              <p className="font-semibold">
                Please note: As part of the study design, the AI assistant may have
                intentionally provided incorrect information in some cases.
              </p>
            </div>
          </div>

          {/* Completion Code Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-300 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-green-900">
                Your Completion Code
              </h3>
              <Badge variant="outline" className="bg-white">
                Required for Prolific
              </Badge>
            </div>

            <div className="bg-white p-4 rounded-md border-2 border-green-400 shadow-sm">
              <p className="text-xs text-gray-600 mb-2 font-medium uppercase tracking-wide">
                Completion Code
              </p>
              <div className="flex items-center justify-between gap-3">
                <code className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
                  {completionCode}
                </code>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  {copied ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-yellow-900">
                  <p className="font-semibold mb-1">Important Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Copy the completion code above</li>
                    <li>Return to Prolific</li>
                    <li>Paste this code in the completion field</li>
                    <li>Submit to receive your payment</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              If you have any questions about this study or your participation,
              please contact the research team at{" "}
              <a
                href="mailto:researcher@anonymous.edu"
                className="text-blue-600 hover:underline font-medium"
              >
                researcher@anonymous.edu
              </a>
            </p>
          </div>

          {/* Finish Button */}
          <div className="flex justify-center pt-2">
            <Button
              onClick={next}
              size="lg"
              className="w-full sm:w-auto min-w-[200px]"
            >
              Complete Study
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
