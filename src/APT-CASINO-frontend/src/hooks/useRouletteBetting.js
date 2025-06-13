// Roulette Betting Utilities
// This module provides helper functions for placing different types of bets in the roulette game

import { useCallback } from "react";
import { toast } from "react-hot-toast";
import useRouletteGame from "./useRouletteGame";

// Constants
const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

// Validation helpers
const validateNumber = (number) => {
  const num = Number(number);
  if (isNaN(num) || num < 0 || num > 36) {
    return false;
  }
  return true;
};

const areAdjacent = (num1, num2) => {
  // Check if two numbers are adjacent on the roulette table
  if (num1 === 0 || num2 === 0) {
    // Special case for zero
    return false;
  }

  // Same row adjacency
  const row1 = Math.floor((num1 - 1) / 3);
  const col1 = (num1 - 1) % 3;
  const row2 = Math.floor((num2 - 1) / 3);
  const col2 = (num2 - 1) % 3;

  // Check if numbers are horizontally or vertically adjacent
  return (
    (row1 === row2 && Math.abs(col1 - col2) === 1) ||
    (col1 === col2 && Math.abs(row1 - row2) === 1)
  );
};

const useRouletteBetting = () => {
  const {
    placeBet,
    gameState,
    loading,
    formatBalance,
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
  } = useRouletteGame();

  // Enhanced functions with additional validation

  // Number bet (straight up) - pays 35:1
  const betOnNumber = useCallback(
    (number, amount) => {
      const num = Number(number);
      if (!validateNumber(num)) {
        toast.error(`Invalid number: ${number}. Must be between 0-36.`);
        return false;
      }

      return placeStraightBet(num, amount);
    },
    [placeStraightBet]
  );

  // Color bet - pays 1:1
  const betOnColor = useCallback(
    (color, amount) => {
      // color should be 'red' or 'black'
      if (color !== "red" && color !== "black") {
        toast.error(`Invalid color: ${color}. Must be 'red' or 'black'.`);
        return false;
      }

      return placeColorBet(color === "red", amount);
    },
    [placeColorBet]
  );

  // Check if a number is red
  const isRed = useCallback((number) => {
    return RED_NUMBERS.includes(Number(number));
  }, []);

  // Odd/Even bet - pays 1:1
  const betOnOddEven = useCallback(
    (choice, amount) => {
      // choice should be 'odd' or 'even'
      if (choice !== "odd" && choice !== "even") {
        toast.error(`Invalid choice: ${choice}. Must be 'odd' or 'even'.`);
        return false;
      }

      return placeOddEvenBet(choice === "odd", amount);
    },
    [placeOddEvenBet]
  );

  // High/Low bet - pays 1:1
  const betOnHighLow = useCallback(
    (choice, amount) => {
      // choice should be 'high' (19-36) or 'low' (1-18)
      if (choice !== "high" && choice !== "low") {
        toast.error(`Invalid choice: ${choice}. Must be 'high' or 'low'.`);
        return false;
      }

      return placeHighLowBet(choice === "high", amount);
    },
    [placeHighLowBet]
  );

  // Dozen bet - pays 2:1
  const betOnDozen = useCallback(
    (dozen, amount) => {
      // dozen should be 1, 2, or 3 (for UI) but we convert to 0, 1, 2 for backend
      const dozenIndex = Number(dozen) - 1;
      if (![0, 1, 2].includes(dozenIndex)) {
        toast.error(`Invalid dozen: ${dozen}. Must be 1, 2, or 3.`);
        return false;
      }

      return placeDozenBet(dozenIndex, amount);
    },
    [placeDozenBet]
  );

  // Column bet - pays 2:1
  const betOnColumn = useCallback(
    (column, amount) => {
      // column should be 1, 2, or 3 (for UI) but we convert to 0, 1, 2 for backend
      const columnIndex = Number(column) - 1;
      if (![0, 1, 2].includes(columnIndex)) {
        toast.error(`Invalid column: ${column}. Must be 1, 2, or 3.`);
        return false;
      }

      return placeColumnBet(columnIndex, amount);
    },
    [placeColumnBet]
  );

  // Split bet (2 adjacent numbers) - pays 17:1
  const betOnSplit = useCallback(
    (number1, number2, amount) => {
      const num1 = Number(number1);
      const num2 = Number(number2);

      if (!validateNumber(num1) || !validateNumber(num2)) {
        toast.error(
          `Invalid numbers: ${number1}, ${number2}. Must be between 0-36.`
        );
        return false;
      }

      if (num1 === num2) {
        toast.error(`Split bet requires two different numbers.`);
        return false;
      }

      if (!areAdjacent(num1, num2)) {
        toast.error(
          `Numbers ${num1} and ${num2} are not adjacent on the roulette table.`
        );
        return false;
      }

      return placeSplitBet(num1, num2, amount);
    },
    [placeSplitBet]
  );

  // Street bet (3 numbers in a row) - pays 11:1
  const betOnStreet = useCallback(
    (streetNumber, amount) => {
      // streetNumber should be 1-12 representing the row (will be converted to the 3 numbers)
      const row = Number(streetNumber);
      if (isNaN(row) || row < 1 || row > 12) {
        toast.error(`Invalid street number: ${streetNumber}. Must be 1-12.`);
        return false;
      }

      return placeStreetBet(row - 1, amount); // Convert to 0-based for backend
    },
    [placeStreetBet]
  );

  // Corner bet (4 numbers in a square) - pays 8:1
  const betOnCorner = useCallback(
    (topLeftNumber, amount) => {
      // topLeftNumber is the top-left number of the corner
      const num = Number(topLeftNumber);
      if (!validateNumber(num)) {
        toast.error(`Invalid corner number: ${topLeftNumber}.`);
        return false;
      }

      // Calculate the corner based on the top-left number
      // This is a simplified approach, you might need more complex logic depending on your UI
      const row = Math.floor((num - 1) / 3);
      const col = (num - 1) % 3;

      // Can't form a corner if we're in the last row or last column
      if (row >= 11 || col >= 2) {
        toast.error(`Cannot form a corner starting with ${num}.`);
        return false;
      }

      // Calculate the 4 numbers in this corner
      const numbers = [num, num + 1, num + 3, num + 4];

      return placeCornerBet(num, amount);
    },
    [placeCornerBet]
  );

  // Line bet (6 numbers, two adjacent rows) - pays 5:1
  const betOnLine = useCallback(
    (lineNumber, amount) => {
      // lineNumber should be 1-11 representing the line (will be converted to the 6 numbers)
      const line = Number(lineNumber);
      if (isNaN(line) || line < 1 || line > 11) {
        toast.error(`Invalid line number: ${lineNumber}. Must be 1-11.`);
        return false;
      }

      return placeLineBet(line - 1, amount); // Convert to 0-based for backend
    },
    [placeLineBet]
  );

  return {
    // Original functions
    placeBet,
    gameState,
    loading,
    formatBalance,
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

    // Enhanced functions with better validation
    betOnNumber,
    betOnColor,
    betOnOddEven,
    betOnHighLow,
    betOnDozen,
    betOnColumn,
    betOnSplit,
    betOnStreet,
    betOnCorner,
    betOnLine,

    // Utility functions
    isRed,
    validateNumber,
    areAdjacent,
  };
};

export default useRouletteBetting;
