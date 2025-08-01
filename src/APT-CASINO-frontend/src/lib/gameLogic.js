import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { idlFactory as wheelIdlFactory } from "../../../declarations/wheel-game/wheel-game.did.js";

// Configure local development or production
const isLocal = process.env.NODE_ENV !== "production";
const host = isLocal ? "http://localhost:4943" : "https://ic0.app";

// Create an agent for communicating with the IC
const createAgent = () => {
  const agent = new HttpAgent({ host });

  // When developing locally, we need to fetch the root key
  if (isLocal) {
    try {
      agent.fetchRootKey();
    } catch (err) {
      console.warn(
        "Unable to fetch root key. Check if your local replica is running"
      );
      console.error(err);
    }
  }

  return agent;
};

// Initialize actors
let wheelActor = null;

// Function to get wheel actor, creating it if it doesn't exist
const getWheelActor = async () => {
  if (!wheelActor) {
    try {
      const agent = createAgent();
      // Get canister ID from environment or config
      const wheelCanisterId =
        process.env.CANISTER_ID_WHEEL_GAME || "rrkah-fqaaa-aaaaa-aaaaq-cai"; // Replace with actual canister ID

      wheelActor = Actor.createActor(wheelIdlFactory, {
        agent,
        canisterId: wheelCanisterId,
      });
    } catch (error) {
      console.error("Failed to create wheel actor:", error);
      throw error;
    }
  }

  return wheelActor;
};

// Calculate the wheel spin result
export const calculateResult = async (risk, noOfSegments, betAmount = 10) => {
  try {
    const actor = await getWheelActor();

    // Call the Motoko backend to spin the wheel with the actual bet amount
    const response = await actor.spinWheel({
      betAmount,
      riskLevel: risk,
      segmentCount: noOfSegments,
    });

    // Process the response
    if ("Ok" in response) {
      const result = response.Ok;
      return {
        position: Number(result.result.position),
        multiplier: result.result.multiplier,
      };
    } else {
      console.error("Error from backend:", response.Err);
      throw new Error(`Backend error: ${response.Err}`);
    }
  } catch (error) {
    console.error("Error calling backend:", error);
    console.warn("Using fallback local calculation instead");
    // Use the fallback client-side calculation when the backend is not available
    return fallbackCalculateResult(risk, noOfSegments);
  }
}; // Fallback client-side calculation for when the backend call fails
const fallbackCalculateResult = (risk, noOfSegments) => {
  // Set multiplier range based on risk
  let minMultiplier, maxMultiplier;

  switch (risk) {
    case "low":
      minMultiplier = 0;
      maxMultiplier = 2.0;
      break;
    case "high":
      minMultiplier = 0;
      maxMultiplier = 10.0;
      break;
    case "medium":
    default:
      minMultiplier = 0;
      maxMultiplier = 3.0;
      break;
  }

  // Generate random position
  const position = Math.floor(Math.random() * noOfSegments);

  // Generate multiplier based on position and risk
  let multiplier;

  if (risk === "low") {
    // 10% chance of 0x, 70% chance of 0.5x-1.5x, 20% chance of 1.5x-2.0x
    if (position < noOfSegments * 0.1) {
      multiplier = 0;
    } else if (position < noOfSegments * 0.8) {
      multiplier = 0.5 + Math.random();
    } else {
      multiplier = 1.5 + Math.random() * 0.5;
    }
  } else if (risk === "high") {
    // 50% chance of 0x, 25% chance of 1.0x-3.0x, 25% chance of 3.0x-10.0x
    if (position < noOfSegments * 0.5) {
      multiplier = 0;
    } else if (position < noOfSegments * 0.75) {
      multiplier = 1.0 + Math.random() * 2.0;
    } else {
      multiplier = 3.0 + Math.random() * 7.0;
    }
  } else {
    // medium
    // 20% chance of 0x, 60% chance of 0.5x-2.0x, 20% chance of 2.0x-3.0x
    if (position < noOfSegments * 0.2) {
      multiplier = 0;
    } else if (position < noOfSegments * 0.8) {
      multiplier = 0.5 + Math.random() * 1.5;
    } else {
      multiplier = 2.0 + Math.random();
    }
  }

  // Round the multiplier to 2 decimal places
  multiplier = Math.round(multiplier * 100) / 100;

  return {
    position,
    multiplier,
  };
};

// Generate fallback wheel segments for the UI
const generateFallbackWheelSegments = (risk, noOfSegments) => {
  const segments = [];
  const colors = [
    "#FF5252",
    "#4CAF50",
    "#2196F3",
    "#FF9800",
    "#9C27B0",
    "#E91E63",
  ];

  for (let i = 0; i < noOfSegments; i++) {
    let multiplier;

    // Use similar logic to fallbackCalculateResult for consistency
    if (risk === "low") {
      if (i < noOfSegments * 0.1) {
        multiplier = 0;
      } else if (i < noOfSegments * 0.8) {
        multiplier = Math.round((0.5 + Math.random()) * 100) / 100;
      } else {
        multiplier = Math.round((1.5 + Math.random() * 0.5) * 100) / 100;
      }
    } else if (risk === "high") {
      if (i < noOfSegments * 0.5) {
        multiplier = 0;
      } else if (i < noOfSegments * 0.75) {
        multiplier = Math.round((1.0 + Math.random() * 2.0) * 100) / 100;
      } else {
        multiplier = Math.round((3.0 + Math.random() * 7.0) * 100) / 100;
      }
    } else {
      // medium
      if (i < noOfSegments * 0.2) {
        multiplier = 0;
      } else if (i < noOfSegments * 0.8) {
        multiplier = Math.round((0.5 + Math.random() * 1.5) * 100) / 100;
      } else {
        multiplier = Math.round((2.0 + Math.random()) * 100) / 100;
      }
    }

    // Assign color based on multiplier
    let color = colors[i % colors.length];
    if (multiplier === 0) {
      color = "#333333"; // Dark gray for 0x multiplier
    } else if (multiplier >= 3) {
      color = "#FFD700"; // Gold for high multipliers
    }

    segments.push({
      multiplier,
      color,
    });
  }

  return segments;
};

// Get wheel segments for the UI
export const getWheelSegments = async (risk, noOfSegments) => {
  try {
    const actor = await getWheelActor();
    const segments = await actor.getWheelSegments(risk, noOfSegments);
    return segments.map((segment) => ({
      multiplier: segment.multiplier,
      color: segment.color,
    }));
  } catch (error) {
    console.error("Error getting wheel segments:", error);
    console.warn("Using fallback wheel segments");
    // Generate fallback segments when backend is not available
    return generateFallbackWheelSegments(risk, noOfSegments);
  }
}; // Generate fallback game history data
const generateFallbackGameHistory = (count = 10) => {
  const history = [];
  const riskLevels = ["low", "medium", "high"];

  for (let i = 0; i < count; i++) {
    const risk = riskLevels[Math.floor(Math.random() * riskLevels.length)];
    const betAmount = Math.floor(Math.random() * 100) + 10;
    const multiplier = fallbackCalculateResult(risk, 10).multiplier;
    const payout = betAmount * multiplier;

    const timestamp = Date.now() - i * 60000; // Games spread out by a minute each

    history.push({
      id: i + 1,
      game: "Wheel",
      time: new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      betAmount: betAmount,
      multiplier: `${multiplier.toFixed(2)}x`,
      payout: payout,
      risk: risk,
    });
  }

  return history;
};

// Get game history
export const getGameHistory = async (count = 10) => {
  try {
    const actor = await getWheelActor();
    const history = await actor.getRecentGames(count);
    return history.map((game) => ({
      id: game.id,
      game: "Wheel",
      time: new Date(Number(game.timestamp) / 1000000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      betAmount: game.betAmount,
      multiplier: `${game.result.multiplier.toFixed(2)}x`,
      payout: game.payout,
      risk: game.riskLevel,
    }));
  } catch (error) {
    console.error("Error getting game history:", error);
    console.warn("Using fallback game history data");
    // Generate fallback history when backend is not available
    return generateFallbackGameHistory(count);
  }
};

// Get game statistics
export const getGameStats = async () => {
  try {
    const actor = await getWheelActor();
    return await actor.getGameStats();
  } catch (error) {
    console.error("Error getting game stats:", error);
    console.warn("Using fallback game stats");
    // Return demo statistics when backend is not available
    return {
      totalGames: 1856,
      totalVolumeBet: 234589,
      totalPayout: 212450,
      biggestWin: 5432,
      houseEdge: 0.05,
    };
  }
};
