#!/bin/bash

# Mines Game Debug Test Script
# This script helps test and debug the mines game functionality

echo "🎮 Mines Game Debug Test"
echo "========================"

# Set the mines game canister ID
MINES_CANISTER="bw4dl-smaaa-aaaaa-qaacq-cai"

echo "📊 Testing basic canister connectivity..."

# Test whoAmI function
echo "🔍 Checking whoAmI..."
dfx canister call mines-game whoAmI

# Test active game count
echo "🔍 Checking active game count..."
dfx canister call mines-game getActiveGameCount

# Test debug active games
echo "🔍 Checking debug active games..."
dfx canister call mines-game debugActiveGames

# Test game stats
echo "🔍 Checking game stats..."
dfx canister call mines-game getGameStats

# Test if game is active
echo "🔍 Checking if game is active..."
dfx canister call mines-game isGameActive

# Test bet limits
echo "🔍 Checking bet limits..."
dfx canister call mines-game getBetLimits

echo ""
echo "🎮 If you want to clear an active game, run:"
echo "dfx canister call mines-game clearActiveGame"
echo ""
echo "🎮 If you want to force end a game, run:"
echo "dfx canister call mines-game forceEndGame"
echo ""
echo "🎮 If you want to check your active game, run:"
echo "dfx canister call mines-game getMyActiveGame"
echo ""
echo "Debug test complete! ✅"
