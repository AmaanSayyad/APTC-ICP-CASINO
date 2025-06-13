// Testing Guide for APT Casino Betting Fix
// Run this in browser console after connecting wallet and navigating to roulette page

console.log("🎰 APT Casino Betting Fix Test Guide");
console.log("=====================================");

// Instructions for manual testing
console.log(`
📋 TESTING STEPS:

1. **Navigate to Roulette Game**:
   - Go to http://localhost:3003/game/roulette
   
2. **Connect Your Wallet**:
   - Click the connect wallet button
   - Complete the authentication process
   
3. **Check Console for Debug Messages**:
   - Open developer tools (F12)
   - Look for these messages when placing a bet:
   
   ✅ Expected Success Messages:
   - "🔍 approveTokens called with: { spender: 'bw4dl-smaaa-aaaaa-qaacq-cai', amount: [amount], spenderType: 'string' }"
   - "🎰 Roulette approveTokens params: { spender: 'bw4dl-smaaa-aaaaa-qaacq-cai', amount: [amount], spenderType: 'string' }"
   - "🎰 Bet placed successfully!"
   
   ❌ Previous Error (should NOT appear):
   - "TypeError: text.includes is not a function"
   - "Invalid spender parameter: expected string, got number"

4. **Test Betting Flow**:
   - Try placing a small bet on a number (e.g., bet 1000000 tokens on number 7)
   - The betting should complete without Principal conversion errors
   
5. **Test Mines Game** (Optional):
   - Navigate to /game/mines
   - Try placing a bet there as well
   - Mines should continue working as it was already correct

🔧 **Key Fix Applied**:
- Changed: \`await approveTokens(amount)\` (❌ Wrong - only 1 parameter)
- To: \`await approveTokens(CANISTER_IDS.ROULETTE_GAME, amount)\` (✅ Correct - 2 parameters)

🎯 **What This Fixes**:
- The approveTokens function expects (spender, amount) but was receiving (amount) 
- This caused amount to be treated as spender, triggering Principal.fromText() on a number
- Result: "TypeError: text.includes is not a function" because numbers don't have .includes()
`);

// Helper function to monitor console for errors
window.monitorBettingErrors = function () {
  const originalError = console.error;
  console.error = function (...args) {
    if (args[0] && args[0].toString().includes("includes is not a function")) {
      console.log(
        "🚨 OLD BUG DETECTED: Principal conversion error still occurring!"
      );
    }
    originalError.apply(console, args);
  };
  console.log("🔍 Monitoring for betting errors...");
};

// Run the monitor
window.monitorBettingErrors();

console.log(
  "\n✅ Test guide loaded! Follow the steps above to verify the fix works."
);
