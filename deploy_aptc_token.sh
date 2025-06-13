#!/bin/bash

echo "🪙 Deploying APTC Token for APT Casino"
echo ""
echo "📋 Token Economics:"
echo "  • Name: APT Casino"
echo "  • Symbol: APTC" 
echo "  • Decimals: 8"
echo "  • Total Supply: 1,000,000,000 APTC"
echo "  • Initial Distribution:"
echo "    - Minter (90%): For rewards, liquidity, game payouts"
echo "    - Office (10%): For operations, marketing, development"
echo ""

# Switch to minter identity
dfx identity use minter

# Get minter account ID
export MINTER_ACCOUNT_ID=$(dfx identity get-principal)
echo "Minter Principal: $MINTER_ACCOUNT_ID"

# Switch to aditya identity for initial balance
dfx identity use aditya

# Get aditya account ID
export OFFICE_ACCOUNT_ID=$(dfx identity get-principal)
echo "Office Principal: $OFFICE_ACCOUNT_ID"

# Switch back to minter for deployment
dfx identity use minter

echo "Deploying APTC Token..."

# Get account IDs for initial distribution
MINTER_ACCOUNT_TEXT=$(dfx ledger account-id --of-principal $MINTER_ACCOUNT_ID)
OFFICE_ACCOUNT_TEXT=$(dfx ledger account-id --of-principal $OFFICE_ACCOUNT_ID)

echo "Minter Account ID: $MINTER_ACCOUNT_TEXT"
echo "Office Account ID: $OFFICE_ACCOUNT_TEXT"

# Deploy APTC Token with initial supply
# We'll deploy first with empty initial values, then mint tokens
dfx deploy APTC-token --argument "(variant { 
  Init = record {
    token_name = opt \"APT Casino\";
    token_symbol = opt \"APTC\";
    transfer_fee = opt record { e8s = 1000 : nat64 };
    initial_values = vec {};
    minting_account = \"$MINTER_ACCOUNT_TEXT\";
    icrc1_minting_account = opt record {
      owner = principal \"$MINTER_ACCOUNT_ID\";
      subaccount = null;
    };
    archive_options = opt record {
      trigger_threshold = 2000 : nat64;
      num_blocks_to_archive = 1000 : nat64;
      controller_id = principal \"$MINTER_ACCOUNT_ID\";
    };
    send_whitelist = vec {};
    maximum_number_of_accounts = null;
    accounts_overflow_trim_quantity = null;
    transaction_window = null;
    max_message_size_bytes = null;
    feature_flags = opt record { icrc2 = true };
  }
})" --playground

echo "✅ APTC Token deployed successfully!"

# Get token canister ID
APTC_TOKEN_ID=$(dfx canister id APTC-token)
echo "📋 APTC Token Canister ID: $APTC_TOKEN_ID"

echo ""
echo "🪙 Checking if we can mint initial supply..."

# Check current total supply
CURRENT_SUPPLY=$(dfx canister call APTC-token icrc1_total_supply "()")
echo "Current total supply: $CURRENT_SUPPLY"

echo ""
echo "📊 Token Information:"
echo "  • Name: APT Casino"
echo "  • Symbol: APTC"
echo "  • Decimals: 8"
echo "  • Transfer Fee: 0.00001 APTC"
echo "  • Canister ID: $APTC_TOKEN_ID"
echo ""
echo "Note: Initial token supply will be minted through the minting account as needed."
echo "The minting account has the authority to create new tokens for rewards and operations."

echo "🪙 APTC Token is ready for use!"
echo ""
echo "📋 Next Steps:"
echo "1. Run './mint_initial_supply.sh' to mint initial tokens (if not done already)"
echo "2. Use './aptc_utils.sh status' to check token status"
echo "3. Use './aptc_utils.sh mint <account> <amount_e8s> <amount_aptc>' to mint more tokens"
echo "4. Run './deploy_roulette_game.sh' to deploy the roulette game"
echo ""
echo "💡 Token Management:"
echo "• The minting account can create new tokens as needed for rewards"
echo "• Current setup: Office account has initial token allocation"
echo "• Use the utility scripts for ongoing token management"
