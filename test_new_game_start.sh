#!/bin/bash

echo "Testing new game start after clearing active game..."
echo "======================================================="

# Check current game stats
echo "Current game stats:"
dfx canister call mines-game getGameStats

echo ""
echo "Attempting to start new game with 10 APTC bet and 5 mines..."

# Try to start a new game
dfx canister call mines-game startGame '(1_000_000_000 : nat, 5 : nat)' --identity minter

echo ""
echo "Game stats after attempt:"
dfx canister call mines-game getGameStats
