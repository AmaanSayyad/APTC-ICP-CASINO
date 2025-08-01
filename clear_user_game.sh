#!/bin/bash

# Clear the active game for the specific user
echo "🧹 Clearing active game for user..."

# Check who we are
echo "🔍 Current identity:"
dfx identity whoami

# Clear the active game
echo "🧹 Clearing active game..."
dfx canister call mines-game clearActiveGame

# Check the state after clearing
echo "📊 Checking state after clearing:"
dfx canister call mines-game getActiveGameCount

echo "✅ Done! You should now be able to start a new game."
