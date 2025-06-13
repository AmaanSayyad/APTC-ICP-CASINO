// Wallet Reset Helper
// This script helps reset wallet connections when authentication issues occur

/**
 * Complete wallet reset procedure
 * Use this when experiencing authentication errors with NFID or Internet Identity
 */
async function performCompleteWalletReset() {
  console.log("🔄 Starting complete wallet reset procedure...");

  // Step 1: Clear localStorage
  console.log("🧹 Clearing localStorage...");
  Object.keys(localStorage).forEach((key) => {
    if (
      key.includes("agent-js") ||
      key.includes("identity") ||
      key.includes("delegation") ||
      key.includes("auth") ||
      key.includes("ic-") ||
      key.includes("canister") ||
      key.includes("principal") ||
      key.includes("nfid") ||
      key.includes("wallet")
    ) {
      console.log(`  - Removing ${key}`);
      localStorage.removeItem(key);
    }
  });

  // Step 2: Clear sessionStorage
  console.log("🧹 Clearing sessionStorage...");
  Object.keys(sessionStorage).forEach((key) => {
    if (
      key.includes("agent-js") ||
      key.includes("identity") ||
      key.includes("delegation") ||
      key.includes("auth") ||
      key.includes("ic-") ||
      key.includes("nfid") ||
      key.includes("wallet")
    ) {
      console.log(`  - Removing ${key}`);
      sessionStorage.removeItem(key);
    }
  });

  // Step 3: Clear cookies
  console.log("🧹 Clearing related cookies...");
  document.cookie.split(";").forEach((cookie) => {
    const [name] = cookie.trim().split("=");
    if (
      name.includes("identity") ||
      name.includes("delegation") ||
      name.includes("nfid") ||
      name.includes("ic")
    ) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      console.log(`  - Removing cookie: ${name}`);
    }
  });

  // Step 4: Reload window to apply changes
  console.log("✅ Reset complete. Reloading page in 3 seconds...");
  setTimeout(() => {
    window.location.reload();
  }, 3000);
}

// Helper function to diagnose wallet connection issues
function diagnoseWalletConnection() {
  console.log("🔍 Diagnosing wallet connection issues...");

  // Check localStorage for wallet data
  const walletKeys = Object.keys(localStorage).filter(
    (key) =>
      key.includes("agent-js") ||
      key.includes("identity") ||
      key.includes("delegation") ||
      key.includes("auth") ||
      key.includes("ic-") ||
      key.includes("principal")
  );

  console.log(
    `Found ${walletKeys.length} wallet-related items in localStorage:`
  );
  walletKeys.forEach((key) => console.log(`  - ${key}`));

  // Check if delegation exists and when it expires
  const delegationKeys = walletKeys.filter((key) => key.includes("delegation"));
  if (delegationKeys.length > 0) {
    delegationKeys.forEach((key) => {
      try {
        const delegation = JSON.parse(localStorage.getItem(key));
        console.log(`Delegation found: ${key}`);
        if (delegation.delegations) {
          delegation.delegations.forEach((d, i) => {
            if (d.delegation && d.delegation.expiration) {
              const expDate = new Date(
                Number(d.delegation.expiration / BigInt(1000000))
              );
              console.log(
                `  Delegation ${i} expires: ${expDate.toLocaleString()}`
              );

              // Check if expired
              if (expDate < new Date()) {
                console.log(
                  `  ❌ EXPIRED DELEGATION FOUND - This is likely causing your issue`
                );
              }
            }
          });
        }
      } catch (e) {
        console.log(`  Could not parse delegation data for ${key}`);
      }
    });
  } else {
    console.log(
      "No delegation data found - this could indicate a connection issue"
    );
  }

  return {
    walletKeysCount: walletKeys.length,
    delegationKeysCount: delegationKeys.length,
    hasDelegationData: delegationKeys.length > 0,
  };
}

// Export the functions
window.walletTools = {
  resetWallet: performCompleteWalletReset,
  diagnoseWallet: diagnoseWalletConnection,
};

console.log(
  "🔧 Wallet reset tools loaded. Use walletTools.resetWallet() to reset your wallet connection."
);
console.log(
  "🔍 Use walletTools.diagnoseWallet() to diagnose wallet connection issues."
);
