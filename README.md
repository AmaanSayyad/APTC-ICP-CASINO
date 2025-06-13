# APT-CASINO

A blockchain-based casino platform running on the Internet Computer Protocol (ICP) with multiple games including Roulette and Mines.

<!-- ![APT-CASINO](src/APT-CASINO-frontend/public/PowerPlay.png) -->

## Overview

APT-CASINO is a decentralized casino application built on the Internet Computer Protocol. It features multiple games including Roulette and Mines, with a custom APTC token for betting. The application consists of a backend written in Motoko and a frontend built with React.js.

## Features

- 🎮 Multiple casino games (Roulette, Mines)
- 💰 Custom APTC token for betting
- 🔐 Secure wallet integration
- 📱 Responsive design for desktop and mobile
- 🔄 Real-time updates for bets and game state

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16.x or higher)
- [npm](https://www.npmjs.com/) (v8.x or higher)
- [dfx](https://internetcomputer.org/docs/current/developer-tools/deploy/install-dfx) (Internet Computer SDK, v0.15.0 or higher)

## Installation

Follow these steps to set up the project locally:

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/APT-CASINO.git
cd APT-CASINO
```

### 2. Install dependencies

```bash
npm install
cd src/APT-CASINO-frontend
npm install
```

### 3. Start the local Internet Computer replica

```bash
dfx start --background
```

### 4. Deploy the canisters

```bash
dfx deploy
```

This will deploy both the backend canisters (roulette, mines) and the frontend canister.

### 5. Deploy the APTC token

```bash
./deploy_aptc_token.sh
```

### 6. Mint initial token supply

```bash
./mint_initial_supply.sh
```

## Running the Application

### Development Mode

To run the frontend in development mode with hot reloading:

```bash
cd src/APT-CASINO-frontend
npm run dev
```

Then open your browser and navigate to `http://localhost:5173`.

### Production Build

To build the frontend for production:

```bash
cd src/APT-CASINO-frontend
npm run build
```

## Project Structure

```
APT-CASINO/
├── deploy_aptc_token.sh         # Script to deploy the APTC token
├── dfx.json                     # DFX configuration file
├── mint_initial_supply.sh       # Script to mint initial token supply
├── package.json                 # Project dependencies
├── transfer-to-user.sh          # Script to transfer tokens to users
├── src/
│   ├── APT-CASINO-backend/      # Backend canister code (Motoko)
│   │   ├── mines.mo             # Mines game logic
│   │   ├── roulette.mo          # Roulette game logic
│   │   ├── types.mo             # Type definitions
│   │   └── utils.mo             # Utility functions
│   └── APT-CASINO-frontend/     # Frontend code (React)
│       ├── public/              # Static assets
│       └── src/                 # React source code
│           ├── app/             # Application components
│           │   ├── game/        # Game components
│           │   ├── profile/     # User profile components
│           │   └── bank/        # Banking/wallet components
│           ├── components/      # Reusable UI components
│           ├── contexts/        # React contexts
│           ├── hooks/           # Custom React hooks
│           └── utils/           # Utility functions
└── declarations/                # Generated type declarations
    ├── APT-CASINO-frontend/
    ├── APTC-token/
    ├── internet_identity/
    ├── mines-game/
    └── roulette-game/
```

## Playing the Games

### Roulette

1. Connect your wallet
2. Set your bet amount
3. Select a number, color, or betting section
4. Click to place your bet
5. Wait for the wheel to spin and see if you win!

### Mines

1. Connect your wallet
2. Set your bet amount and number of mines
3. Click on tiles to reveal them
4. Avoid mines and collect gems
5. Cash out to secure your winnings before hitting a mine

## Wallet Integration

The casino integrates with Internet Identity for authentication. Follow these steps to connect:

1. Click "Connect Wallet" in the application
2. Either sign in with an existing Internet Identity or create a new one
3. Approve the connection to give the application access to your identity
4. Once connected, you'll be able to see your APTC token balance and place bets

## Token Management

To get APTC tokens for testing:

```bash
./transfer-to-user.sh <principal-id> <amount>
```

## Troubleshooting

If you encounter issues:

1. Make sure you have the latest version of dfx installed
2. Check that the local replica is running with `dfx ping`
3. Clear your browser cache
4. Try redeploying the canisters with `dfx deploy --rebuild`

For wallet reset and debugging tools, see:

- `/public/wallet-reset-tool.html`
- `/public/debug-frontend-betting.html`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please open an issue on the GitHub repository.
