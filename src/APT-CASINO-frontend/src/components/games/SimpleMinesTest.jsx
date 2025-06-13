// Simple test component for mines game
import React from "react";

const SimpleMinesTest = () => {
  console.log("🎮 SimpleMinesTest component rendering...");

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#0a0a0a",
        color: "#fff",
        minHeight: "100vh",
        textAlign: "center",
      }}
    >
      <h1 style={{ color: "#FFD700", fontSize: "3rem" }}>💎 Mines Game Test</h1>
      <p style={{ fontSize: "1.5rem", margin: "20px 0" }}>
        This is a simple test component to verify the mines route is working.
      </p>
      <div
        style={{
          backgroundColor: "#1a1a1a",
          padding: "20px",
          borderRadius: "10px",
          margin: "20px auto",
          maxWidth: "600px",
        }}
      >
        <h2>Component Status: ✅ LOADED</h2>
        <p>
          If you can see this, the routing to the mines game is working
          correctly.
        </p>
        <p>The issue might be with the EnhancedMinesGame component itself.</p>
      </div>
    </div>
  );
};

export default SimpleMinesTest;
