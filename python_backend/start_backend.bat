@echo off
echo 🐍 Starting AI Game Engine Python Backend...
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo 🚀 Starting FastAPI server on http://localhost:8001
echo 🎨 DALL-E requests limited to 5 per game
echo 📦 Asset caching enabled
echo.

python main.py

pause