// filepath: /Users/aditya/APT-CASINO/src/APT-CASINO-frontend/src/utils/tokenApproval.js
// Improved token approval functions based on successful implementation patterns
import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { CANISTER_IDS } from "../config/backend-integration";

// Function to clear certificate caches - helps with ThresBls12_381 signature issues
function clearCertificateCaches() {
  if (typeof window !== "undefined" && window.localStorage) {
    Object.keys(window.localStorage).forEach((key) => {
      if (
        key.includes("certificate") ||
        key.includes("delegation") ||
        key.includes("agent") ||
        key.includes("identity") ||
        key.includes("auth") ||
        key.includes("principal") ||
        key.includes("canister")
      ) {
        window.localStorage.removeItem(key);
        console.log(`🗑️ Cleared localStorage: ${key}`);
      }
    });
  }
}

// Enhanced token approval with proper error handling and formatting
export const approveICRCToken = async (
  identity,
  spenderCanisterId,
  amount,
  tokenCanisterId = CANISTER_IDS.APTC_TOKEN,
  tokenIdl = null // Pass the token IDL if needed
) => {
  if (!identity) {
    throw new Error("Missing identity for token approval");
  }

  try {
    // Clear any problematic certificates from browser storage
    clearCertificateCaches();

    // Create a fresh agent with identity and clear settings
    const agent = new HttpAgent({
      host: "http://127.0.0.1:4943", // Use consistent local host format
      identity: identity,
      disableOriginalPrincipalValidation: true, // Important for proper validation
    });

    // Always fetch root key for local development - crucial for ThresBls12_381 issues
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      await agent.fetchRootKey().catch((e) => {
        console.warn("⚠️ Root key fetch warning:", e);
        // Continue despite errors - we'll retry if needed
      });
      console.log("✅ Root key fetched for token approval");
    }

    // Create token actor directly
    let tokenActor = tokenIdl
      ? Actor.createActor(tokenIdl, { agent, canisterId: tokenCanisterId })
      : await createGenericTokenActor(agent, tokenCanisterId);

    // Get token fee - don't rely on metadata which might not be available
    let tokenFee;
    try {
      const fee = await tokenActor.icrc1_fee();
      tokenFee = typeof fee === "bigint" ? fee : BigInt(fee);
      console.log("🪙 Token fee fetched successfully:", tokenFee.toString());
    } catch (feeError) {
      console.warn("⚠️ Failed to fetch token fee, using default:", feeError);
      // Use a default fee if we can't fetch it (10000 is common for ICRC tokens)
      tokenFee = BigInt(10000);
    }

    // Ensure amount is a BigInt - Using consistent format Number(amount) * 100000000
    const amountBigInt =
      typeof amount === "bigint"
        ? amount
        : BigInt(Math.floor(Number(amount) * 100000000));

    // Add fee to ensure sufficient approval
    const approvalAmount = amountBigInt + tokenFee;

    // Structure transaction according to ICRC-2 standard
    const transaction = {
      from_subaccount: [],
      spender: {
        owner: Principal.fromText(spenderCanisterId),
        subaccount: [],
      },
      amount: approvalAmount,
      expected_allowance: [],
      expires_at: [],
      fee: [tokenFee], // Fee is wrapped in an array as it's optional
      memo: [],
      created_at_time: [],
    };

    console.log("📝 Approval transaction:", transaction);

    // Implement retry mechanism for ThresBls12_381 signature errors
    const MAX_RETRIES = 3;
    let retries = 0;
    let currentTokenActor = tokenActor; // Use a different variable name to avoid conflicts

    while (retries < MAX_RETRIES) {
      try {
        // Execute approval with retry logic
        const result = await currentTokenActor.icrc2_approve(transaction);

        if (result.Err) {
          if (result.Err.InsufficientFunds) {
            throw new Error(
              `Insufficient funds. Balance: ${result.Err.InsufficientFunds.balance}`
            );
          } else {
            throw new Error(`Approval error: ${JSON.stringify(result.Err)}`);
          }
        }

        console.log("✅ Token approval successful:", result);
        return result.Ok;
      } catch (error) {
        console.warn(
          `⚠️ Approval attempt ${retries + 1} failed:`,
          error.message
        );

        // If it's a ThresBls12_381 error, clear caches and retry
        if (error.message && error.message.includes("ThresBls12_381")) {
          console.log(
            "🔄 ThresBls12_381 error detected, clearing caches and retrying..."
          );

          // Clear caches
          clearCertificateCaches();

          // Wait briefly before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Create a new agent and actor for the retry
          const newAgent = new HttpAgent({
            host: "http://127.0.0.1:4943",
            identity: identity,
            disableOriginalPrincipalValidation: true,
          });

          // Fetch root key for local development
          if (
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1"
          ) {
            await newAgent.fetchRootKey();
          }

          // Create a new token actor with the fresh agent - use assignment to different variable
          currentTokenActor = tokenIdl
            ? Actor.createActor(tokenIdl, {
                agent: newAgent,
                canisterId: tokenCanisterId,
              })
            : await createGenericTokenActor(newAgent, tokenCanisterId);
        }

        retries++;

        // If not the last retry, continue to next attempt
        if (retries < MAX_RETRIES) {
          continue;
        }

        // On final retry, throw the error to be caught by the outer catch block
        throw error;
      }
    }
  } catch (error) {
    console.error("❌ Token approval failed:", error);

    // Enhanced error detection for certificate and delegation issues
    if (
      error.message?.includes("ThresBls12_381") ||
      error.message?.includes("signature could not be verified") ||
      error.message?.includes("Certificate verification failed") ||
      error.message?.includes("delegation") ||
      error.message?.includes("Invalid canister signature") ||
      error.message?.includes("iccanistersignature") ||
      error.message?.includes("invalid combined threshold signature") ||
      error.message?.includes("certificate verification failed") ||
      error.message?.includes("invalid delegation") ||
      error.message?.includes("code: 400") ||
      error.message?.includes("bad request")
    ) {
      console.log(
        "🔑 Detected certificate/signature issue, providing guidance..."
      );
      throw new Error(
        "Token approval failed due to a certificate verification issue. " +
          "Please try disconnecting your wallet, clearing browser cache, and reconnecting.\n\n" +
          "If using localhost, run the fix-canister-signatures.sh script."
      );
    }

    throw error;
  }
};

// Helper function to create a generic ICRC token actor
const createGenericTokenActor = async (agent, canisterId) => {
  // Generic ICRC interface with just the methods we need for approval
  const icrcInterface = ({ IDL }) => {
    const Subaccount = IDL.Vec(IDL.Nat8);
    const Account = IDL.Record({
      owner: IDL.Principal,
      subaccount: IDL.Opt(Subaccount),
    });

    return IDL.Service({
      icrc1_fee: IDL.Func([], [IDL.Nat], ["query"]),
      icrc2_approve: IDL.Func(
        [
          IDL.Record({
            from_subaccount: IDL.Opt(Subaccount),
            spender: Account,
            amount: IDL.Nat,
            expected_allowance: IDL.Opt(IDL.Nat),
            expires_at: IDL.Opt(IDL.Nat64),
            fee: IDL.Opt(IDL.Nat),
            memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
            created_at_time: IDL.Opt(IDL.Nat64),
          }),
        ],
        [
          IDL.Variant({
            Ok: IDL.Nat,
            Err: IDL.Variant({
              GenericError: IDL.Record({
                message: IDL.Text,
                error_code: IDL.Nat,
              }),
              TemporarilyUnavailable: IDL.Null,
              InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
              BadFee: IDL.Record({ expected_fee: IDL.Nat }),
              AllowanceChanged: IDL.Record({ current_allowance: IDL.Nat }),
              CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
              TooOld: IDL.Null,
              Expired: IDL.Record({
                ledger_time: IDL.Nat64,
                expires_at: IDL.Nat64,
              }),
            }),
          }),
        ],
        []
      ),
    });
  };

  return Actor.createActor(icrcInterface, { agent, canisterId });
};
