#!/bin/bash

echo "==============================================="
echo "🎮 Running Wheel Game in Demo Mode 🎮"
echo "==============================================="
echo "This script runs the frontend with fallback mock data,"
echo "allowing you to test the wheel game without deploying"
echo "the wheel-game canister."
echo ""
echo "For full functionality with backend integration:"
echo "1. Run './deploy_wheel_game.sh' to deploy the canister"
echo "2. Update the canister ID in gameLogic.js if needed"
echo ""
echo "Starting frontend development server..."
cd src/APT-CASINO-frontend
npm run dev
