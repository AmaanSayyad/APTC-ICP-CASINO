import React from "react";
import { useNFID } from "../providers/NFIDProvider";

const ConnectWalletButton = ({ className = "", ...props }) => {
  const { connect, isConnected, isLoading, disconnect } = useNFID();

  const handleConnect = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={isLoading}
      className={`bg-gradient-to-r from-red-magic to-blue-magic text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 ${className}`}
      {...props}
    >
      {isLoading
        ? "Connecting..."
        : isConnected
        ? "Disconnect"
        : "Connect Wallet"}
    </button>
  );
};

export default ConnectWalletButton;
