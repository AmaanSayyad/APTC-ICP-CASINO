"use client";

import React, { useEffect, useState } from "react";
import { FaHistory } from "react-icons/fa";
import { getGameHistory } from "../../lib/gameLogic";

const GameHistory = ({ gameHistory }) => {
  const [remoteHistory, setRemoteHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayedHistory, setDisplayedHistory] = useState([]);

  useEffect(() => {
    // Fetch game history from the backend
    const fetchHistory = async () => {
      try {
        const history = await getGameHistory(20);
        setRemoteHistory(history);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching game history:", error);
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Combine local and remote history
  useEffect(() => {
    // Use only the backend history, since all game logic is handled by the backend
    setDisplayedHistory(remoteHistory);

    // Refresh history when local gameHistory prop changes (means a new game was played)
    const fetchLatestHistory = async () => {
      try {
        const history = await getGameHistory(20);
        setRemoteHistory(history);
        setDisplayedHistory(history);
      } catch (error) {
        console.error("Error fetching updated game history:", error);
      }
    };

    if (gameHistory.length > 0) {
      fetchLatestHistory();
    }
  }, [gameHistory, remoteHistory]);
  return (
    <div className="bg-gradient-to-b from-gray-900/70 to-gray-900/30 rounded-xl border border-gray-800 shadow-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center">
          <FaHistory className="mr-2 text-red-400" />
          <span className="bg-gradient-to-r from-red-300 to-amber-300 bg-clip-text text-transparent">
            Recent Spins
          </span>
        </h3>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          <p className="mt-2 text-gray-400">Loading game history...</p>
        </div>
      ) : displayedHistory.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-800">
                <th className="pb-2 text-left">Time</th>
                <th className="pb-2 text-right">Bet</th>
                <th className="pb-2 text-right">Multiplier</th>
                <th className="pb-2 text-right">Payout</th>
              </tr>
            </thead>
            <tbody>
              {displayedHistory.map((item) => (
                <tr key={item.id} className="border-b border-gray-800 text-sm">
                  <td className="py-3 text-left text-gray-300">{item.time}</td>
                  <td className="py-3 text-right text-gray-300">
                    {item.betAmount} APTC
                  </td>
                  <td
                    className={`py-3 text-right font-medium ${
                      parseFloat(item.multiplier) === 0 ||
                      parseFloat(item.multiplier) < 1
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {item.multiplier}
                  </td>
                  <td className="py-3 text-right text-gray-300">
                    {item.payout} APTC
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          No game history found. Start playing to record your spins!
        </div>
      )}
    </div>
  );
};

export default GameHistory;
