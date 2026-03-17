import React from "react";
import { Timer } from "./components/Timer";
import { Card } from "./components/ui/card";

export function Profile() {
  return (
    <Card className="max-w-md mx-auto mt-4 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-center">
        <Timer />
      </div>
    </Card>
  );
}
