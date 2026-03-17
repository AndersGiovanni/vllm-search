import { useGame } from "@empirica/core/player/classic/react";

import React from "react";
import { Stage } from "./Stage";

export function Game() {
  const game = useGame();
  const { playerCount } = game.get("treatment");

  return (
    <div className="min-h-screen w-full flex">
      <div className="flex-1">
        <Stage />
      </div>

      {playerCount > 1 && (
        <div className="w-128 border-l flex justify-center items-center min-h-screen">
          <Chat scope={game} attribute="chat" />
        </div>
      )}
    </div>
  );
}
