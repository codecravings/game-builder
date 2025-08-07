import { ParticleSystem } from './ParticleSystem'

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
  visible?: boolean
  solid?: boolean
  [key: string]: any
}

export interface Platform {
  x: number
  y: number
  width: number
  height: number
  color?: string
  sprite?: string
  solid?: boolean
  type?: string
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
}

export interface GameData {
  title: string
  description: string
  gameType: string
  entities: Entity[]
  levels: GameLevel[]
  gameLogic?: {
    winCondition?: string
    loseCondition?: string
    scoring?: any
    specialMechanics?: any
  }
  [key: string]: any
}

export class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private gameData: GameData
  private currentLevel: number = 0
  private entities: Map<string, Entity> = new Map()
  private collectibles: Map<string, Collectible> = new Map()
  private traps: Map<string, Trap> = new Map()
  private keys: Set<string> = new Set()
  private camera = { x: 0, y: 0 }
  private score = 0
  private gameTime = 0
  private isRunning = false
  private lastTime = 0
  private player: Entity | null = null
  private particles = new ParticleSystem()

  constructor(canvas: HTMLCanvasElement, gameData: GameData) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.gameData = gameData
    this.init()
  }

  init() {
    this.setupCanvas()
    this.setupEntities()
    this.setupLevel()
    this.setupControls()
    this.player = this.entities.get('player') || null
  }

  setupCanvas() {
    this.canvas.width = 800
    this.canvas.height = 600
    this.canvas.style.background = '#000'
  }

  setupEntities() {
    this.entities.clear()
    this.gameData.entities.forEach((entityData, index) => {
      const entity: Entity = {
        ...entityData,
        id: entityData.name || `entity_${index}`,
        velocity: { x: 0, y: 0 },
        visible: true,
        solid: entityData.type === 'player' || entityData.type === 'enemy'
      }
      
      // Set default physics if not provided
      if (!entity.physics) {
        entity.physics = {
          gravity: entity.type === 'player' || entity.type === 'enemy',
          gravityForce: 0.8,
          jumpForce: 15,
          moveSpeed: 5,
          friction: 0.8
        }
      }

      // Ensure entity has a color
      if (!entity.color) {
        entity.color = entity.type === 'player' ? '#00FFFF' : 
                      entity.type === 'enemy' ? '#FF4500' : '#FF6B6B'
      }

      this.entities.set(entity.id, entity)
    })
  }

  setupLevel() {
    const level = this.gameData.levels[this.currentLevel]
    if (!level) return

    // Setup collectibles
    this.collectibles.clear()
    if (level.collectibles) {
      level.collectibles.forEach((collectible, index) => {
        this.collectibles.set(`collectible_${index}`, {
          ...collectible,
          id: `collectible_${index}`,
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
        this.traps.set(`trap_${index}`, {
          ...trap,
          id: `trap_${index}`,
          active: true,
          color: trap.color || '#FF0000'
        })
      })
    }
  }

  setupControls() {
    document.addEventListener('keydown', (e) => {
      this.keys.add(e.code)
      e.preventDefault()
    })

    document.addEventListener('keyup', (e) => {
      this.keys.delete(e.code)
      e.preventDefault()
    })
  }

  start() {
    this.isRunning = true
    this.lastTime = performance.now()
    this.gameLoop()
  }

  stop() {
    this.isRunning = false
  }

  pause() {
    this.isRunning = !this.isRunning
    if (this.isRunning) {
      this.lastTime = performance.now()
      this.gameLoop()
    }
  }

  gameLoop = (currentTime: number = performance.now()) => {
    if (!this.isRunning) return

    const deltaTime = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime

    this.update(deltaTime)
    this.render()

    requestAnimationFrame(this.gameLoop)
  }

  update(deltaTime: number) {
    this.gameTime += deltaTime
    
    // Update entities
    this.entities.forEach(entity => {
      this.updateEntity(entity, deltaTime)
    })

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

  updateEntity(entity: Entity, deltaTime: number) {
    if (!entity.velocity) entity.velocity = { x: 0, y: 0 }

    // Handle player input
    if (entity.type === 'player' && this.player === entity) {
      this.handlePlayerInput(entity, deltaTime)
    }

    // Apply physics
    if (entity.physics?.gravity && entity.velocity) {
      entity.velocity.y += (entity.physics.gravityForce || 0.8) * 60 * deltaTime
    }

    // Apply friction
    if (entity.physics?.friction && entity.velocity) {
      entity.velocity.x *= Math.pow(entity.physics.friction, deltaTime * 60)
    }

    // Update position
    if (entity.velocity) {
      entity.x += entity.velocity.x * deltaTime * 60
      entity.y += entity.velocity.y * deltaTime * 60
    }

    // Keep entities in bounds
    const level = this.gameData.levels[this.currentLevel]
    entity.x = Math.max(0, Math.min(level.width - entity.width, entity.x))
    entity.y = Math.max(0, Math.min(level.height - entity.height, entity.y))
  }

  handlePlayerInput(player: Entity, _deltaTime: number) {
    if (!player.velocity || !player.physics) return

    const moveSpeed = player.physics.moveSpeed || 5
    const jumpForce = player.physics.jumpForce || 15

    // Movement
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) {
      player.velocity.x = -moveSpeed
    }
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) {
      player.velocity.x = moveSpeed
    }

    // Jumping
    if ((this.keys.has('KeyW') || this.keys.has('ArrowUp') || this.keys.has('Space')) && this.isOnGround(player)) {
      player.velocity.y = -jumpForce
      this.particles.createJumpEffect(player.x + player.width/2, player.y + player.height)
    }

    // Special abilities
    if (player.abilities) {
      if (this.keys.has('KeyJ') && player.abilities.shuriken) {
        this.throwShuriken(player)
      }
      if (this.keys.has('KeyK') && player.abilities.dash) {
        this.dash(player)
      }
    }
  }

  isOnGround(entity: Entity): boolean {
    const level = this.gameData.levels[this.currentLevel]
    
    // Check against platforms
    for (const platform of level.platforms) {
      if (entity.x < platform.x + platform.width &&
          entity.x + entity.width > platform.x &&
          entity.y + entity.height >= platform.y &&
          entity.y + entity.height <= platform.y + 10) {
        return true
      }
    }

    // Check against ground
    if (entity.y + entity.height >= level.height - 50) {
      return true
    }

    return false
  }

  checkCollisions() {
    if (!this.player) return

    const level = this.gameData.levels[this.currentLevel]

    // Platform collisions
    level.platforms.forEach(platform => {
      if (this.checkCollision(this.player!, platform)) {
        this.resolveCollision(this.player!, platform)
      }
    })

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

    // Simple top collision (landing on platform)
    if (entity.velocity.y > 0 && 
        entity.y < platform.y &&
        entity.y + entity.height > platform.y) {
      entity.y = platform.y - entity.height
      entity.velocity.y = 0
    }
  }

  collectItem(collectible: Collectible) {
    collectible.collected = true
    this.score += collectible.points
    this.particles.createExplosion(collectible.x + collectible.width!/2, collectible.y + collectible.height!/2, '#FFD700')
  }

  hitTrap(entity: Entity, trap: Trap) {
    if (entity.health !== undefined) {
      entity.health -= trap.damage
      if (entity.health <= 0) {
        this.gameOver()
      }
    }
  }

  throwShuriken(player: Entity) {
    // Create a shuriken projectile
    const shuriken: Entity = {
      id: `shuriken_${Date.now()}`,
      name: 'shuriken',
      type: 'projectile',
      x: player.x + player.width / 2,
      y: player.y + player.height / 2,
      width: 8,
      height: 8,
      velocity: { x: player.velocity!.x >= 0 ? 10 : -10, y: 0 },
      color: '#C0C0C0',
      visible: true,
      solid: false,
      physics: { gravity: false }
    }
    
    this.entities.set(shuriken.id, shuriken)
    
    // Remove shuriken after 3 seconds
    setTimeout(() => {
      this.entities.delete(shuriken.id)
    }, 3000)
  }

  dash(player: Entity) {
    if (!player.velocity) return
    
    // Dash in facing direction
    const dashForce = 15
    const direction = player.velocity.x >= 0 ? 1 : -1
    
    player.velocity.x = dashForce * direction
    
    // Add invincibility frames
    player.invincible = true
    setTimeout(() => {
      player.invincible = false
    }, 200)
  }

  updateCamera() {
    if (!this.player) return

    const level = this.gameData.levels[this.currentLevel]
    
    // Center camera on player
    this.camera.x = this.player.x - this.canvas.width / 2
    this.camera.y = this.player.y - this.canvas.height / 2

    // Keep camera in bounds
    this.camera.x = Math.max(0, Math.min(level.width - this.canvas.width, this.camera.x))
    this.camera.y = Math.max(0, Math.min(level.height - this.canvas.height, this.camera.y))
  }

  updateCollectibles(_deltaTime: number) {
    this.collectibles.forEach(collectible => {
      if (collectible.floating) {
        // Add floating animation
        collectible.y += Math.sin(this.gameTime * 3) * 0.5
      }
    })
  }

  checkGameState() {
    // TODO: Implement win/lose condition checks
  }

  reachGoal() {
    // TODO: Implement level completion
    console.log('Level completed!')
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
    this.ctx.translate(-this.camera.x, -this.camera.y)

    // Render background
    this.ctx.fillStyle = level.background
    this.ctx.fillRect(0, 0, level.width, level.height)

    // Render platforms
    level.platforms.forEach(platform => {
      this.ctx.fillStyle = platform.color || '#8B4513'
      this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
    })

    // Render collectibles
    this.collectibles.forEach(collectible => {
      if (!collectible.collected) {
        this.ctx.fillStyle = collectible.color || '#FFD700'
        this.ctx.fillRect(collectible.x, collectible.y, collectible.width!, collectible.height!)
        
        // Add glow effect for floating collectibles
        if (collectible.floating) {
          this.ctx.shadowBlur = 10
          this.ctx.shadowColor = collectible.color || '#FFD700'
          this.ctx.fillRect(collectible.x, collectible.y, collectible.width!, collectible.height!)
          this.ctx.shadowBlur = 0
        }
      }
    })

    // Render traps
    this.traps.forEach(trap => {
      if (trap.active) {
        this.ctx.fillStyle = trap.color || '#FF0000'
        this.ctx.fillRect(trap.x, trap.y, trap.width, trap.height)
      }
    })

    // Render entities
    this.entities.forEach(entity => {
      if (entity.visible) {
        this.ctx.fillStyle = entity.color || (entity.type === 'player' ? '#00FF00' : '#FF6B6B')
        this.ctx.fillRect(entity.x, entity.y, entity.width, entity.height)
        
        // Render health bar for player
        if (entity.type === 'player' && entity.health !== undefined) {
          this.renderHealthBar(entity)
        }
      }
    })

    // Render goal
    if (level.goal) {
      this.ctx.fillStyle = level.goal.color || '#FFD700'
      this.ctx.fillRect(level.goal.x, level.goal.y, level.goal.width, level.goal.height)
      
      // Add sparkle effect
      this.ctx.shadowBlur = 15
      this.ctx.shadowColor = '#FFD700'
      this.ctx.fillRect(level.goal.x, level.goal.y, level.goal.width, level.goal.height)
      this.ctx.shadowBlur = 0
    }

    // Render particles
    this.particles.render(this.ctx)

    // Restore camera transform
    this.ctx.restore()

    // Render UI (not affected by camera)
    this.renderUI()
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
    this.ctx.font = '20px Arial'
    this.ctx.fillText(`Score: ${this.score}`, 10, 30)

    // Time
    this.ctx.fillText(`Time: ${Math.floor(this.gameTime)}s`, 10, 60)

    // Player health
    if (this.player && this.player.health !== undefined) {
      this.ctx.fillText(`Health: ${this.player.health}`, 10, 90)
    }

    // Instructions
    this.ctx.font = '12px Arial'
    this.ctx.fillStyle = '#AAA'
    this.ctx.fillText('WASD/Arrows: Move | Space: Jump | J: Shuriken | K: Dash', 10, this.canvas.height - 10)
  }

  getGameState() {
    return {
      score: this.score,
      time: this.gameTime,
      isRunning: this.isRunning,
      player: this.player,
      level: this.currentLevel
    }
  }
}