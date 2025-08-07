import os
import json
import hashlib
import time
from typing import Dict, List, Optional, Tuple
import requests
from PIL import Image
import base64
from io import BytesIO
from config import *

class AssetManager:
    def __init__(self):
        self.asset_cache: Dict[str, str] = {}
        self.dalle_request_count = 0
        self.cache_dir = ASSET_CACHE_DIR
        os.makedirs(self.cache_dir, exist_ok=True)
        self.load_cache()
    
    def load_cache(self):
        """Load cached assets from disk"""
        cache_file = os.path.join(self.cache_dir, "asset_cache.json")
        if os.path.exists(cache_file):
            with open(cache_file, 'r') as f:
                self.asset_cache = json.load(f)
    
    def save_cache(self):
        """Save asset cache to disk"""
        cache_file = os.path.join(self.cache_dir, "asset_cache.json")
        with open(cache_file, 'w') as f:
            json.dump(self.asset_cache, f)
    
    def get_cache_key(self, prompt: str, asset_type: str) -> str:
        """Generate unique cache key for asset"""
        content = f"{prompt}_{asset_type}_{SPRITE_SIZE}"
        return hashlib.md5(content.encode()).hexdigest()
    
    async def generate_game_assets(self, game_data: dict) -> Dict[str, str]:
        """
        Generate optimized assets for game with max 5 DALL-E requests
        Returns dict of asset_name -> file_path
        """
        print(f"Starting asset generation for game: {game_data.get('title', 'Unknown')}")
        
        assets = {}
        self.dalle_request_count = 0
        
        # Step 1: Identify priority assets
        priority_requests = self._identify_priority_assets(game_data)
        
        print(f"Priority assets identified: {len(priority_requests)}")
        
        # Step 2: Generate priority assets with DALL-E (max 5)
        for asset_info in priority_requests:
            if self.dalle_request_count >= MAX_DALLE_REQUESTS_PER_GAME:
                print(f"DALL-E limit reached ({MAX_DALLE_REQUESTS_PER_GAME}), using fallbacks")
                break
            
            asset_path = await self._generate_dalle_asset(asset_info)
            if asset_path:
                assets[asset_info['name']] = asset_path
                self.dalle_request_count += 1
        
        # Step 3: Generate fallback assets for remaining entities
        remaining_entities = self._get_remaining_entities(game_data, assets)
        for entity in remaining_entities:
            fallback_path = self._create_fallback_asset(entity)
            assets[entity['name']] = fallback_path
        
        print(f"Asset generation complete: {len(assets)} assets, {self.dalle_request_count} DALL-E requests used")
        return assets
    
    def _identify_priority_assets(self, game_data: dict) -> List[Dict]:
        """Identify the most important assets for DALL-E generation"""
        priority_requests = []
        
        # 1. Player character (highest priority)
        player_entity = None
        for entity in game_data.get('entities', []):
            if entity.get('type') == 'player':
                player_entity = entity
                break
        
        if player_entity:
            priority_requests.append({
                'name': player_entity['name'],
                'type': 'character',
                'prompt': self._create_player_prompt(player_entity, game_data),
                'size': (SPRITE_SIZE, SPRITE_SIZE)
            })
        
        # 2. Background (second priority)
        if game_data.get('levels') and len(game_data['levels']) > 0:
            level = game_data['levels'][0]
            priority_requests.append({
                'name': 'background',
                'type': 'background',
                'prompt': self._create_background_prompt(level, game_data),
                'size': BACKGROUND_SIZE
            })
        
        # 3. Primary enemy (third priority)
        enemies = [e for e in game_data.get('entities', []) if 'enemy' in e.get('name', '').lower()]
        if enemies:
            enemy = enemies[0]  # Take first enemy
            priority_requests.append({
                'name': enemy['name'],
                'type': 'character', 
                'prompt': self._create_enemy_prompt(enemy, game_data),
                'size': (SPRITE_SIZE, SPRITE_SIZE)
            })
        
        # 4. Collectible (fourth priority)
        collectibles = []
        for level in game_data.get('levels', []):
            collectibles.extend(level.get('collectibles', []))
        
        if collectibles:
            priority_requests.append({
                'name': 'collectible',
                'type': 'item',
                'prompt': self._create_collectible_prompt(collectibles[0], game_data),
                'size': (24, 24)
            })
        
        # 5. Platform texture (fifth priority)
        platforms = []
        for level in game_data.get('levels', []):
            platforms.extend(level.get('platforms', []))
        
        if platforms:
            priority_requests.append({
                'name': 'platform',
                'type': 'tile',
                'prompt': self._create_platform_prompt(platforms[0], game_data),
                'size': (64, 32)
            })
        
        return priority_requests[:MAX_DALLE_REQUESTS_PER_GAME]
    
    def _create_player_prompt(self, entity: dict, game_data: dict) -> str:
        theme = game_data.get('theme', 'fantasy')
        art_style = game_data.get('artStyle', 'pixel')
        game_type = game_data.get('gameType', 'platformer')
        
        base_prompt = f"{art_style} art style, {theme} theme, mobile game sprite"
        
        if game_type == 'racing':
            return f"{base_prompt}, top-down racing car, sleek design, bright colors, Formula 1 style, detailed wheels, transparent background, 32x32 pixels"
        elif game_type == 'flappy':
            return f"{base_prompt}, cute flying bird character, colorful feathers, expressive eyes, wings spread, cartoon style, transparent background, 32x32 pixels" 
        elif game_type == 'shooter':
            return f"{base_prompt}, futuristic spaceship, detailed hull, engine thrusters, sci-fi design, metallic finish, transparent background, 32x32 pixels"
        else:
            return f"{base_prompt}, heroic character, detailed armor, determined expression, action pose, RPG quality, transparent background, 32x32 pixels"
    
    def _create_background_prompt(self, level: dict, game_data: dict) -> str:
        theme = game_data.get('theme', 'fantasy')
        art_style = game_data.get('artStyle', 'pixel')
        game_type = game_data.get('gameType', 'platformer')
        
        base_prompt = f"{art_style} art style, {theme} theme, mobile game background"
        
        if game_type == 'racing':
            return f"{base_prompt}, professional racing track, asphalt surface, white lane markings, grandstands, aerial view, detailed track, 800x600 resolution"
        elif game_type == 'flappy':
            return f"{base_prompt}, beautiful sky environment, fluffy clouds, gradient blue sky, distant mountains, parallax layers, bright atmosphere, 800x600 resolution"
        elif game_type == 'shooter':
            return f"{base_prompt}, deep space environment, star field, nebulae, cosmic dust, sci-fi atmosphere, 800x600 resolution"
        else:
            return f"{base_prompt}, detailed platformer environment, lush forest, rocky platforms, atmospheric lighting, adventure game quality, 800x600 resolution"
    
    def _create_enemy_prompt(self, entity: dict, game_data: dict) -> str:
        theme = game_data.get('theme', 'fantasy')
        art_style = game_data.get('artStyle', 'pixel')
        
        return f"{art_style} art style, {theme} theme, enemy creature, menacing appearance, detailed features, hostile design, video game quality, transparent background, 32x32 pixels"
    
    def _create_collectible_prompt(self, collectible: dict, game_data: dict) -> str:
        theme = game_data.get('theme', 'fantasy')
        art_style = game_data.get('artStyle', 'pixel')
        
        return f"{art_style} art style, {theme} theme, collectible item, shiny treasure, magical glow, valuable object, game pickup, transparent background, 24x24 pixels"
    
    def _create_platform_prompt(self, platform: dict, game_data: dict) -> str:
        theme = game_data.get('theme', 'fantasy')
        art_style = game_data.get('artStyle', 'pixel')
        
        return f"{art_style} art style, {theme} theme, platform texture, tileable surface, detailed texture, game environment, seamless tile, 64x32 pixels"
    
    async def _generate_dalle_asset(self, asset_info: Dict) -> Optional[str]:
        """Generate single asset using DALL-E 3"""
        cache_key = self.get_cache_key(asset_info['prompt'], asset_info['type'])
        
        # Check cache first
        if cache_key in self.asset_cache:
            cached_path = os.path.join(self.cache_dir, f"{cache_key}.png")
            if os.path.exists(cached_path):
                print(f"📦 Using cached asset: {asset_info['name']}")
                return cached_path
        
        try:
            print(f"🎨 Generating DALL-E asset: {asset_info['name']}")
            
            response = requests.post(
                "https://api.openai.com/v1/images/generations",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "dall-e-3",
                    "prompt": asset_info['prompt'],
                    "n": 1,
                    "size": "1024x1024",
                    "quality": "standard",
                    "response_format": "b64_json"
                },
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                b64_image = data['data'][0]['b64_json']
                
                # Decode and resize image
                image_data = base64.b64decode(b64_image)
                image = Image.open(BytesIO(image_data))
                
                # Resize to target size
                image = image.resize(asset_info['size'], Image.Resampling.LANCZOS)
                
                # Save to cache
                asset_path = os.path.join(self.cache_dir, f"{cache_key}.png")
                image.save(asset_path, "PNG")
                
                # Update cache
                self.asset_cache[cache_key] = asset_path
                self.save_cache()
                
                print(f"✅ Generated: {asset_info['name']}")
                return asset_path
            else:
                print(f"❌ DALL-E request failed for {asset_info['name']}: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Error generating {asset_info['name']}: {str(e)}")
            return None
    
    def _get_remaining_entities(self, game_data: dict, generated_assets: Dict[str, str]) -> List[Dict]:
        """Get entities that still need assets"""
        remaining = []
        
        for entity in game_data.get('entities', []):
            if entity['name'] not in generated_assets:
                remaining.append(entity)
        
        return remaining
    
    def _create_fallback_asset(self, entity: dict) -> str:
        """Create simple colored rectangle fallback for entity"""
        cache_key = f"fallback_{entity['name']}_{entity.get('color', '#4A90E2')}"
        asset_path = os.path.join(self.cache_dir, f"{cache_key}.png")
        
        if not os.path.exists(asset_path):
            # Create simple colored rectangle
            color = entity.get('color', '#4A90E2')
            # Convert hex to RGB
            if color.startswith('#'):
                color = color[1:]
                rgb = tuple(int(color[i:i+2], 16) for i in (0, 2, 4))
            else:
                rgb = (74, 144, 226)  # Default blue
            
            # Create image
            image = Image.new('RGBA', (SPRITE_SIZE, SPRITE_SIZE), (*rgb, 255))
            
            # Add simple border
            from PIL import ImageDraw
            draw = ImageDraw.Draw(image)
            draw.rectangle([0, 0, SPRITE_SIZE-1, SPRITE_SIZE-1], outline=(255, 255, 255, 255), width=1)
            
            image.save(asset_path, "PNG")
            print(f"🎨 Created fallback asset: {entity['name']}")
        
        return asset_path

# Global instance
asset_manager = AssetManager()