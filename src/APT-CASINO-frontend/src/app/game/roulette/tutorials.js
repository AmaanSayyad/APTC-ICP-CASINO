export const rouletteTutorial =
  "This is the European roulette variation, where there is only one 0 in the roulette (it is more favorable for you, as players!). There is a limit of $1,000 for every bet. First, enter a non-zero bet size. Then, click on parts of the board to make the appropriate bets. Clicking on an existing bet will overwrite it. Finish placing the bets by running the roulette and find out which number was selected! Curious what bets you can make? Take a look at the odds breakdown.";

export const rouletteOdds = [
  "Below are the supported inside bets",
  "-Straight Up (35:1 payout): Select one number",
  "-Split (17:1 payout): Select two numbers (click border between two numbers)",
  "-Street (11:1 payout): Select three numbers (example: click bottom border of 1 to get street 1, 2, and 3)",
  "-Corner (8:1 payout): Select four numbers (click corner between 4 straight ups)",
  "-Six Line (5:1 payout): Select six numbers (example: click corner between 1 and 4 to bet 1, 2, 3, 4, 5, and 6)",
  "Below are the supported outside bets",
  '-Column (2:1 payout): 12 numbers aligned to the "2 To 1" (click 2 To 1)',
  "-Dozen (2:1 payout): 12 numbers aligned to 1st, 2nd, or 3rd 12 (click on the 1st, 2nd, or 3rd 12)",
  "-Red/Black (1:1 payout): Self explanatory, no? (click on red or black box)",
  "-High/Low (1:1 payout): Pick one half to bet on (click on 1-18 or 19-36)",
  "-Even/Odd (1:1 payout): Same vibe as red/black but even/odd instead (click on even or odd box)",
];

// Tutorial helper functions
export const showRouletteTutorial = () => {
  return {
    title: "European Roulette - How to Play",
    content: rouletteTutorial,
    odds: rouletteOdds,
  };
};

export const getBetTypeExplanation = (betType, betValue) => {
  switch (betType) {
    case "number":
      return `Number ${betValue}`;
    case "red":
      return "Red numbers";
    case "black":
      return "Black numbers";
    case "odd":
      return "Odd numbers";
    case "even":
      return "Even numbers";
    case "low":
      return "Low (1-18)";
    case "high":
      return "High (19-36)";
    case "dozen":
      const dozenRanges = ["1-12", "13-24", "25-36"];
      return `Dozen ${betValue + 1} (${dozenRanges[betValue]})`;
    case "column":
      return `Column ${betValue + 1}`;
    default:
      return "Unknown bet";
  }
};
