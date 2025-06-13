import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
  createTokenActor,
  createRouletteActor,
  formatTokenAmount,
  parseTokenAmount,
  getAuthClient,
} from "../config/icp-config";

// Custom hook for ICP authentication
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async () => {
    try {
      const authClient = await getAuthClient();

      await authClient.login({
        identityProvider:
          process.env.NODE_ENV === "production"
            ? "https://identity.ic0.app"
            : `http://127.0.0.1:${
                import.meta.env.DFX_PORT || "4943"
              }/?canisterId=rdmx6-jaaaa-aaaah-qcaiq-cai`,
        onSuccess: () => {
          const identity = authClient.getIdentity();
          const principal = identity.getPrincipal().toString();

          setIdentity(identity);
          setPrincipal(principal);
          setIsAuthenticated(true);

          toast.success("Successfully logged in!");
        },
        onError: (error) => {
          console.error("Login failed:", error);
          toast.error("Login failed. Please try again.");
        },
      });
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Authentication failed");
    }
  };

  const logout = async () => {
    try {
      const authClient = await getAuthClient();
      await authClient.logout();

      setIdentity(null);
      setPrincipal(null);
      setIsAuthenticated(false);

      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  const checkAuth = async () => {
    try {
      const authClient = await getAuthClient();
      const authenticated = await authClient.isAuthenticated();

      if (authenticated) {
        const identity = authClient.getIdentity();
        const principal = identity.getPrincipal().toString();

        setIdentity(identity);
        setPrincipal(principal);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    isAuthenticated,
    identity,
    principal,
    loading,
    login,
    logout,
  };
};

// Custom hook for APT Token operations
export const useAPTToken = (identity) => {
  const [balance, setBalance] = useState(BigInt(0));
  const [loading, setLoading] = useState(false);
  const [tokenActor, setTokenActor] = useState(null);

  useEffect(() => {
    if (identity) {
      createTokenActor(identity).then(setTokenActor);
    }
  }, [identity]);

  const getBalance = useCallback(
    async (principal) => {
      if (!tokenActor || !principal) return BigInt(0);

      try {
        const balance = await tokenActor.balanceOf(principal);
        return balance;
      } catch (error) {
        console.error("Error fetching balance:", error);
        return BigInt(0);
      }
    },
    [tokenActor]
  );

  const transfer = useCallback(
    async (to, amount) => {
      if (!tokenActor) {
        toast.error("Token actor not initialized");
        return false;
      }

      setLoading(true);
      try {
        const result = await tokenActor.transfer(to, amount);

        if ("Ok" in result) {
          toast.success("Transfer successful!");
          return true;
        } else {
          toast.error(`Transfer failed: ${result.Err}`);
          return false;
        }
      } catch (error) {
        console.error("Transfer error:", error);
        toast.error("Transfer failed");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [tokenActor]
  );

  const approve = useCallback(
    async (spender, amount) => {
      if (!tokenActor) {
        toast.error("Token actor not initialized");
        return false;
      }

      setLoading(true);
      try {
        const result = await tokenActor.approve(spender, amount);

        if ("Ok" in result) {
          toast.success("Approval successful!");
          return true;
        } else {
          toast.error(`Approval failed: ${result.Err}`);
          return false;
        }
      } catch (error) {
        console.error("Approval error:", error);
        toast.error("Approval failed");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [tokenActor]
  );

  const getAllowance = useCallback(
    async (owner, spender) => {
      if (!tokenActor) return BigInt(0);

      try {
        return await tokenActor.allowance(owner, spender);
      } catch (error) {
        console.error("Error fetching allowance:", error);
        return BigInt(0);
      }
    },
    [tokenActor]
  );

  // Update balance when identity changes
  useEffect(() => {
    if (identity && tokenActor) {
      const principal = identity.getPrincipal().toString();

      const updateBalance = async () => {
        const newBalance = await getBalance(principal);
        setBalance(newBalance);
      };

      updateBalance();

      // Set up periodic balance updates
      const interval = setInterval(updateBalance, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [identity, tokenActor, getBalance]);

  return {
    balance,
    loading,
    getBalance,
    transfer,
    approve,
    getAllowance,
    tokenActor,
  };
};

// Custom hook for Roulette game operations
export const useRoulette = (identity) => {
  const [gameState, setGameState] = useState({
    currentRound: 0,
    minBet: BigInt(0),
    maxBet: BigInt(0),
    recentNumbers: [],
    currentBets: [],
    recentResults: [],
  });
  const [loading, setLoading] = useState(false);
  const [rouletteActor, setRouletteActor] = useState(null);

  useEffect(() => {
    if (identity) {
      createRouletteActor(identity).then(setRouletteActor);
    }
  }, [identity]);

  // Fetch game state
  const fetchGameState = useCallback(async () => {
    if (!rouletteActor) return;

    try {
      const [
        currentRound,
        minBet,
        maxBet,
        recentNumbers,
        currentBets,
        recentResults,
      ] = await Promise.all([
        rouletteActor.getCurrentRound(),
        rouletteActor.getMinBet(),
        rouletteActor.getMaxBet(),
        rouletteActor.getRecentNumbers(),
        rouletteActor.getCurrentBets(),
        rouletteActor.getRecentResults(20),
      ]);

      setGameState({
        currentRound,
        minBet,
        maxBet,
        recentNumbers,
        currentBets,
        recentResults,
      });
    } catch (error) {
      console.error("Error fetching game state:", error);
    }
  }, [rouletteActor]);

  // Place a bet
  const placeBet = useCallback(
    async (betType, betValue, amount, numbers = []) => {
      if (!rouletteActor) {
        toast.error("Roulette actor not initialized");
        return false;
      }

      setLoading(true);
      try {
        // Convert bet type to the format expected by the canister
        const betTypeVariant = { [betType]: null };

        const result = await rouletteActor.placeBet(
          betTypeVariant,
          betValue,
          amount,
          numbers
        );

        if ("Ok" in result) {
          toast.success(result.Ok);
          await fetchGameState(); // Refresh game state
          return true;
        } else {
          toast.error(`Bet failed: ${result.Err}`);
          return false;
        }
      } catch (error) {
        console.error("Bet placement error:", error);
        toast.error("Failed to place bet");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [rouletteActor, fetchGameState]
  );

  // Spin roulette
  const spinRoulette = useCallback(async () => {
    if (!rouletteActor) {
      toast.error("Roulette actor not initialized");
      return false;
    }

    setLoading(true);
    try {
      const result = await rouletteActor.spinRoulette();

      if ("Ok" in result) {
        toast.success(result.Ok);
        await fetchGameState(); // Refresh game state
        return true;
      } else {
        toast.error(`Spin failed: ${result.Err}`);
        return false;
      }
    } catch (error) {
      console.error("Spin error:", error);
      toast.error("Failed to spin roulette");
      return false;
    } finally {
      setLoading(false);
    }
  }, [rouletteActor, fetchGameState]);

  // Get user balance from roulette contract
  const getUserBalance = useCallback(
    async (principal) => {
      if (!rouletteActor || !principal) return BigInt(0);

      try {
        return await rouletteActor.getUserBalance(principal);
      } catch (error) {
        console.error("Error fetching user balance:", error);
        return 0n;
      }
    },
    [rouletteActor]
  );

  // Initialize game state when roulette actor is ready
  useEffect(() => {
    if (rouletteActor) {
      fetchGameState();

      // Set up periodic state updates
      const interval = setInterval(fetchGameState, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [rouletteActor, fetchGameState]);

  return {
    gameState,
    loading,
    placeBet,
    spinRoulette,
    getUserBalance,
    fetchGameState,
    rouletteActor,
  };
};

// Utility functions for bet creation
export const createBet = {
  number: (number, amount) => ({
    betType: "Number",
    betValue: number,
    amount: parseTokenAmount(amount),
    numbers: [],
  }),

  color: (isRed, amount) => ({
    betType: "Color",
    betValue: isRed ? 1 : 0,
    amount: parseTokenAmount(amount),
    numbers: [],
  }),

  oddEven: (isEven, amount) => ({
    betType: "OddEven",
    betValue: isEven ? 1 : 0,
    amount: parseTokenAmount(amount),
    numbers: [],
  }),

  highLow: (isHigh, amount) => ({
    betType: "HighLow",
    betValue: isHigh ? 1 : 0,
    amount: parseTokenAmount(amount),
    numbers: [],
  }),

  dozen: (dozen, amount) => ({
    betType: "Dozen",
    betValue: dozen, // 0, 1, or 2
    amount: parseTokenAmount(amount),
    numbers: [],
  }),

  column: (column, amount) => ({
    betType: "Column",
    betValue: column, // 0, 1, or 2
    amount: parseTokenAmount(amount),
    numbers: [],
  }),

  split: (numbers, amount) => ({
    betType: "Split",
    betValue: 0,
    amount: parseTokenAmount(amount),
    numbers,
  }),

  street: (numbers, amount) => ({
    betType: "Street",
    betValue: 0,
    amount: parseTokenAmount(amount),
    numbers,
  }),

  corner: (numbers, amount) => ({
    betType: "Corner",
    betValue: 0,
    amount: parseTokenAmount(amount),
    numbers,
  }),

  line: (numbers, amount) => ({
    betType: "Line",
    betValue: 0,
    amount: parseTokenAmount(amount),
    numbers,
  }),
};
