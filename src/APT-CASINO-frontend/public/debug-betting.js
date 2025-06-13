// Browser console debug script for betting functionality
// Run this in the browser console when on the roulette page

console.log("🎰 Debugging roulette betting...");

// Check if CANISTER_IDS are properly loaded
try {
  const module = await import("/src/config/backend-integration.js");
  console.log("📋 CANISTER_IDS:", module.CANISTER_IDS);
  console.log("🎯 ROULETTE_GAME ID:", module.CANISTER_IDS.ROULETTE_GAME);
  console.log("🎯 ID Type:", typeof module.CANISTER_IDS.ROULETTE_GAME);
} catch (error) {
  console.error("❌ Failed to load backend integration:", error);
}

// Check if backend integration context is available
try {
  const context = window.React?.useContext || null;
  console.log("⚛️ React context available:", !!context);
} catch (error) {
  console.error("❌ React context error:", error);
}

// Look for any approveTokens calls in the console
console.log("🔍 Monitoring for approveTokens calls...");

// Override console.log to catch our debug messages
const originalLog = console.log;
console.log = function (...args) {
  if (args[0] && args[0].includes && args[0].includes("approveTokens")) {
    originalLog("🎯 INTERCEPTED:", ...args);
  }
  originalLog(...args);
};

console.log("✅ Debug script loaded. Try placing a bet to see debug output.");
