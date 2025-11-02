#!/bin/bash

# Quick Start Script for Story 4.1 - AO Skill Publishing
# This script helps you complete the remaining configuration steps

set -e  # Exit on error

echo "============================================"
echo "Story 4.1 - Configuration Helper"
echo "============================================"
echo ""

# Check if SEED_PHRASE is set
if [ -z "$SEED_PHRASE" ]; then
    echo "⚠️  SEED_PHRASE environment variable is not set!"
    echo ""
    echo "Please set it first:"
    echo "  export SEED_PHRASE=\"your twelve word seed phrase here\""
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "✅ SEED_PHRASE is set"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Creating .env from template..."
    cp .env.example .env
    echo "✅ Created .env file"
fi

echo "✅ .env file exists"
echo ""

# Check if AO_REGISTRY_PROCESS_ID is set
source .env
if [ -z "$AO_REGISTRY_PROCESS_ID" ]; then
    echo "⚠️  AO_REGISTRY_PROCESS_ID is not set in .env"
    echo ""
    echo "Next steps:"
    echo "1. Deploy the AO Registry Process (see DEPLOYMENT_GUIDE.md Step 3)"
    echo "2. Copy the 43-character process ID"
    echo "3. Add it to .env file:"
    echo "   AO_REGISTRY_PROCESS_ID=<your-process-id>"
    echo ""
    echo "Would you like me to guide you through deployment? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo ""
        echo "📖 Opening deployment guide..."
        echo ""
        cat DEPLOYMENT_GUIDE.md | head -100
        echo ""
        echo "See full guide in: DEPLOYMENT_GUIDE.md"
    fi
    exit 0
fi

echo "✅ AO_REGISTRY_PROCESS_ID is configured: $AO_REGISTRY_PROCESS_ID"
echo ""

# Check if CLI is built
if [ ! -f "cli/dist/index.js" ]; then
    echo "⚠️  CLI not built. Building now..."
    npm run build
    echo "✅ CLI built successfully"
fi

echo "✅ CLI is built and ready"
echo ""

echo "============================================"
echo "✅ All configuration checks passed!"
echo "============================================"
echo ""
echo "You're ready to publish the skill!"
echo ""
echo "Run these commands:"
echo ""
echo "  # Publish the ao skill"
echo "  node cli/dist/index.js publish skills/ao"
echo ""
echo "  # Install and test"
echo "  node cli/dist/index.js install ao"
echo ""
echo "============================================"
