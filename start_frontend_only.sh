#!/bin/bash

# Start the frontend development server only
echo "Starting frontend development server..."
cd src/APT-CASINO-frontend
npm run dev

# Note: In a separate terminal, you can test the wheel game by navigating to:
# http://localhost:5173/game/wheel
