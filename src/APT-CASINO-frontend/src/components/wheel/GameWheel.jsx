"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { getWheelSegments } from "../../lib/gameLogic";
import "../../styles/spinner.css";

const GameWheel = ({
  risk,
  isSpinning,
  noOfSegments,
  currentMultiplier,
  targetMultiplier,
  handleSelectMultiplier,
  wheelPosition,
  hasSpun,
}) => {
  const [segments, setSegments] = useState([]);
  const [rotation, setRotation] = useState(0);
  const [previousRotation, setPreviousRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const wheelRef = useRef(null);

  // Load segments from the Motoko backend
  useEffect(() => {
    const loadSegments = async () => {
      setIsLoading(true);
      try {
        const segmentsData = await getWheelSegments(risk, noOfSegments);
        setSegments(segmentsData);
      } catch (error) {
        console.error("Error loading wheel segments:", error);
        setSegments([]); // Set empty segments and let the UI handle the error state
      } finally {
        setIsLoading(false);
      }
    };

    loadSegments();
  }, [risk, noOfSegments]);

  // Handle wheel spinning animation
  useEffect(() => {
    if (isSpinning && wheelPosition !== undefined) {
      // Calculate the angle for each segment
      const segmentAngle = 360 / segments.length;

      // Calculate target position for the wheel
      const targetRotation =
        previousRotation + (1080 + wheelPosition * segmentAngle);

      // Set the new rotation
      setRotation(targetRotation);
      setPreviousRotation(targetRotation % 360);
    }
  }, [isSpinning, wheelPosition, segments]);

  // Generate wheel segments
  const renderWheelSegments = () => {
    if (!segments || segments.length === 0) {
      // Show loading/error state when segments aren't available
      return (
        <g>
          <circle cx="50" cy="50" r="40" fill="#333" stroke="#222" />
          <text
            x="50"
            y="50"
            textAnchor="middle"
            fill="white"
            fontSize="5"
            fontWeight="bold"
          >
            Loading segments...
          </text>
        </g>
      );
    }

    const segmentAngle = 360 / segments.length;

    return segments.map((segment, index) => {
      const startAngle = index * segmentAngle;
      const endAngle = (index + 1) * segmentAngle;

      // Generate SVG path for segment
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = 50 + 40 * Math.cos(startRad);
      const y1 = 50 + 40 * Math.sin(startRad);
      const x2 = 50 + 40 * Math.cos(endRad);
      const y2 = 50 + 40 * Math.sin(endRad);

      // Determine the large arc flag
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

      // Create the path for the segment
      const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      // Determine background color based on multiplier
      const color =
        segment.color ||
        (segment.multiplier === 0
          ? "red"
          : segment.multiplier < 1
          ? "orange"
          : segment.multiplier < 2
          ? "blue"
          : "green");

      return (
        <path
          key={index}
          d={pathData}
          fill={color}
          stroke="#222"
          strokeWidth="0.5"
          onClick={() => handleSelectMultiplier(segment.multiplier)}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <title>{`${segment.multiplier}x`}</title>
        </path>
      );
    });
  };

  return (
    <div className="relative w-full p-4 bg-gradient-to-b from-gray-900/70 to-gray-900/30 rounded-xl border border-gray-800 shadow-lg overflow-hidden">
      <div className="mb-4 text-center">
        <h3 className="text-xl font-bold bg-gradient-to-r from-red-300 to-amber-300 bg-clip-text text-transparent">
          Fortune Wheel
        </h3>
        <p className="text-gray-400 text-sm">
          {isLoading ? "Loading wheel..." : "Spin the wheel to test your luck!"}
        </p>
      </div>

      <div className="flex flex-col items-center">
        {/* Wheel container */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8">
          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <div className="loading-spinner"></div>
              <span className="ml-2 text-white">Loading segments...</span>
            </div>
          )}

          {/* Spinning wheel */}
          <motion.div
            ref={wheelRef}
            className="w-full h-full relative"
            animate={{ rotate: rotation }}
            transition={{
              duration: 3,
              ease: [0.2, 0.65, 0.3, 0.9],
              type: "spring",
              stiffness: 10,
              damping: 20,
            }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              className="drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]"
            >
              {/* Wheel segments */}
              {renderWheelSegments()}

              {/* Center circle */}
              <circle
                cx="50"
                cy="50"
                r="5"
                fill="#444"
                stroke="#666"
                strokeWidth="1"
              />
            </svg>
          </motion.div>

          {/* Pointer */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent border-t-red-500"></div>
          </div>

          {/* Result indicator */}
          {hasSpun && currentMultiplier !== null && (
            <motion.div
              className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 bg-black/80 rounded-lg px-6 py-4 border-2 ${
                currentMultiplier === 0
                  ? "border-red-500"
                  : currentMultiplier < 1
                  ? "border-orange-400"
                  : "border-green-400"
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 3.1, duration: 0.3, type: "spring" }}
            >
              <div className="text-center">
                <div className="text-sm text-gray-400">Result</div>
                <div
                  className={`text-3xl font-bold ${
                    currentMultiplier === 0
                      ? "text-red-500"
                      : currentMultiplier < 1
                      ? "text-orange-400"
                      : "text-green-400"
                  }`}
                >
                  {currentMultiplier}x
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Game status */}
        <div className="w-full text-center">
          {isSpinning ? (
            <div className="text-amber-300 animate-pulse">Spinning...</div>
          ) : (
            <div className="text-white">Place your bet and spin!</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameWheel;
