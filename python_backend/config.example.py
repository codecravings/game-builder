import os

# API Configuration - Add your own API keys here
OPENAI_API_KEY = "your-openai-api-key-here"
DEEPSEEK_API_KEY = "your-deepseek-api-key-here"

# DALL-E Request Limits
MAX_DALLE_REQUESTS_PER_GAME = 5
DALLE_CACHE_HOURS = 24

# Game Engine Settings
GAME_WIDTH = 800
GAME_HEIGHT = 600
FPS = 60

# Asset Settings
ASSET_CACHE_DIR = "cached_assets"
SPRITE_SIZE = 32
BACKGROUND_SIZE = (800, 600)

# Server Settings
BACKEND_HOST = "localhost"
BACKEND_PORT = 8002
CORS_ORIGINS = ["http://localhost:3000", "http://localhost:5173"]

# Physics Settings
GRAVITY = 981  # pixels/second^2
FRICTION = 0.7
JUMP_FORCE = -500
MOVE_SPEED = 200

# Asset Priority (for DALL-E optimization)
PRIORITY_ASSETS = [
    "player",
    "background", 
    "primary_enemy",
    "collectible",
    "platform_texture"
]