// Game Type Router - Selects appropriate engine based on game type
import { EnhancedGameEngine } from './EnhancedGameEngine'

export interface GameTypeConfig {
  gameType: string
  controls: string[]
  physics: {
    gravity: boolean
    movement: '2d' | '8way' | 'racing' | 'puzzle'
    collisionType: 'platform' | 'boundary' | 'grid' | 'none'
  }
  camera: {
    follow: boolean
    bounds: boolean
    zoom: number
  }
  ui: {
    showHealth: boolean
    showScore: boolean
    showSpeed: boolean
    showLaps: boolean
    customHUD: string[]
  }
}

export const GAME_TYPE_CONFIGS: { [key: string]: GameTypeConfig } = {
  platformer: {
    gameType: 'platformer',
    controls: ['WASD', 'Space', 'Shift'],
    physics: {
      gravity: true,
      movement: '2d',
      collisionType: 'platform'
    },
    camera: {
      follow: true,
      bounds: true,
      zoom: 1
    },
    ui: {
      showHealth: true,
      showScore: true,
      showSpeed: false,
      showLaps: false,
      customHUD: ['lives', 'collectibles']
    }
  },
  
  shooter: {
    gameType: 'shooter',
    controls: ['WASD', 'Space', 'Mouse'],
    physics: {
      gravity: false,
      movement: '8way',
      collisionType: 'boundary'
    },
    camera: {
      follow: true,
      bounds: true,
      zoom: 1
    },
    ui: {
      showHealth: true,
      showScore: true,
      showSpeed: false,
      showLaps: false,
      customHUD: ['ammo', 'shields', 'wave']
    }
  },
  
  racing: {
    gameType: 'racing',
    controls: ['Arrows', 'Space'],
    physics: {
      gravity: false,
      movement: 'racing',
      collisionType: 'boundary'
    },
    camera: {
      follow: true,
      bounds: false,
      zoom: 0.8
    },
    ui: {
      showHealth: false,
      showScore: false,
      showSpeed: true,
      showLaps: true,
      customHUD: ['position', 'lapTime', 'bestLap']
    }
  },
  
  flappy: {
    gameType: 'flappy',
    controls: ['Space', 'Click'],
    physics: {
      gravity: true,
      movement: '2d',
      collisionType: 'platform'
    },
    camera: {
      follow: false,
      bounds: false,
      zoom: 1
    },
    ui: {
      showHealth: false,
      showScore: true,
      showSpeed: false,
      showLaps: false,
      customHUD: ['highScore', 'pipes']
    }
  },
  
  tetris: {
    gameType: 'puzzle',
    controls: ['Arrows', 'Space'],
    physics: {
      gravity: false,
      movement: 'puzzle',
      collisionType: 'grid'
    },
    camera: {
      follow: false,
      bounds: false,
      zoom: 1
    },
    ui: {
      showHealth: false,
      showScore: true,
      showSpeed: false,
      showLaps: false,
      customHUD: ['level', 'lines', 'nextPiece']
    }
  },
  
  puzzle: {
    gameType: 'puzzle',
    controls: ['Arrows', 'Space'],
    physics: {
      gravity: false,
      movement: 'puzzle',
      collisionType: 'grid'
    },
    camera: {
      follow: false,
      bounds: false,
      zoom: 1
    },
    ui: {
      showHealth: false,
      showScore: true,
      showSpeed: false,
      showLaps: false,
      customHUD: ['level', 'moves', 'objectives']
    }
  },
  
  fighting: {
    gameType: 'fighting',
    controls: ['WASD', 'JKL', 'Space'],
    physics: {
      gravity: true,
      movement: '2d',
      collisionType: 'platform'
    },
    camera: {
      follow: true,
      bounds: true,
      zoom: 1.2
    },
    ui: {
      showHealth: true,
      showScore: false,
      showSpeed: false,
      showLaps: false,
      customHUD: ['comboMeter', 'specialMeter', 'roundTimer']
    }
  },
  
  tower_defense: {
    gameType: 'tower_defense',
    controls: ['Mouse', 'Scroll'],
    physics: {
      gravity: false,
      movement: 'puzzle',
      collisionType: 'none'
    },
    camera: {
      follow: false,
      bounds: true,
      zoom: 0.7
    },
    ui: {
      showHealth: false,
      showScore: false,
      showSpeed: false,
      showLaps: false,
      customHUD: ['gold', 'wave', 'lives', 'buildMenu']
    }
  },
  
  endless_runner: {
    gameType: 'endless_runner',
    controls: ['Space', 'ArrowDown'],
    physics: {
      gravity: true,
      movement: '2d',
      collisionType: 'platform'
    },
    camera: {
      follow: true,
      bounds: false,
      zoom: 1
    },
    ui: {
      showHealth: false,
      showScore: true,
      showSpeed: true,
      showLaps: false,
      customHUD: ['distance', 'coins', 'multiplier']
    }
  },
  
  match3: {
    gameType: 'match3',
    controls: ['Mouse', 'Click'],
    physics: {
      gravity: false,
      movement: 'puzzle',
      collisionType: 'grid'
    },
    camera: {
      follow: false,
      bounds: false,
      zoom: 1
    },
    ui: {
      showHealth: false,
      showScore: true,
      showSpeed: false,
      showLaps: false,
      customHUD: ['moves', 'objectives', 'powerups']
    }
  }
}

export class GameTypeRouter {
  // Intelligent game type detection from game content
  static detectGameTypeFromContent(gameData: any): string {
    if (!gameData) return 'platformer'
    
    const title = (gameData.title || '').toLowerCase()
    const description = (gameData.description || '').toLowerCase()
    const entities = gameData.entities || []
    const levels = gameData.levels || []
    
    // Analyze content for game type indicators
    const content = `${title} ${description}`.toLowerCase()
    
    // Racing game detection
    if (content.includes('race') || content.includes('car') || content.includes('speed') ||
        content.includes('track') || content.includes('lap') || 
        entities.some((e: any) => e.emoji?.includes('🏎️') || e.emoji?.includes('🚗') || e.name?.includes('car'))) {
      return 'racing'
    }
    
    // Tetris/Puzzle detection
    if (content.includes('tetris') || content.includes('block') || content.includes('puzzle') ||
        content.includes('falling') || content.includes('clear') ||
        levels.some((l: any) => l.grid || l.gameBoard)) {
      return 'tetris'
    }
    
    // Flappy Bird detection
    if (content.includes('flappy') || content.includes('bird') || content.includes('fly') ||
        content.includes('tap') || content.includes('pipe') ||
        entities.some((e: any) => e.emoji?.includes('🐦') || e.physics?.jumpForce > 15)) {
      return 'flappy'
    }
    
    // Shooter detection
    if (content.includes('shoot') || content.includes('space') || content.includes('laser') ||
        content.includes('alien') || content.includes('enemy') ||
        entities.some((e: any) => e.abilities?.shooting || e.weaponType)) {
      return 'shooter'
    }
    
    // Fighting game detection
    if (content.includes('fight') || content.includes('combat') || content.includes('battle') ||
        content.includes('combo') || content.includes('punch') ||
        entities.some((e: any) => e.combat || e.emoji?.includes('🥋') || e.emoji?.includes('🥊'))) {
      return 'fighting'
    }
    
    // Tower Defense detection
    if (content.includes('tower') || content.includes('defense') || content.includes('wave') ||
        content.includes('castle') || 
        levels.some((l: any) => l.waves || l.path || l.buildableAreas)) {
      return 'tower_defense'
    }
    
    // Endless Runner detection
    if (content.includes('endless') || content.includes('runner') || content.includes('temple') ||
        content.includes('obstacle') || 
        levels.some((l: any) => l.effects?.autoScroll || l.width > 50000)) {
      return 'endless_runner'
    }
    
    // Default to platformer
    return 'platformer'
  }
  
  static getConfig(gameType: string, gameData?: any): GameTypeConfig {
    // First try intelligent detection if we have game data
    if (gameData) {
      const detectedType = this.detectGameTypeFromContent(gameData)
      if (detectedType !== 'platformer' || !gameType || gameType === 'undefined') {
        console.log(`🎯 Detected game type: ${detectedType} from content analysis`)
        gameType = detectedType
      }
    }
    
    // Normalize game type names
    const normalizedType = gameType?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'platformer'
    
    // Check for exact matches first
    if (GAME_TYPE_CONFIGS[normalizedType]) {
      return GAME_TYPE_CONFIGS[normalizedType]
    }
    
    // Check for partial matches
    for (const [key, config] of Object.entries(GAME_TYPE_CONFIGS)) {
      if (normalizedType.includes(key) || key.includes(normalizedType)) {
        return config
      }
    }
    
    // Enhanced keyword detection
    const keywordMap = {
      racing: ['race', 'car', 'speed', 'track', 'lap', 'drift', 'boost'],
      tetris: ['tetris', 'block', 'puzzle', 'falling', 'clear', 'line', 'grid'],
      flappy: ['flappy', 'bird', 'fly', 'tap', 'pipe', 'wing'],
      shooter: ['shoot', 'space', 'laser', 'alien', 'bullet', 'weapon'],
      fighting: ['fight', 'combat', 'battle', 'combo', 'punch', 'kick'],
      tower_defense: ['tower', 'defense', 'wave', 'castle', 'enemy'],
      endless_runner: ['endless', 'runner', 'temple', 'obstacle', 'dash']
    }
    
    for (const [type, keywords] of Object.entries(keywordMap)) {
      if (keywords.some(keyword => normalizedType.includes(keyword))) {
        return GAME_TYPE_CONFIGS[type as keyof typeof GAME_TYPE_CONFIGS]
      }
    }
    
    // Default to platformer for unknown types
    console.warn(`Unknown game type: ${gameType}, defaulting to platformer`)
    return GAME_TYPE_CONFIGS.platformer
  }
  
  static createEngine(canvas: HTMLCanvasElement, gameData: any): EnhancedGameEngine {
    // Get config with intelligent detection
    const config = this.getConfig(gameData.gameType || 'platformer', gameData)
    
    // Update gameData with detected/corrected game type
    const correctedGameType = config.gameType
    if (gameData.gameType !== correctedGameType) {
      console.log(`🔧 Correcting game type from '${gameData.gameType}' to '${correctedGameType}'`)
      gameData.gameType = correctedGameType
    }
    
    // Apply game type specific corrections to game data
    const correctedGameData = this.applyGameTypeCorrections(gameData, config)
    
    // Enhance game data with type-specific settings
    const enhancedGameData = {
      ...correctedGameData,
      gameTypeConfig: config
    }
    
    const engine = new EnhancedGameEngine(canvas, enhancedGameData)
    
    // Apply type-specific engine settings
    this.configureEngineForGameType(engine, config)
    
    return engine
  }
  
  // Apply corrections based on game type
  private static applyGameTypeCorrections(gameData: any, config: GameTypeConfig): any {
    const corrected = { ...gameData }
    
    // Fix entities based on game type
    if (corrected.entities) {
      corrected.entities = corrected.entities.map((entity: any) => {
        if (entity.type === 'player') {
          const fixedEntity = { ...entity }
          
          // Racing game fixes
          if (config.gameType === 'racing') {
            fixedEntity.physics = {
              ...fixedEntity.physics,
              gravity: false,
              maxSpeed: fixedEntity.physics?.maxSpeed || 10,
              acceleration: fixedEntity.physics?.acceleration || 0.4,
              braking: fixedEntity.physics?.braking || 0.6,
              turning: fixedEntity.physics?.turning || 0.25
            }
            fixedEntity.currentSpeed = 0
            fixedEntity.steeringAngle = 0
            fixedEntity.facingAngle = 0
          }
          
          // Flappy game fixes
          else if (config.gameType === 'flappy') {
            fixedEntity.physics = {
              ...fixedEntity.physics,
              gravity: true,
              gravityForce: fixedEntity.physics?.gravityForce || 1.2,
              jumpForce: fixedEntity.physics?.jumpForce || 18,
              moveSpeed: 0 // No horizontal movement
            }
          }
          
          // Shooter game fixes
          else if (config.gameType === 'shooter') {
            fixedEntity.physics = {
              ...fixedEntity.physics,
              gravity: false,
              moveSpeed: fixedEntity.physics?.moveSpeed || 8
            }
            fixedEntity.abilities = {
              ...fixedEntity.abilities,
              shooting: true
            }
          }
          
          // Puzzle game fixes
          else if (config.gameType === 'puzzle' || config.gameType === 'tetris') {
            fixedEntity.physics = {
              ...fixedEntity.physics,
              gravity: config.gameType === 'tetris',
              moveSpeed: 32 // Grid-based movement
            }
          }
          
          return fixedEntity
        }
        return entity
      })
    }
    
    return corrected
  }
  
  private static configureEngineForGameType(engine: EnhancedGameEngine, config: GameTypeConfig) {
    // Set camera zoom
    engine.setZoom(config.camera.zoom)
    
    // Configure camera behavior based on game type
    if (!config.camera.follow) {
      // Disable camera following for puzzle games, etc.
      engine.setCameraMode('fixed')
    }
    
    // Set culling based on game type
    if (config.gameType === 'puzzle' || config.gameType === 'match3' || config.gameType === 'tetris') {
      engine.setCulling(false) // Disable culling for grid-based games
    }
    
    // Racing game specific configurations
    if (config.gameType === 'racing') {
      engine.setPhysicsMode('racing')
      engine.setCameraMode('follow_smooth')
    }
    
    // Flappy game specific configurations
    if (config.gameType === 'flappy') {
      engine.setPhysicsMode('flappy')
      engine.setCameraMode('fixed_horizontal')
    }
    
    // Shooter game specific configurations
    if (config.gameType === 'shooter') {
      engine.setPhysicsMode('space')
      engine.setCameraMode('follow_loose')
    }
    
    // Fighting game specific configurations
    if (config.gameType === 'fighting') {
      engine.setPhysicsMode('fighting')
      engine.setCameraMode('fighting_focus')
    }
    
    console.log(`🎮 Engine configured for ${config.gameType} with physics: ${config.physics.movement}`)
  }
  
  static generateControlsHint(gameType: string): string {
    const config = this.getConfig(gameType)
    
    const hints: { [key: string]: string } = {
      platformer: 'WASD/Arrows: Move | Space: Jump | Shift: Dash',
      shooter: 'WASD: Move | Space: Shoot | Mouse: Aim | Shift: Boost',
      racing: 'Up/Down: Accelerate/Brake | Left/Right: Steer | Space: Boost',
      flappy: 'Space/Click: Flap Wings | Avoid Obstacles',
      puzzle: 'Arrows: Move Piece | Space: Rotate | Down: Drop',
      tetris: 'Arrows: Move/Rotate | Down: Fast Drop | Space: Instant Drop',
      fighting: 'WASD: Move | J: Punch | K: Kick | L: Block | Space: Jump',
      tower_defense: 'Mouse: Select/Build | Scroll: Zoom | Click: Place Tower',
      endless_runner: 'Space: Jump | Down: Slide | Avoid Obstacles',
      match3: 'Click: Select Gem | Drag: Swap Gems | Make Matches of 3+'
    }
    
    return hints[config.gameType] || hints.platformer
  }
}

export default GameTypeRouter