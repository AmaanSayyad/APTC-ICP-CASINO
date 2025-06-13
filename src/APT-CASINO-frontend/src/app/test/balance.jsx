import React, { useState, useEffect } from "react";
import { Actor } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { createOptimizedAgent, handleICPError } from "../../utils/icp-agent";
import EnhancedFaucetNotice from "../../components/EnhancedFaucetNotice";

// Configuration
const TOKEN_CANISTER_ID = "bw4dl-smaaa-aaaaa-qaacq-cai";
const TEST_PRINCIPAL =
  "g7pxz-jokx3-26h4l-ojujs-qxxam-3gfd7-ixh2x-tmyql-jgorw-dar3l-aqe";

// IDL for ICRC-1 token
const tokenIdl = ({ IDL }) => {
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });

  const TransferError = IDL.Variant({
    BadFee: IDL.Record({ expected_fee: IDL.Nat }),
    BadBurn: IDL.Record({ min_burn_amount: IDL.Nat }),
    InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
    TooOld: IDL.Null,
    CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
    TemporarilyUnavailable: IDL.Null,
    Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
    GenericError: IDL.Record({ error_code: IDL.Nat, message: IDL.Text }),
  });

  return IDL.Service({
    icrc1_name: IDL.Func([], [IDL.Text], ["query"]),
    icrc1_symbol: IDL.Func([], [IDL.Text], ["query"]),
    icrc1_decimals: IDL.Func([], [IDL.Nat8], ["query"]),
    icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ["query"]),
    icrc1_total_supply: IDL.Func([], [IDL.Nat], ["query"]),
    faucet_claim: IDL.Func(
      [],
      [IDL.Variant({ Ok: IDL.Nat, Err: IDL.Text })],
      []
    ),
  });
};

function BalanceTestPage() {
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);
  const [tokenInfo, setTokenInfo] = useState({
    name: "",
    symbol: "",
    decimals: 8,
  });
  const [tokenActor, setTokenActor] = useState(null);
  const [actorLoading, setActorLoading] = useState(true); // Track actor creation
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [autoFetchAttempted, setAutoFetchAttempted] = useState(false);

  // Create token actor on component mount
  useEffect(() => {
    const createActor = async () => {
      try {
        setActorLoading(true);
        console.log("🔧 Creating optimized agent for token actor...");

        // Create an optimized agent with proper configuration
        const host =
          import.meta.env.DFX_NETWORK === "ic"
            ? "https://ic0.app"
            : `http://127.0.0.1:${import.meta.env.DFX_PORT || "4943"}`;

        console.log("🔧 Environment variables:", {
          DFX_NETWORK: import.meta.env.DFX_NETWORK,
          DFX_PORT: import.meta.env.DFX_PORT,
          host: host,
        });

        const agent = await createOptimizedAgent({
          host,
          isLocal: import.meta.env.DFX_NETWORK !== "ic",
          fetchRootKey: import.meta.env.DFX_NETWORK !== "ic",
        });

        // Create token actor
        const actor = Actor.createActor(tokenIdl, {
          agent,
          canisterId: TOKEN_CANISTER_ID,
        });

        setTokenActor(actor);
        setActorLoading(false);
        console.log("✅ Actor created successfully");

        // Reset retry count on successful creation
        setRetryCount(0);
      } catch (err) {
        const errorInfo = handleICPError(err);
        console.error("❌ Failed to create actor:", errorInfo.message);
        setError(`Failed to create actor: ${errorInfo.message}`);

        // Attempt automatic retry with a maximum of 3 retries
        if (retryCount < 3) {
          console.log(
            `🔄 Retrying actor creation (attempt ${retryCount + 1}/3)...`
          );
          setRetryCount((prev) => prev + 1);
          // Use exponential backoff for retries
          const delay = 1000 * Math.pow(1.5, retryCount);
          setTimeout(createActor, delay);
        } else {
          setError(
            `Failed to create actor after 3 attempts: ${errorInfo.message}`
          );
          setActorLoading(false);
        }
      }
    };

    createActor();
  }, [retryCount]);

  // Fetch token info when actor is available
  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!tokenActor) return;

      try {
        const [name, symbol, decimals] = await Promise.all([
          tokenActor.icrc1_name(),
          tokenActor.icrc1_symbol(),
          tokenActor.icrc1_decimals(),
        ]);

        setTokenInfo({ name, symbol, decimals });
        console.log(`✅ Token info fetched: ${name} (${symbol})`);
      } catch (err) {
        const errorInfo = handleICPError(err);
        console.error("❌ Failed to fetch token info:", errorInfo.message);
        setError(`Failed to fetch token info: ${errorInfo.message}`);
      }
    };

    fetchTokenInfo();
  }, [tokenActor]);

  // Automatically fetch balance when token info is available
  useEffect(() => {
    if (
      tokenActor &&
      tokenInfo.name &&
      !balance &&
      !loading &&
      !autoFetchAttempted
    ) {
      console.log("🔄 Auto-fetching balance...");
      setAutoFetchAttempted(true);
      fetchBalance();
    }
  }, [tokenActor, tokenInfo.name, balance, loading, autoFetchAttempted]);

  // Fetch balance for the test principal
  const fetchBalance = async () => {
    if (!tokenActor) {
      setError("Token actor not initialized");
      return;
    }

    try {
      setLoading(true);
      setError(null); // Clear previous errors
      console.log(`🔍 Fetching balance for principal: ${TEST_PRINCIPAL}`);

      // Create account object
      const account = {
        owner: Principal.fromText(TEST_PRINCIPAL),
        subaccount: [],
      };

      // Fetch balance with proper error handling
      try {
        console.log("📞 Calling icrc1_balance_of...");
        const rawBalance = await tokenActor.icrc1_balance_of(account);
        console.log(`💰 Raw balance: ${rawBalance.toString()}`);

        // Convert to display format
        const formattedBalance =
          Number(rawBalance) / Math.pow(10, tokenInfo.decimals || 8);

        setBalance({
          raw: rawBalance.toString(),
          formatted: formattedBalance.toString(),
        });
        setError(null);
        console.log(
          `✅ Formatted balance: ${formattedBalance} ${tokenInfo.symbol}`
        );
      } catch (balanceError) {
        const errorInfo = handleICPError(balanceError);

        // Try to provide more helpful error messages
        if (
          errorInfo.message.includes("certificate verification") ||
          errorInfo.message.includes("signature")
        ) {
          console.log(
            "🔄 Certificate verification issue detected - this usually indicates a configuration issue with the local replica"
          );
          setError(
            "Certificate verification failed. Check if the local replica is running and try again."
          );
        } else if (
          errorInfo.category === "HASH_FIELD_ERROR" ||
          balanceError.message?.includes("Cannot find field hash")
        ) {
          console.log(
            "🔄 Hash field error detected - retrying automatically..."
          );
          setError("Verification error detected. Retrying automatically...");

          // Auto-retry after a short delay for hash field errors
          setTimeout(() => {
            console.log("🔄 Auto-retrying balance fetch...");
            fetchBalance();
          }, 2000);
          return;
        } else {
          setError(`Failed to fetch balance: ${errorInfo.message}`);
        }
      }
    } catch (err) {
      const errorInfo = handleICPError(err);
      console.error("❌ Failed to fetch balance:", errorInfo.message);
      setError(`Failed to fetch balance: ${errorInfo.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Claim tokens from the faucet
  const claimTokens = async () => {
    if (!tokenActor) {
      setClaimError("Token actor not initialized");
      return;
    }

    try {
      setClaimLoading(true);
      setClaimError(null);
      setClaimSuccess(false);
      console.log("🚰 Claiming tokens from faucet...");

      const result = await tokenActor.faucet_claim();
      console.log("🚰 Faucet claim result:", result);

      if ("Err" in result) {
        console.error("❌ Faucet claim returned error:", result.Err);
        setClaimError(result.Err);
      } else {
        console.log(`✅ Faucet claim successful! Transaction ID: ${result.Ok}`);
        setClaimSuccess(true);
        // Refresh balance after successful claim
        setTimeout(() => {
          fetchBalance();
        }, 1000); // Small delay to ensure transaction is processed
      }
    } catch (err) {
      const errorInfo = handleICPError(err);
      console.error("❌ Failed to claim tokens:", errorInfo.message);

      // Handle specific error cases
      let errorMessage = errorInfo.message;

      if (
        errorMessage.includes("not exported") ||
        errorMessage.includes("No such method") ||
        errorMessage.includes("Canister has no update method")
      ) {
        errorMessage = "Faucet function not available - please contact admin";
      } else if (
        errorMessage.includes("once per 24 hours") ||
        errorMessage.includes("once per day")
      ) {
        errorMessage = "You can only claim tokens once per day";
      } else if (
        errorInfo.category === "HASH_FIELD_ERROR" ||
        errorMessage.includes("Cannot find field hash") ||
        errorMessage.includes("_24860_")
      ) {
        errorMessage = "Verification error. Please try again in a moment.";
        // Auto-retry after a short delay
        console.log(
          "🔄 Hash field error detected, auto-retrying in 3 seconds..."
        );
        setClaimError(errorMessage + " (Auto-retrying in 3 seconds...)");
        setTimeout(() => {
          console.log("🔄 Auto-retrying claim...");
          claimTokens();
        }, 3000);
        return; // Exit early to not set the error again
      }

      setClaimError(errorMessage);
    } finally {
      setClaimLoading(false);
    }
  };

  // Format for display
  const getDisplayBalance = () => {
    if (actorLoading) return "Connecting to network...";
    if (!tokenActor) return "Actor not initialized";
    if (loading) return "Loading balance...";
    if (error && !balance) return "Error - click Fetch Balance to retry";
    if (!tokenInfo.name) return "Loading token info...";
    if (!balance && !autoFetchAttempted) return "Preparing to load balance...";
    if (!balance) return "Click 'Fetch Balance' to load";
    return `${balance.formatted} ${tokenInfo.symbol || "APTC"}`;
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-900 to-black py-16 px-4">
      <div className="max-w-4xl mx-auto p-6 bg-gray-800 bg-opacity-50 rounded-xl backdrop-blur-sm border border-purple-500/20">
        <h1 className="text-3xl font-bold text-center mb-8 text-gradient bg-gradient-to-r from-purple-400 to-pink-400">
          APTC Token Balance Test
        </h1>
        {/* Enhanced Faucet Notice */}
        <EnhancedFaucetNotice />
        <div className="bg-black/30 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-300">
            Token Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <p className="text-gray-400 mb-1 text-sm">Name</p>
              <p className="font-medium text-white">
                {tokenInfo.name || "Loading..."}
              </p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <p className="text-gray-400 mb-1 text-sm">Symbol</p>
              <p className="font-medium text-white">
                {tokenInfo.symbol || "Loading..."}
              </p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <p className="text-gray-400 mb-1 text-sm">Decimals</p>
              <p className="font-medium text-white">{tokenInfo.decimals}</p>
            </div>
          </div>
        </div>{" "}
        <div className="bg-black/30 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-300">
            Balance Test
          </h2>

          <div className="mb-4">
            <p className="text-gray-400 mb-1 text-sm">Test Principal</p>
            <p className="font-medium text-white break-all bg-gray-900/50 p-2 rounded">
              {TEST_PRINCIPAL}
            </p>
          </div>

          <div className="mb-6">
            <p className="text-gray-400 mb-1 text-sm">Balance</p>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <p className="font-bold text-2xl text-green-400">
                {getDisplayBalance()}
              </p>
              {balance && (
                <p className="text-gray-500 text-sm mt-1">Raw: {balance.raw}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-900/30 border border-red-500/30 p-4 rounded-lg">
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          )}

          <button
            onClick={fetchBalance}
            disabled={loading || !tokenActor || actorLoading}
            className={`w-full py-3 px-6 rounded-lg font-bold mb-4 ${
              loading || !tokenActor || actorLoading
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            } transition duration-200`}
          >
            {loading
              ? "Loading..."
              : actorLoading
              ? "Initializing..."
              : "Fetch Balance"}
          </button>

          <div className="h-px w-full bg-purple-500/20 my-6"></div>

          <h3 className="text-lg font-semibold mb-4 text-purple-300">
            Token Faucet
          </h3>

          <p className="text-gray-300 mb-4">
            Claim 1000 {tokenInfo.symbol || "APTC"} tokens for testing purposes.
            You can only claim once per 24 hours.
          </p>

          {claimError && (
            <div className="mb-6 bg-red-900/30 border border-red-500/30 p-4 rounded-lg">
              <p className="text-red-400 font-medium">{claimError}</p>
            </div>
          )}

          {claimSuccess && (
            <div className="mb-6 bg-green-900/30 border border-green-500/30 p-4 rounded-lg">
              <p className="text-green-400 font-medium">
                🎉 Successfully claimed 1000 {tokenInfo.symbol || "APTC"}{" "}
                tokens!
              </p>
            </div>
          )}

          <button
            onClick={claimTokens}
            disabled={claimLoading || !tokenActor || actorLoading}
            className={`w-full py-3 px-6 rounded-lg font-bold ${
              claimLoading || !tokenActor || actorLoading
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
            } transition duration-200`}
          >
            {claimLoading
              ? "Claiming..."
              : actorLoading
              ? "Initializing..."
              : "Claim Tokens"}
          </button>
        </div>
        <div className="bg-black/30 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-purple-300">
            Debug Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <p className="text-gray-400 mb-1 text-sm">Token Canister ID</p>
              <p className="font-medium text-white">{TOKEN_CANISTER_ID}</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <p className="text-gray-400 mb-1 text-sm">Actor Initialized</p>
              <p className="font-medium text-white">
                {tokenActor ? "Yes" : "No"}
              </p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <p className="text-gray-400 mb-1 text-sm">Actor Loading</p>
              <p className="font-medium text-white">
                {actorLoading ? "Yes" : "No"}
              </p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <p className="text-gray-400 mb-1 text-sm">Balance Loading</p>
              <p className="font-medium text-white">{loading ? "Yes" : "No"}</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <p className="text-gray-400 mb-1 text-sm">Retry Count</p>
              <p className="font-medium text-white">{retryCount}</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <p className="text-gray-400 mb-1 text-sm">Token Info Loaded</p>
              <p className="font-medium text-white">
                {tokenInfo.name ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BalanceTestPage;
