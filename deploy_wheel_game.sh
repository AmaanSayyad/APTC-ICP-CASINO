#!/bin/bash

# Step 1: Compile and deploy the wheel-game canister
echo "Compiling and deploying wheel-game canister..."
dfx deploy wheel-game

# Step 2: Start the frontend development server
echo "Starting frontend development server..."
cd src/APT-CASINO-frontend
npm run start

# Note: In a separate terminal, you can test the wheel game by navigating to:
# http://localhost:5173/game/wheel
