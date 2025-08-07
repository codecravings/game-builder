import { ParticleSystem } from './ParticleSystem'
import { AssetManager } from '../services/assetManager'

export interface Vector2 {
  x: number
  y: number
}

export interface Entity {
  id: string
  name: string
  type: string
  x: number
  y: number
  width: number
  height: number
  velocity?: Vector2
  physics?: {
    gravity?: boolean
    gravityForce?: number
    jumpForce?: number
    moveSpeed?: number
    airControl?: number
    wallSlideSpeed?: number
    wallJumpForce?: Vector2
    friction?: number
    bounce?: number
    mass?: number
    // Racing physics properties
    maxSpeed?: number
    acceleration?: number
    braking?: number
    turning?: number
    drift?: number
  }
  abilities?: {
    [key: string]: boolean
  }
  controls?: {
    [key: string]: string
  }
  health?: number
  maxHealth?: number
  sprite?: string
  color?: string
  emoji?: string
  emojiSize?: number
  renderMode?: 'color' | 'emoji' | 'sprite'
  glowEffect?: boolean
  visible?: boolean
  solid?: boolean
  animation?: {
    current: string
    frame: number
    timer: number
    speed: number
  }
  // Racing-specific properties
  currentSpeed?: number
  steeringAngle?: number
  facingAngle?: number
  [key: string]: any
}

export interface Platform {
  x: number
  y: number
  width: number
  height: number
  color?: string
  sprite?: string
  emoji?: string
  solid?: boolean
  type?: string
  movable?: boolean
  movement?: {
    speed: number
    direction: Vector2
    bounds?: { min: Vector2, max: Vector2 }
  }
}

export interface Collectible {
  id: string
  type: string
  x: number
  y: number
  width?: number
  height?: number
  points: number
  collected?: boolean
  floating?: boolean
  sprite?: string
  color?: string
  emoji?: string
  effect?: string
}

export interface Trap {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  damage: number
  active?: boolean
  sprite?: string
  color?: string
  direction?: string
  interval?: number
  timer?: number
}

export interface GameLevel {
  name: string
  width: number
  height: number
  background: string
  platforms: Platform[]
  collectibles?: Collectible[]
  traps?: Trap[]
  enemies?: Entity[]
  goal?: {
    x: number
    y: number
    width: number
    height: number
    sprite?: string
    color?: string
  }
  effects?: {
    weather?: string
    lighting?: string
    particles?: string[]
  }
}

export interface GameData {
  title: string
  description: string
  gameType: string
  visualStyle?: string
  theme?: string
  entities: Entity[]
  levels: GameLevel[]
  gameLogic?: {
    winCondition?: string
    loseCondition?: string
    scoring?: any
    specialMechanics?: any
  }
  assets?: {
    sprites?: any[]
    sounds?: any[]
    music?: string
  }
  [key: string]: any
}

export class EnhancedGameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  public gameData: GameData
  private currentLevel: number = 0
  private entities: Map<string, Entity> = new Map()
  private collectibles: Map<string, Collectible> = new Map()
  private traps: Map<string, Trap> = new Map()
  private keys: Set<string> = new Set()
  private camera = { x: 0, y: 0, zoom: 1 }
  private cameraMode: string = 'follow'
  private physicsMode: string = 'default'
  private score = 0
  private gameTime = 0
  private isRunning = false
  private lastTime = 0
  private animationFrameId: number | null = null
  private player: Entity | null = null
  private particles = new ParticleSystem()
  private assetManager: AssetManager
  private debugMode = false
  private allowDebugLogs = false // Master switch for all debug logs - DISABLED to prevent spam
  
  // Performance optimization
  private frameCount = 0
  private fps = 0
  private lastFPSUpdate = 0
  private viewportEntities: Entity[] = []
  private cullingEnabled = true
  private lastCullingUpdate = 0
  private cullingUpdateInterval = 100 // Update culling every 100ms
  
  // Responsive design
  private baseWidth = 800
  private baseHeight = 600
  private scale = 1
  private canvasContainer: HTMLElement | null = null

  constructor(canvas: HTMLCanvasElement, gameData: GameData) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.gameData = this.validateAndFixGameData(gameData)
    this.assetManager = AssetManager.getInstance()
    this.init()
  }

  private validateAndFixGameData(gameData: GameData): GameData {
    console.log('🔍 Validating game data...', gameData)
    
    // Ensure basic structure exists
    if (!gameData || typeof gameData !== 'object') {
      console.warn('⚠️ Invalid game data, creating fallback')
      return this.createFallbackGameData()
    }

    // Ensure levels array exists
    if (!gameData.levels || !Array.isArray(gameData.levels) || gameData.levels.length === 0) {
      console.warn('⚠️ No levels found, creating default level')
      gameData.levels = [this.createDefaultLevel(gameData)]
    }

    // Validate each level
    gameData.levels = gameData.levels.map((level, index) => {
      if (!level || typeof level !== 'object') {
        console.warn(`⚠️ Invalid level ${index}, creating default`)
        return this.createDefaultLevel(gameData)
      }
      
      // Ensure platforms is an array (can be empty for games like Tetris)
      if (!level.platforms) level.platforms = []
      if (!Array.isArray(level.platforms)) level.platforms = []
      
      // Ensure basic level properties
      level.width = level.width || 1600
      level.height = level.height || 800
      level.background = level.background || '#2D5C3D'
      level.name = level.name || `Level ${index + 1}`
      
      // Ensure arrays exist (can be empty)
      level.collectibles = level.collectibles || []
      level.traps = level.traps || []
      level.enemies = level.enemies || []
      
      return level
    })

    // Ensure entities array exists
    if (!gameData.entities || !Array.isArray(gameData.entities)) {
      console.warn('⚠️ No entities found, creating default player')
      gameData.entities = [this.createDefaultPlayer()]
    }

    // Ensure at least one entity exists
    if (gameData.entities.length === 0) {
      gameData.entities.push(this.createDefaultPlayer())
    }

    console.log('✅ Game data validated successfully')
    return gameData
  }

  private createFallbackGameData(): GameData {
    return {
      title: 'Fallback Game',
      description: 'A simple game created as fallback',
      gameType: 'platformer',
      entities: [this.createDefaultPlayer()],
      levels: [this.createDefaultLevel()]
    }
  }

  private createDefaultPlayer(): Entity {
    return {
      id: 'player',
      name: 'player',
      type: 'player',
      x: 100,
      y: 300,
      width: 32,
      height: 32,
      color: '#FF6B6B',
      emoji: '🎮',
      renderMode: 'emoji',
      velocity: { x: 0, y: 0 },
      physics: {
        gravity: true,
        gravityForce: 0.8,
        jumpForce: 15,
        moveSpeed: 6,
        airControl: 0.7,
        friction: 0.8
      },
      health: 3,
      maxHealth: 3,
      visible: true
    }
  }

  private createDefaultLevel(gameData?: any): GameLevel {
    const gameType = gameData?.gameType || 'platformer'
    
    // For puzzle games like Tetris, don't add platforms
    const platforms = gameType === 'puzzle' || gameType === 'tetris' ? [] : [
      { x: 0, y: 750, width: 1600, height: 50, color: '#8B4513' },
      { x: 300, y: 650, width: 200, height: 20, color: '#8B4513' }
    ]
    
    return {
      name: 'Level 1',
      width: 1600,
      height: 800,
      background: '#2D5C3D',
      platforms: platforms,
      collectibles: [],
      traps: [],
      enemies: []
    }
  }

  init() {
    this.setupCanvas()
    this.setupEntities()
    this.setupLevel()
    this.setupControls()
    this.setupResponsiveCanvas()
    
    // CRITICAL: Find and set player reference correctly
    this.player = null
    this.entities.forEach(entity => {
      if (entity.type === 'player') {
        this.player = entity
        console.log('🎯 Player found and set:', entity.id, entity.name)
      }
    })
    
    // CRITICAL DEBUG: Expose engine and inspect player
    if (typeof window !== 'undefined') {
      (window as any).gameEngine = this
      console.log('🔧 Game engine exposed globally as window.gameEngine')
    }
    
    // CRITICAL DEBUG: Check player racing properties
    if (this.player) {
      const gameTypeLower = (this.gameData.gameType || '').toLowerCase()
      const isRacingType = gameTypeLower.includes('racing') || gameTypeLower.includes('racer') || gameTypeLower.includes('car') || gameTypeLower.includes('speed')
      
      console.log('🏎️ PLAYER RACING DEBUG:', {
        gameType: this.gameData.gameType,
        isRacingType,
        hasRacingPhysics: !!(this.player.physics?.maxSpeed),
        physics: this.player.physics,
        racingProps: {
          currentSpeed: this.player.currentSpeed,
          steeringAngle: this.player.steeringAngle,
          facingAngle: this.player.facingAngle
        },
        emoji: this.player.emoji,
        renderMode: this.player.renderMode,
        position: { x: this.player.x, y: this.player.y }
      })
      
      // Auto-fix racing properties if missing
      if (isRacingType && !this.player.physics?.maxSpeed) {
        console.log('🔧 AUTO-FIXING missing racing properties...')
        this.player.physics = {
          ...this.player.physics,
          gravity: false,
          maxSpeed: 8,
          acceleration: 0.5,
          braking: 0.7,
          turning: 0.3,
          drift: 0.1
        }
        this.player.currentSpeed = 0
        this.player.steeringAngle = 0
        this.player.facingAngle = 0
        this.player.emoji = this.player.emoji || '🏎️'
        this.player.renderMode = 'emoji'
        console.log('✅ Racing properties auto-fixed!')
        console.log('🏎️ Fixed player:', this.player)
      }
    }
    
    // Load game assets
    this.loadGameAssets()
  }

  private async loadGameAssets() {
    try {
      await this.assetManager.preloadGameAssets(this.gameData)
      console.log('Game assets loaded successfully')
    } catch (error) {
      console.warn('Some assets failed to load:', error)
    }
  }

  setupCanvas() {
    // Larger canvas for space games
    if (this.gameData.gameType === 'shooter' || this.gameData.gameType === 'space') {
      this.baseWidth = 1200
      this.baseHeight = 800
    }
    
    this.updateCanvasSize()
    this.canvas.style.imageRendering = 'pixelated'
    
    // Set canvas background
    const level = this.gameData.levels[this.currentLevel]
    if (level && level.background) {
      this.canvas.style.background = level.background
    }
  }

  private updateCanvasSize() {
    // Get container element
    this.canvasContainer = this.canvas.parentElement
    
    if (this.canvasContainer) {
      const containerWidth = this.canvasContainer.clientWidth
      const containerHeight = this.canvasContainer.clientHeight
      
      // Calculate scale to fit container while maintaining aspect ratio
      const scaleX = containerWidth / this.baseWidth
      const scaleY = containerHeight / this.baseHeight
      this.scale = Math.min(scaleX, scaleY, 2) // Max scale of 2x
      
      // Set canvas display size
      this.canvas.style.width = `${this.baseWidth * this.scale}px`
      this.canvas.style.height = `${this.baseHeight * this.scale}px`
      
      // Set actual canvas resolution
      this.canvas.width = this.baseWidth
      this.canvas.height = this.baseHeight
      
      // Update camera if needed
      this.updateCamera()
    } else {
      // Fallback to default size
      this.canvas.width = this.baseWidth
      this.canvas.height = this.baseHeight
    }
  }

  private setupResponsiveCanvas() {
    // Handle window resize
    const resizeObserver = new ResizeObserver(() => {
      this.updateCanvasSize()
    })
    
    if (this.canvasContainer) {
      resizeObserver.observe(this.canvasContainer)
    }
    
    // Handle device orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.updateCanvasSize(), 100)
    })
  }

  setupEntities() {
    this.entities.clear()
    this.gameData.entities.forEach((entityData, index) => {
      const entity: Entity = {
        ...entityData,
        id: entityData.id || entityData.name || `entity_${index}`,
        velocity: entityData.velocity || { x: 0, y: 0 },
        visible: entityData.visible !== false,
        solid: entityData.solid !== false && (entityData.type === 'player' || entityData.type === 'enemy')
      }
      
      // Enhanced physics defaults
      if (!entity.physics) {
        entity.physics = {
          gravity: entity.type === 'player' || entity.type === 'enemy',
          gravityForce: 0.8,
          jumpForce: 15,
          moveSpeed: 5,
          friction: 0.8,
          airControl: 0.7,
          mass: 1
        }
      }

      // Enhanced entity properties
      if (!entity.color) {
        entity.color = this.getEntityColor(entity.type, this.gameData.theme)
      }

      // Animation setup
      if (!entity.animation) {
        entity.animation = {
          current: 'idle',
          frame: 0,
          timer: 0,
          speed: 0.1
        }
      }

      this.entities.set(entity.id, entity)
      
      // Set player reference immediately when we create a player entity
      if (entity.type === 'player') {
        this.player = entity
        console.log('🏎️ Player entity created:', entity.id)
      }
    })
  }

  private getEntityColor(type: string, theme?: string): string {
    const colorMap: { [key: string]: { [key: string]: string } } = {
      player: {
        fantasy: '#DEB887',
        cyberpunk: '#00FFFF',
        space: '#C0C0C0',
        default: '#FF6B6B'
      },
      enemy: {
        fantasy: '#8B0000',
        cyberpunk: '#FF4500',
        space: '#FF1493',
        default: '#FF4500'
      },
      default: {
        default: '#4ECDC4'
      }
    }
    
    return colorMap[type]?.[theme || 'default'] || colorMap[type]?.default || colorMap.default.default
  }

  setupLevel() {
    const level = this.gameData.levels[this.currentLevel]
    if (!level) return

    // Setup collectibles
    this.collectibles.clear()
    if (level.collectibles) {
      level.collectibles.forEach((collectible, index) => {
        this.collectibles.set(collectible.id || `collectible_${index}`, {
          ...collectible,
          id: collectible.id || `collectible_${index}`,
          collected: false,
          width: collectible.width || 24,
          height: collectible.height || 24,
          color: collectible.color || '#FFD700'
        })
      })
    }

    // Setup traps
    this.traps.clear()
    if (level.traps) {
      level.traps.forEach((trap, index) => {
        this.traps.set(trap.id || `trap_${index}`, {
          ...trap,
          id: trap.id || `trap_${index}`,
          active: true,
          color: trap.color || '#FF0000',
          timer: 0
        })
      })
    }

    // Setup moving platforms
    if (level.platforms) {
      level.platforms.forEach(platform => {
        if (platform.movable && platform.movement) {
          // Initialize movement state
          platform.movement.direction = platform.movement.direction || { x: 1, y: 0 }
        }
      })
    }
  }

  setupControls() {
    // Make canvas focusable for keyboard input
    this.canvas.tabIndex = 0
    this.canvas.focus()
    
    // Single consolidated keydown listener
    document.addEventListener('keydown', (e) => {
      // Debug toggle
      if (e.code === 'F3') {
        this.debugMode = !this.debugMode
        e.preventDefault()
        return
      }
      
      // Add key to set and log for racing debug (throttled)
      this.keys.add(e.code)
      if (this.allowDebugLogs) {
        console.log('🎮 KEY DOWN:', e.code, 'Total keys:', Array.from(this.keys))
      }
      
      // Prevent default for game controls only
      const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space']
      if (gameKeys.includes(e.code)) {
        e.preventDefault()
      }
    })
    
    document.addEventListener('keyup', (e) => {
      this.keys.delete(e.code)
      if (this.allowDebugLogs) {
        console.log('🎮 KEY UP:', e.code, 'Remaining keys:', Array.from(this.keys))
      }
      
      // Prevent default for game controls only
      const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space']
      if (gameKeys.includes(e.code)) {
        e.preventDefault()
      }
    })

    // Touch controls for mobile
    this.setupTouchControls()
  }

  private setupTouchControls() {
    let touchStart: { x: number, y: number } | null = null
    
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      touchStart = {
        x: touch.clientX,
        y: touch.clientY
      }
    })
    
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      if (!touchStart || !this.player) return
      
      const touch = e.touches[0]
      const deltaX = touch.clientX - touchStart.x
      const deltaY = touch.clientY - touchStart.y
      
      // Convert touch gestures to key presses
      this.keys.clear()
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal movement
        if (deltaX > 30) this.keys.add('ArrowRight')
        if (deltaX < -30) this.keys.add('ArrowLeft')
      } else {
        // Vertical movement
        if (deltaY < -30) this.keys.add('Space') // Jump
      }
    })
    
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault()
      touchStart = null
      this.keys.clear()
    })
  }

  start() {
    this.isRunning = true
    this.lastTime = performance.now()
    this.animationFrameId = requestAnimationFrame(this.gameLoop)
    console.log('🚀 Game loop started')
  }

  stop() {
    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
      console.log('🛑 Game loop stopped and animation frame cancelled')
    }
  }

  pause() {
    this.isRunning = !this.isRunning
    if (this.isRunning) {
      this.lastTime = performance.now()
      this.animationFrameId = requestAnimationFrame(this.gameLoop)
      console.log('▶️ Game resumed')
    } else {
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId)
        this.animationFrameId = null
      }
      console.log('⏸️ Game paused')
    }
  }

  gameLoop = (currentTime: number = performance.now()) => {
    if (!this.isRunning) return

    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.016) // Cap delta time
    this.lastTime = currentTime

    // DEBUG: Log game loop execution when keys are pressed (only in debug mode)
    if (this.debugMode && this.keys.size > 0 && this.frameCount % 300 === 0) {
      console.log('🎮 GAME LOOP EXECUTING with keys:', Array.from(this.keys), 'isRunning:', this.isRunning)
    }

    // Update FPS counter
    this.updateFPS(currentTime)

    this.update(deltaTime)
    this.render()

    if (this.isRunning) {
      this.animationFrameId = requestAnimationFrame(this.gameLoop)
    }
  }

  private updateFPS(currentTime: number) {
    this.frameCount++
    
    if (currentTime - this.lastFPSUpdate >= 1000) {
      this.fps = this.frameCount
      this.frameCount = 0
      this.lastFPSUpdate = currentTime
    }
  }

  update(deltaTime: number) {
    this.gameTime += deltaTime
    
    // DEBUG: Log when update is called and if we have keys pressed (only in debug mode)
    if (this.debugMode && this.keys.size > 0 && this.frameCount % 300 === 0) {
      console.log('🔄 UPDATE CALLED with keys:', Array.from(this.keys), 'entities:', this.entities.size)
    }
    
    // Update moving platforms
    this.updateMovingPlatforms(deltaTime)
    
    // Update traps
    this.updateTraps(deltaTime)
    
    // Update entities with viewport culling
    this.updateEntitiesOptimized(deltaTime)

    // Update camera to follow player
    if (this.player) {
      this.updateCamera()
    }

    // Check collisions
    this.checkCollisions()

    // Update collectibles
    this.updateCollectibles(deltaTime)

    // Update particles
    this.particles.update(deltaTime)

    // Check win/lose conditions
    this.checkGameState()
  }

  private updateEntitiesOptimized(deltaTime: number) {
    // Viewport culling - only update entities near the camera (optimized)
    if (this.cullingEnabled) {
      // Only recalculate culling periodically for performance
      const currentTime = performance.now()
      if (currentTime - this.lastCullingUpdate > this.cullingUpdateInterval) {
        this.viewportEntities = []
        const cullingMargin = 200
        
        this.entities.forEach(entity => {
          if (this.isEntityInViewport(entity, cullingMargin)) {
            this.viewportEntities.push(entity)
          }
        })
        
        this.lastCullingUpdate = currentTime
      }
      
      // Update only viewport entities
      this.viewportEntities.forEach(entity => {
        this.updateEntity(entity, deltaTime)
      })
    } else {
      // Update all entities (fallback)
      this.entities.forEach(entity => {
        this.updateEntity(entity, deltaTime)
      })
    }
  }

  private isEntityInViewport(entity: Entity, margin: number = 0): boolean {
    const left = this.camera.x - margin
    const right = this.camera.x + this.canvas.width + margin
    const top = this.camera.y - margin
    const bottom = this.camera.y + this.canvas.height + margin
    
    return !(entity.x + entity.width < left || 
             entity.x > right || 
             entity.y + entity.height < top || 
             entity.y > bottom)
  }

  private updateMovingPlatforms(deltaTime: number) {
    const level = this.gameData.levels[this.currentLevel]
    if (!level.platforms) return
    
    level.platforms.forEach(platform => {
      if (platform.movable && platform.movement) {
        const movement = platform.movement
        const speed = movement.speed * deltaTime * 60
        
        // Move platform
        platform.x += movement.direction.x * speed
        platform.y += movement.direction.y * speed
        
        // Check bounds and reverse direction if needed
        if (movement.bounds) {
          if (platform.x <= movement.bounds.min.x || platform.x + platform.width >= movement.bounds.max.x) {
            movement.direction.x *= -1
          }
          if (platform.y <= movement.bounds.min.y || platform.y + platform.height >= movement.bounds.max.y) {
            movement.direction.y *= -1
          }
        }
      }
    })
  }

  private updateTraps(deltaTime: number) {
    this.traps.forEach(trap => {
      if (trap.interval && trap.timer !== undefined) {
        trap.timer += deltaTime
        
        if (trap.timer >= trap.interval) {
          trap.active = !trap.active
          trap.timer = 0
        }
      }
    })
  }

  updateEntity(entity: Entity, deltaTime: number) {
    if (!entity.velocity) entity.velocity = { x: 0, y: 0 }

    // DEBUG: Disabled completely to stop console spam
    // if (entity.type === 'player' && this.allowDebugLogs && this.keys.size > 0 && this.frameCount % 60 === 0) {
    //   console.log('🎯 PROCESSING PLAYER ENTITY:', {
    //     entityId: entity.id,
    //     entityType: entity.type,
    //     isThisPlayer: this.player === entity,
    //     hasKeys: this.keys.size > 0,
    //     keys: Array.from(this.keys),
    //     playerRef: !!this.player
    //   })
    // }

    // Handle player input
    if (entity.type === 'player') {
      // CRITICAL FIX: Set this entity as the player if it's not set
      if (!this.player) {
        this.player = entity
        console.log('🏎️ Player reference fixed:', entity.id)
      }
      
      // Debug logging disabled for performance
      // if (this.allowDebugLogs && this.keys.size > 0 && this.frameCount % 60 === 0) {
      //   console.log('✅ CALLING handlePlayerInput')
      // }
      this.handlePlayerInput(entity, deltaTime)
    }

    // Handle AI for enemies
    if (entity.type === 'enemy') {
      this.handleEnemyAI(entity, deltaTime)
    }

    // Apply enhanced physics
    this.applyPhysics(entity, deltaTime)

    // Update animations
    this.updateEntityAnimation(entity, deltaTime)

    // Keep entities in level bounds
    const level = this.gameData.levels[this.currentLevel]
    entity.x = Math.max(0, Math.min(level.width - entity.width, entity.x))
    
    // Handle falling off screen
    if (entity.y > level.height + 100) {
      if (entity.type === 'player') {
        this.handlePlayerDeath()
      } else {
        this.respawnEntity(entity)
      }
    }
  }

  private applyPhysics(entity: Entity, deltaTime: number) {
    if (!entity.physics || !entity.velocity) return
    
    const physics = entity.physics
    const gameTypeLower = (this.gameData.gameType || '').toLowerCase()
    const isRacingGame = gameTypeLower.includes('racing') || gameTypeLower.includes('racer') || gameTypeLower.includes('car') || gameTypeLower.includes('speed')
    
    // Skip traditional physics for racing games (they handle their own)
    if (isRacingGame && (entity.type === 'player' || entity.type === 'enemy')) {
      // Racing cars (both player and AI) handle their own physics
      // Apply velocity more smoothly for racing games
      const deltaMultiplier = deltaTime * 60
      entity.x += entity.velocity.x * deltaMultiplier
      entity.y += entity.velocity.y * deltaMultiplier
      return
    }
    
    // Apply gravity for non-racing entities
    if (physics.gravity) {
      const gravityForce = (physics.gravityForce || 0.8) * (physics.mass || 1)
      entity.velocity.y += gravityForce * 60 * deltaTime
    }

    // Apply air resistance/friction
    if (physics.friction) {
      const friction = Math.pow(physics.friction, deltaTime * 60)
      entity.velocity.x *= friction
      
      if (!this.isOnGround(entity)) {
        entity.velocity.y *= Math.pow(physics.friction * 0.99, deltaTime * 60) // Less air resistance on Y
      }
    }

    // Terminal velocity
    const maxVelocity = physics.maxSpeed || 20
    entity.velocity.y = Math.max(-maxVelocity, Math.min(maxVelocity, entity.velocity.y))
    entity.velocity.x = Math.max(-maxVelocity, Math.min(maxVelocity, entity.velocity.x))

    // Update position
    entity.x += entity.velocity.x * deltaTime * 60
    entity.y += entity.velocity.y * deltaTime * 60
  }

  private updateEntityAnimation(entity: Entity, deltaTime: number) {
    if (!entity.animation) return
    
    entity.animation.timer += deltaTime
    
    if (entity.animation.timer >= entity.animation.speed) {
      entity.animation.frame++
      entity.animation.timer = 0
      
      // Reset frame (assuming 4 frames per animation)
      if (entity.animation.frame >= 4) {
        entity.animation.frame = 0
      }
    }
    
    // Determine animation state
    if (entity.type === 'player' && entity.velocity) {
      if (Math.abs(entity.velocity.x) > 0.1) {
        entity.animation.current = 'run'
      } else if (entity.velocity.y < -0.1) {
        entity.animation.current = 'jump'
      } else if (entity.velocity.y > 0.1) {
        entity.animation.current = 'fall'
      } else {
        entity.animation.current = 'idle'
      }
    }
  }

  private handleEnemyAI(entity: Entity, deltaTime: number) {
    if (!entity.velocity || !this.player) return
    
    const gameTypeLower = (this.gameData.gameType || '').toLowerCase()
    const isRacingGame = gameTypeLower.includes('racing') || gameTypeLower.includes('racer') || gameTypeLower.includes('car') || gameTypeLower.includes('speed')
    
    if (isRacingGame) {
      // RACING AI: Make AI cars move like racing cars, not flying enemies
      this.handleRacingAI(entity, deltaTime)
    } else {
      // PLATFORMER AI: Traditional enemy behavior
      this.handlePlatformerAI(entity, deltaTime)
    }
  }
  
  private handleRacingAI(entity: Entity, deltaTime: number) {
    // AI cars should drive forward with slight lane changes
    const racingSpeed = 3 + Math.random() * 2 // Random speed between 3-5
    const laneChangeSpeed = 1
    
    // Drive forward (negative Y = up/forward)
    entity.velocity.y = -racingSpeed
    
    // Slight lane changes for realistic racing behavior
    if (!entity.aiTimer) entity.aiTimer = 0
    entity.aiTimer += deltaTime
    
    // Change lanes occasionally
    if (entity.aiTimer > 2 + Math.random() * 3) { // Every 2-5 seconds
      entity.aiTarget = (Math.random() - 0.5) * laneChangeSpeed * 2 // -laneChangeSpeed to +laneChangeSpeed
      entity.aiTimer = 0
    }
    
    // Move towards target lane position
    if (entity.aiTarget !== undefined) {
      entity.velocity.x = entity.aiTarget
      // Gradually reduce target to stop lane changing
      entity.aiTarget *= 0.98
      if (Math.abs(entity.aiTarget) < 0.1) {
        entity.aiTarget = 0
      }
    }
    
    // Keep AI cars within track bounds
    const level = this.gameData.levels[this.currentLevel]
    if (level) {
      const trackMargin = 120
      entity.x = Math.max(trackMargin, Math.min(level.width - trackMargin, entity.x))
    }
  }
  
  private handlePlatformerAI(entity: Entity, deltaTime: number) {
    // Original platformer AI behavior
    const distanceToPlayer = Math.abs(entity.x - this.player!.x)
    const chaseDistance = 150
    const patrolSpeed = 2
    const chaseSpeed = 4
    
    if (distanceToPlayer < chaseDistance) {
      // Chase player
      const direction = this.player!.x > entity.x ? 1 : -1
      entity.velocity.x = direction * chaseSpeed
    } else {
      // Patrol behavior
      if (!entity.patrolDirection) {
        entity.patrolDirection = Math.random() > 0.5 ? 1 : -1
      }
      
      entity.velocity.x = entity.patrolDirection * patrolSpeed
      
      // Change direction occasionally or at platform edges
      if (Math.random() < 0.01 || this.isAtPlatformEdge(entity)) {
        entity.patrolDirection *= -1
      }
    }
  }

  private isAtPlatformEdge(entity: Entity): boolean {
    const level = this.gameData.levels[this.currentLevel]
    const futureX = entity.x + entity.velocity!.x * 0.5
    
    // Check if there's ground ahead
    if (!level.platforms || !Array.isArray(level.platforms)) return true
    for (const platform of level.platforms) {
      if (entity.y + entity.height >= platform.y &&
          entity.y + entity.height <= platform.y + platform.height + 5 &&
          futureX + entity.width > platform.x &&
          futureX < platform.x + platform.width) {
        return false // Ground ahead
      }
    }
    
    return true // No ground ahead, at edge
  }

  handlePlayerInput(player: Entity, deltaTime: number) {
    if (!player.velocity || !player.physics) {
      console.error('❌ Player input failed: missing velocity or physics', { 
        hasVelocity: !!player.velocity, 
        hasPhysics: !!player.physics,
        player: player
      })
      return
    }

    const moveSpeed = player.physics.moveSpeed || 5
    const jumpForce = player.physics.jumpForce || 15
    const airControl = player.physics.airControl || 0.7
    const isGrounded = this.isOnGround(player)
    
    // Check game type for different control schemes - FIXED to handle creative AI names
    const gameTypeLower = (this.gameData.gameType || '').toLowerCase()
    const isSpaceGame = gameTypeLower.includes('shooter') || gameTypeLower.includes('space') || !player.physics.gravity
    const isRacingGame = gameTypeLower.includes('racing') || gameTypeLower.includes('racer') || gameTypeLower.includes('car') || gameTypeLower.includes('speed')
    
    // DEBUG - Log input when keys are pressed (ALWAYS ENABLED TO DEBUG RACING)
    if (this.keys.size > 0 && this.frameCount % 60 === 0) {
      console.log('🚨 INPUT DEBUG:', { 
        gameType: this.gameData.gameType, 
        isRacingGame, 
        isSpaceGame,
        keys: Array.from(this.keys),
        playerPosition: { x: player.x, y: player.y },
        playerVelocity: player.velocity,
        playerPhysics: player.physics,
        route: isRacingGame ? 'RACING' : isSpaceGame ? 'SPACE' : 'PLATFORMER'
      })
    }
    
    if (isRacingGame) {
      if (this.debugMode && this.keys.size > 0 && this.frameCount % 180 === 0) {
        console.log('🏎️ ROUTING TO RACING INPUT')
      }
      this.handleRacingInput(player, deltaTime)
    } else if (isSpaceGame) {
      if (this.debugMode && this.keys.size > 0 && this.frameCount % 180 === 0) {
        console.log('🚀 ROUTING TO SPACE INPUT')
      }
      // 8-directional movement for space games
      player.velocity.x = 0
      player.velocity.y = 0
      
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) {
        player.velocity.x = -moveSpeed
      }
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) {
        player.velocity.x = moveSpeed
      }
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) {
        player.velocity.y = -moveSpeed
      }
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) {
        player.velocity.y = moveSpeed
      }
      
      // Boost ability
      if (this.keys.has('Space') && player.abilities?.boostDash) {
        player.velocity.x *= 1.5
        player.velocity.y *= 1.5
        this.particles.createTrail(player.x + player.width/2, player.y + player.height/2, '#00FFFF')
      }
      
      // Shooting
      if (this.keys.has('KeyJ') || this.keys.has('KeyX')) {
        this.playerShoot(player)
      }
    } else {
      // Platformer movement
      let moveInput = 0
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) {
        moveInput = -1
      }
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) {
        moveInput = 1
      }

      // Apply movement with air control
      const controlMultiplier = isGrounded ? 1 : airControl
      player.velocity.x += moveInput * moveSpeed * controlMultiplier * deltaTime * 60

      // Jumping
      if ((this.keys.has('KeyW') || this.keys.has('ArrowUp') || this.keys.has('Space')) && isGrounded) {
        player.velocity.y = -jumpForce
        this.particles.createJumpEffect(player.x + player.width/2, player.y + player.height)
      }
    }

    // Enhanced abilities (only for platformer games)
    if (player.abilities && !isSpaceGame && !isRacingGame) {
      // Dash ability
      if (this.keys.has('KeyK') && player.abilities.dash) {
        this.dash(player)
      }
      
      // Double jump
      if ((this.keys.has('KeyW') || this.keys.has('ArrowUp') || this.keys.has('Space')) && 
          player.abilities.doubleJump && !isGrounded && !player.hasDoubleJumped) {
        player.velocity.y = -jumpForce * 0.8
        player.hasDoubleJumped = true
        this.particles.createJumpEffect(player.x + player.width/2, player.y + player.height)
      }
      
      // Wall jump
      if (player.abilities.wallJump && this.isOnWall(player) && 
          (this.keys.has('KeyW') || this.keys.has('ArrowUp') || this.keys.has('Space'))) {
        const wallDirection = this.getWallDirection(player)
        player.velocity.x = -wallDirection * moveSpeed * 1.5
        player.velocity.y = -jumpForce * 0.9
      }
    }

    // Reset double jump when grounded
    if (isGrounded) {
      player.hasDoubleJumped = false
    }
  }

  private handleRacingInput(player: Entity, deltaTime: number) {
    console.log('🏎️ RACING INPUT CALLED - Keys:', Array.from(this.keys), 'Player pos:', { x: player.x, y: player.y })
    
    if (!player.velocity || !player.physics) {
      console.warn('Racing input failed: missing velocity or physics', { hasVelocity: !!player.velocity, hasPhysics: !!player.physics })
      return
    }

    // Racing physics properties - MORE RESPONSIVE
    const maxSpeed = 8
    const acceleration = 1.2
    const braking = 1.5
    const turning = 6
    
    // Ensure velocity is properly initialized
    if (!player.velocity) player.velocity = { x: 0, y: 0 }

    // Input handling - Check both WASD and Arrow keys
    const isAccelerating = this.keys.has('ArrowUp') || this.keys.has('KeyW')
    const isBraking = this.keys.has('ArrowDown') || this.keys.has('KeyS')
    const isTurningLeft = this.keys.has('ArrowLeft') || this.keys.has('KeyA')
    const isTurningRight = this.keys.has('ArrowRight') || this.keys.has('KeyD')

    console.log('🎮 Racing Input State:', { isAccelerating, isBraking, isTurningLeft, isTurningRight })

    // SIMPLIFIED RACING PHYSICS - Direct velocity control
    
    // Horizontal movement (left/right steering)
    if (isTurningLeft) {
      player.velocity.x = -turning
      console.log('🔄 Turning LEFT, velocity.x =', player.velocity.x)
    } else if (isTurningRight) {
      player.velocity.x = turning
      console.log('🔄 Turning RIGHT, velocity.x =', player.velocity.x)
    } else {
      player.velocity.x = 0 // Stop horizontal movement when not turning
    }
    
    // Vertical movement (forward/backward)
    if (isAccelerating) {
      player.velocity.y = -maxSpeed // Negative = moving up (forward)
      console.log('🚀 ACCELERATING, velocity.y =', player.velocity.y)
    } else if (isBraking) {
      player.velocity.y = maxSpeed * 0.5 // Positive = moving down (backward)
      console.log('🛑 BRAKING, velocity.y =', player.velocity.y)
    } else {
      player.velocity.y = 0 // Stop when no input
      console.log('⏸️ NO INPUT, stopped')
    }
    
    console.log('🏁 Final velocity:', player.velocity)
    
    // Constrain car to track bounds
    const level = this.gameData.levels[this.currentLevel]
    if (level) {
      // Keep car within horizontal track boundaries
      const trackMargin = 100
      player.x = Math.max(trackMargin, Math.min(level.width - trackMargin, player.x))
      
      // For racing games, we can allow some vertical movement but keep it reasonable
      player.y = Math.max(50, Math.min(level.height - 100, player.y))
    }

    // DEBUG - Disabled for performance
    // if (this.debugMode && (Math.abs(newVelX) > 0.1 || Math.abs(newVelY) > 0.1) && this.frameCount % 60 === 0) {
    //   console.log('🏁 RACING VELOCITY UPDATE:', {
    //     currentSpeed: player.currentSpeed,
    //     facingAngle: player.facingAngle,
    //     newVelocity: { x: newVelX, y: newVelY },
    //     position: { x: player.x, y: player.y },
    //     keys: Array.from(this.keys)
    //   })
    // }

    // Add visual effects for high speed
    if (Math.abs(player.currentSpeed) > maxSpeed * 0.7) {
      this.particles.createTrail(player.x + player.width/2, player.y + player.height/2, '#FF4444')
    }
  }

  private isOnWall(entity: Entity): boolean {
    const level = this.gameData.levels[this.currentLevel]
    if (!level.platforms || !Array.isArray(level.platforms)) return false
    
    for (const platform of level.platforms) {
      // Check left wall
      if (entity.x <= platform.x + platform.width + 5 &&
          entity.x + entity.width > platform.x + platform.width &&
          entity.y < platform.y + platform.height &&
          entity.y + entity.height > platform.y) {
        return true
      }
      
      // Check right wall
      if (entity.x + entity.width >= platform.x - 5 &&
          entity.x < platform.x &&
          entity.y < platform.y + platform.height &&
          entity.y + entity.height > platform.y) {
        return true
      }
    }
    
    return false
  }

  private getWallDirection(entity: Entity): number {
    const level = this.gameData.levels[this.currentLevel]
    if (!level.platforms || !Array.isArray(level.platforms)) return 0
    
    for (const platform of level.platforms) {
      // Check left wall
      if (entity.x <= platform.x + platform.width + 5 &&
          entity.x + entity.width > platform.x + platform.width &&
          entity.y < platform.y + platform.height &&
          entity.y + entity.height > platform.y) {
        return 1 // Wall is to the left, jump right
      }
      
      // Check right wall
      if (entity.x + entity.width >= platform.x - 5 &&
          entity.x < platform.x &&
          entity.y < platform.y + platform.height &&
          entity.y + entity.height > platform.y) {
        return -1 // Wall is to the right, jump left
      }
    }
    
    return 0
  }

  isOnGround(entity: Entity): boolean {
    const level = this.gameData.levels[this.currentLevel]
    if (!level) return false
    const tolerance = 5
    
    // Check against platforms (if they exist)
    if (level.platforms && Array.isArray(level.platforms)) {
      for (const platform of level.platforms) {
      if (entity.x < platform.x + platform.width &&
          entity.x + entity.width > platform.x &&
          entity.y + entity.height >= platform.y - tolerance &&
          entity.y + entity.height <= platform.y + tolerance + 10) {
          return true
        }
      }
    }

    // Check against level ground
    if (level.height && entity.y + entity.height >= level.height - 50) {
      return true
    }

    return false
  }

  updateCamera() {
    if (!this.player) return

    const level = this.gameData.levels[this.currentLevel]
    
    // Smooth camera following
    const targetX = this.player.x - this.canvas.width / (2 * this.camera.zoom)
    const targetY = this.player.y - this.canvas.height / (2 * this.camera.zoom)
    
    const smoothing = 0.1
    this.camera.x += (targetX - this.camera.x) * smoothing
    this.camera.y += (targetY - this.camera.y) * smoothing

    // Keep camera in bounds
    this.camera.x = Math.max(0, Math.min(level.width - this.canvas.width / this.camera.zoom, this.camera.x))
    this.camera.y = Math.max(0, Math.min(level.height - this.canvas.height / this.camera.zoom, this.camera.y))
  }

  checkCollisions() {
    if (!this.player) return

    const level = this.gameData.levels[this.currentLevel]

    // Platform collisions
    if (level.platforms && Array.isArray(level.platforms)) {
      level.platforms.forEach(platform => {
        if (this.checkCollision(this.player!, platform)) {
          this.resolveCollision(this.player!, platform)
        }
      })
    }

    // Collectible collisions
    this.collectibles.forEach(collectible => {
      if (!collectible.collected && this.checkCollision(this.player!, collectible)) {
        this.collectItem(collectible)
      }
    })

    // Trap collisions
    this.traps.forEach(trap => {
      if (trap.active && this.checkCollision(this.player!, trap)) {
        this.hitTrap(this.player!, trap)
      }
    })

    // Enemy collisions
    this.entities.forEach(entity => {
      if (entity.type === 'enemy' && this.checkCollision(this.player!, entity)) {
        this.handleEnemyCollision(this.player!, entity)
      }
    })

    // Goal collision
    if (level.goal && this.checkCollision(this.player!, level.goal)) {
      this.reachGoal()
    }
  }

  checkCollision(a: any, b: any): boolean {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y
  }

  resolveCollision(entity: Entity, platform: Platform) {
    if (!entity.velocity) return

    // const wasOnGround = this.isOnGround(entity) // For future collision improvements
    
    // Determine collision side
    const overlapLeft = (entity.x + entity.width) - platform.x
    const overlapRight = (platform.x + platform.width) - entity.x
    const overlapTop = (entity.y + entity.height) - platform.y
    const overlapBottom = (platform.y + platform.height) - entity.y
    
    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom)
    
    if (minOverlap === overlapTop && entity.velocity.y > 0) {
      // Landing on top
      entity.y = platform.y - entity.height
      entity.velocity.y = 0
      
      // If platform is moving, move entity with it
      if (platform.movable && platform.movement) {
        entity.x += platform.movement.direction.x * platform.movement.speed
      }
    } else if (minOverlap === overlapBottom && entity.velocity.y < 0) {
      // Hitting from below
      entity.y = platform.y + platform.height
      entity.velocity.y = 0
    } else if (minOverlap === overlapLeft && entity.velocity.x > 0) {
      // Hitting from left
      entity.x = platform.x - entity.width
      entity.velocity.x = 0
    } else if (minOverlap === overlapRight && entity.velocity.x < 0) {
      // Hitting from right
      entity.x = platform.x + platform.width
      entity.velocity.x = 0
    }
  }

  private handleEnemyCollision(player: Entity, enemy: Entity) {
    if (player.invincible) return
    
    // Check if player is attacking (implement attack system later)
    if (player.velocity && player.velocity.y > 5) {
      // Player bouncing on enemy
      player.velocity.y = -10
      this.destroyEnemy(enemy)
      this.score += 25
    } else {
      // Player takes damage
      this.damagePlayer(player, 1)
    }
  }

  private destroyEnemy(enemy: Entity) {
    this.entities.delete(enemy.id)
    this.particles.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#FF4500')
  }

  private damagePlayer(player: Entity, damage: number) {
    if (player.health !== undefined) {
      player.health -= damage
      player.invincible = true
      
      // Flash effect
      let flashCount = 0
      const flashInterval = setInterval(() => {
        player.visible = !player.visible
        flashCount++
        if (flashCount >= 6) {
          clearInterval(flashInterval)
          player.visible = true
          player.invincible = false
        }
      }, 100)
      
      if (player.health <= 0) {
        this.handlePlayerDeath()
      }
    }
  }

  private handlePlayerDeath() {
    console.log('Player died!')
    this.particles.createExplosion(this.player!.x + this.player!.width/2, this.player!.y + this.player!.height/2, '#FF0000')
    
    // Respawn after delay
    setTimeout(() => {
      this.respawnPlayer()
    }, 1000)
  }

  private respawnPlayer() {
    if (this.player) {
      this.player.x = 100
      this.player.y = 300
      this.player.health = this.player.maxHealth || 3
      this.player.velocity = { x: 0, y: 0 }
      this.player.visible = true
    }
  }

  private respawnEntity(entity: Entity) {
    // Reset entity to spawn position
    entity.y = 300
    entity.velocity = { x: 0, y: 0 }
  }

  collectItem(collectible: Collectible) {
    collectible.collected = true
    this.score += collectible.points
    this.particles.createExplosion(collectible.x + collectible.width!/2, collectible.y + collectible.height!/2, collectible.color || '#FFD700')
    
    // Play collect sound if available
    // this.playSound('collect')
  }

  hitTrap(entity: Entity, trap: Trap) {
    if (entity.health !== undefined) {
      this.damagePlayer(entity, trap.damage)
    }
  }

  playerShoot(player: Entity) {
    if (player.shootCooldown > 0) return
    
    // Create projectile
    const projectile: Entity = {
      id: `projectile_${Date.now()}`,
      name: 'player_shot',
      type: 'projectile',
      x: player.x + player.width,
      y: player.y + player.height / 2,
      width: 8,
      height: 4,
      velocity: { x: 15, y: 0 },
      color: '#00FFFF',
      visible: true,
      solid: false,
      physics: { gravity: false }
    }
    
    this.entities.set(projectile.id, projectile)
    this.particles.createTrail(projectile.x, projectile.y, '#00FFFF')
    
    player.shootCooldown = 0.2 // 200ms cooldown
    
    // Remove projectile after 3 seconds
    setTimeout(() => {
      this.entities.delete(projectile.id)
    }, 3000)
  }

  dash(player: Entity) {
    if (!player.velocity || player.dashCooldown > 0) return
    
    const dashForce = 15
    const direction = player.velocity.x >= 0 ? 1 : -1
    
    player.velocity.x = dashForce * direction
    player.invincible = true
    player.dashCooldown = 1 // 1 second cooldown
    
    // Visual effect
    this.particles.createTrail(player.x + player.width/2, player.y + player.height/2, '#00FFFF')
    
    setTimeout(() => {
      player.invincible = false
    }, 200)
  }

  updateCollectibles(_deltaTime: number) {
    this.collectibles.forEach(collectible => {
      if (collectible.floating) {
        collectible.y += Math.sin(this.gameTime * 3) * 0.5
      }
      
      // Update collectible effects
      if (collectible.effect === 'pulse') {
        // Add pulsing effect
      }
    })
    
    // Update cooldowns
    if (this.player) {
      if (this.player.dashCooldown > 0) {
        this.player.dashCooldown -= _deltaTime
      }
      if (this.player.shootCooldown > 0) {
        this.player.shootCooldown -= _deltaTime
      }
    }
  }

  checkGameState() {
    // Check win condition
    if (this.gameData.gameLogic?.winCondition === 'collect_all') {
      const allCollected = Array.from(this.collectibles.values()).every(c => c.collected)
      if (allCollected) {
        this.winLevel()
      }
    }
  }

  reachGoal() {
    console.log('Level completed!')
    this.winLevel()
  }

  private winLevel() {
    this.particles.createExplosion(this.player!.x + this.player!.width/2, this.player!.y + this.player!.height/2, '#00FF00')
    
    // Check if there's a next level
    if (this.currentLevel < this.gameData.levels.length - 1) {
      this.nextLevel()
    } else {
      this.gameComplete()
    }
  }

  private nextLevel() {
    this.currentLevel++
    this.setupLevel()
    this.respawnPlayer()
    console.log(`Advanced to level ${this.currentLevel + 1}`)
  }

  private gameComplete() {
    console.log('Game completed!')
    this.stop()
    // Show completion screen
  }

  gameOver() {
    console.log('Game Over!')
    this.stop()
  }

  render() {
    const level = this.gameData.levels[this.currentLevel]
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Set camera transform
    this.ctx.save()
    this.ctx.scale(this.camera.zoom, this.camera.zoom)
    this.ctx.translate(-this.camera.x, -this.camera.y)

    // Render background
    this.renderBackground(level)

    // Render platforms
    this.renderPlatforms(level)

    // Render collectibles
    this.renderCollectibles()

    // Render traps
    this.renderTraps()

    // Render entities (only those in viewport for performance)
    this.renderEntities()

    // Render goal
    this.renderGoal(level)

    // Render particles
    this.particles.render(this.ctx)

    // Restore camera transform
    this.ctx.restore()

    // Render UI (not affected by camera)
    this.renderUI()
    
    // Render debug info
    if (this.debugMode) {
      this.renderDebugInfo()
    }
  }

  private renderBackground(level: GameLevel) {
    // Check for DALL-E generated background images with multiple naming patterns
    const possibleBackgroundNames = [
      'background',
      'background_image',
      level.backgroundImage,
      'level_background',
      `${this.gameData.theme}_background`,
      `${this.gameData.gameType}_background`
    ].filter(Boolean)
    
    let backgroundSprite = null
    
    // Try to find any background image
    for (const bgName of possibleBackgroundNames) {
      const sprite = this.assetManager.getSprite(bgName as string) || this.assetManager.getImage(bgName as string)
      if (sprite) {
        backgroundSprite = sprite
        console.log(`🖼️ Found background image: ${bgName}`)
        break
      }
    }
    
    if (backgroundSprite) {
      console.log('🖼️ Rendering DALL-E background image')
      this.ctx.drawImage(backgroundSprite, 0, 0, level.width, level.height)
    } else {
      console.log('🖼️ Rendering gradient background fallback')
      // Validate and fix background color
      const backgroundColor = this.validateColor(level.background) || '#87CEEB'
      
      // Render gradient background
      const gradient = this.ctx.createLinearGradient(0, 0, 0, level.height)
      gradient.addColorStop(0, backgroundColor)
      gradient.addColorStop(1, this.darkenColor(backgroundColor, 30))
      
      this.ctx.fillStyle = gradient
      this.ctx.fillRect(0, 0, level.width, level.height)
    }
  }

  private validateColor(color: string): string | null {
    if (!color || typeof color !== 'string') return null
    
    // Remove any invalid characters or multiple colors
    const cleanColor = color.split(',')[0].trim()
    
    // Check if it's a valid hex color
    if (/^#[0-9A-F]{6}$/i.test(cleanColor)) {
      return cleanColor
    }
    
    // Check if it's a valid color name
    const testDiv = document.createElement('div')
    testDiv.style.color = cleanColor
    if (testDiv.style.color) {
      return cleanColor
    }
    
    return null
  }

  private renderPlatforms(level: GameLevel) {
    if (!level.platforms || !Array.isArray(level.platforms)) return
    level.platforms.forEach(platform => {
      const sprite = this.assetManager.getSprite(`platform_${platform.type || 'default'}`)
      
      if (sprite) {
        this.ctx.drawImage(sprite, platform.x, platform.y, platform.width, platform.height)
      } else {
        this.ctx.fillStyle = platform.color || '#8B4513'
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
        
        // Add simple texture
        if (this.gameData.visualStyle === 'pixel') {
          this.ctx.fillStyle = this.lightenColor(platform.color || '#8B4513', 20)
          this.ctx.fillRect(platform.x + 2, platform.y + 2, platform.width - 4, 2)
        }
      }
    })
  }

  private renderCollectibles() {
    this.collectibles.forEach(collectible => {
      if (!collectible.collected && this.isInViewport(collectible)) {
        // Prioritize emoji rendering for collectibles
        if (collectible.emoji) {
          this.ctx.save()
          
          // Apply camera offset
          const screenX = collectible.x - this.camera.x
          const screenY = collectible.y - this.camera.y
          
          // Add floating animation
          let offsetY = 0
          if (collectible.floating || collectible.type === 'collectible') {
            offsetY = Math.sin(Date.now() * 0.005 + collectible.x * 0.01) * 4
          }
          
          // Add sparkle effect
          this.ctx.shadowBlur = 8
          this.ctx.shadowColor = collectible.color || '#FFD700'
          this.ctx.shadowOffsetX = 0
          this.ctx.shadowOffsetY = 0
          
          // Center and size the emoji
          const centerX = screenX + (collectible.width || 24) / 2
          const centerY = screenY + (collectible.height || 24) / 2 + offsetY
          const emojiSize = Math.max(20, (collectible.width || 24))
          
          this.ctx.font = `${emojiSize}px serif`
          this.ctx.textAlign = 'center'
          this.ctx.textBaseline = 'middle'
          this.ctx.fillText(collectible.emoji, centerX, centerY)
          
          this.ctx.restore()
        } else {
          // Fallback to sprite or color rendering
          const sprite = this.assetManager.getSprite(`collectible_${collectible.type}`)
          
          if (sprite) {
            this.ctx.drawImage(sprite, 
              collectible.x - this.camera.x, 
              collectible.y - this.camera.y, 
              collectible.width!, 
              collectible.height!)
          } else {
            this.ctx.save()
            this.ctx.fillStyle = collectible.color || '#FFD700'
            
            // Add glow effect
            this.ctx.shadowBlur = 10
            this.ctx.shadowColor = collectible.color || '#FFD700'
            
            this.ctx.fillRect(
              collectible.x - this.camera.x, 
              collectible.y - this.camera.y, 
              collectible.width!, 
              collectible.height!)
            
            this.ctx.restore()
          }
        }
      }
    })
  }

  private renderTraps() {
    this.traps.forEach(trap => {
      if (trap.active && this.isInViewport(trap)) {
        const sprite = this.assetManager.getSprite(`trap_${trap.type}`)
        
        if (sprite) {
          this.ctx.drawImage(sprite, trap.x, trap.y, trap.width, trap.height)
        } else {
          this.ctx.fillStyle = trap.color || '#FF0000'
          this.ctx.fillRect(trap.x, trap.y, trap.width, trap.height)
        }
      }
    })
  }

  private renderEntities() {
    const entitiesToRender = this.cullingEnabled ? this.viewportEntities : Array.from(this.entities.values())
    
    entitiesToRender.forEach(entity => {
      if (entity.visible) {
        this.renderEntity(entity)
      }
    })
  }

  private renderEntity(entity: Entity) {
    // PRIORITIZE DALL-E SPRITES OVER EVERYTHING
    // Try multiple sprite name variations to match DALL-E generated assets
    const possibleSpriteNames = [
      entity.sprite, // Direct sprite reference from adapter
      entity.name, // Entity name (e.g., 'player_car', 'goomba1')
      entity.type, // Entity type (e.g., 'player', 'enemy')
      `${entity.type}_${entity.name}`, // Combined type and name
      `${entity.name}_sprite`, // Name with suffix
      `sprite_${entity.name}` // Prefixed name
    ].filter(Boolean) // Remove undefined values
    
    let loadedSprite = null
    
    // Check all possible sprite names for DALL-E loaded images
    for (const spriteName of possibleSpriteNames) {
      const sprite = this.assetManager.getSprite(spriteName as string)
      if (sprite) {
        loadedSprite = sprite
        // Only log once per entity type to avoid spam
        if (this.frameCount % 1800 === 0) { // Every 30 seconds at 60fps
          console.log(`🎨 Found DALL-E sprite: ${spriteName} for entity: ${entity.name}`)
        }
        break
      }
    }
    
    // RENDER PRIORITIZATION: 1. DALL-E Sprite, 2. Emoji, 3. Color
    if (loadedSprite && entity.renderMode !== 'emoji' && entity.renderMode !== 'color') {
      // Only log occasionally to avoid spam
      if (this.debugMode && this.frameCount % 1800 === 0) { // Every 30 seconds at 60fps
        console.log(`🖼️ Rendering DALL-E sprite for: ${entity.name}`)
      }
      this.renderEntitySprite(entity, loadedSprite)
    } else if (entity.emoji && (entity.renderMode === 'emoji' || !entity.renderMode)) {
      this.renderEntityEmoji(entity)
    } else {
      // Fallback to colored rectangle with enhanced effects
      this.renderEntityColor(entity)
    }
    
    // Render health bar for entities with health
    if (entity.health !== undefined && entity.maxHealth !== undefined) {
      this.renderHealthBar(entity)
    }
  }

  private renderEntityEmoji(entity: Entity) {
    this.ctx.save()
    
    // Apply camera offset
    const screenX = entity.x - this.camera.x
    const screenY = entity.y - this.camera.y
    
    // Center the emoji in the entity bounds
    const centerX = screenX + entity.width / 2
    const centerY = screenY + entity.height / 2
    
    // Handle rotation for racing cars and other rotatable entities
    if (entity.facingAngle !== undefined && entity.facingAngle !== 0) {
      this.ctx.translate(centerX, centerY)
      this.ctx.rotate(entity.facingAngle)
      this.ctx.translate(-centerX, -centerY)
    }
    
    // Set emoji size based on entity dimensions - make them bigger and more visible
    const baseSize = Math.max(entity.width, entity.height)
    const emojiSize = entity.emojiSize || Math.max(24, baseSize * 1.2)
    this.ctx.font = `${emojiSize}px serif`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    
    // Add visual effects
    if (entity.glowEffect || entity.type === 'player') {
      this.ctx.shadowBlur = 10
      this.ctx.shadowColor = entity.color || (entity.type === 'player' ? '#00FFFF' : '#FFD700')
      this.ctx.shadowOffsetX = 0
      this.ctx.shadowOffsetY = 0
    }
    
    // Add bounce animation for collectibles
    let offsetY = 0
    if (entity.type === 'collectible' || (entity.hasOwnProperty('points') && entity.points > 0)) {
      offsetY = Math.sin(Date.now() * 0.005) * 3
    }
    
    // Add pulsing effect for goals
    let scale = 1
    if (entity.type === 'goal' || entity.emoji === '🏆') {
      scale = 1 + Math.sin(Date.now() * 0.003) * 0.1
      this.ctx.save()
      this.ctx.translate(centerX, centerY)
      this.ctx.scale(scale, scale)
      this.ctx.translate(-centerX, -centerY)
    }
    
    // Render the emoji
    this.ctx.fillText(entity.emoji!, centerX, centerY + offsetY)
    
    if (entity.type === 'goal' || entity.emoji === '🏆') {
      this.ctx.restore()
    }
    
    this.ctx.restore()
  }

  private renderEntitySprite(entity: Entity, sprite: HTMLImageElement | HTMLCanvasElement) {
    this.ctx.save()
    
    // Flip sprite based on movement direction
    const flipX = entity.velocity && entity.velocity.x < 0
    
    // Add glow effect if enabled
    if (entity.glowEffect) {
      this.ctx.shadowBlur = 20
      this.ctx.shadowColor = entity.color || '#00FFFF'
    }
    
    // Handle rotation for racing cars and other rotatable entities
    if (entity.facingAngle !== undefined && entity.facingAngle !== 0) {
      const centerX = entity.x + entity.width / 2
      const centerY = entity.y + entity.height / 2
      this.ctx.translate(centerX, centerY)
      this.ctx.rotate(entity.facingAngle)
      this.ctx.translate(-centerX, -centerY)
    }
    
    if (flipX) {
      this.ctx.scale(-1, 1)
      this.ctx.drawImage(sprite, -(entity.x + entity.width), entity.y, entity.width, entity.height)
    } else {
      this.ctx.drawImage(sprite, entity.x, entity.y, entity.width, entity.height)
    }
    
    this.ctx.restore()
  }
  
  private renderEntityColor(entity: Entity) {
    this.ctx.save()
    
    // Enhanced colored rectangle with effects
    this.ctx.fillStyle = entity.color || '#FF6B6B'
    
    if (entity.glowEffect) {
      this.ctx.shadowBlur = 15
      this.ctx.shadowColor = entity.color || '#FF6B6B'
    }
    
    // Add rounded corners for better visual appeal
    const radius = Math.min(entity.width, entity.height) * 0.1
    this.roundRect(entity.x, entity.y, entity.width, entity.height, radius)
    this.ctx.fill()
    
    // Add highlight effect
    this.ctx.fillStyle = this.lightenColor(entity.color || '#FF6B6B', 40)
    this.roundRect(entity.x + 2, entity.y + 2, entity.width - 4, 3, radius)
    this.ctx.fill()
    
    this.ctx.restore()
  }

  private roundRect(x: number, y: number, width: number, height: number, radius: number) {
    this.ctx.beginPath()
    this.ctx.moveTo(x + radius, y)
    this.ctx.lineTo(x + width - radius, y)
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    this.ctx.lineTo(x + width, y + height - radius)
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    this.ctx.lineTo(x + radius, y + height)
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    this.ctx.lineTo(x, y + radius)
    this.ctx.quadraticCurveTo(x, y, x + radius, y)
    this.ctx.closePath()
  }

  private renderGoal(level: GameLevel) {
    if (level.goal && this.isInViewport(level.goal)) {
      // Prioritize emoji rendering for goals
      if (level.goal.emoji) {
        this.ctx.save()
        
        // Apply camera offset
        const screenX = level.goal.x - this.camera.x
        const screenY = level.goal.y - this.camera.y
        
        // Add pulsing animation
        const pulseScale = 1 + Math.sin(Date.now() * 0.003) * 0.15
        
        // Center and size the emoji
        const centerX = screenX + level.goal.width / 2
        const centerY = screenY + level.goal.height / 2
        const emojiSize = Math.max(32, level.goal.width * 0.8)
        
        // Add golden glow effect
        this.ctx.shadowBlur = 20
        this.ctx.shadowColor = '#FFD700'
        this.ctx.shadowOffsetX = 0
        this.ctx.shadowOffsetY = 0
        
        // Apply pulsing scale
        this.ctx.translate(centerX, centerY)
        this.ctx.scale(pulseScale, pulseScale)
        this.ctx.translate(-centerX, -centerY)
        
        this.ctx.font = `${emojiSize}px serif`
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
        this.ctx.fillText(level.goal.emoji, centerX, centerY)
        
        this.ctx.restore()
      } else {
        // Fallback to sprite or color rendering
        const sprite = this.assetManager.getSprite('goal')
        
        if (sprite) {
          this.ctx.drawImage(sprite, 
            level.goal.x - this.camera.x, 
            level.goal.y - this.camera.y, 
            level.goal.width, 
            level.goal.height)
        } else {
          this.ctx.save()
          this.ctx.fillStyle = level.goal.color || '#FFD700'
          
          // Add intense sparkle effect
          this.ctx.shadowBlur = 15
          this.ctx.shadowColor = '#FFD700'
          
          this.ctx.fillRect(
            level.goal.x - this.camera.x, 
            level.goal.y - this.camera.y, 
            level.goal.width, 
            level.goal.height)
          
          this.ctx.restore()
        }
      }
    }
  }

  private isInViewport(obj: any): boolean {
    return this.isEntityInViewport(obj)
  }

  renderHealthBar(entity: Entity) {
    const barWidth = 40
    const barHeight = 6
    const x = entity.x
    const y = entity.y - 10

    // Background
    this.ctx.fillStyle = '#333'
    this.ctx.fillRect(x, y, barWidth, barHeight)

    // Health
    const healthPercent = (entity.health || 0) / (entity.maxHealth || entity.health || 1)
    this.ctx.fillStyle = healthPercent > 0.5 ? '#0F0' : healthPercent > 0.25 ? '#FF0' : '#F00'
    this.ctx.fillRect(x, y, barWidth * healthPercent, barHeight)
  }

  renderUI() {
    // Score
    this.ctx.fillStyle = '#FFF'
    this.ctx.font = 'bold 20px Arial'
    this.ctx.fillText(`Score: ${this.score}`, 10, 30)

    // Time
    this.ctx.fillText(`Time: ${Math.floor(this.gameTime)}s`, 10, 60)

    // Game-specific UI - FIXED to handle creative game type names
    const gameTypeLower = (this.gameData.gameType || '').toLowerCase()
    const isRacingGame = gameTypeLower.includes('racing') || gameTypeLower.includes('racer') || gameTypeLower.includes('car') || gameTypeLower.includes('speed')
    
    if (isRacingGame && this.player) {
      // Racing-specific UI
      const speed = Math.round(Math.abs(this.player.currentSpeed || 0))
      this.ctx.fillText(`Speed: ${speed} mph`, 10, 90)
      
      // Lap info (if available)
      if (this.player.currentLap !== undefined) {
        this.ctx.fillText(`Lap: ${this.player.currentLap}/3`, 10, 120)
      }
      
      // Position (if available)
      if (this.player.racePosition !== undefined) {
        this.ctx.fillText(`Position: ${this.player.racePosition}`, 10, 150)
      }
    } else {
      // Standard game UI
      if (this.player && this.player.health !== undefined) {
        this.ctx.fillText(`Health: ${this.player.health}/${this.player.maxHealth}`, 10, 90)
      }
      
      this.ctx.fillText(`Level: ${this.currentLevel + 1}`, 10, 120)
    }

    // Controls hint  
    this.ctx.font = '12px Arial'
    this.ctx.fillStyle = '#AAA'
    
    // Reuse the same game type detection logic
    const gameTypeForControls = (this.gameData.gameType || '').toLowerCase()
    const isSpaceGameForControls = gameTypeForControls.includes('shooter') || gameTypeForControls.includes('space') || !this.player?.physics?.gravity
    const isRacingGameForControls = gameTypeForControls.includes('racing') || gameTypeForControls.includes('racer') || gameTypeForControls.includes('car') || gameTypeForControls.includes('speed')
    
    let controls = 'F3: Debug'
    if (isRacingGameForControls) {
      controls = 'Arrows/WASD: Steer & Accelerate | Space: Boost | F3: Debug'
    } else if (isSpaceGameForControls) {
      controls = 'WASD: Move | Space: Boost | J/X: Shoot | F3: Debug'
    } else {
      controls = 'WASD/Arrows: Move | Space: Jump | J: Shoot | K: Dash | F3: Debug'
    }
    
    this.ctx.fillText(controls, 10, this.canvas.height - 10)
  }

  private renderDebugInfo() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(this.canvas.width - 200, 10, 190, 120)
    
    this.ctx.fillStyle = '#0F0'
    this.ctx.font = '12px monospace'
    this.ctx.fillText(`FPS: ${this.fps}`, this.canvas.width - 190, 30)
    this.ctx.fillText(`Entities: ${this.entities.size}`, this.canvas.width - 190, 45)
    this.ctx.fillText(`Rendered: ${this.viewportEntities.length}`, this.canvas.width - 190, 60)
    this.ctx.fillText(`Camera: ${Math.floor(this.camera.x)}, ${Math.floor(this.camera.y)}`, this.canvas.width - 190, 75)
    this.ctx.fillText(`Zoom: ${this.camera.zoom.toFixed(2)}`, this.canvas.width - 190, 90)
    
    if (this.player) {
      this.ctx.fillText(`Player: ${Math.floor(this.player.x)}, ${Math.floor(this.player.y)}`, this.canvas.width - 190, 105)
      this.ctx.fillText(`Velocity: ${this.player.velocity?.x.toFixed(1)}, ${this.player.velocity?.y.toFixed(1)}`, this.canvas.width - 190, 120)
    }
  }

  private lightenColor(color: string, percent: number): string {
    const hex = color.replace('#', '')
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + percent)
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + percent)
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + percent)
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  private darkenColor(color: string, percent: number): string {
    const hex = color.replace('#', '')
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - percent)
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - percent)
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - percent)
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  getGameState() {
    return {
      score: this.score,
      time: this.gameTime,
      isRunning: this.isRunning,
      player: this.player,
      level: this.currentLevel,
      fps: this.fps,
      entities: this.entities.size,
      camera: this.camera
    }
  }

  // Public methods for external control
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled
    this.allowDebugLogs = enabled
    console.log(`🔧 Debug mode ${enabled ? 'ENABLED' : 'DISABLED'}`)
  }

  setCulling(enabled: boolean) {
    this.cullingEnabled = enabled
  }

  setZoom(zoom: number) {
    this.camera.zoom = Math.max(0.5, Math.min(3, zoom))
  }

  setCameraMode(mode: 'follow' | 'fixed' | 'follow_smooth' | 'fixed_horizontal' | 'follow_loose' | 'fighting_focus') {
    this.cameraMode = mode
    if (mode === 'fixed') {
      this.camera.x = 0
      this.camera.y = 0
    }
  }
  
  setPhysicsMode(mode: 'default' | 'racing' | 'flappy' | 'space' | 'fighting') {
    this.physicsMode = mode
    console.log(`🔧 Physics mode set to: ${mode}`)
  }
}