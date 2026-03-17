import React from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Placeholder Stage Component
 * Simple stage for testing intro/exit flow
 */
export function PlaceholderStage() {
  const player = usePlayer();

  const handleContinue = () => {
    player.stage.set("submit", true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Placeholder Stage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-gray-600">
            This is a placeholder stage for testing the intro and exit flow.
            Click continue to proceed to the exit survey.
          </p>

          <div className="flex justify-center pt-4">
            <Button onClick={handleContinue} size="lg" className="w-full sm:w-auto">
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
