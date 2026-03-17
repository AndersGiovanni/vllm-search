import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

/**
 * Consent Component
 * Displays informed consent information and collects participant consent
 */
export function Consent({ onConsent }) {
  const [agreed, setAgreed] = useState(false);
  const [noConsent, setNoConsent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (agreed) {
      // Proceed to next step
      onConsent();
    }
  };

  const handleNoConsent = () => {
    setNoConsent(true);
  };

  if (noConsent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Thank You</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              Thank you for your time. You have chosen not to participate in this study.
            </p>
            <p className="text-gray-700">
              You may close this window.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-3xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Informed Consent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-sm max-w-none space-y-4">
            <h3 className="text-lg font-semibold">Study Purpose</h3>
            <p className="text-gray-700">
              You are being invited to participate in a research study examining how people
              engage with video content and information. This study will take approximately
              20 minutes to complete.
            </p>

            <h3 className="text-lg font-semibold">What You Will Do</h3>
            <p className="text-gray-700">
              During this study, you will:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Complete a brief demographic survey</li>
              <li>Watch and interact with video content</li>
              <li>Answer questions about the content you viewed</li>
              <li>Provide feedback about your experience</li>
            </ul>

            <h3 className="text-lg font-semibold">Risks and Benefits</h3>
            <p className="text-gray-700">
              There are no anticipated risks beyond those encountered in everyday life.
              While you may not directly benefit from participating, your responses will
              contribute to research on information reception and media engagement.
            </p>

            <h3 className="text-lg font-semibold">Confidentiality</h3>
            <p className="text-gray-700">
              Your responses will be kept confidential. Data will be stored securely and
              only accessible to the research team. Your individual responses will not be
              identifiable in any publications or presentations.
            </p>

            <h3 className="text-lg font-semibold">Voluntary Participation</h3>
            <p className="text-gray-700">
              Your participation is completely voluntary. You may withdraw at any time
              without penalty. However, compensation may only be provided for completed
              sessions.
            </p>

            <h3 className="text-lg font-semibold">Questions</h3>
            <p className="text-gray-700">
              If you have questions about this study, please contact the research team
              at researcher@anonymous.edu.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="consent-checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label
                htmlFor="consent-checkbox"
                className="text-sm text-gray-900 cursor-pointer font-normal"
              >
                I have read and understood the above information. I voluntarily agree to
                participate in this research study. I understand that I can withdraw at
                any time.
              </Label>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleNoConsent}
                size="lg"
                className="w-full sm:w-auto"
              >
                No, I do not consent
              </Button>
              <Button
                type="submit"
                disabled={!agreed}
                size="lg"
                className="w-full sm:w-auto"
              >
                Continue to Study
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
