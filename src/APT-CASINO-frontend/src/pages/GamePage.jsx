import React from "react";
import { Routes, Route } from "react-router-dom";
import HeaderText from "../components/HeaderText";
import GameCarousel from "../components/GameCarousel";
import MostPlayed from "../components/MostPlayed";
import GameStats from "../components/GameStats";

// Import individual game components
import MinesGame from "../components/games/MinesGame";
import PlinkoGame from "../components/games/PlinkoGame";
import RouletteGame from "../components/games/RouletteGame";

function GameLobby() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sharp-black to-[#150012] text-white">
      <div className="container mx-auto px-4 lg:px-8 pt-32 pb-16">
        <div className="mb-10">
          <GameCarousel />
        </div>
        <MostPlayed />
      </div>
    </div>
  );
}

export default function GamePage() {
  return (
    <Routes>
      <Route path="/" element={<GameLobby />} />
      <Route path="/mines" element={<MinesGame />} />
      <Route path="/plinko" element={<PlinkoGame />} />
      <Route path="/roulette" element={<RouletteGame />} />
    </Routes>
  );
}
