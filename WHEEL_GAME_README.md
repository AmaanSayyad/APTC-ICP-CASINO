# Wheel Game Implementation for APT Casino

This repository contains the implementation of a Wheel Game for the APT Casino platform on the Internet Computer.

## Project Structure

- Backend: `/src/APT-CASINO-backend/wheel.mo`
- Frontend:
  - Main component: `/src/APT-CASINO-frontend/src/app/game/wheel/page.jsx`
  - Game wheel visualization: `/src/APT-CASINO-frontend/src/components/wheel/GameWheel.jsx`
  - Betting panel: `/src/APT-CASINO-frontend/src/components/wheel/BettingPanel.jsx`
  - Game history: `/src/APT-CASINO-frontend/src/components/wheel/GameHistory.jsx`
  - Game logic: `/src/APT-CASINO-frontend/src/lib/gameLogic.js`

## Features

- Motoko backend with complete game logic implementation
- React frontend components for wheel visualization and betting
- Backend-driven game mechanics for fairness and security
- Game history tracking
- Auto betting functionality
- Support for different bet types and amounts

## How to Deploy and Test

### Prerequisites

- Install the DFINITY Canister SDK (DFX)
- Node.js and npm

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

### Deploy the Wheel Game Canister

Run the deployment script:

```bash
./deploy_wheel_game.sh
```

This script will:

1. Compile and deploy the `wheel-game` canister
2. Start the frontend development server

### Manual Deployment Steps

If you prefer to run commands manually:

1. Deploy the wheel-game canister:

   ```
   dfx deploy wheel-game
   ```

2. Start the frontend development server:

   ```
   cd src/APT-CASINO-frontend
   npm run dev
   ```

3. Access the wheel game at:
   ```
   http://localhost:5173/game/wheel
   ```

## Architecture

The Wheel Game follows a strict backend-driven architecture where:

1. All game logic runs on the Motoko backend
2. The frontend only handles visualization and user interactions
3. Game results are determined by the canister's random number generator
4. Game history is stored on the backend for transparency and fairness

## Testing

To test the wheel game functionality:

1. Connect your wallet using the Connect Wallet button
2. Place a bet using the betting panel
3. Spin the wheel using the manual bet or auto bet functions
4. View your game history in the history panel
