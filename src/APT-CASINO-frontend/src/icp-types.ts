// ICP Roulette Casino - Frontend Integration Types
// This file provides TypeScript interfaces for interacting with the ICP canisters

export interface BetType {
  Number: null;
  Color: null;
  OddEven: null;
  HighLow: null;
  Dozen: null;
  Column: null;
  Split: null;
  Street: null;
  Corner: null;
  Line: null;
}

export interface Bet {
  player: string; // Principal as string
  amount: bigint;
  betType: BetType;
  betValue: number; // 0-255 (Nat8)
  numbers: number[];
  round: bigint;
  timestamp: bigint;
}

export interface BetResult {
  player: string;
  amount: bigint;
  won: boolean;
  winnings: bigint;
  round: bigint;
  number: bigint;
  timestamp: bigint;
}

// Token Canister Interface
export interface TokenCanister {
  name: () => Promise<string>;
  symbol: () => Promise<string>;
  decimals: () => Promise<number>;
  totalSupply: () => Promise<bigint>;
  balanceOf: (account: string) => Promise<bigint>;
  allowance: (owner: string, spender: string) => Promise<bigint>;
  transfer: (
    to: string,
    amount: bigint
  ) => Promise<{ Ok: boolean } | { Err: string }>;
  transferFrom: (
    from: string,
    to: string,
    amount: bigint
  ) => Promise<{ Ok: boolean } | { Err: string }>;
  approve: (
    spender: string,
    amount: bigint
  ) => Promise<{ Ok: boolean } | { Err: string }>;
  mint: (
    to: string,
    amount: bigint
  ) => Promise<{ Ok: boolean } | { Err: string }>;
  burn: (amount: bigint) => Promise<{ Ok: boolean } | { Err: string }>;
  setTreasury: (
    newTreasury: string
  ) => Promise<{ Ok: boolean } | { Err: string }>;
  setRouletteContract: (
    roulette: string
  ) => Promise<{ Ok: boolean } | { Err: string }>;
  pause: () => Promise<{ Ok: boolean } | { Err: string }>;
  unpause: () => Promise<{ Ok: boolean } | { Err: string }>;
  getOwner: () => Promise<string>;
  getTreasury: () => Promise<string>;
  getRouletteContract: () => Promise<[string] | []>;
  isPaused: () => Promise<boolean>;
  getRecentTransfers: (
    limit: bigint
  ) => Promise<Array<[string, string, bigint, bigint]>>;
  getRecentApprovals: (
    limit: bigint
  ) => Promise<Array<[string, string, bigint, bigint]>>;
}

// Roulette Canister Interface
export interface RouletteCanister {
  placeBet: (
    betType: BetType,
    betValue: number,
    amount: bigint,
    numbers: number[]
  ) => Promise<{ Ok: string } | { Err: string }>;

  spinRoulette: () => Promise<{ Ok: string } | { Err: string }>;

  withdraw: (amount: bigint) => Promise<{ Ok: boolean } | { Err: string }>;

  getMinBet: () => Promise<bigint>;
  getMaxBet: () => Promise<bigint>;
  getCurrentRound: () => Promise<bigint>;
  getUserBalance: (user: string) => Promise<bigint>;
  getRecentNumbers: () => Promise<number[]>;
  getRecentResults: (limit: bigint) => Promise<BetResult[]>;
  getCurrentBets: () => Promise<Bet[]>;
  getLastSpinTime: () => Promise<bigint>;

  // Admin functions
  setMinBet: (newMinBet: bigint) => Promise<{ Ok: boolean } | { Err: string }>;
  setMaxBet: (newMaxBet: bigint) => Promise<{ Ok: boolean } | { Err: string }>;
  setTreasury: (
    newTreasury: string
  ) => Promise<{ Ok: boolean } | { Err: string }>;
  emergencyWithdraw: (
    amount: bigint
  ) => Promise<{ Ok: boolean } | { Err: string }>;

  getOwner: () => Promise<string>;
  getTreasury: () => Promise<string>;
  getPlatformFeeRate: () => Promise<bigint>;
}

// Utility functions for bet creation
export class BetTypeHelper {
  static Number(): BetType {
    return { Number: null } as any;
  }

  static Color(): BetType {
    return { Color: null } as any;
  }

  static OddEven(): BetType {
    return { OddEven: null } as any;
  }

  static HighLow(): BetType {
    return { HighLow: null } as any;
  }

  static Dozen(): BetType {
    return { Dozen: null } as any;
  }

  static Column(): BetType {
    return { Column: null } as any;
  }

  static Split(): BetType {
    return { Split: null } as any;
  }

  static Street(): BetType {
    return { Street: null } as any;
  }

  static Corner(): BetType {
    return { Corner: null } as any;
  }

  static Line(): BetType {
    return { Line: null } as any;
  }
}

// Constants for bet values
export const BetValues = {
  // Color: 0 = Black, 1 = Red
  BLACK: 0,
  RED: 1,

  // OddEven: 0 = Odd, 1 = Even
  ODD: 0,
  EVEN: 1,

  // HighLow: 0 = Low (1-18), 1 = High (19-36)
  LOW: 0,
  HIGH: 1,

  // Dozens: 0 = 1st (1-12), 1 = 2nd (13-24), 2 = 3rd (25-36)
  FIRST_DOZEN: 0,
  SECOND_DOZEN: 1,
  THIRD_DOZEN: 2,

  // Columns: 0 = 1st column, 1 = 2nd column, 2 = 3rd column
  FIRST_COLUMN: 0,
  SECOND_COLUMN: 1,
  THIRD_COLUMN: 2,
} as const;

// Payout multipliers
export const PayoutMultipliers = {
  NUMBER: 36, // 35:1 + original bet
  COLOR: 2, // 1:1 + original bet
  ODDEVEN: 2, // 1:1 + original bet
  HIGHLOW: 2, // 1:1 + original bet
  DOZEN: 3, // 2:1 + original bet
  COLUMN: 3, // 2:1 + original bet
  SPLIT: 18, // 17:1 + original bet
  STREET: 12, // 11:1 + original bet
  CORNER: 9, // 8:1 + original bet
  LINE: 6, // 5:1 + original bet
} as const;

// Red numbers in European roulette
export const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

// Helper function to check if a number is red
export function isRedNumber(number: number): boolean {
  return RED_NUMBERS.includes(number);
}

// Helper function to get dozen for a number
export function getDozen(number: number): number {
  if (number === 0) return -1; // 0 doesn't belong to any dozen
  return Math.floor((number - 1) / 12);
}

// Helper function to get column for a number
export function getColumn(number: number): number {
  if (number === 0) return -1; // 0 doesn't belong to any column
  return (number - 1) % 3;
}

// Helper function to convert tokens to display format (8 decimals) - Using simple Number format
export function formatTokenAmount(amount: bigint): number {
  return Number(amount) / 100000000;
}

// Helper function to convert display amount to token amount (8 decimals)
export function parseTokenAmount(amount: string | number): bigint {
  return BigInt(Math.floor(Number(amount) * 100000000));
}

// Sample usage example:
/*
import { Actor, HttpAgent } from '@dfinity/agent';

// Connect to canisters
const host = import.meta.env.NODE_ENV === "production" 
  ? "https://ic0.app" 
  : `http://localhost:${import.meta.env.DFX_PORT || "4943"}`;
  
const agent = new HttpAgent({ host });
const tokenCanister = Actor.createActor(tokenIdl, {
  agent,
  canisterId: 'your-token-canister-id',
}) as TokenCanister;

const rouletteCanister = Actor.createActor(rouletteIdl, {
  agent,
  canisterId: 'your-roulette-canister-id',  
}) as RouletteCanister;

// Place a bet on red
const betResult = await rouletteCanister.placeBet(
  BetTypeHelper.Color(),
  BetValues.RED,
  parseTokenAmount('10'), // 10 APTC
  []
);

// Check balance
const balance = await tokenCanister.balanceOf('your-principal');
console.log('Balance:', formatTokenAmount(balance), 'APTC');
*/
