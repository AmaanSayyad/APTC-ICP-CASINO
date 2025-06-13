export const manualFormConfig = {
  fields: [
    {
      id: "betAmount",
      label: "Bet Amount (APTC)",
      type: "singleSelect",
      options: [10, 25, 50, 100, 250, 500, 1000],
      defaultValue: 50,
      placeholder: "Select bet amount",
    },
    {
      id: "mines",
      label: "Number of Mines",
      type: "singleSelect",
      options: Array.from({ length: 24 }, (_, i) => i + 1),
      defaultValue: 5,
      placeholder: "Select mines count",
    }
  ],
  submitButton: "START GAME",
};

export const autoFormConfig = {
  submitButton: "START AUTO BETTING",
  fields: [
    {
      id: "betAmount",
      label: "Bet Amount (APTC)",
      type: "singleSelect",
      options: [10, 25, 50, 100, 250, 500, 1000],
      defaultValue: 50,
      placeholder: "Select bet amount",
    },
    {
      id: "mines",
      label: "Number of Mines",
      type: "singleSelect",
      options: Array.from({ length: 24 }, (_, i) => i + 1),
      defaultValue: 5,
      placeholder: "Select mines count",
    },
    {
      id: "tilesToReveal",
      label: "Tiles to Reveal",
      type: "singleSelect",
      options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      defaultValue: 5,
      placeholder: "Tiles revealed per game",
    },
    {
      id: "numberOfBets",
      label: "Number of Rounds",
      type: "number",
      defaultValue: 10,
      placeholder: "Total rounds to play",
    },
    {
      id: "onWin",
      label: "On Win Action",
      type: "singleSelect",
      options: ["Reset", "+10%", "+25%", "+50%", "+100%", "-10%", "-25%"],
      defaultValue: "Reset",
      placeholder: "Strategy after winning",
    },
    {
      id: "onLoss",
      label: "On Loss Action",
      type: "singleSelect",
      options: ["Reset", "+10%", "+25%", "+50%", "+100%", "-10%", "-25%"],
      defaultValue: "+50%",
      placeholder: "Strategy after losing",
    },
    {
      id: "stopOnProfit",
      label: "Stop on Profit (APTC)",
      type: "text",
      defaultValue: "500",
      placeholder: "Auto-stop at this profit",
    },
    {
      id: "stopOnLoss",
      label: "Stop on Loss (APTC)",
      type: "text",
      defaultValue: "500",
      placeholder: "Auto-stop at this loss",
    },
    {
      id: "aiAssist",
      label: "Use AI Assistant",
      type: "boolean", 
      defaultValue: false,
      placeholder: "Enable AI assistance",
    }
  ],
};
