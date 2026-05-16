#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1

# Add common Node.js locations to PATH (Homebrew on Apple Silicon and Intel)
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# Source nvm if available (handles nvm-based Node installations)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

if ! command -v node >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    echo "Node not found. Installing via Homebrew..."
    brew install node
    if ! command -v node >/dev/null 2>&1; then
      echo "Node installation failed. Please install Node manually."
      exit 1
    fi
  else
    echo "Node is not installed and Homebrew not found. Please install Node manually."
    exit 1
  fi
fi

# Kill any leftover server from a previous session so the correct data folder is always used
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 0.5

npm install

npm run server &
SERVER_PID=$!

# Give the server a moment to bind before Electron connects
sleep 1

npm start

# Clean up the server when Electron exits
kill "$SERVER_PID" 2>/dev/null
