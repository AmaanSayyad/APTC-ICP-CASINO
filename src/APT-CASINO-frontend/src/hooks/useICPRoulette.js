import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { Principal } from "@dfinity/principal";
import {
  createTokenActor,
  createRouletteActor,
  formatTokenAmount,
  parseTokenAmount,
} from "../config/icp-config";
import { useNFID } from "../providers/NFIDProvider";

// Bet types mapping to match Motoko backend
export const BetTypes = {
  NUMBER: { Number: null },
  COLOR: { Color: null },
  ODDEVEN: { OddEven: null },
  HIGHLOW: { HighLow: null },
  DOZEN: { Dozen: null },
  COLUMN: { Column: null },
  SPLIT: { Split: null },
  STREET: { Street: null },
  CORNER: { Corner: null },
  LINE: { Line: null },
};

// Color mappings for roulette
const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

export const useICPRoulette = () => {
  const { isConnected, identity, principal } = useNFID();
  const [loading, setLoading] = useState(false);
  const [gameState, setGameState] = useState({
    currentRound: 0,
    minBet: 0,
    maxBet: 0,
    userBalance: 0,
    recentNumbers: [],
    currentBets: [],
    lastSpinTime: 0,
  });
  const [tokenActor, setTokenActor] = useState(null);
  const [rouletteActor, setRouletteActor] = useState(null);
  const [tokenFee, setTokenFee] = useState(BigInt(0));

  // Initialize actors when identity changes
  useEffect(() => {
    const initActors = async () => {
      if (identity) {
        try {
          const token = await createTokenActor(identity);
          const roulette = await createRouletteActor(identity);
          setTokenActor(token);
          setRouletteActor(roulette);

          // Fetch token fee
          try {
            const fee = await token.icrc1_fee();
            // Ensure fee is converted to BigInt
            const feeBigInt = typeof fee === "bigint" ? fee : BigInt(fee);
            setTokenFee(feeBigInt);
          } catch (error) {
            console.error("Failed to fetch token fee:", error);
            setTokenFee(BigInt(1000)); // Fallback fee value
          }
        } catch (error) {
          console.error("Failed to initialize actors:", error);
          toast.error("Failed to connect to ICP network");
        }
      } else {
        setTokenActor(null);
        setRouletteActor(null);
        setTokenFee(BigInt(0));
      }
    };

    initActors();
  }, [identity]);

  // Load game state
  const loadGameState = useCallback(async () => {
    if (!rouletteActor || !tokenActor || !principal) return;

    try {
      setLoading(true);

      const [
        currentRound,
        minBet,
        maxBet,
        userBalance,
        recentNumbers,
        currentBets,
        lastSpinTime,
      ] = await Promise.all([
        rouletteActor.getCurrentRound(),
        rouletteActor.getMinBet(),
        rouletteActor.getMaxBet(),
        rouletteActor.getUserBalance(Principal.fromText(principal)),
        rouletteActor.getRecentNumbers(),
        rouletteActor.getCurrentBets(),
        rouletteActor.getLastSpinTime(),
      ]);

      setGameState({
        currentRound: Number(currentRound),
        minBet: Number(minBet),
        maxBet: Number(maxBet),
        userBalance: Number(userBalance),
        recentNumbers: recentNumbers.map((n) => Number(n)),
        currentBets: currentBets,
        lastSpinTime: Number(lastSpinTime),
      });
    } catch (error) {
      console.error("Failed to load game state:", error);
      toast.error("Failed to load game data");
    } finally {
      setLoading(false);
    }
  }, [rouletteActor, tokenActor, principal]);

  // Load game state on component mount and actor changes
  useEffect(() => {
    if (rouletteActor && tokenActor && principal) {
      loadGameState();
    }
  }, [loadGameState]);

  // Approve tokens for betting
  const approveTokens = useCallback(
    async (amount) => {
      if (!tokenActor || !rouletteActor || !principal) {
        toast.error("Please connect your wallet first");
        return false;
      }

      try {
        setLoading(true);

        // Get roulette canister principal for approval
        const roulettePrincipal =
          (await rouletteActor.getCanisterId?.()) ||
          Principal.fromText(process.env.NEXT_PUBLIC_ROULETTE_CANISTER_ID);

        // Get the current fee to ensure it's up-to-date
        const currentFee = await tokenActor.icrc1_fee();
        const freshTokenFee =
          typeof currentFee === "bigint" ? currentFee : BigInt(currentFee);

        console.log(
          `🪙 ICP Roulette using current token fee: ${freshTokenFee.toString()} for approval`
        );

        const approveArgs = {
          from_subaccount: [],
          spender: {
            owner: roulettePrincipal,
            subaccount: [],
          },
          amount: BigInt(amount),
          expected_allowance: [],
          expires_at: [],
          fee: [freshTokenFee],
          memo: [],
          created_at_time: [],
        };

        const result = await tokenActor.icrc2_approve(approveArgs);

        if (result.Ok !== undefined) {
          toast.success("Tokens approved successfully!");
          return true;
        } else {
          console.error("Approval failed:", result.Err);
          toast.error(
            `Approval failed: ${
              result.Err.GenericError?.message || "Unknown error"
            }`
          );
          return false;
        }
      } catch (error) {
        console.error("Approval error:", error);
        toast.error("Failed to approve tokens");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [tokenActor, rouletteActor, principal]
  );

  // Place a bet
  const placeBet = useCallback(
    async (betType, betValue, amount, numbers = []) => {
      if (!rouletteActor || !principal) {
        toast.error("Please connect your wallet first");
        return false;
      }

      try {
        setLoading(true);

        // Ensure sufficient approval first
        const approvalResult = await approveTokens(amount);
        if (!approvalResult) {
          return false;
        }

        const result = await rouletteActor.placeBet(
          betType,
          betValue,
          BigInt(amount),
          numbers.map((n) => BigInt(n))
        );

        if (result.Ok !== undefined) {
          toast.success("Bet placed successfully!");
          // Reload game state after successful bet
          await loadGameState();
          return true;
        } else {
          console.error("Bet failed:", result.Err);
          toast.error(`Bet failed: ${result.Err}`);
          return false;
        }
      } catch (error) {
        console.error("Betting error:", error);
        toast.error("Failed to place bet");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [rouletteActor, principal, approveTokens, loadGameState]
  );

  // Place a number bet
  const placeNumberBet = useCallback(
    async (number, amount) => {
      return await placeBet(BetTypes.NUMBER, number, amount, []);
    },
    [placeBet]
  );

  // Place a color bet (0 = red, 1 = black)
  const placeColorBet = useCallback(
    async (color, amount) => {
      return await placeBet(BetTypes.COLOR, color, amount, []);
    },
    [placeBet]
  );

  // Place an odd/even bet (0 = even, 1 = odd)
  const placeOddEvenBet = useCallback(
    async (oddEven, amount) => {
      return await placeBet(BetTypes.ODDEVEN, oddEven, amount, []);
    },
    [placeBet]
  );

  // Place a high/low bet (0 = low 1-18, 1 = high 19-36)
  const placeHighLowBet = useCallback(
    async (highLow, amount) => {
      return await placeBet(BetTypes.HIGHLOW, highLow, amount, []);
    },
    [placeBet]
  );

  // Place a dozen bet (0 = 1st dozen, 1 = 2nd dozen, 2 = 3rd dozen)
  const placeDozenBet = useCallback(
    async (dozen, amount) => {
      return await placeBet(BetTypes.DOZEN, dozen, amount, []);
    },
    [placeBet]
  );

  // Place a column bet (0 = 1st column, 1 = 2nd column, 2 = 3rd column)
  const placeColumnBet = useCallback(
    async (column, amount) => {
      return await placeBet(BetTypes.COLUMN, column, amount, []);
    },
    [placeBet]
  );

  // Place a split bet (two adjacent numbers)
  const placeSplitBet = useCallback(
    async (numbers, amount) => {
      if (numbers.length !== 2) {
        toast.error("Split bet requires exactly 2 numbers");
        return false;
      }
      return await placeBet(BetTypes.SPLIT, 0, amount, numbers);
    },
    [placeBet]
  );

  // Place a street bet (three numbers in a row)
  const placeStreetBet = useCallback(
    async (numbers, amount) => {
      if (numbers.length !== 3) {
        toast.error("Street bet requires exactly 3 numbers");
        return false;
      }
      return await placeBet(BetTypes.STREET, 0, amount, numbers);
    },
    [placeBet]
  );

  // Place a corner bet (four numbers)
  const placeCornerBet = useCallback(
    async (numbers, amount) => {
      if (numbers.length !== 4) {
        toast.error("Corner bet requires exactly 4 numbers");
        return false;
      }
      return await placeBet(BetTypes.CORNER, 0, amount, numbers);
    },
    [placeBet]
  );

  // Place a line bet (six numbers)
  const placeLineBet = useCallback(
    async (numbers, amount) => {
      if (numbers.length !== 6) {
        toast.error("Line bet requires exactly 6 numbers");
        return false;
      }
      return await placeBet(BetTypes.LINE, 0, amount, numbers);
    },
    [placeBet]
  );

  // Withdraw user balance
  const withdraw = useCallback(
    async (amount) => {
      if (!rouletteActor) {
        toast.error("Please connect your wallet first");
        return false;
      }

      try {
        setLoading(true);

        const result = await rouletteActor.withdraw(BigInt(amount));

        if (result.Ok !== undefined) {
          toast.success("Withdrawal successful!");
          await loadGameState();
          return true;
        } else {
          console.error("Withdrawal failed:", result.Err);
          toast.error(`Withdrawal failed: ${result.Err}`);
          return false;
        }
      } catch (error) {
        console.error("Withdrawal error:", error);
        toast.error("Failed to withdraw");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [rouletteActor, loadGameState]
  );

  // Get recent bet results
  const getRecentResults = useCallback(
    async (limit = 10) => {
      if (!rouletteActor) return [];

      try {
        const results = await rouletteActor.getRecentResults(BigInt(limit));
        return results.map((result) => ({
          ...result,
          amount: Number(result.amount),
          winnings: Number(result.winnings),
          round: Number(result.round),
          number: Number(result.number),
          timestamp: Number(result.timestamp),
        }));
      } catch (error) {
        console.error("Failed to get recent results:", error);
        return [];
      }
    },
    [rouletteActor]
  );

  // Helper function to determine if a number is red
  const isRedNumber = useCallback((number) => {
    return RED_NUMBERS.includes(number);
  }, []);

  // Helper function to format token amounts
  const formatTokens = useCallback((amount) => {
    return formatTokenAmount(amount);
  }, []);

  // Helper function to parse token amounts
  const parseTokens = useCallback((amount) => {
    return parseTokenAmount(amount);
  }, []);

  return {
    // State
    loading,
    gameState,
    isConnected,

    // Actions
    loadGameState,
    approveTokens,

    // Betting functions
    placeNumberBet,
    placeColorBet,
    placeOddEvenBet,
    placeHighLowBet,
    placeDozenBet,
    placeColumnBet,
    placeSplitBet,
    placeStreetBet,
    placeCornerBet,
    placeLineBet,

    // Other functions
    withdraw,
    getRecentResults,

    // Helpers
    isRedNumber,
    formatTokens,
    parseTokens,

    // Constants
    BetTypes,
    RED_NUMBERS,
  };
};

export default useICPRoulette;
