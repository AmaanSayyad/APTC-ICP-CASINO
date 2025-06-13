// Enhanced Roulette Betting Hook with Integrated Token Approval
import { useState, useCallback } from "react";
import { useNFID } from "../providers/NFIDProvider";
import { useBackendIntegrationContext } from "../contexts/BackendIntegrationContext";
import { toast } from "react-hot-toast";

export const useEnhancedRouletteBetting = () => {
  const { isConnected, principal } = useNFID();
  const {
    actors,
    approveTokens,
    approveTokensWithFallback, // Use the enhanced approval function
    parseTokenAmount,
    tokenInfo,
    loading,
    setLoading,
    balance,
    fetchBalance,
    CANISTER_IDS,
  } = useBackendIntegrationContext();

  const [bettingState, setBettingState] = useState({
    isPlacing: false,
    lastBetResult: null,
    pendingApproval: false,
  });

  // Helper function to check if amount is valid
  const validateBetAmount = useCallback(
    (amount) => {
      if (!amount || amount <= 0) {
        throw new Error("Please enter a valid bet amount");
      }

      const amountBigInt = parseTokenAmount(amount, tokenInfo.decimals);
      const totalRequired = amountBigInt + tokenInfo.fee;

      if (balance < totalRequired) {
        throw new Error(
          `Insufficient balance. You need ${(
            Number(totalRequired) / 100000000
          ).toFixed(8)} APTC but have ${(Number(balance) / 100000000).toFixed(
            8
          )} APTC`
        );
      }

      return amountBigInt;
    },
    [balance, tokenInfo, parseTokenAmount]
  );

  // Enhanced bet placement with automatic approval
  const placeBetWithApproval = useCallback(
    async (betType, betValue, amount) => {
      if (!isConnected || !principal) {
        throw new Error("Please connect your wallet first");
      }

      if (!actors.roulette || !actors.aptc) {
        throw new Error("Backend not ready. Please refresh and try again.");
      }

      setBettingState((prev) => ({ ...prev, isPlacing: true }));

      try {
        console.log("🎲 Starting enhanced bet placement:", {
          betType,
          betValue,
          amount,
          principal: principal.toString(),
        });

        // Validate the bet amount
        const betAmountBigInt = validateBetAmount(amount);
        console.log("✅ Bet amount validated:", betAmountBigInt.toString());

        // Step 1: Approve tokens with buffer for fees
        setBettingState((prev) => ({ ...prev, pendingApproval: true }));
        const approvalAmount = betAmountBigInt + BigInt(20_000_000); // 0.2 APTC buffer

        console.log("🔑 Approving tokens:", {
          spender: CANISTER_IDS.ROULETTE_GAME,
          amount: approvalAmount.toString(),
        });

        try {
          // First attempt with enhanced approval function that handles ThresBls12_381 errors
          console.log(
            "🛡️ Using enhanced token approval with fallback mechanisms"
          );
          await approveTokensWithFallback(
            CANISTER_IDS.ROULETTE_GAME,
            amount + 0.2
          ); // Add 0.2 APTC buffer
          console.log("✅ Enhanced token approval successful");
        } catch (approvalError) {
          console.error("❌ Enhanced token approval failed:", approvalError);

          // Check if the approval error is due to delegation expiry
          const isDelegationExpiry =
            approvalError.message?.includes("invalid delegation expiry") ||
            approvalError.message?.includes("delegation has expired") ||
            approvalError.message?.includes(
              "specified sender delegation has expired"
            ) ||
            approvalError.message?.includes("delegation expiry") ||
            approvalError.message?.includes("delegation expired") ||
            approvalError.message?.includes("provided expiry") ||
            approvalError.message?.includes("local replica time") ||
            approvalError.message?.includes(
              "delegation certificate has expired"
            ) ||
            approvalError.message?.includes(
              "delegation certificate is expired"
            ) ||
            (approvalError.message?.includes("expiry") &&
              approvalError.message?.includes("delegation")) ||
            (approvalError.message?.includes("provided expiry") &&
              approvalError.message?.includes("local replica time"));

          if (isDelegationExpiry) {
            // Don't wrap delegation expiry errors, throw them directly for proper handling
            throw approvalError;
          }

          // Try standard approval as fallback
          console.log("⚠️ Falling back to standard approval method");
          try {
            await approveTokens(CANISTER_IDS.ROULETTE_GAME, amount + 0.2);
            console.log("✅ Standard token approval successful");
          } catch (secondError) {
            console.error("❌ All token approval methods failed:", secondError);

            // Check if the second error is also delegation expiry
            const isSecondDelegationExpiry =
              secondError.message?.includes("invalid delegation expiry") ||
              secondError.message?.includes("delegation has expired") ||
              secondError.message?.includes(
                "specified sender delegation has expired"
              ) ||
              secondError.message?.includes("delegation expiry") ||
              secondError.message?.includes("delegation expired") ||
              secondError.message?.includes("provided expiry") ||
              secondError.message?.includes("local replica time") ||
              (secondError.message?.includes("expiry") &&
                secondError.message?.includes("delegation"));

            if (isSecondDelegationExpiry) {
              // Don't wrap delegation expiry errors
              throw secondError;
            }

            throw new Error(
              `Token approval failed: ${approvalError.message}. Please try clearing your browser cache and reconnecting your wallet.`
            );
          }
        }

        setBettingState((prev) => ({ ...prev, pendingApproval: false }));

        // Step 2: Convert bet type to backend format
        let betTypeVariant;
        switch (betType) {
          case "number":
            betTypeVariant = { Number: null };
            break;
          case "red":
            betTypeVariant = { Color: null };
            betValue = 1; // Red = 1
            break;
          case "black":
            betTypeVariant = { Color: null };
            betValue = 0; // Black = 0
            break;
          case "odd":
            betTypeVariant = { OddEven: null };
            betValue = 1; // Odd = 1
            break;
          case "even":
            betTypeVariant = { OddEven: null };
            betValue = 0; // Even = 0
            break;
          case "high":
            betTypeVariant = { HighLow: null };
            betValue = 1; // High (19-36) = 1
            break;
          case "low":
            betTypeVariant = { HighLow: null };
            betValue = 0; // Low (1-18) = 0
            break;
          case "dozen":
            betTypeVariant = { Dozen: null };
            break;
          case "column":
            betTypeVariant = { Column: null };
            break;
          case "split":
            betTypeVariant = { Split: null };
            break;
          case "street":
            betTypeVariant = { Street: null };
            break;
          case "corner":
            betTypeVariant = { Corner: null };
            break;
          case "line":
            betTypeVariant = { Line: null };
            break;
          default:
            throw new Error(`Unsupported bet type: ${betType}`);
        }

        // Step 3: Place the bet
        console.log("🎲 Placing bet with backend:", {
          betTypeVariant,
          betValue,
          amount: betAmountBigInt.toString(),
        });

        const result = await actors.roulette.placeBet(
          betTypeVariant,
          betValue,
          betAmountBigInt,
          [] // numbers array (empty for most bet types)
        );

        if ("Err" in result) {
          throw new Error(`Bet placement failed: ${result.Err}`);
        }

        console.log("✅ Bet placed successfully:", result.Ok);

        setBettingState((prev) => ({
          ...prev,
          lastBetResult: {
            success: true,
            betType,
            betValue,
            amount: betAmountBigInt,
            result: result.Ok,
            timestamp: new Date(),
          },
        }));

        // Refresh balance after successful bet
        setTimeout(() => {
          fetchBalance();
        }, 2000);

        return true;
      } catch (error) {
        console.error("❌ Enhanced betting error:", error);

        // Enhanced error debugging
        console.log("🔍 ENHANCED BETTING ERROR ANALYSIS:");
        console.log("📋 Error message:", error?.message);
        console.log("📋 Error toString:", error?.toString());
        console.log("📋 Error object:", error);
        console.log("📋 Error stack:", error?.stack);

        setBettingState((prev) => ({
          ...prev,
          lastBetResult: {
            success: false,
            error: error.message,
            timestamp: new Date(),
          },
        }));

        // Detect local development delegation issues
        const isLocalDev =
          typeof window !== "undefined" &&
          window.location.hostname.includes("localhost");

        // Check for delegation expiry first (more specific than general delegation errors)
        const isDelegationExpiry =
          error.message?.includes("invalid delegation expiry") ||
          error.message?.includes("delegation has expired") ||
          error.message?.includes("specified sender delegation has expired") ||
          error.message?.includes("delegation expiry") ||
          error.message?.includes("delegation expired") ||
          error.message?.includes("provided expiry") ||
          error.message?.includes("local replica time") ||
          error.message?.includes("delegation certificate has expired") ||
          error.message?.includes("delegation certificate is expired") ||
          (error.message?.includes("expiry") &&
            error.message?.includes("delegation")) ||
          (error.message?.includes("provided expiry") &&
            error.message?.includes("local replica time"));

        if (isDelegationExpiry) {
          const delegationExpiryError = new Error(
            "🔐 Wallet delegation has expired. This is a known issue in local development.\n\n" +
              "Please try the following steps:\n" +
              "1. Disconnect your NFID wallet\n" +
              "2. Clear browser cache and cookies\n" +
              "3. Reconnect your NFID wallet\n" +
              "4. Try placing your bet immediately after connecting\n\n" +
              "💡 Local Development Tip: NFID delegations expire quickly (~12 seconds) in local mode.\n" +
              "For testing, consider using the dfx CLI:\n" +
              `• ./enhanced-local-betting.sh '${principal}' '${
                amount * 100000000
              }' '${betType}'\n\n` +
              "If the issue persists, check the browser console for detailed error logs."
          );
          delegationExpiryError.isDelegationError = true;
          delegationExpiryError.isDelegationExpiry = true;
          throw delegationExpiryError;
        }

        if (
          isLocalDev &&
          (error.message?.includes("delegation") ||
            error.message?.includes("Certificate verification") ||
            error.message?.includes("threshold signature") ||
            error.message?.includes("Signature verification failed") ||
            error.message?.includes("Invalid canister signature") ||
            error.message?.includes("certificate verification failed") ||
            error.message?.includes(
              "IcCanisterSignature signature could not be verified"
            ) ||
            error.message?.includes(
              "ThresBls12_381 signature could not be verified"
            ) ||
            error.message?.includes("Invalid combined threshold signature") ||
            error.message?.includes("Invalid delegation") ||
            error.message?.includes("Code: 400 (Bad Request)"))
        ) {
          const enhancedError = new Error(
            "🔧 Local Development: NFID delegation not fully supported. Use CLI script for testing."
          );
          enhancedError.isDelegationError = true;
          enhancedError.localDevSolution = `./enhanced-local-betting.sh '${principal}' '${
            amount * 100000000
          }' '${betType}'`;

          // Log helpful information for debugging
          console.log("🔧 Local Development Solution Available:");
          console.log(
            `cd /Users/aditya/APT-CASINO && ${enhancedError.localDevSolution}`
          );

          throw enhancedError;
        }

        throw error;
      } finally {
        setBettingState((prev) => ({
          ...prev,
          isPlacing: false,
          pendingApproval: false,
        }));
      }
    },
    [
      isConnected,
      principal,
      actors,
      approveTokens,
      approveTokensWithFallback,
      parseTokenAmount,
      tokenInfo,
      balance,
      fetchBalance,
      CANISTER_IDS,
      validateBetAmount,
    ]
  );

  // Convenience functions for specific bet types
  const placeStraightBet = useCallback(
    (number, amount) => placeBetWithApproval("number", number, amount),
    [placeBetWithApproval]
  );

  const placeColorBet = useCallback(
    (isRed, amount) =>
      placeBetWithApproval(isRed ? "red" : "black", isRed ? 1 : 0, amount),
    [placeBetWithApproval]
  );

  const placeOddEvenBet = useCallback(
    (isOdd, amount) =>
      placeBetWithApproval(isOdd ? "odd" : "even", isOdd ? 1 : 0, amount),
    [placeBetWithApproval]
  );

  const placeHighLowBet = useCallback(
    (isHigh, amount) =>
      placeBetWithApproval(isHigh ? "high" : "low", isHigh ? 1 : 0, amount),
    [placeBetWithApproval]
  );

  // Additional bet types
  const placeDozenBet = useCallback(
    (dozen, amount) => {
      // Dozen 1 = 1-12 (value: 0), Dozen 2 = 13-24 (value: 1), Dozen 3 = 25-36 (value: 2)
      if (dozen < 1 || dozen > 3) {
        throw new Error("Dozen must be 1, 2, or 3");
      }
      return placeBetWithApproval("dozen", dozen - 1, amount);
    },
    [placeBetWithApproval]
  );

  const placeColumnBet = useCallback(
    (column, amount) => {
      // Column 1 = 1,4,7... (value: 0), Column 2 = 2,5,8... (value: 1), Column 3 = 3,6,9... (value: 2)
      if (column < 1 || column > 3) {
        throw new Error("Column must be 1, 2, or 3");
      }
      return placeBetWithApproval("column", column - 1, amount);
    },
    [placeBetWithApproval]
  );

  const placeSplitBet = useCallback(
    (number1, number2, amount) => {
      // Split bet covers two adjacent numbers
      if (number1 < 0 || number1 > 36 || number2 < 0 || number2 > 36) {
        throw new Error("Numbers must be between 0 and 36");
      }
      // Use the lower number as the bet value for split bets
      return placeBetWithApproval("split", Math.min(number1, number2), amount);
    },
    [placeBetWithApproval]
  );

  const placeStreetBet = useCallback(
    (startNumber, amount) => {
      // Street bet covers a row of three numbers (e.g., 1-2-3, 4-5-6, etc.)
      if (startNumber < 1 || startNumber > 34 || startNumber % 3 !== 1) {
        throw new Error(
          "Street start number must be 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, or 34"
        );
      }
      return placeBetWithApproval("street", startNumber, amount);
    },
    [placeBetWithApproval]
  );

  const placeCornerBet = useCallback(
    (topLeftNumber, amount) => {
      // Corner bet covers four numbers in a square (e.g., 1-2-4-5)
      if (topLeftNumber < 1 || topLeftNumber > 32) {
        throw new Error("Invalid corner bet position");
      }
      return placeBetWithApproval("corner", topLeftNumber, amount);
    },
    [placeBetWithApproval]
  );

  const placeLineBet = useCallback(
    (startNumber, amount) => {
      // Line bet covers two adjacent streets (6 numbers)
      if (startNumber < 1 || startNumber > 31 || startNumber % 3 !== 1) {
        throw new Error(
          "Line start number must be 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, or 31"
        );
      }
      return placeBetWithApproval("line", startNumber, amount);
    },
    [placeBetWithApproval]
  );

  return {
    // State
    bettingState,
    isPlacing: bettingState.isPlacing,
    pendingApproval: bettingState.pendingApproval,
    lastBetResult: bettingState.lastBetResult,

    // Actions
    placeBetWithApproval,
    placeStraightBet,
    placeColorBet,
    placeOddEvenBet,
    placeHighLowBet,
    placeDozenBet,
    placeColumnBet,
    placeSplitBet,
    placeStreetBet,
    placeCornerBet,
    placeLineBet,
    validateBetAmount,

    // Utils
    formatAmount: (amount) =>
      (Number(amount) / Math.pow(10, tokenInfo.decimals)).toFixed(8),
  };
};

export default useEnhancedRouletteBetting;
