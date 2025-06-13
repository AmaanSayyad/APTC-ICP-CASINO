import React from "react";
import { useNFID } from "../providers/NFIDProvider";
import TokenBalance from "./TokenBalance";

export default function NFIDConnectButton() {
  const { isConnected, isLoading, principal, connect, disconnect, error } =
    useNFID();

  const handleConnect = async () => {
    if (isConnected) {
      await disconnect();
    } else {
      await connect();
    }
  };

  // Format principal for display
  const formatPrincipal = (principal) => {
    if (!principal) return "";
    return `${principal.slice(0, 6)}...${principal.slice(-4)}`;
  };

  if (error) {
    return (
      <div className="bg-gradient-to-r from-red-500 to-red-700 hover-gradient-shadow rounded-xl p-0.5 cursor-pointer">
        <div className="bg-[#070005] rounded-xl py-3 px-6 h-full flex items-center">
          <button onClick={handleConnect} className="text-white font-medium">
            Connection Error - Retry
          </button>
        </div>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <TokenBalance />
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 hover-gradient-shadow rounded-xl p-0.5 cursor-pointer">
          <div className="bg-[#070005] rounded-xl py-3 px-6 h-full flex items-center">
            <span className="text-white font-medium flex items-center gap-2">
              ICP Network
            </span>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 hover-gradient-shadow rounded-xl p-0.5 cursor-pointer">
          <div className="bg-[#070005] rounded-xl py-3 px-6 h-full flex items-center">
            <button onClick={handleConnect} className="text-white font-medium">
              {formatPrincipal(principal)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-red-magic to-blue-magic hover-gradient-shadow rounded-xl p-0.5 cursor-pointer">
      <div className="bg-[#070005] rounded-xl py-3 px-6 h-full flex items-center">
        <button
          onClick={handleConnect}
          className="text-white font-medium"
          disabled={isLoading}
        >
          {isLoading ? "Connecting to NFID..." : "Connect with NFID"}
        </button>
      </div>
    </div>
  );
}
