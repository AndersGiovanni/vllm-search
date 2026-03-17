import { EmpiricaClassic } from "@empirica/core/player/classic";
import { EmpiricaContext } from "@empirica/core/player/classic/react";
import { EmpiricaMenu, EmpiricaParticipant } from "@empirica/core/player/react";
import React from "react";
import { Game } from "./Game";
import { Consent } from "./intro-exit/Consent";
import { PlayerCreate } from "./intro-exit/PlayerCreate";
import { PreSurvey } from "./intro-exit/PreSurvey";
import { ExitSurvey } from "./intro-exit/ExitSurvey";
import { Reward } from "./intro-exit/Reward";

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const playerKey = urlParams.get("participantKey") || "";

  const { protocol, host } = window.location;
  const url = `${protocol}//${host}/query`;

  function introSteps({ game, player }) {
    return [PreSurvey];
  }

  function exitSteps({ game, player }) {
    return [ExitSurvey, Reward];
  }

  return (
    <EmpiricaParticipant url={url} ns={playerKey} modeFunc={EmpiricaClassic}>
      <div className="min-h-screen relative bg-gray-50">
        <EmpiricaMenu position="bottom-left" />
        <EmpiricaContext
          consent={Consent}
          playerCreate={PlayerCreate}
          introSteps={introSteps}
          exitSteps={exitSteps}
        >
          <Game />
        </EmpiricaContext>
      </div>
    </EmpiricaParticipant>
  );
}
