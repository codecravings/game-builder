import pygame
import pymunk
import math
import json
import asyncio
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
from config import *

class GameType(Enum):
    PLATFORMER = "platformer"
    RACING = "racing"
    FLAPPY = "flappy"
    SHOOTER = "shooter"
    TETRIS = "tetris"

@dataclass
class GameState:
    score: int = 0
    health: int = 100
    time: float = 0.0
    level: int = 0
    lives: int = 3
    game_over: bool = False
    win: bool = False

class GameObject:
    def __init__(self, name: str, x: float, y: float, width: float, height: float):
        self.name = name
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.velocity_x = 0.0
        self.velocity_y = 0.0
        self.color = (255, 255, 255)
        self.sprite_path: Optional[str] = None
        self.sprite: Optional[pygame.Surface] = None
        self.active = True
        
    def update(self, dt: float):
        """Update object physics and state"""
        self.x += self.velocity_x * dt
        self.y += self.velocity_y * dt
    
    def render(self, screen: pygame.Surface, camera_offset: Tuple[float, float] = (0, 0)):
        """Render object to screen"""
        render_x = self.x - camera_offset[0]
        render_y = self.y - camera_offset[1]
        
        if self.sprite:
            screen.blit(self.sprite, (render_x, render_y))
        else:
            pygame.draw.rect(screen, self.color, 
                           (render_x, render_y, self.width, self.height))

class Player(GameObject):
    def __init__(self, name: str, x: float, y: float, width: float, height: float):
        super().__init__(name, x, y, width, height)
        self.on_ground = False
        self.jump_force = JUMP_FORCE
        self.move_speed = MOVE_SPEED
        self.health = 100
        self.can_jump = True
        
    def jump(self):
        if self.on_ground and self.can_jump:
            self.velocity_y = self.jump_force
            self.on_ground = False
    
    def move_left(self, dt: float):
        self.velocity_x = -self.move_speed
    
    def move_right(self, dt: float):
        self.velocity_x = self.move_speed
    
    def stop_horizontal(self):
        self.velocity_x = 0

class Enemy(GameObject):
    def __init__(self, name: str, x: float, y: float, width: float, height: float):
        super().__init__(name, x, y, width, height)
        self.speed = 50
        self.direction = 1
        self.patrol_range = 100
        self.start_x = x
        
    def update(self, dt: float):
        # Simple patrol AI
        if self.x >= self.start_x + self.patrol_range:
            self.direction = -1
        elif self.x <= self.start_x:
            self.direction = 1
            
        self.velocity_x = self.speed * self.direction
        super().update(dt)

class Collectible(GameObject):
    def __init__(self, name: str, x: float, y: float, width: float, height: float, points: int = 10):
        super().__init__(name, x, y, width, height)
        self.points = points
        self.collected = False
        
    def collect(self) -> int:
        if not self.collected:
            self.collected = True
            self.active = False
            return self.points
        return 0

class Platform(GameObject):
    def __init__(self, name: str, x: float, y: float, width: float, height: float):
        super().__init__(name, x, y, width, height)
        self.solid = True

class PygameGameEngine:
    def __init__(self, width: int = GAME_WIDTH, height: int = GAME_HEIGHT):
        pygame.init()
        self.width = width
        self.height = height
        self.screen = pygame.Surface((width, height))
        self.clock = pygame.time.Clock()
        self.running = True
        self.dt = 0.0
        
        # Game state
        self.game_state = GameState()
        self.game_type = GameType.PLATFORMER
        self.game_data: Optional[Dict] = None
        
        # Game objects
        self.player: Optional[Player] = None
        self.enemies: List[Enemy] = []
        self.collectibles: List[Collectible] = []
        self.platforms: List[Platform] = []
        self.all_objects: List[GameObject] = []
        
        # Physics world (Pymunk)
        self.space = pymunk.Space()
        self.space.gravity = (0, GRAVITY)
        
        # Camera
        self.camera_x = 0.0
        self.camera_y = 0.0
        
        # Assets
        self.assets: Dict[str, pygame.Surface] = {}
        self.background: Optional[pygame.Surface] = None
        
        # Input state
        self.keys_pressed = set()
        
    async def initialize_game(self, game_data: Dict, assets: Dict[str, str]):
        """Initialize game from JSON data and asset paths"""
        self.game_data = game_data
        self.game_type = GameType(game_data.get('gameType', 'platformer'))
        
        print(f"🎮 Initializing {self.game_type.value} game: {game_data.get('title', 'Unknown')}")
        
        # Load assets
        await self._load_assets(assets)
        
        # Create game objects
        self._create_entities(game_data.get('entities', []))
        self._create_level_objects(game_data.get('levels', [{}])[0])
        
        # Initialize physics
        self._setup_physics()
        
        print(f"✅ Game initialized: {len(self.all_objects)} objects created")
        
    async def _load_assets(self, asset_paths: Dict[str, str]):
        """Load all game assets"""
        for asset_name, asset_path in asset_paths.items():
            try:
                if asset_name == 'background':
                    self.background = pygame.image.load(asset_path).convert()
                    self.background = pygame.transform.scale(self.background, (self.width, self.height))
                else:
                    surface = pygame.image.load(asset_path).convert_alpha()
                    self.assets[asset_name] = surface
                    print(f"📦 Loaded asset: {asset_name}")
            except Exception as e:
                print(f"⚠️  Failed to load asset {asset_name}: {e}")
    
    def _create_entities(self, entities: List[Dict]):
        """Create game entities from JSON data"""
        for entity_data in entities:
            name = entity_data.get('name', 'unnamed')
            entity_type = entity_data.get('type', 'object')
            x = float(entity_data.get('x', 0))
            y = float(entity_data.get('y', 0))
            width = float(entity_data.get('width', 32))
            height = float(entity_data.get('height', 32))
            
            if entity_type == 'player':
                self.player = Player(name, x, y, width, height)
                if name in self.assets:
                    self.player.sprite = pygame.transform.scale(self.assets[name], (int(width), int(height)))
                self.all_objects.append(self.player)
                
            elif 'enemy' in entity_type.lower() or 'enemy' in name.lower():
                enemy = Enemy(name, x, y, width, height)
                if name in self.assets:
                    enemy.sprite = pygame.transform.scale(self.assets[name], (int(width), int(height)))
                self.enemies.append(enemy)
                self.all_objects.append(enemy)
            
            # Color fallback
            color_str = entity_data.get('color', '#FFFFFF')
            if color_str.startswith('#'):
                color_str = color_str[1:]
                color = tuple(int(color_str[i:i+2], 16) for i in (0, 2, 4))
            else:
                color = (255, 255, 255)
            
            # Apply color to objects without sprites
            for obj in self.all_objects[-1:]:  # Last added object
                if not obj.sprite:
                    obj.color = color
    
    def _create_level_objects(self, level_data: Dict):
        """Create level objects (platforms, collectibles, etc.)"""
        # Create platforms
        for platform_data in level_data.get('platforms', []):
            x = float(platform_data.get('x', 0))
            y = float(platform_data.get('y', 0))
            width = float(platform_data.get('width', 100))
            height = float(platform_data.get('height', 20))
            
            platform = Platform(f"platform_{len(self.platforms)}", x, y, width, height)
            
            # Color
            color_str = platform_data.get('color', '#8B4513')
            if color_str.startswith('#'):
                color_str = color_str[1:]
                platform.color = tuple(int(color_str[i:i+2], 16) for i in (0, 2, 4))
            
            self.platforms.append(platform)
            self.all_objects.append(platform)
        
        # Create collectibles
        for collectible_data in level_data.get('collectibles', []):
            x = float(collectible_data.get('x', 0))
            y = float(collectible_data.get('y', 0))
            width = float(collectible_data.get('width', 20))
            height = float(collectible_data.get('height', 20))
            points = collectible_data.get('points', 10)
            
            collectible = Collectible(f"collectible_{len(self.collectibles)}", x, y, width, height, points)
            
            # Use collectible asset if available
            if 'collectible' in self.assets:
                collectible.sprite = pygame.transform.scale(self.assets['collectible'], (int(width), int(height)))
            else:
                collectible.color = (255, 215, 0)  # Gold color
            
            self.collectibles.append(collectible)
            self.all_objects.append(collectible)
    
    def _setup_physics(self):
        """Setup Pymunk physics bodies"""
        # Create physics bodies for platforms
        for platform in self.platforms:
            body = pymunk.Body(body_type=pymunk.Body.STATIC)
            shape = pymunk.Poly.create_box(body, (platform.width, platform.height))
            shape.friction = FRICTION
            body.position = platform.x + platform.width/2, platform.y + platform.height/2
            self.space.add(body, shape)
        
        # Create physics body for player
        if self.player:
            mass = 10
            moment = pymunk.moment_for_box(mass, (self.player.width, self.player.height))
            body = pymunk.Body(mass, moment)
            shape = pymunk.Poly.create_box(body, (self.player.width, self.player.height))
            shape.friction = FRICTION
            body.position = self.player.x + self.player.width/2, self.player.y + self.player.height/2
            self.space.add(body, shape)
            self.player.physics_body = body
            self.player.physics_shape = shape
    
    def handle_input(self, keys: set):
        """Handle input for game"""
        self.keys_pressed = keys
        
        if not self.player:
            return
            
        # Movement based on game type
        if self.game_type == GameType.PLATFORMER:
            if 'left' in keys or 'a' in keys:
                self.player.move_left(self.dt)
            elif 'right' in keys or 'd' in keys:
                self.player.move_right(self.dt)
            else:
                self.player.stop_horizontal()
            
            if 'up' in keys or 'w' in keys or 'space' in keys:
                self.player.jump()
                
        elif self.game_type == GameType.RACING:
            if 'up' in keys or 'w' in keys:
                self.player.velocity_y = -MOVE_SPEED
            elif 'down' in keys or 's' in keys:
                self.player.velocity_y = MOVE_SPEED
            else:
                self.player.velocity_y *= 0.9
                
            if 'left' in keys or 'a' in keys:
                self.player.velocity_x = -MOVE_SPEED
            elif 'right' in keys or 'd' in keys:
                self.player.velocity_x = MOVE_SPEED
            else:
                self.player.velocity_x *= 0.9
    
    def update(self, dt: float):
        """Update game state"""
        self.dt = dt
        self.game_state.time += dt
        
        # Update physics
        self.space.step(dt)
        
        # Sync player position with physics
        if self.player and hasattr(self.player, 'physics_body'):
            pos = self.player.physics_body.position
            self.player.x = pos.x - self.player.width/2
            self.player.y = pos.y - self.player.height/2
            
            # Check if on ground
            self.player.on_ground = abs(self.player.physics_body.velocity.y) < 10
        
        # Update all objects
        for obj in self.all_objects:
            if obj.active:
                obj.update(dt)
        
        # Update enemies
        for enemy in self.enemies:
            if enemy.active:
                enemy.update(dt)
        
        # Check collisions
        self._check_collisions()
        
        # Update camera
        self._update_camera()
        
        # Check win/lose conditions
        self._check_game_conditions()
    
    def _check_collisions(self):
        """Check game object collisions"""
        if not self.player:
            return
            
        player_rect = pygame.Rect(self.player.x, self.player.y, self.player.width, self.player.height)
        
        # Check collectible collisions
        for collectible in self.collectibles:
            if collectible.active:
                coll_rect = pygame.Rect(collectible.x, collectible.y, collectible.width, collectible.height)
                if player_rect.colliderect(coll_rect):
                    points = collectible.collect()
                    self.game_state.score += points
        
        # Check enemy collisions
        for enemy in self.enemies:
            if enemy.active:
                enemy_rect = pygame.Rect(enemy.x, enemy.y, enemy.width, enemy.height)
                if player_rect.colliderect(enemy_rect):
                    self.player.health -= 10
                    if self.player.health <= 0:
                        self.game_state.game_over = True
    
    def _update_camera(self):
        """Update camera to follow player"""
        if self.player:
            target_x = self.player.x - self.width // 2
            target_y = self.player.y - self.height // 2
            
            # Smooth camera movement
            self.camera_x += (target_x - self.camera_x) * 0.1
            self.camera_y += (target_y - self.camera_y) * 0.1
    
    def _check_game_conditions(self):
        """Check win/lose conditions"""
        # Win condition: collect all items
        if all(not c.active for c in self.collectibles) and len(self.collectibles) > 0:
            self.game_state.win = True
        
        # Lose condition: fall off the world
        if self.player and self.player.y > self.height + 200:
            self.game_state.game_over = True
    
    def render(self) -> pygame.Surface:
        """Render game frame"""
        # Clear screen
        self.screen.fill((135, 206, 235))  # Sky blue default
        
        # Draw background
        if self.background:
            self.screen.blit(self.background, (0, 0))
        
        # Draw all objects with camera offset
        camera_offset = (self.camera_x, self.camera_y)
        
        for obj in self.all_objects:
            if obj.active:
                obj.render(self.screen, camera_offset)
        
        # Draw UI
        self._render_ui()
        
        return self.screen
    
    def _render_ui(self):
        """Render game UI"""
        font = pygame.font.Font(None, 36)
        
        # Score
        score_text = font.render(f"Score: {self.game_state.score}", True, (255, 255, 255))
        self.screen.blit(score_text, (10, 10))
        
        # Health
        if self.player:
            health_text = font.render(f"Health: {self.player.health}", True, (255, 255, 255))
            self.screen.blit(health_text, (10, 50))
        
        # Time
        time_text = font.render(f"Time: {int(self.game_state.time)}", True, (255, 255, 255))
        self.screen.blit(time_text, (10, 90))
        
        # Game over / Win
        if self.game_state.game_over:
            game_over_text = font.render("GAME OVER", True, (255, 0, 0))
            text_rect = game_over_text.get_rect(center=(self.width//2, self.height//2))
            self.screen.blit(game_over_text, text_rect)
        elif self.game_state.win:
            win_text = font.render("YOU WIN!", True, (0, 255, 0))
            text_rect = win_text.get_rect(center=(self.width//2, self.height//2))
            self.screen.blit(win_text, text_rect)
    
    def get_game_state(self) -> Dict:
        """Get current game state as dict"""
        return {
            'score': self.game_state.score,
            'health': self.player.health if self.player else 100,
            'time': self.game_state.time,
            'level': self.game_state.level,
            'game_over': self.game_state.game_over,
            'win': self.game_state.win,
            'fps': self.clock.get_fps() if hasattr(self, 'clock') else 60
        }
    
    def reset_game(self):
        """Reset game to initial state"""
        self.game_state = GameState()
        if self.player:
            self.player.health = 100
            # Reset player position
            if hasattr(self.player, 'physics_body'):
                initial_pos = (100, 400)  # Default spawn
                self.player.physics_body.position = initial_pos
        
        # Reset collectibles
        for collectible in self.collectibles:
            collectible.active = True
            collectible.collected = False
    
    def quit(self):
        """Clean up and quit"""
        self.running = False
        pygame.quit()