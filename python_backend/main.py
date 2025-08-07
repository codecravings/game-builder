from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import pygame
import asyncio
import json
import base64
import io
import os
import time
from typing import Dict, List, Optional
import uvicorn

from config import *
from game_engine import PygameGameEngine
from asset_manager import asset_manager

# Initialize FastAPI app
app = FastAPI(title="AI Game Engine Backend", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global game engine instance
game_engine: Optional[PygameGameEngine] = None
game_running = False

# Pydantic models
class GameData(BaseModel):
    title: str
    gameType: str
    theme: str = "fantasy"
    artStyle: str = "pixel"
    entities: List[Dict]
    levels: List[Dict]
    mobileOptimized: bool = True

class GameInput(BaseModel):
    keys: List[str]
    timestamp: float

class GameStateResponse(BaseModel):
    score: int
    health: int
    time: float
    level: int
    game_over: bool
    win: bool
    fps: float

@app.on_event("startup")
async def startup_event():
    """Initialize pygame and game systems"""
    pygame.init()
    pygame.display.set_mode((1, 1))  # Minimal display for headless operation
    print("AI Game Engine Backend Started")
    print(f"Server running on {BACKEND_HOST}:{BACKEND_PORT}")

@app.on_event("shutdown") 
async def shutdown_event():
    """Clean up resources"""
    global game_engine
    if game_engine:
        game_engine.quit()
    pygame.quit()
    print("Backend shutdown complete")

@app.get("/")
async def root():
    return {"message": "AI Game Engine Backend", "status": "running"}

@app.post("/api/game/initialize")
async def initialize_game(game_data: GameData):
    """Initialize a new game with optimized DALL-E assets"""
    global game_engine, game_running
    
    try:
        print(f"🎮 Initializing game: {game_data.title}")
        
        # Generate optimized assets (max 5 DALL-E requests)
        print("🎨 Starting asset generation...")
        assets = await asset_manager.generate_game_assets(game_data.dict())
        
        # Create new game engine instance
        game_engine = PygameGameEngine(GAME_WIDTH, GAME_HEIGHT)
        
        # Initialize game with data and assets
        await game_engine.initialize_game(game_data.dict(), assets)
        
        game_running = True
        
        print(f"✅ Game initialized: {game_data.title}")
        
        return {
            "success": True,
            "message": f"Game '{game_data.title}' initialized successfully",
            "assets_generated": len(assets),
            "dalle_requests_used": asset_manager.dalle_request_count,
            "game_type": game_data.gameType
        }
        
    except Exception as e:
        print(f"❌ Game initialization failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Game initialization failed: {str(e)}")

@app.post("/api/game/input")
async def handle_game_input(input_data: GameInput):
    """Handle game input from frontend"""
    global game_engine
    
    if not game_engine:
        raise HTTPException(status_code=400, detail="No game initialized")
    
    try:
        # Convert key names to standardized format
        keys = set()
        for key in input_data.keys:
            if key.lower() in ['arrowleft', 'keya']:
                keys.add('left')
            elif key.lower() in ['arrowright', 'keyd']:
                keys.add('right')
            elif key.lower() in ['arrowup', 'keyw']:
                keys.add('up')
            elif key.lower() in ['arrowdown', 'keys']:
                keys.add('down')
            elif key.lower() in ['space']:
                keys.add('space')
            else:
                keys.add(key.lower())
        
        # Handle input in game engine
        game_engine.handle_input(keys)
        
        return {"success": True, "keys_processed": list(keys)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Input handling failed: {str(e)}")

@app.get("/api/game/state")
async def get_game_state() -> GameStateResponse:
    """Get current game state"""
    global game_engine
    
    if not game_engine:
        raise HTTPException(status_code=400, detail="No game initialized")
    
    try:
        state = game_engine.get_game_state()
        return GameStateResponse(**state)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get game state: {str(e)}")

@app.get("/api/game/frame")
async def get_game_frame():
    """Get current game frame as PNG image"""
    global game_engine
    
    if not game_engine:
        raise HTTPException(status_code=400, detail="No game initialized")
    
    try:
        # Update game (simulate one frame)
        game_engine.update(1.0 / FPS)
        
        # Render frame
        surface = game_engine.render()
        
        # Convert pygame surface to PNG bytes
        img_str = pygame.image.tostring(surface, 'RGB')
        img_array = pygame.surfarray.array3d(surface)
        img_array = img_array.swapaxes(0, 1)
        
        # Create PIL image and convert to bytes
        from PIL import Image
        pil_image = Image.fromarray(img_array)
        
        # Save to bytes buffer
        img_buffer = io.BytesIO()
        pil_image.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        return StreamingResponse(img_buffer, media_type="image/png")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Frame generation failed: {str(e)}")

@app.get("/api/game/frame/base64")
async def get_game_frame_base64():
    """Get current game frame as base64 encoded image"""
    global game_engine
    
    if not game_engine:
        raise HTTPException(status_code=400, detail="No game initialized")
    
    try:
        # Update game
        game_engine.update(1.0 / FPS)
        
        # Render frame
        surface = game_engine.render()
        
        # Convert to base64
        img_str = pygame.image.tostring(surface, 'RGB')
        img_array = pygame.surfarray.array3d(surface)
        img_array = img_array.swapaxes(0, 1)
        
        from PIL import Image
        pil_image = Image.fromarray(img_array)
        
        img_buffer = io.BytesIO()
        pil_image.save(img_buffer, format='PNG')
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        
        return {
            "success": True,
            "frame": f"data:image/png;base64,{img_base64}",
            "game_state": game_engine.get_game_state()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Frame generation failed: {str(e)}")

@app.post("/api/game/reset")
async def reset_game():
    """Reset current game to initial state"""
    global game_engine
    
    if not game_engine:
        raise HTTPException(status_code=400, detail="No game initialized")
    
    try:
        game_engine.reset_game()
        return {"success": True, "message": "Game reset successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Game reset failed: {str(e)}")

@app.get("/api/assets/cache/info")
async def get_asset_cache_info():
    """Get information about cached assets"""
    try:
        cache_size = len(asset_manager.asset_cache)
        return {
            "cached_assets": cache_size,
            "cache_directory": asset_manager.cache_dir,
            "dalle_requests_made": asset_manager.dalle_request_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get cache info: {str(e)}")

@app.delete("/api/assets/cache/clear")
async def clear_asset_cache():
    """Clear all cached assets"""
    try:
        import os
        import shutil
        
        # Clear in-memory cache
        asset_manager.asset_cache.clear()
        
        # Clear disk cache
        if os.path.exists(asset_manager.cache_dir):
            shutil.rmtree(asset_manager.cache_dir)
            os.makedirs(asset_manager.cache_dir, exist_ok=True)
        
        # Reset DALL-E counter
        asset_manager.dalle_request_count = 0
        
        return {"success": True, "message": "Asset cache cleared"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")

@app.post("/api/game/improve")
async def improve_game_with_ai(request_data: dict):
    """Improve game based on user feedback using DeepSeek"""
    try:
        game = request_data.get('game', {})
        improvement = request_data.get('improvement', {})
        
        improvement_type = improvement.get('type', 'general')
        description = improvement.get('description', '')
        target_element = improvement.get('targetElement', 'all')
        
        print(f"AI Improvement Request: {improvement_type} - {description}")
        
        # Create improvement prompt for DeepSeek
        improvement_prompt = f"""
Improve this game based on user feedback:

CURRENT GAME:
{json.dumps(game, indent=2)}

USER REQUEST:
Type: {improvement_type}
Description: {description}
Target: {target_element}

INSTRUCTIONS:
1. Analyze the user's request carefully
2. Modify the game JSON to implement their changes
3. If they want color changes, update entity colors and level backgrounds
4. If they want gameplay changes, modify physics, movement, or mechanics
5. If they want asset changes, update entity names or add new ones
6. Keep the same overall structure but improve based on feedback
7. Return ONLY the improved game JSON, no explanation

IMPROVED GAME JSON:
"""

        # Send to DeepSeek for improvement
        import requests
        response = requests.post(
            "https://api.deepseek.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "deepseek-chat",
                "messages": [{"role": "user", "content": improvement_prompt}],
                "max_tokens": 3000,
                "temperature": 0.7
            }
        )
        
        if response.ok:
            data = response.json()
            improved_content = data['choices'][0]['message']['content']
            
            # Parse the improved game JSON with better error handling
            import re
            print(f"🔍 DeepSeek response: {improved_content[:500]}...")
            
            # Try multiple JSON extraction methods
            json_patterns = [
                r'\{[\s\S]*\}',  # Original pattern
                r'```json\s*(\{[\s\S]*?\})\s*```',  # JSON in code blocks
                r'```\s*(\{[\s\S]*?\})\s*```',  # Generic code blocks
            ]
            
            improved_game = None
            for pattern in json_patterns:
                json_match = re.search(pattern, improved_content, re.MULTILINE | re.DOTALL)
                if json_match:
                    try:
                        json_str = json_match.group(1) if json_match.lastindex else json_match.group(0)
                        # Clean up common JSON issues
                        json_str = json_str.strip()
                        json_str = re.sub(r',\s*}', '}', json_str)  # Remove trailing commas
                        json_str = re.sub(r',\s*]', ']', json_str)  # Remove trailing commas in arrays
                        
                        improved_game = json.loads(json_str)
                        print(f"✅ Game improved successfully: {improved_game.get('title', 'Unknown')}")
                        break
                    except json.JSONDecodeError as e:
                        print(f"⚠️ JSON parse failed with pattern {pattern}: {str(e)}")
                        continue
            
            if improved_game:
                return improved_game
            else:
                # Fallback: return original game with basic improvements
                print("⚠️ Falling back to basic improvements")
                fallback_game = game.copy()
                
                if improvement_type == 'color':
                    # Apply basic color improvements
                    if 'entities' in fallback_game:
                        for entity in fallback_game['entities']:
                            if entity.get('type') == 'player':
                                entity['color'] = '#00FFFF'
                            elif 'enemy' in entity.get('name', '').lower():
                                entity['color'] = '#FF4444'
                            elif 'star' in entity.get('name', '').lower():
                                entity['color'] = '#FFD700'
                    
                    if 'levels' in fallback_game and fallback_game['levels']:
                        fallback_game['levels'][0]['background'] = '#1a1a2e'
                
                return fallback_game
        else:
            raise Exception(f"DeepSeek API failed: {response.status_code}")
            
    except Exception as e:
        print(f"Game improvement failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Game improvement failed: {str(e)}")

@app.post("/api/game/save")
async def save_game(request_data: dict):
    """Save game with assets to backend storage"""
    try:
        save_data = request_data.get('save_data', {})
        game_data = request_data.get('game_data', {})
        
        save_id = save_data.get('id', str(int(time.time() * 1000)))
        
        # Create saves directory
        saves_dir = os.path.join(os.getcwd(), "saved_games")
        os.makedirs(saves_dir, exist_ok=True)
        
        # Save game data
        game_file = os.path.join(saves_dir, f"game_{save_id}.json")
        with open(game_file, 'w') as f:
            json.dump(game_data, f, indent=2)
        
        # Save metadata
        metadata_file = os.path.join(saves_dir, f"meta_{save_id}.json")
        with open(metadata_file, 'w') as f:
            json.dump(save_data, f, indent=2)
        
        print(f"Game saved: {save_data.get('title', 'Unknown')} (ID: {save_id})")
        
        return {
            "success": True,
            "message": "Game saved successfully",
            "save_id": save_id,
            "dalle_requests_used": asset_manager.dalle_request_count
        }
        
    except Exception as e:
        print(f"Save failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Save failed: {str(e)}")

@app.get("/api/game/load/{save_id}")
async def load_game(save_id: str):
    """Load saved game with assets"""
    try:
        saves_dir = os.path.join(os.getcwd(), "saved_games")
        game_file = os.path.join(saves_dir, f"game_{save_id}.json")
        
        if not os.path.exists(game_file):
            raise HTTPException(status_code=404, detail="Saved game not found")
        
        with open(game_file, 'r') as f:
            game_data = json.load(f)
        
        print(f"Game loaded: {game_data.get('title', 'Unknown')} (ID: {save_id})")
        return game_data
        
    except Exception as e:
        print(f"Load failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Load failed: {str(e)}")

@app.get("/api/game/saves")
async def list_saved_games():
    """List all saved games"""
    try:
        saves_dir = os.path.join(os.getcwd(), "saved_games")
        if not os.path.exists(saves_dir):
            return []
        
        saved_games = []
        for filename in os.listdir(saves_dir):
            if filename.startswith("meta_") and filename.endswith(".json"):
                try:
                    with open(os.path.join(saves_dir, filename), 'r') as f:
                        metadata = json.load(f)
                        saved_games.append(metadata)
                except Exception as e:
                    print(f"Failed to load metadata {filename}: {e}")
        
        # Sort by timestamp (newest first)
        saved_games.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        return saved_games
        
    except Exception as e:
        print(f"Failed to list saves: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list saves: {str(e)}")

@app.delete("/api/game/save/{save_id}")
async def delete_saved_game(save_id: str):
    """Delete a saved game"""
    try:
        saves_dir = os.path.join(os.getcwd(), "saved_games")
        game_file = os.path.join(saves_dir, f"game_{save_id}.json")
        meta_file = os.path.join(saves_dir, f"meta_{save_id}.json")
        
        deleted_files = 0
        if os.path.exists(game_file):
            os.remove(game_file)
            deleted_files += 1
        if os.path.exists(meta_file):
            os.remove(meta_file)
            deleted_files += 1
        
        return {
            "success": True,
            "message": f"Deleted {deleted_files} files for save {save_id}"
        }
        
    except Exception as e:
        print(f"Delete failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

# WebSocket endpoint for real-time game streaming
@app.websocket("/ws/game")
async def websocket_game_stream(websocket: WebSocket):
    """WebSocket endpoint for real-time game streaming"""
    await websocket.accept()
    global game_engine
    
    if not game_engine:
        await websocket.send_json({"error": "No game initialized"})
        return
    
    try:
        while game_running:
            # Update game
            game_engine.update(1.0 / FPS)
            
            # Get frame as base64
            surface = game_engine.render()
            img_array = pygame.surfarray.array3d(surface)
            img_array = img_array.swapaxes(0, 1)
            
            from PIL import Image
            pil_image = Image.fromarray(img_array)
            
            img_buffer = io.BytesIO()
            pil_image.save(img_buffer, format='PNG')
            img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
            
            # Send frame and game state
            await websocket.send_json({
                "frame": f"data:image/png;base64,{img_base64}",
                "game_state": game_engine.get_game_state(),
                "timestamp": asyncio.get_event_loop().time()
            })
            
            # Control frame rate
            await asyncio.sleep(1.0 / FPS)
            
    except WebSocketDisconnect:
        print("🔌 WebSocket client disconnected")
    except Exception as e:
        print(f"❌ WebSocket error: {str(e)}")
        await websocket.send_json({"error": str(e)})

if __name__ == "__main__":
    print("Starting AI Game Engine Backend...")
    print(f"Server will run on http://{BACKEND_HOST}:{BACKEND_PORT}")
    print(f"DALL-E requests limited to {MAX_DALLE_REQUESTS_PER_GAME} per game")
    print(f"Asset cache directory: {ASSET_CACHE_DIR}")
    
    uvicorn.run(
        "main:app",
        host=BACKEND_HOST,
        port=BACKEND_PORT,
        reload=True,
        log_level="info"
    )