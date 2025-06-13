// Auto-generated canister configuration
export const CANISTER_IDS = {
  APTC_TOKEN:
    process.env.CANISTER_ID_APTC_TOKEN || "be2us-64aaa-aaaaa-qaabq-cai",
  ROULETTE_GAME: "asrmz-lmaaa-aaaaa-qaaeq-cai",
};

// Network configuration
export const NETWORK = process.env.NODE_ENV === "production" ? "ic" : "local";

// API endpoints
export const IC_HOST =
  NETWORK === "local" ? "http://localhost:4943" : "https://ic0.app";

// Game configuration
export const GAME_CONFIG = {
  MIN_BET: 10_000_000, // 0.1 APTC
  MAX_BET: 100_000_000_000, // 1,000 APTC
  PLATFORM_FEE_RATE: 0.5, // 0.5%
  AUTO_SPIN_DELAY: 30000, // 30 seconds
  DECIMALS: 8,
};

// Bet types with payouts
export const BET_TYPES = {
  Number: { payout: 35, label: "Single Number" },
  Color: { payout: 1, label: "Red/Black" },
  OddEven: { payout: 1, label: "Odd/Even" },
  HighLow: { payout: 1, label: "High/Low" },
  Dozen: { payout: 2, label: "Dozen" },
  Column: { payout: 2, label: "Column" },
  Split: { payout: 17, label: "Split" },
  Street: { payout: 11, label: "Street" },
  Corner: { payout: 8, label: "Corner" },
  Line: { payout: 5, label: "Line" },
};

// Red numbers in European roulette
export const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

// Utility functions - Using simple Number format like Number(bet.winnings) / 100000000
export const formatAPTC = (amount) => {
  return Number(amount) / 100000000;
};

export const parseAPTC = (amount) => {
  return Math.floor(Number(amount) * 100000000);
};

export const isRedNumber = (number) => {
  return RED_NUMBERS.includes(number);
};

export const getNumberColor = (number) => {
  if (number === 0) return "green";
  return isRedNumber(number) ? "red" : "black";
};
