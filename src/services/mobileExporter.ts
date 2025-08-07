interface GameData {
  title: string
  description: string
  gameType: string
  assets?: any
  entities: any[]
  levels: any[]
  gameLogic: any
  touchControls?: any
  mobileFeatures?: any
}

export class MobileExporter {
  static async exportForMobile(gameData: GameData): Promise<string> {
    
    // Embed DALL-E assets as base64 data URLs
    let embeddedAssets = ''
    if (gameData.assets) {
      const allAssets = [
        ...(gameData.assets.sprites || []),
        ...(gameData.assets.backgrounds || [])
      ].filter(asset => asset.url && asset.url.startsWith('data:image/'))
      
      if (allAssets.length > 0) {
        embeddedAssets = `
        // Embedded DALL-E Assets
        const gameAssets = {
          ${allAssets.map(asset => `'${asset.name}': '${asset.url}'`).join(',\n          ')}
        };
        
        // Load assets into images
        const loadedImages = {};
        const loadAssets = async () => {
          const loadPromises = Object.entries(gameAssets).map(([name, url]) => {
            return new Promise((resolve, reject) => {
              const img = new Image();
              img.onload = () => {
                loadedImages[name] = img;
                console.log('Loaded asset:', name);
                resolve(img);
              };
              img.onerror = (e) => {
                console.warn('Failed to load asset:', name, e);
                resolve(null);
              };
              img.src = url;
            });
          });
          
          await Promise.all(loadPromises);
          console.log('All assets loaded:', Object.keys(loadedImages));
        };
        `
      }
    }
    
    const mobileGameCode = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>${gameData.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            touch-action: manipulation;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            overflow: hidden;
            user-select: none;
            -webkit-user-select: none;
            height: 100vh;
            width: 100vw;
        }
        
        #gameCanvas {
            display: block;
            background: #000;
            border: none;
            width: 100vw;
            height: 100vh;
            object-fit: contain;
        }
        
        .mobile-controls {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 20px;
            z-index: 1000;
        }
        
        .control-btn {
            width: 80px;
            height: 80px;
            border: none;
            border-radius: 50%;
            background: rgba(6, 182, 212, 0.8);
            color: white;
            font-size: 24px;
            font-weight: bold;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 20px rgba(6, 182, 212, 0.3);
            cursor: pointer;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            transition: all 0.2s ease;
        }
        
        .control-btn:active {
            transform: scale(0.95);
            background: rgba(6, 182, 212, 1);
        }
        
        .control-btn.left { background: rgba(244, 63, 94, 0.8); }
        .control-btn.right { background: rgba(34, 197, 94, 0.8); }
        .control-btn.action { background: rgba(168, 85, 247, 0.8); }
        
        .control-btn.left:active { background: rgba(244, 63, 94, 1); }
        .control-btn.right:active { background: rgba(34, 197, 94, 1); }
        .control-btn.action:active { background: rgba(168, 85, 247, 1); }
        
        .game-ui {
            position: fixed;
            top: 20px;
            left: 20px;
            right: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 1000;
            pointer-events: none;
        }
        
        .score, .lives {
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-weight: bold;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(6, 182, 212, 0.5);
        }
        
        .pause-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1001;
            width: 50px;
            height: 50px;
            border: none;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            font-size: 20px;
            cursor: pointer;
            backdrop-filter: blur(10px);
            pointer-events: all;
        }
        
        @media (max-width: 768px) {
            .control-btn {
                width: 60px;
                height: 60px;
                font-size: 18px;
            }
            
            .mobile-controls {
                bottom: 30px;
                gap: 15px;
            }
            
            .score, .lives {
                font-size: 14px;
                padding: 8px 16px;
            }
        }
        
        @media (orientation: landscape) {
            .mobile-controls {
                bottom: 10px;
            }
            
            .game-ui {
                top: 10px;
            }
            
            .pause-btn {
                top: 10px;
            }
        }
    </style>
</head>
<body>
    <canvas id="gameCanvas"></canvas>
    
    <div class="game-ui">
        <div class="score">Score: <span id="scoreValue">0</span></div>
        <div class="lives">Lives: <span id="livesValue">3</span></div>
    </div>
    
    <button class="pause-btn" id="pauseBtn">⏸️</button>
    
    <div class="mobile-controls">
        <button class="control-btn left" id="leftBtn">◀</button>
        <button class="control-btn action" id="actionBtn">${gameData.gameType === 'flappy' ? '🚀' : '⬆'}</button>
        <button class="control-btn right" id="rightBtn">▶</button>
    </div>

    <script>
        ${embeddedAssets}
        
        class MobileGame {
            constructor() {
                this.canvas = document.getElementById('gameCanvas');
                this.ctx = this.canvas.getContext('2d');
                this.gameData = ${JSON.stringify(gameData, null, 2)};
                
                this.score = 0;
                this.lives = 3;
                this.gameState = 'playing'; // playing, paused, gameover
                this.isPaused = false;
                this.assetsLoaded = false;
                
                // Initialize and load assets first
                this.initializeGame();
            }
            
            async initializeGame() {
                ${embeddedAssets ? `
                console.log('Loading game assets...');
                await loadAssets();
                this.assetsLoaded = true;
                console.log('Assets loaded, starting game');
                ` : 'this.assetsLoaded = true;'}
                
                this.setupCanvas();
                this.setupControls();
                this.setupGame();
                this.gameLoop();
                
                // Prevent scrolling on mobile
                document.body.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
                
                // Handle focus loss on mobile
                document.addEventListener('visibilitychange', () => {
                    if (document.hidden && this.gameData.mobileFeatures?.pauseOnFocusLoss) {
                        this.pauseGame();
                    }
                });
            }
            
            setupCanvas() {
                const resizeCanvas = () => {
                    this.canvas.width = window.innerWidth;
                    this.canvas.height = window.innerHeight;
                    
                    // Calculate game scaling for different screen sizes
                    const gameWidth = this.gameData.levels[0]?.width || 800;
                    const gameHeight = this.gameData.levels[0]?.height || 600;
                    
                    this.scaleX = this.canvas.width / gameWidth;
                    this.scaleY = this.canvas.height / gameHeight;
                    this.scale = Math.min(this.scaleX, this.scaleY);
                    
                    // Center the game
                    this.offsetX = (this.canvas.width - gameWidth * this.scale) / 2;
                    this.offsetY = (this.canvas.height - gameHeight * this.scale) / 2;
                };
                
                resizeCanvas();
                window.addEventListener('resize', resizeCanvas);
                window.addEventListener('orientationchange', () => {
                    setTimeout(resizeCanvas, 100);
                });
            }
            
            setupControls() {
                const leftBtn = document.getElementById('leftBtn');
                const rightBtn = document.getElementById('rightBtn');
                const actionBtn = document.getElementById('actionBtn');
                const pauseBtn = document.getElementById('pauseBtn');
                
                // Touch controls
                leftBtn.addEventListener('touchstart', () => this.handleInput('left', true));
                leftBtn.addEventListener('touchend', () => this.handleInput('left', false));
                
                rightBtn.addEventListener('touchstart', () => this.handleInput('right', true));
                rightBtn.addEventListener('touchend', () => this.handleInput('right', false));
                
                actionBtn.addEventListener('touchstart', () => this.handleInput('action', true));
                actionBtn.addEventListener('touchend', () => this.handleInput('action', false));
                
                pauseBtn.addEventListener('click', () => this.togglePause());
                
                // Keyboard controls for desktop testing
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.handleInput('left', true);
                    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.handleInput('right', true);
                    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') this.handleInput('action', true);
                });
                
                document.addEventListener('keyup', (e) => {
                    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.handleInput('left', false);
                    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.handleInput('right', false);
                    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') this.handleInput('action', false);
                });
                
                this.keys = {};
            }
            
            setupGame() {
                this.player = {
                    x: this.gameData.entities[0]?.x || 100,
                    y: this.gameData.entities[0]?.y || 300,
                    width: this.gameData.entities[0]?.width || 32,
                    height: this.gameData.entities[0]?.height || 32,
                    velX: 0,
                    velY: 0,
                    speed: 5,
                    jumpPower: 12,
                    grounded: false,
                    color: '#00BFFF'
                };
                
                this.level = this.gameData.levels[0] || {};
                this.platforms = this.level.platforms || [];
                this.enemies = this.level.enemies || [];
                this.collectibles = this.level.collectibles || [];
                this.goal = this.level.goal;
                
                this.gravity = 0.5;
                this.lastTime = 0;
            }
            
            handleInput(action, pressed) {
                if (this.isPaused) return;
                
                this.keys[action] = pressed;
                
                if (pressed) {
                    switch (action) {
                        case 'action':
                            if (this.gameData.gameType === 'flappy') {
                                this.player.velY = -this.player.jumpPower;
                            } else if (this.player.grounded) {
                                this.player.velY = -this.player.jumpPower;
                                this.player.grounded = false;
                            }
                            break;
                    }
                }
            }
            
            update(deltaTime) {
                if (this.isPaused) return;
                
                // Player movement
                if (this.keys.left) {
                    this.player.velX = -this.player.speed;
                } else if (this.keys.right) {
                    this.player.velX = this.player.speed;
                } else {
                    this.player.velX *= 0.8; // Friction
                }
                
                // Apply gravity
                this.player.velY += this.gravity;
                
                // Update position
                this.player.x += this.player.velX;
                this.player.y += this.player.velY;
                
                // Platform collision
                this.player.grounded = false;
                for (let platform of this.platforms) {
                    if (this.player.x < platform.x + platform.width &&
                        this.player.x + this.player.width > platform.x &&
                        this.player.y < platform.y + platform.height &&
                        this.player.y + this.player.height > platform.y) {
                        
                        if (this.player.velY > 0) { // Falling
                            this.player.y = platform.y - this.player.height;
                            this.player.velY = 0;
                            this.player.grounded = true;
                        }
                    }
                }
                
                // Screen boundaries
                if (this.player.x < 0) this.player.x = 0;
                if (this.player.x + this.player.width > this.level.width) {
                    this.player.x = this.level.width - this.player.width;
                }
                
                // Check if fell off screen
                if (this.player.y > this.level.height) {
                    this.lives--;
                    this.updateLives();
                    this.resetPlayer();
                    
                    if (this.lives <= 0) {
                        this.gameOver();
                    }
                }
                
                // Check goal collision
                if (this.goal && this.checkCollision(this.player, this.goal)) {
                    this.levelComplete();
                }
                
                // Update collectibles
                this.collectibles = this.collectibles.filter(collectible => {
                    if (this.checkCollision(this.player, collectible)) {
                        this.score += 10;
                        this.updateScore();
                        return false;
                    }
                    return true;
                });
            }
            
            render() {
                if (!this.assetsLoaded) {
                    // Show loading screen
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                    
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = '24px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('Loading Assets...', this.canvas.width / 2, this.canvas.height / 2);
                    return;
                }
                
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                
                this.ctx.save();
                this.ctx.translate(this.offsetX, this.offsetY);
                this.ctx.scale(this.scale, this.scale);
                
                // Draw background - prioritize DALL-E background
                ${embeddedAssets ? `
                const bgImage = loadedImages['background'];
                if (bgImage) {
                    this.ctx.drawImage(bgImage, 0, 0, this.level.width, this.level.height);
                } else {
                ` : ''}
                    const bgColor = this.level.background || '#87CEEB';
                    this.ctx.fillStyle = bgColor;
                    this.ctx.fillRect(0, 0, this.level.width, this.level.height);
                ${embeddedAssets ? '}' : ''}
                
                // Draw platforms
                this.ctx.fillStyle = '#8B4513';
                for (let platform of this.platforms) {
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                }
                
                // Draw collectibles
                this.ctx.fillStyle = '#FFD700';
                for (let collectible of this.collectibles) {
                    this.ctx.fillRect(collectible.x, collectible.y, collectible.width || 20, collectible.height || 20);
                }
                
                // Draw goal
                if (this.goal) {
                    this.ctx.fillStyle = '#32CD32';
                    this.ctx.fillRect(this.goal.x, this.goal.y, this.goal.width, this.goal.height);
                }
                
                // Draw player - prioritize DALL-E player sprite
                ${embeddedAssets ? `
                const playerEntityName = this.gameData.entities[0]?.name || 'player';
                const playerImage = loadedImages[playerEntityName] || loadedImages['player'];
                
                if (playerImage) {
                    // Handle rotation for racing games
                    if (this.gameData.gameType === 'racing' && this.player.angle !== undefined) {
                        this.ctx.save();
                        this.ctx.translate(this.player.x + this.player.width/2, this.player.y + this.player.height/2);
                        this.ctx.rotate(this.player.angle || 0);
                        this.ctx.drawImage(playerImage, -this.player.width/2, -this.player.height/2, this.player.width, this.player.height);
                        this.ctx.restore();
                    } else {
                        this.ctx.drawImage(playerImage, this.player.x, this.player.y, this.player.width, this.player.height);
                    }
                } else {
                ` : ''}
                    this.ctx.fillStyle = this.player.color;
                    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
                    
                    // Draw player eyes for character
                    this.ctx.fillStyle = 'white';
                    this.ctx.fillRect(this.player.x + 6, this.player.y + 6, 6, 6);
                    this.ctx.fillRect(this.player.x + 20, this.player.y + 6, 6, 6);
                    this.ctx.fillStyle = 'black';
                    this.ctx.fillRect(this.player.x + 8, this.player.y + 8, 2, 2);
                    this.ctx.fillRect(this.player.x + 22, this.player.y + 8, 2, 2);
                ${embeddedAssets ? '}' : ''}
                
                this.ctx.restore();
                
                // Draw pause overlay
                if (this.isPaused) {
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                    
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = '48px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
                }
            }
            
            checkCollision(rect1, rect2) {
                return rect1.x < rect2.x + rect2.width &&
                       rect1.x + rect1.width > rect2.x &&
                       rect1.y < rect2.y + rect2.height &&
                       rect1.y + rect1.height > rect2.y;
            }
            
            resetPlayer() {
                this.player.x = this.gameData.entities[0]?.x || 100;
                this.player.y = this.gameData.entities[0]?.y || 300;
                this.player.velX = 0;
                this.player.velY = 0;
            }
            
            togglePause() {
                this.isPaused = !this.isPaused;
                document.getElementById('pauseBtn').textContent = this.isPaused ? '▶️' : '⏸️';
            }
            
            pauseGame() {
                this.isPaused = true;
                document.getElementById('pauseBtn').textContent = '▶️';
            }
            
            updateScore() {
                document.getElementById('scoreValue').textContent = this.score;
            }
            
            updateLives() {
                document.getElementById('livesValue').textContent = this.lives;
            }
            
            levelComplete() {
                alert('Level Complete! 🎉');
                this.score += 100;
                this.updateScore();
                this.resetPlayer();
            }
            
            gameOver() {
                this.gameState = 'gameover';
                alert('Game Over! Final Score: ' + this.score);
                // Could implement restart functionality here
                this.lives = 3;
                this.score = 0;
                this.updateScore();
                this.updateLives();
                this.resetPlayer();
            }
            
            gameLoop(currentTime = 0) {
                const deltaTime = currentTime - this.lastTime;
                this.lastTime = currentTime;
                
                this.update(deltaTime);
                this.render();
                
                requestAnimationFrame((time) => this.gameLoop(time));
            }
        }
        
        // Start the game when page loads
        window.addEventListener('load', () => {
            new MobileGame();
        });
        
        // Prevent context menu on mobile
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    </script>
</body>
</html>`;
    
    return mobileGameCode;
  }
  
  static downloadGame(gameCode: string, fileName: string) {
    const blob = new Blob([gameCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.html') ? fileName : `${fileName}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
  
  static async generateAndDownload(gameData: GameData) {
    try {
      const mobileGameCode = await this.exportForMobile(gameData);
      const fileName = `${gameData.title.replace(/[^a-zA-Z0-9]/g, '_')}_mobile_game`;
      this.downloadGame(mobileGameCode, fileName);
      
      return {
        success: true,
        message: 'Mobile game exported successfully! Upload to any web server or run locally.',
        fileName: fileName + '.html'
      };
    } catch (error) {
      console.error('Export failed:', error);
      return {
        success: false,
        message: 'Export failed: ' + error.message
      };
    }
  }
}