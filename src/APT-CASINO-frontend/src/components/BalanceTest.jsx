import React, { useEffect } from "react";
import { useAPTCToken } from "../hooks/useAPTCToken";
import { useNFID } from "../providers/NFIDProvider";

const BalanceTest = () => {
  const { principal, isConnected } = useNFID();
  const { balance, loading, error, getBalance, formatTokenAmount } =
    useAPTCToken();

  useEffect(() => {
    console.log("🔧 BalanceTest Debug:", {
      principal,
      isConnected,
      balance: balance?.toString(),
      loading,
      error,
    });

    if (isConnected && principal) {
      console.log("🔧 Fetching balance for principal:", principal);
      getBalance(true);
    }
  }, [isConnected, principal, getBalance]);

  if (!isConnected) {
    return <div>Not connected</div>;
  }

  return (
    <div
      style={{
        padding: "20px",
        background: "#1a1a1a",
        color: "white",
        margin: "10px",
        borderRadius: "8px",
      }}
    >
      <h3>Balance Test Component</h3>
      <p>Principal: {principal}</p>
      <p>Connected: {isConnected ? "Yes" : "No"}</p>
      <p>Loading: {loading ? "Yes" : "No"}</p>
      <p>Error: {error || "None"}</p>
      <p>Raw Balance: {balance?.toString() || "No balance"}</p>
      <p>
        Formatted: {balance ? formatTokenAmount(balance) : "No balance"} APTC
      </p>
      <button
        onClick={() => getBalance(true)}
        style={{
          padding: "10px",
          background: "#444",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Refresh Balance
      </button>
    </div>
  );
};

export default BalanceTest;
