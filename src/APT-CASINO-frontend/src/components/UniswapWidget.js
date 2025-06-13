"use client";
import React from "react";

const UniswapWidget = () => {
  return (
    <div className="bg-[#1A0015] rounded-xl p-6">
      <p className="text-white/70 text-sm mb-4">
        Access Uniswap's full swap functionality directly within APT Casino
      </p>

      <div className="w-full" style={{ height: "680px" }}>
        <iframe
          src="https://app.uniswap.org/#/swap"
          className="w-full h-full rounded-lg border-0"
          title="Uniswap Swap Interface"
          allow="ethereum; clipboard-write;"
        />

        <div className="mt-4 text-center">
          <p className="text-xs text-white/50">Powered by Uniswap</p>
        </div>
      </div>
    </div>
  );
};

export default UniswapWidget;
