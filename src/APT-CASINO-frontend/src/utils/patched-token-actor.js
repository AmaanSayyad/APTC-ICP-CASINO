// Create a patched @dfinity/agent call for faucet_claim 
import { IDL } from "@dfinity/candid";
import { HttpAgent, ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { Ed25519KeyIdentity } from "@dfinity/identity";

/**
 * This function helps you get around the "Cannot find field hash" error
 * by creating a special version of the token actor that uses low-level
 * calls to avoid the hashing issues.
 */
export async function createPatchedTokenActor(tokenCanisterId) {
  // Generate a fresh identity for testing
  const identity = Ed25519KeyIdentity.generate();
  console.log(`Created identity with principal: ${identity.getPrincipal()}`);
  
  // Create the agent
  const host = import.meta.env.DFX_NETWORK === "ic"
    ? "https://ic0.app"
    : `http://127.0.0.1:${import.meta.env.DFX_PORT || "4943"}`;
    
  const agent = new HttpAgent({
    host,
    identity,
  });
  
  try {
    console.log("Fetching root key...");
    await agent.fetchRootKey();
    console.log("Root key fetched successfully");
  } catch (e) {
    console.warn("Failed to fetch root key:", e.message);
    console.log("Continuing anyway - this is expected for local development");
  }

  // Prepare the request for faucet_claim
  // We need to encode the method call arguments using Candid
  const encoder = new TextEncoder();
  const methodName = "faucet_claim";
  
  // Empty arguments for faucet_claim
  const emptyArgs = new Uint8Array([68, 73, 68, 76, 0, 0]); // "DIDL" + 2 null bytes

  console.log(`Prepared request for ${methodName}`);
  
  // Make a direct call without going through the Actor
  try {
    console.log(`Making direct call to ${methodName}...`);
    
    const canisterId = Principal.fromText(tokenCanisterId);
    const response = await agent.call(canisterId, {
      methodName,
      arg: emptyArgs,
    });
    
    console.log("Raw response:", response);
    
    // Decode the response
    const decoder = new TextDecoder();
    const responseText = decoder.decode(new Uint8Array(response));
    
    console.log("Response (decoded):", responseText);
    
    // The response is likely CBOR encoded - we'd need a CBOR decoder
    // to fully decode it. For now, we can check if the balance changed.
    
    // Check the balance before and after
    console.log("Checking balance...");
    
  // Create a simple Account interface for balance query
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  
  // Encode the balance query
  const account = {
    owner: identity.getPrincipal(),
    subaccount: [], // empty array for Opt
  };
  
  const balanceArgs = IDL.encode([Account], [account]);
  
  try {
    // Query the balance
    const balanceResponse = await agent.query(canisterId, {
      methodName: "icrc1_balance_of",
      arg: balanceArgs,
    });
    
    console.log("Balance response:", balanceResponse);
    
    // Try to extract the balance from the raw response
    let balance = BigInt(0);
    try {
      if (balanceResponse && balanceResponse.reply && balanceResponse.reply.arg) {
        // The response contains DIDL encoded data
        // We can try multiple ways to decode it
        const rawData = balanceResponse.reply.arg;
        
        // Method 1: If it's a proper DIDL-encoded Nat
        try {
          if (rawData.length > 8) {
            // For larger numbers, there might be extra bytes
            balance = IDL.decode([IDL.Nat], rawData.slice(4))[0];
          }
        } catch (e) {
          console.warn("Method 1 decoding failed:", e.message);
        }
      }
    } catch (e) {
      console.error("Error decoding balance:", e);
    }
    console.log("Balance:", balance.toString());
    
    return {
      success: true,
      message: "Direct call completed",
      principal: identity.getPrincipal().toString(),
      balance: balance.toString(),
    };
    
  } catch (error) {
    console.error("Error querying balance:", error);
    return {
      success: false,
      error: error.message,
      principal: identity.getPrincipal().toString(),
    };
  }
  
  } catch (error) {
    console.error("Error making direct call:", error);
    return {
      success: false,
      error: error.message,
      principal: identity.getPrincipal().toString(),
    };
  }
}

// Test the function directly if this script is run
async function main() {
  console.log("====== Testing Patched Token Actor ======");
  
  const tokenCanisterId = "bw4dl-smaaa-aaaaa-qaacq-cai";
  
  console.log(`Using token canister: ${tokenCanisterId}`);
  
  try {
    const result = await createPatchedTokenActor(tokenCanisterId);
    console.log("Test result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
  
  console.log("====== Test Complete ======");
}

// Run the test if this file is executed directly
if (process.argv[1].endsWith("patched-token-actor.js")) {
  main();
}
