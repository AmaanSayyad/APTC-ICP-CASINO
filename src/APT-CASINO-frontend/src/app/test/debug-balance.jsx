import React, { useEffect, useState } from "react";
import { useNFID } from "../../providers/NFIDProvider";
import { useAPTCToken } from "../../hooks/useAPTCToken";

const DebugBalance = () => {
  const { isConnected, principal, connect } = useNFID();
  const {
    balance,
    loading,
    error,
    getBalance,
    formatTokenAmount,
    anonymousActor,
    tokenInfo,
  } = useAPTCToken();

  const [debugInfo, setDebugInfo] = useState([]);

  const addDebugInfo = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DEBUG] ${message}`);
  };

  useEffect(() => {
    addDebugInfo(`Component mounted`);
    addDebugInfo(
      `Initial state - isConnected: ${isConnected}, principal: ${principal}, balance: ${balance?.toString()}`
    );
  }, []);

  useEffect(() => {
    addDebugInfo(
      `Connection state changed - isConnected: ${isConnected}, principal: ${principal}`
    );
  }, [isConnected, principal]);

  useEffect(() => {
    addDebugInfo(
      `Balance changed - balance: ${balance?.toString()}, loading: ${loading}, error: ${error}`
    );
  }, [balance, loading, error]);

  useEffect(() => {
    addDebugInfo(
      `Token info changed - name: ${tokenInfo.name}, symbol: ${tokenInfo.symbol}, decimals: ${tokenInfo.decimals}`
    );
  }, [tokenInfo]);

  useEffect(() => {
    addDebugInfo(
      `Anonymous actor status: ${
        anonymousActor ? "available" : "not available"
      }`
    );
  }, [anonymousActor]);

  const handleConnect = async () => {
    try {
      addDebugInfo("Attempting to connect wallet...");
      await connect();
      addDebugInfo("Wallet connection initiated");
    } catch (err) {
      addDebugInfo(`Wallet connection failed: ${err.message}`);
    }
  };

  const handleFetchBalance = async () => {
    try {
      addDebugInfo("Manually fetching balance...");
      const result = await getBalance(true);
      addDebugInfo(`Manual balance fetch result: ${result?.toString()}`);
    } catch (err) {
      addDebugInfo(`Manual balance fetch failed: ${err.message}`);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "monospace",
        background: "#1a1a1a",
        color: "white",
        minHeight: "100vh",
      }}
    >
      <h1>APTC Token Balance Debug</h1>

      <div
        style={{
          margin: "20px 0",
          padding: "15px",
          background: "#2a2a2a",
          border: "1px solid #444",
        }}
      >
        <h3>Current State</h3>
        <p>
          <strong>Connected:</strong> {isConnected ? "Yes" : "No"}
        </p>
        <p>
          <strong>Principal:</strong> {principal || "None"}
        </p>
        <p>
          <strong>Balance:</strong> {balance?.toString() || "None"}
        </p>
        <p>
          <strong>Formatted Balance:</strong>{" "}
          {balance ? formatTokenAmount(balance) : "None"} APTC
        </p>
        <p>
          <strong>Loading:</strong> {loading ? "Yes" : "No"}
        </p>
        <p>
          <strong>Error:</strong> {error || "None"}
        </p>
        <p>
          <strong>Anonymous Actor:</strong>{" "}
          {anonymousActor ? "Ready" : "Not Ready"}
        </p>
        <p>
          <strong>Token Name:</strong> {tokenInfo.name || "Loading..."}
        </p>
        <p>
          <strong>Token Symbol:</strong> {tokenInfo.symbol || "Loading..."}
        </p>
      </div>

      <div style={{ margin: "20px 0" }}>
        {!isConnected ? (
          <button
            onClick={handleConnect}
            style={{
              padding: "10px 20px",
              background: "#007acc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            Connect Wallet
          </button>
        ) : (
          <button
            onClick={handleFetchBalance}
            disabled={loading}
            style={{
              padding: "10px 20px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            {loading ? "Fetching..." : "Fetch Balance"}
          </button>
        )}
      </div>

      <div
        style={{
          margin: "20px 0",
          padding: "15px",
          background: "#2a2a2a",
          border: "1px solid #444",
          maxHeight: "400px",
          overflow: "auto",
        }}
      >
        <h3>Debug Log</h3>
        {debugInfo.map((info, index) => (
          <div key={index} style={{ fontSize: "12px", marginBottom: "2px" }}>
            {info}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugBalance;
