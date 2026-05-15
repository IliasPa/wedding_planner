#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1

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

npm install

npm run server &

npm start
