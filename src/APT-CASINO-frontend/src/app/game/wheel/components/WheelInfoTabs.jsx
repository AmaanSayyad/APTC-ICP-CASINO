"use client";

import React from "react";
import WheelVideo from "../components/WheelVideo";
import WheelDescription from "../components/WheelDescription";
import WheelStrategyGuide from "../components/WheelStrategyGuide";
import WheelProbability from "../components/WheelProbability";
import WheelPayouts from "../components/WheelPayouts";
import WheelHistory from "../components/WheelHistory";

const WheelInfoTabs = () => {
  return (
    <div className="mt-10 px-4 md:px-10 lg:px-20">
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-lg bg-gray-900/50 backdrop-blur-sm p-1.5 border border-gray-700/30">
          <button
            className="px-6 py-3 rounded-md bg-gradient-to-br from-red-800 to-rose-700 hover:from-red-700 hover:to-rose-600 text-white font-semibold transition-all duration-200"
            onClick={() => {}}
          >
            Game Info
          </button>
          <button
            className="px-6 py-3 rounded-md text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200"
            onClick={() => {}}
          >
            Strategy Guide
          </button>
          <button
            className="px-6 py-3 rounded-md text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200"
            onClick={() => {}}
          >
            Game Mechanics
          </button>
        </div>
      </div>

      {/* Video Tutorial */}
      <WheelVideo />

      {/* Game Description */}
      <WheelDescription />

      {/* Strategy Guide */}
      <WheelStrategyGuide />

      {/* Probabilities */}
      <WheelProbability />

      {/* Payouts */}
      <WheelPayouts />

      {/* Game History */}
      <WheelHistory />
    </div>
  );
};

export default WheelInfoTabs;
