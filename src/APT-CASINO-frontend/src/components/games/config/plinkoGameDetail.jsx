export const gameData = {
  label: "Game Description",
  title: "Plinko",
  image: "/images/games/plinko.png",
  description:
    "Watch balls bounce through pegs and land in multiplier slots for big wins!",
  youtube: "https://www.youtube.com/embed/3m55hkPzuLQ?si=abc123example",
  paragraphs: [
    "Drop balls from the top and watch them bounce through a maze of pegs, creating unpredictable paths that lead to different multiplier slots at the bottom. The suspense builds with every bounce as your ball careens toward its final destination.",
    "Choose your risk level to adjust the multiplier distribution - low risk offers more consistent wins, while high risk provides the chance for massive payouts. With each ball drop offering a unique journey, Plinko combines physics-based gameplay with thrilling casino action.",
    "Our provably fair Plinko game uses advanced physics simulation to ensure every bounce is authentic and random. Whether you're playing manually or using auto-drop mode, each game offers the perfect blend of strategy and chance for an exciting crypto gaming experience.",
  ],
};

export const bettingTableData = {
  title: "Plinko Multipliers",
  description:
    "Choose your risk level and see the potential multipliers for each slot. Higher risk means bigger potential wins but lower hit frequency.",
  table: [
    {
      risk: "Low",
      multipliers: [
        "1.5x",
        "1.2x",
        "1.1x",
        "1x",
        "0.5x",
        "1x",
        "1.1x",
        "1.2x",
        "1.5x",
      ],
    },
    {
      risk: "Medium",
      multipliers: [
        "3x",
        "1.5x",
        "1.2x",
        "0.7x",
        "0.2x",
        "0.7x",
        "1.2x",
        "1.5x",
        "3x",
      ],
    },
    {
      risk: "High",
      multipliers: [
        "26x",
        "8.2x",
        "2x",
        "0.4x",
        "0.2x",
        "0.4x",
        "2x",
        "8.2x",
        "26x",
      ],
    },
  ],
};

export const gameStatistics = {
  totalBets: "1,234,567",
  totalVolume: "8.9M APTC",
  avgBetSize: "125 APTC",
  maxWin: "650,000 APTC",
};
