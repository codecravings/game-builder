// Racing Game Fix Utility
// This ensures racing games work correctly every time

export function fixRacingGame(gameData: any): any {
  if (gameData.gameType === 'racing') {
    console.log('🔧 Applying racing game fixes...')
    
    // Find the player entity
    const playerEntity = gameData.entities?.find((e: any) => e.type === 'player')
    
    if (playerEntity) {
      console.log('🏎️ Fixing player car physics...')
      
      // FORCE correct racing physics
      playerEntity.physics = {
        gravity: false,           // CRITICAL: No gravity for cars
        maxSpeed: 10,            // Increased speed for better gameplay
        acceleration: 0.6,        // Quick acceleration  
        braking: 0.9,            // Good braking
        turning: 0.4,            // More responsive turning
        drift: 0.15,             // Improved drift
        friction: 0.05           // Low friction for racing
      }
      
      // FORCE correct racing properties
      playerEntity.currentSpeed = 0
      playerEntity.steeringAngle = 0
      playerEntity.facingAngle = 0
      
      // FORCE correct starting position for racing
      playerEntity.x = 100      // Left side of screen
      playerEntity.y = 350      // Good racing line position
      
      // FORCE correct size for racing car visibility
      playerEntity.width = 56   
      playerEntity.height = 32
      playerEntity.emojiSize = 48  // Make emoji bigger
      
      // FORCE emoji rendering
      playerEntity.emoji = '🏎️'
      playerEntity.renderMode = 'emoji'
      
      // FORCE abilities
      playerEntity.abilities = { boost: true }
      
      console.log('✅ Player car fixed:', {
        position: { x: playerEntity.x, y: playerEntity.y },
        physics: playerEntity.physics,
        emoji: playerEntity.emoji
      })
    }
    
    // Fix level for racing
    if (gameData.levels && gameData.levels[0]) {
      const level = gameData.levels[0]
      
      // Remove platforms for racing games  
      level.platforms = []
      
      // Add track boundaries as platforms for collision
      level.platforms = [
        { x: 0, y: 100, width: level.width || 1600, height: 30, color: '#696969', type: 'barrier' },
        { x: 0, y: (level.height || 800) - 150, width: level.width || 1600, height: 30, color: '#696969', type: 'barrier' }
      ]
      
      // Add racing track visual elements
      level.trackElements = [
        { x: 0, y: 130, width: level.width || 1600, height: (level.height || 800) - 280, color: '#2F4F4F', type: 'track' }
      ]
      
      // Ensure goal is reachable
      if (level.goal) {
        level.goal.x = Math.min(level.goal.x, (level.width || 1600) - 200)
        level.goal.y = 350
        level.goal.emoji = '🏁'
      }
      
      console.log('✅ Racing track fixed')
    }
    
    // Force racing controls display
    gameData.controls = {
      description: 'Racing Controls',
      keys: [
        'Arrow Keys or WASD: Steer and Accelerate',
        'Space: Boost',
        'Up/W: Accelerate',
        'Down/S: Brake',
        'Left/A: Turn Left', 
        'Right/D: Turn Right'
      ]
    }
    
    console.log('🎮 Racing controls configured')
    
    // Add racing-specific UI hints
    gameData.uiHints = {
      speed: true,
      position: true,
      lapTime: true
    }
  }
  
  return gameData
}

export function validateRacingGame(gameData: any): boolean {
  if (gameData.gameType !== 'racing') return true
  
  const player = gameData.entities?.find((e: any) => e.type === 'player')
  
  if (!player) {
    console.error('❌ Racing validation failed: No player entity')
    return false
  }
  
  if (player.physics?.gravity !== false) {
    console.error('❌ Racing validation failed: Player has gravity')
    return false
  }
  
  if (!player.physics?.maxSpeed) {
    console.error('❌ Racing validation failed: No maxSpeed')
    return false
  }
  
  if (player.currentSpeed === undefined) {
    console.error('❌ Racing validation failed: No currentSpeed')
    return false
  }
  
  console.log('✅ Racing game validation passed')
  return true
}

// Quick racing game creator for immediate testing
export function createTestRacingGame(): any {
  return {
    title: "Quick Racing Test",
    description: "Simple racing game to test car movement",
    gameType: "racing",
    visualStyle: "emoji",
    
    entities: [{
      name: "player_car", 
      type: "player",
      x: 100,
      y: 350,
      width: 48,
      height: 32,
      color: "#FF0000",
      emoji: "🏎️",
      renderMode: "emoji",
      physics: {
        gravity: false,
        maxSpeed: 8,
        acceleration: 0.5,
        braking: 0.8,
        turning: 0.3,
        drift: 0.1
      },
      abilities: { boost: true },
      currentSpeed: 0,
      steeringAngle: 0,
      facingAngle: 0
    }],
    
    levels: [{
      name: "Test Track",
      width: 1200,
      height: 600, 
      background: "#2F4F4F",
      platforms: [],  // No platforms for racing
      collectibles: [
        { type: "coin", x: 400, y: 350, points: 10, color: "#FFD700", width: 24, height: 24, emoji: "🪙" },
        { type: "boost", x: 600, y: 300, points: 0, color: "#FFFF00", width: 32, height: 32, emoji: "⚡" }
      ],
      goal: { x: 1000, y: 300, width: 64, height: 100, color: "#FFD700", emoji: "🏁" }
    }],
    
    gameLogic: {
      winCondition: "reach_goal",
      loseCondition: "crash_into_barriers", 
      scoring: { collectibles: 5, timeBonus: true }
    }
  }
}