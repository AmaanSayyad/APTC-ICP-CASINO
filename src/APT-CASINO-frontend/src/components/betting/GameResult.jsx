import React, { useEffect, useState } from "react";
import useAPTCToken from "../../hooks/useAPTCToken";

const GameResult = ({
  isVisible,
  isWin,
  betAmount,
  winAmount,
  multiplier,
  message,
  onClose,
  autoCloseDelay = 3000,
}) => {
  const { formatTokenAmount } = useAPTCToken();
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isVisible && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoCloseDelay]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`transform transition-all duration-300 ${
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        <div
          className={`
          rounded-xl p-8 text-center max-w-md mx-4 border-2
          ${
            isWin
              ? "bg-gradient-to-br from-green-800 to-emerald-900 border-green-400"
              : "bg-gradient-to-br from-red-800 to-rose-900 border-red-400"
          }
        `}
        >
          {/* Result Icon */}
          <div className="mb-4">
            {isWin ? (
              <div className="text-6xl animate-bounce">🎉</div>
            ) : (
              <div className="text-6xl">😞</div>
            )}
          </div>

          {/* Result Title */}
          <h2
            className={`text-2xl font-bold mb-4 ${
              isWin ? "text-green-200" : "text-red-200"
            }`}
          >
            {isWin ? "You Won!" : "You Lost!"}
          </h2>

          {/* Bet Details */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Bet Amount:</span>
              <span className="text-white font-medium">
                {formatTokenAmount(betAmount)} APTC
              </span>
            </div>

            {isWin && winAmount && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Win Amount:</span>
                  <span className="text-green-400 font-medium">
                    +{formatTokenAmount(winAmount)} APTC
                  </span>
                </div>

                {multiplier && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Multiplier:</span>
                    <span className="text-yellow-400 font-medium">
                      {multiplier}x
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Custom Message */}
          {message && <p className="text-gray-200 mb-6 text-sm">{message}</p>}

          {/* Close Button */}
          <button
            onClick={handleClose}
            className={`
              px-6 py-2 rounded-lg font-medium transition-colors
              ${
                isWin
                  ? "bg-green-600 hover:bg-green-500 text-white"
                  : "bg-red-600 hover:bg-red-500 text-white"
              }
            `}
          >
            Continue Playing
          </button>

          {/* Auto-close indicator */}
          {autoCloseDelay > 0 && (
            <p className="text-gray-400 text-xs mt-4">
              Auto-closing in {Math.ceil(autoCloseDelay / 1000)} seconds
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameResult;
