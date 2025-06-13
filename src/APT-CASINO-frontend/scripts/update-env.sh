#!/bin/bash
# filepath: /Users/aditya/APT-CASINO/src/APT-CASINO-frontend/scripts/update-env.sh

# Get the current dfx replica port
DFX_PORT=$(dfx info replica-port)

# Create or update the development environment file
cat > .env.development << EOL
# Development environment variables
DFX_NETWORK=local
DFX_PORT=$DFX_PORT
EOL

echo "Updated .env.development with DFX_PORT=$DFX_PORT"
