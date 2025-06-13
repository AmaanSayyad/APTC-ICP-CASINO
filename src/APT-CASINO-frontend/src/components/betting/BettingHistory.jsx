import React, { useState } from "react";
import useAPTCToken from "../../hooks/useAPTCToken";

const BettingHistory = ({ gameType = null, maxItems = 10 }) => {
  const { gameHistory, formatTokenAmount, pendingBets } = useAPTCToken();
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter history by game type if specified
  const filteredHistory = gameType
    ? gameHistory.filter((bet) => bet.gameType === gameType)
    : gameHistory;

  const displayHistory = isExpanded
    ? filteredHistory.slice(0, maxItems)
    : filteredHistory.slice(0, 5);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getGameIcon = (gameType) => {
    const icons = {
      roulette: "🎰",
      mines: "💣",
      plinko: "🎯",
      dice: "🎲",
      poker: "🃏",
      blackjack: "🂡",
      slots: "🎰",
    };
    return icons[gameType] || "🎮";
  };

  if (gameHistory.length === 0 && pendingBets.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-center">
        <p className="text-gray-400">No betting history yet</p>
        <p className="text-gray-500 text-sm mt-1">Your bets will appear here</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-medium">
          {gameType ? `${gameType} History` : "Betting History"}
        </h3>
        {filteredHistory.length > 5 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-yellow-400 hover:text-yellow-300 text-sm"
          >
            {isExpanded ? "Show Less" : "Show More"}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {/* Pending Bets */}
        {pendingBets.map((bet) => (
          <div
            key={bet.id}
            className="flex items-center justify-between p-3 bg-gray-700 rounded-lg border-l-4 border-yellow-500"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getGameIcon(bet.gameType)}</span>
              <div>
                <div className="text-white text-sm font-medium">
                  {bet.gameType} • Pending
                </div>
                <div className="text-gray-400 text-xs">
                  {formatTime(bet.timestamp)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-yellow-400 font-medium">
                -{formatTokenAmount(bet.amount)} APTC
              </div>
              <div className="text-xs text-gray-400">
                <div className="animate-pulse flex items-center">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></div>
                  Processing...
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Completed Bets */}
        {displayHistory.map((bet) => (
          <div
            key={bet.id}
            className={`flex items-center justify-between p-3 bg-gray-700 rounded-lg border-l-4 ${
              bet.status === "won" ? "border-green-500" : "border-red-500"
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getGameIcon(bet.gameType)}</span>
              <div>
                <div className="text-white text-sm font-medium">
                  {bet.gameType} • {bet.status === "won" ? "Won" : "Lost"}
                  {bet.multiplier && bet.status === "won" && (
                    <span className="text-yellow-400 ml-1">
                      ({bet.multiplier}x)
                    </span>
                  )}
                </div>
                <div className="text-gray-400 text-xs">
                  {formatTime(bet.completedAt || bet.timestamp)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`font-medium ${
                  bet.status === "won" ? "text-green-400" : "text-red-400"
                }`}
              >
                {bet.status === "won"
                  ? `+${formatTokenAmount(bet.payout)} APTC`
                  : `-${formatTokenAmount(bet.amount)} APTC`}
              </div>
              <div className="text-gray-400 text-xs">
                Bet: {formatTokenAmount(bet.amount)} APTC
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      {gameHistory.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-white font-medium">{gameHistory.length}</div>
              <div className="text-gray-400 text-xs">Total Bets</div>
            </div>
            <div>
              <div className="text-green-400 font-medium">
                {gameHistory.filter((bet) => bet.status === "won").length}
              </div>
              <div className="text-gray-400 text-xs">Wins</div>
            </div>
            <div>
              <div className="text-yellow-400 font-medium">
                {gameHistory.length > 0
                  ? `${Math.round(
                      (gameHistory.filter((bet) => bet.status === "won")
                        .length /
                        gameHistory.length) *
                        100
                    )}%`
                  : "0%"}
              </div>
              <div className="text-gray-400 text-xs">Win Rate</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BettingHistory;
