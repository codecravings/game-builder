interface DeepSeekGameData {
  title: string
  description: string
  gameType: string
  theme?: string
  artStyle?: string
  entities: any[]
  levels: any[]
  assets?: {
    sprites?: any[]
    backgrounds?: any[]
  }
  gameLogic?: any
  touchControls?: any
  mobileFeatures?: any
}

interface EnhancedEntity {
  id: string
  name: string
  type: string
  x: number
  y: number
  width: number
  height: number
  velocity?: { x: number, y: number }
  physics?: any
  color?: string
  sprite?: string
  renderMode: 'emoji' | 'sprite' | 'color'
  emoji?: string
  emojiSize?: number
  visible: boolean
  health?: number
  maxHealth?: number
  glowEffect?: boolean
}

interface EnhancedLevel {
  id: string
  name: string
  width: number
  height: number
  background: string
  platforms: any[]
  enemies: any[]
  collectibles: any[]
  goal?: any
  backgroundImage?: string
}

export class GameDataAdapter {
  static convertToEngineFormat(deepSeekData: DeepSeekGameData): any {
    console.log('🔄 Converting DeepSeek data to engine format:', deepSeekData)
    
    // Prevent duplicate conversions by checking if already converted
    if (deepSeekData.entities?.some(e => e.id && e.velocity)) {
      console.log('🔄 Data already converted, returning as-is')
      return deepSeekData
    }
    
    // Convert entities
    const convertedEntities = this.convertEntities(deepSeekData.entities, deepSeekData.gameType, deepSeekData.assets)
    
    // Convert levels and extract all level entities
    const { levels: convertedLevels, levelEntities } = this.convertLevels(deepSeekData.levels, deepSeekData.entities, deepSeekData.assets)
    
    // Combine main entities with level entities (limit to prevent performance issues)
    const allEntities = [...convertedEntities, ...levelEntities.slice(0, 50)]
    
    console.log(`🎯 Total entities created: ${allEntities.length} (main: ${convertedEntities.length}, level: ${levelEntities.length})`)
    
    // Create engine-compatible data structure
    const engineData = {
      title: deepSeekData.title,
      description: deepSeekData.description,
      gameType: deepSeekData.gameType,
      theme: deepSeekData.theme || 'fantasy',
      
      // Enhanced entities with proper rendering (includes level entities)
      entities: allEntities,
      
      // Enhanced levels with all objects
      levels: convertedLevels,
      
      // Game settings
      settings: {
        physics: {
          gravity: deepSeekData.gameType !== 'racing' && deepSeekData.gameType !== 'shooter',
          gravityForce: 0.5,
          friction: 0.8,
          jumpForce: 12
        },
        controls: this.getControlsForGameType(deepSeekData.gameType),
        scoring: deepSeekData.gameLogic?.scoring || { collectibles: 10 },
        winCondition: deepSeekData.gameLogic?.winCondition || 'reach goal',
        loseCondition: deepSeekData.gameLogic?.loseCondition || 'fall off screen'
      },
      
      // Asset references - formatted for AssetManager
      assets: this.formatAssetsForEngine(deepSeekData.assets),
      
      // Mobile features
      mobile: {
        touchControls: deepSeekData.touchControls || { tap: 'jump', swipe: 'move' },
        optimized: deepSeekData.mobileOptimized || true
      }
    }
    
    console.log('✅ Converted engine data:', engineData)
    return engineData
  }
  
  private static convertEntities(entities: any[], gameType: string, assets?: any): EnhancedEntity[] {
    return entities.map((entity, index) => {
      const entityId = `entity_${index}`
      const hasSprite = assets?.sprites?.find(s => s.name === entity.name || s.name === entity.type)
      
      // Determine render mode and visual representation
      let renderMode: 'emoji' | 'sprite' | 'color' = 'color'
      let emoji = ''
      let color = this.validateColor(entity.color) || this.getDefaultEntityColor(entity.type, gameType)
      
      if (hasSprite) {
        renderMode = 'sprite'
      } else {
        // Use emojis for better visual representation
        emoji = this.getEntityEmoji(entity.name, entity.type, gameType)
        if (emoji) {
          renderMode = 'emoji'
        }
      }
      
      const convertedEntity: EnhancedEntity = {
        id: entityId,
        name: entity.name,
        type: entity.type,
        x: entity.x,
        y: entity.y,
        width: entity.width,
        height: entity.height,
        velocity: { x: 0, y: 0 },
        physics: this.convertPhysics(entity.physics, gameType),
        color: color,
        sprite: hasSprite ? hasSprite.name : entity.name, // Try to use sprite by name
        renderMode: hasSprite ? 'sprite' : (emoji ? 'emoji' : 'color'),
        emoji: emoji,
        emojiSize: Math.max(entity.width, entity.height) * 0.8,
        visible: true,
        glowEffect: entity.type === 'player'
      }
      
      // Add health for certain entity types
      if (entity.type === 'player' || entity.type === 'enemy') {
        convertedEntity.health = entity.health || (entity.type === 'player' ? 3 : 1)
        convertedEntity.maxHealth = convertedEntity.health
      }
      
      return convertedEntity
    })
  }
  
  private static convertLevels(levels: any[], entities: any[], assets?: any): { levels: EnhancedLevel[], levelEntities: EnhancedEntity[] } {
    const allLevelEntities: EnhancedEntity[] = []
    
    const convertedLevels = levels.map((level, index) => {
      const levelId = `level_${index}`
      
      // Convert platforms to entities
      const platformEntities = (level.platforms || []).map((platform, pIndex) => ({
        id: `platform_${index}_${pIndex}`,
        name: `platform_${pIndex}`,
        type: 'platform',
        x: platform.x,
        y: platform.y,
        width: platform.width,
        height: platform.height,
        velocity: { x: 0, y: 0 },
        color: this.validateColor(platform.color) || '#8B4513',
        renderMode: 'color' as const,
        visible: true,
        physics: { 
          static: true,
          gravity: false,
          collision: true
        }
      }))
      
      // Add platform entities to the collection
      allLevelEntities.push(...platformEntities)
      
      // Convert enemies to entities
      const enemyEntities = (level.enemies || []).map((enemy, eIndex) => ({
        id: `enemy_${index}_${eIndex}`,
        name: enemy.name || `enemy_${eIndex}`,
        type: 'enemy',
        x: enemy.x,
        y: enemy.y,
        width: enemy.width || 24,
        height: enemy.height || 24,
        velocity: { x: 0, y: 0 },
        color: this.validateColor(enemy.color) || '#FF4444',
        renderMode: 'emoji' as const,
        emoji: this.getEntityEmoji(enemy.name, 'enemy', level.gameType),
        emojiSize: Math.max(enemy.width || 24, enemy.height || 24) * 0.8,
        visible: true,
        physics: { 
          gravity: true, 
          gravityForce: 0.5,
          moveSpeed: enemy.speed || 1,
          collision: true,
          patrol: true,
          patrolDistance: 100
        },
        health: 1,
        maxHealth: 1
      }))
      
      // Add enemy entities to the collection
      allLevelEntities.push(...enemyEntities)
      
      // Convert collectibles to entities
      const collectibleEntities = (level.collectibles || []).map((collectible, cIndex) => ({
        id: `collectible_${index}_${cIndex}`,
        name: `collectible_${cIndex}`,
        type: 'collectible',
        x: collectible.x,
        y: collectible.y,
        width: collectible.width || 20,
        height: collectible.height || 20,
        velocity: { x: 0, y: 0 },
        color: this.validateColor(collectible.color) || '#FFD700',
        renderMode: 'emoji' as const,
        emoji: '💎',
        emojiSize: Math.max(collectible.width || 20, collectible.height || 20) * 0.8,
        visible: true,
        physics: { 
          static: true,
          gravity: false,
          collision: true
        },
        points: collectible.points || 10
      }))
      
      // Add collectible entities to the collection
      allLevelEntities.push(...collectibleEntities)
      
      // Convert goal to entity
      const goalEntity = level.goal ? [{
        id: `goal_${index}`,
        name: 'goal',
        type: 'goal',
        x: level.goal.x,
        y: level.goal.y,
        width: level.goal.width,
        height: level.goal.height,
        velocity: { x: 0, y: 0 },
        color: '#32CD32',
        renderMode: 'emoji' as const,
        emoji: '🚩',
        emojiSize: Math.max(level.goal.width, level.goal.height) * 0.8,
        visible: true,
        physics: { 
          static: true,
          gravity: false,
          collision: true
        },
        glowEffect: true
      }] : []
      
      // Add goal entity to the collection if it exists
      if (goalEntity.length > 0) {
        allLevelEntities.push(...goalEntity)
      }
      
      // Find background asset from the formatted assets
      const backgroundAsset = assets?.backgrounds?.find(bg => 
        bg.name === 'background' || bg.id === 'background'
      )
      
      const convertedLevel: EnhancedLevel = {
        id: levelId,
        name: level.name,
        width: level.width,
        height: level.height,
        background: level.background || '#87CEEB',
        backgroundImage: backgroundAsset?.name || 'background', // Use asset name for lookup
        platforms: platformEntities,
        enemies: enemyEntities,
        collectibles: collectibleEntities,
        goal: goalEntity[0] || null
      }
      
      return convertedLevel
    })
    
    return {
      levels: convertedLevels,
      levelEntities: allLevelEntities
    }
  }
  
  private static convertPhysics(physics: any, gameType: string): any {
    if (!physics) {
      return this.getDefaultPhysicsForGameType(gameType)
    }
    
    return {
      gravity: physics.gravity !== undefined ? physics.gravity : gameType !== 'racing',
      gravityForce: physics.gravityForce || 0.5,
      jumpForce: physics.jumpPower || physics.jumpForce || 12,
      moveSpeed: physics.speed || 5,
      maxSpeed: physics.maxSpeed || 10,
      friction: physics.friction || 0.8,
      bounce: physics.bounce || 0,
      collision: physics.collision !== false,
      mobile: physics.mobile !== false
    }
  }
  
  private static getDefaultPhysicsForGameType(gameType: string): any {
    const physicsMap = {
      platformer: {
        gravity: true,
        gravityForce: 0.5,
        jumpForce: 12,
        moveSpeed: 5,
        friction: 0.8,
        collision: true
      },
      flappy: {
        gravity: true,
        gravityForce: 0.4,
        jumpForce: 8,
        moveSpeed: 3,
        friction: 0.9,
        collision: true
      },
      racing: {
        gravity: false,
        gravityForce: 0,
        jumpForce: 0,
        moveSpeed: 8,
        maxSpeed: 15,
        friction: 0.95,
        collision: true,
        turning: 0.1
      },
      shooter: {
        gravity: false,
        gravityForce: 0,
        jumpForce: 0,
        moveSpeed: 6,
        friction: 0.9,
        collision: true
      }
    }
    
    return physicsMap[gameType] || physicsMap.platformer
  }
  
  private static getControlsForGameType(gameType: string): any {
    const controlsMap = {
      platformer: {
        left: ['a', 'A', 'ArrowLeft'],
        right: ['d', 'D', 'ArrowRight'],
        jump: ['w', 'W', 'ArrowUp', ' ', 'Space']
      },
      flappy: {
        flap: ['w', 'W', 'ArrowUp', ' ', 'Space', 'Click']
      },
      racing: {
        left: ['a', 'A', 'ArrowLeft'],
        right: ['d', 'D', 'ArrowRight'],
        accelerate: ['w', 'W', 'ArrowUp'],
        brake: ['s', 'S', 'ArrowDown']
      },
      shooter: {
        left: ['a', 'A', 'ArrowLeft'],
        right: ['d', 'D', 'ArrowRight'],
        up: ['w', 'W', 'ArrowUp'],
        down: ['s', 'S', 'ArrowDown'],
        shoot: [' ', 'Space']
      }
    }
    
    return controlsMap[gameType] || controlsMap.platformer
  }
  
  private static getEntityEmoji(name: string, type: string, gameType?: string): string {
    const nameEmojis = {
      // Player characters
      'player': '🤖',
      'hero': '🦸',
      'ninja': '🥷',
      'spaceship': '🚀',
      'car': '🏎️',
      'player_car': '🏎️',
      'bird': '🐦',
      
      // Enemies
      'goomba': '🍄',
      'goomba1': '🍄',
      'goomba2': '🍄',
      'alien': '👾',
      'alien1': '👾',
      'alien2': '👾',
      'alien3': '👾',
      'rival_car1': '🚗',
      'rival_car2': '🚙',
      'pipe': '🟢',
      'pipe_top': '🟢',
      'pipe_bottom': '🟢',
      'asteroid': '☄️',
      'asteroid1': '☄️',
      'asteroid2': '☄️',
      
      // Objects
      'platform': '🟫',
      'collectible': '💎',
      'goal': '🚩',
      'coin': '🪙',
      'star': '⭐',
      'gem': '💎'
    }
    
    // Try exact name match first
    if (nameEmojis[name.toLowerCase()]) {
      return nameEmojis[name.toLowerCase()]
    }
    
    // Try type-based emojis
    const typeEmojis = {
      'player': gameType === 'racing' ? '🏎️' : gameType === 'shooter' ? '🚀' : gameType === 'flappy' ? '🐦' : '🤖',
      'enemy': gameType === 'racing' ? '🚗' : gameType === 'shooter' ? '👾' : gameType === 'flappy' ? '🟢' : '🍄',
      'collectible': '💎',
      'platform': '🟫',
      'goal': '🚩',
      'obstacle': '⚠️'
    }
    
    return typeEmojis[type] || '⬜'
  }
  
  private static validateColor(color: string): string | null {
    if (!color || typeof color !== 'string') return null
    
    // Remove any invalid characters or multiple colors
    const cleanColor = color.split(',')[0].trim()
    
    // Check if it's a valid hex color
    if (/^#[0-9A-F]{6}$/i.test(cleanColor)) {
      return cleanColor
    }
    
    // Check if it's a valid 3-digit hex color
    if (/^#[0-9A-F]{3}$/i.test(cleanColor)) {
      return cleanColor
    }
    
    // Check basic color names
    const validColors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white', 'gray', 'grey']
    if (validColors.includes(cleanColor.toLowerCase())) {
      return cleanColor
    }
    
    return null
  }
  
  private static getDefaultEntityColor(type: string, gameType: string): string {
    const colorMap = {
      player: '#00BFFF',
      enemy: '#FF4444',
      platform: '#8B4513',
      collectible: '#FFD700',
      goal: '#32CD32',
      obstacle: '#FF6B6B'
    }
    
    return colorMap[type] || '#CCCCCC'
  }

  private static formatAssetsForEngine(assets?: any): any {
    if (!assets) return { sprites: [], backgrounds: [], audio: [] }
    
    const formattedAssets = {
      sprites: [],
      backgrounds: [],
      audio: []
    }
    
    // Format sprites for AssetManager
    if (assets.sprites && Array.isArray(assets.sprites)) {
      formattedAssets.sprites = assets.sprites.map((sprite, index) => ({
        id: sprite.name || `sprite_${index}`,
        name: sprite.name || `sprite_${index}`,
        url: sprite.url,
        type: 'sprite',
        width: sprite.width,
        height: sprite.height
      }))
    }
    
    // Format backgrounds for AssetManager
    if (assets.backgrounds && Array.isArray(assets.backgrounds)) {
      formattedAssets.backgrounds = assets.backgrounds.map((bg, index) => ({
        id: bg.name || `background_${index}`,
        name: bg.name || `background_${index}`,
        url: bg.url,
        type: 'sprite',
        width: bg.width,
        height: bg.height
      }))
    }
    
    console.log('🎨 Formatted assets for engine:', formattedAssets)
    return formattedAssets
  }
}