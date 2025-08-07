#!/bin/bash

echo "🐍 Starting AI Game Engine Python Backend..."
echo

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing dependencies..."
pip install -r requirements.txt

echo
echo "🚀 Starting FastAPI server on http://localhost:8001"
echo "🎨 DALL-E requests limited to 5 per game"
echo "📦 Asset caching enabled"
echo

python main.py