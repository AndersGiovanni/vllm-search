import {
  usePlayer,
  usePlayers,
  useRound,
  useStage,
} from "@empirica/core/player/classic/react";
import { Loading } from "@empirica/core/player/react";
import React from "react";
import { PlaceholderStage } from "./stages/PlaceholderStage";
import VideoExperimentStage from "./stages/VideoExperimentStage";
import PreparationStage from "./stages/PreparationStage";

export function Stage() {
  const player = usePlayer();
  const players = usePlayers();
  const round = useRound();
  const stage = useStage();

  if (player.stage.get("submit")) {
    if (players.length === 1) {
      return <Loading />;
    }

    return (
      <div className="text-center text-gray-400 pointer-events-none">
        Please wait for other player(s).
      </div>
    );
  }

  const task = round.get("task");

  // Handle preparation round
  if (task === "preparation") {
    return <PreparationStage />;
  }

  // Handle experiment rounds (topic-based tasks)
  if (task && task.startsWith("topic-")) {
    return <VideoExperimentStage />;
  }

  // Other task types
  switch (task) {
    case "placeholder":
      return <PlaceholderStage />;
    default:
      return <div>Unknown task: {task}</div>;
  }
}
