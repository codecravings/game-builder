import { RobustJSONParser } from '../utils/jsonParser'
import { GamePersistenceManager } from './gamePersistence'
import { AssetManager } from './assetManager'
import { getGameTemplate, customizeTemplate } from './gameTemplates'

const DEEPSEEK_API_KEY = process.env.VITE_DEEPSEEK_API_KEY || 'your-deepseek-api-key-here'
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

interface GameOptions {
  visualStyle: string
  assetLevel: string
  audioEnabled: boolean
  musicEnabled: boolean
  complexity: string
  genre: string
  theme: string
}

interface GenerationProgress {
  (message: string): void
}

// Asset libraries based on options
const ASSET_LIBRARIES = {
  pixel: {
    player: { color: '#FF6B6B', width: 16, height: 24 },
    platform: { color: '#8B4513', texture: 'pixelated' },
    collectible: { color: '#FFD700', effect: 'sparkle' },
    enemy: { color: '#8B0000', pattern: 'geometric' }
  },
  cartoon: {
    player: { color: '#4ECDC4', width: 32, height: 48 },
    platform: { color: '#98D8C8', texture: 'rounded' },
    collectible: { color: '#F7DC6F', effect: 'bounce' },
    enemy: { color: '#E74C3C', pattern: 'organic' }
  },
  cyberpunk: {
    player: { color: '#00FFFF', width: 24, height: 36 },
    platform: { color: '#4A148C', texture: 'neon_grid' },
    collectible: { color: '#FF1493', effect: 'digital_glow' },
    enemy: { color: '#FF4500', pattern: 'circuit' }
  },
  fantasy: {
    player: { color: '#DEB887', width: 28, height: 42 },
    platform: { color: '#8FBC8F', texture: 'stone' },
    collectible: { color: '#FFD700', effect: 'magical_sparkle' },
    enemy: { color: '#696969', pattern: 'mystical' }
  }
}

const COMPLEXITY_TEMPLATES = {
  simple: {
    mechanics: ['movement', 'jumping', 'collecting'],
    levels: 1,
    entities: 3,
    features: 'Basic gameplay with simple objectives'
  },
  medium: {
    mechanics: ['movement', 'jumping', 'collecting', 'combat', 'power-ups'],
    levels: 3,
    entities: 6,
    features: 'Combat system, multiple levels, varied enemies'
  },
  complex: {
    mechanics: ['movement', 'jumping', 'collecting', 'combat', 'power-ups', 'special-abilities', 'puzzles'],
    levels: 5,
    entities: 10,
    features: 'Advanced mechanics, boss fights, puzzle elements'
  },
  epic: {
    mechanics: ['movement', 'jumping', 'collecting', 'combat', 'power-ups', 'special-abilities', 'puzzles', 'story', 'achievements'],
    levels: 8,
    entities: 15,
    features: 'Full game experience with story, achievements, multiple game modes'
  }
}

const THEME_ENHANCEMENTS = {
  fantasy: {
    background: '#2D5C3D',
    music: 'orchestral_adventure.ogg',
    sounds: ['magic_chime.wav', 'sword_clash.wav', 'mystical_collect.wav'],
    effects: ['sparkle_particles', 'magic_trail', 'enchanted_glow']
  },
  scifi: {
    background: '#0D1B2A',
    music: 'electronic_space.ogg',
    sounds: ['laser_shot.wav', 'tech_beep.wav', 'energy_collect.wav'],
    effects: ['laser_particles', 'energy_trail', 'holographic_glow']
  },
  cyberpunk: {
    background: '#1A0B3D',
    music: 'synthwave_neon.ogg',
    sounds: ['cyber_jump.wav', 'digital_hit.wav', 'data_collect.wav'],
    effects: ['neon_particles', 'digital_glitch', 'circuit_glow']
  }
}

export async function generateEnhancedGame(
  userPrompt: string, 
  options: GameOptions, 
  onProgress: GenerationProgress
): Promise<any> {
  // Use the new smart generation system
  const { SmartGameGeneration } = await import('./smartGameGeneration')
  
  try {
    onProgress('🧠 Initializing smart AI game generation...')
    const smartGame = await SmartGameGeneration.generateWorkingGame(userPrompt, options, onProgress)
    
    // Apply additional enhancements
    onProgress('✨ Applying final polish...')
    const enhancedGame = await applyAssetEnhancements(smartGame, options, onProgress) 
    const audioGame = await integrateAudioSystem(enhancedGame, options, onProgress)
    
    // CRITICAL: Apply game-specific fixes
    let finalGame = audioGame
    if (options.genre === 'racing' || audioGame.gameType === 'racing' || 
        audioGame.title?.toLowerCase().includes('race') || 
        audioGame.description?.toLowerCase().includes('race')) {
      onProgress('🏎️ Applying racing game optimizations...')
      const { fixRacingGame, validateRacingGame } = await import('../utils/racingGameFix')
      finalGame = fixRacingGame(audioGame)
      
      // Validate the racing game works
      const isValid = validateRacingGame(finalGame)
      if (!isValid) {
        onProgress('⚠️ Racing validation failed, creating fallback racing game...')
        const { createTestRacingGame } = await import('../utils/racingGameFix')
        finalGame = createTestRacingGame()
      }
    }
    
    // Initialize asset manager for the game
    onProgress('🎮 Setting up game assets...')
    const assetManager = AssetManager.getInstance()
    await assetManager.preloadGameAssets(finalGame)
    
    // Auto-save the generated game
    onProgress('💾 Auto-saving game...')
    GamePersistenceManager.setCurrentGame(finalGame)
    GamePersistenceManager.autoSaveCurrentGame(finalGame)
    
    onProgress('🚀 Amazing game created successfully!')
    return finalGame
    
  } catch (error) {
    console.error('Smart generation failed, falling back to enhanced generation:', error)
    onProgress('⚠️ Using fallback generation system...')
    return generateEnhancedGameFallback(userPrompt, options, onProgress)
  }
}

async function generateEnhancedGameFallback(
  userPrompt: string, 
  options: GameOptions, 
  onProgress: GenerationProgress
): Promise<any> {
  onProgress('🤖 Analyzing your game concept...')
  
  // Get complexity and theme data
  const complexity = COMPLEXITY_TEMPLATES[options.complexity as keyof typeof COMPLEXITY_TEMPLATES]
  const assets = ASSET_LIBRARIES[options.visualStyle as keyof typeof ASSET_LIBRARIES] || ASSET_LIBRARIES.pixel
  const themeData = THEME_ENHANCEMENTS[options.theme as keyof typeof THEME_ENHANCEMENTS] || THEME_ENHANCEMENTS.fantasy

  // Enhanced prompt with game-type-specific instructions
  const gameTypeInstructions = {
    racing: `
RACING GAME SPECIFIC REQUIREMENTS:
- Player entity MUST have physics: { gravity: false, maxSpeed: 10, acceleration: 0.6, braking: 0.9, turning: 0.4, drift: 0.15 }
- NO jumping mechanics - this is a RACING game
- NO platforms except track boundaries
- Player MUST have currentSpeed: 0, steeringAngle: 0, facingAngle: 0 properties
- Player MUST have emoji: "🏎️" and renderMode: "emoji"
- Create simple straight race track with barriers at top and bottom
- Include collectible items like coins (🪙) and boost pads (⚡)
- Focus on acceleration, braking, and steering mechanics
- Goal should be a finish line (🏁)
- UI should show: speed, time, position`,
    
    shooter: `
SPACE SHOOTER SPECIFIC REQUIREMENTS:
- Player entity MUST have physics: { gravity: false, moveSpeed: 8, airControl: 1 }
- Enable 8-way movement (WASD controls)
- Include shooting mechanics with projectiles
- Create waves of enemies that move in patterns
- NO platforms - this is SPACE, not a platformer
- Focus on shooting, dodging, and space combat
- UI should show: health, score, wave number, ammo`,
    
    flappy: `
FLAPPY BIRD SPECIFIC REQUIREMENTS:
- Player entity MUST have physics: { gravity: true, gravityForce: 1.2, jumpForce: 18, moveSpeed: 0 }
- NO horizontal movement - player stays in same X position
- Create pipe obstacles that scroll horizontally
- Simple tap/space controls for flapping
- Endless scrolling world
- Focus on timing and obstacle avoidance
- UI should show: score, high score`,
    
    tetris: `
TETRIS/PUZZLE SPECIFIC REQUIREMENTS:
- Game type MUST be "puzzle" not "platformer"
- NO gravity for player - this is grid-based
- NO platforms - use grid system instead
- Create falling block pieces (tetrominoes)
- Grid-based movement and rotation
- Line clearing mechanics
- Focus on puzzle solving, not jumping
- UI should show: score, level, lines cleared, next piece`,
    
    fighting: `
FIGHTING GAME SPECIFIC REQUIREMENTS:
- Player entity should have combat system with health
- Include combo system and special moves
- Create fighting arena with boundaries
- AI opponent with fighting patterns
- Focus on combat mechanics, not exploration
- UI should show: health bars, combo meter, round timer`,
    
    tower_defense: `
TOWER DEFENSE SPECIFIC REQUIREMENTS:
- Game type MUST be "tower_defense"
- NO player entity that moves around
- Create enemy path and spawn points
- Tower placement system
- Resource management (gold/currency)
- Wave-based enemy spawning
- Focus on strategy and tower placement
- UI should show: gold, wave number, lives, tower menu`
  }

  const specificInstructions = gameTypeInstructions[options.genre as keyof typeof gameTypeInstructions] || `
GENERIC GAME REQUIREMENTS:
- Ensure physics and mechanics match the ${options.genre} game type
- Avoid platformer mechanics unless this is specifically a platformer
- Focus on the core mechanics of ${options.genre} games`

  // Enhanced prompt with detailed specifications
  const enhancedPrompt = `
You are an expert game designer creating a professional ${options.complexity} ${options.genre} game.

USER CONCEPT: "${userPrompt}"

${specificInstructions}

DETAILED SPECIFICATIONS:
- Game Type: ${options.genre} (IMPORTANT: Follow the specific requirements above)
- Visual Style: ${options.visualStyle} art style
- Asset Quality: ${options.assetLevel} level
- Game Complexity: ${options.complexity} (${complexity.features})
- Theme: ${options.theme}
- Audio: ${options.audioEnabled ? 'Include sound effects' : 'No audio needed'}
- Music: ${options.musicEnabled ? 'Include background music' : 'No music needed'}

REQUIRED MECHANICS (${complexity.mechanics.length} total):
${complexity.mechanics.map(m => `- ${m}`).join('\n')}

TECHNICAL REQUIREMENTS:
- Create ${complexity.levels} level(s) with ${complexity.entities} entities
- Use ${assets.player.width}x${assets.player.height} sprite dimensions
- Apply ${options.theme} theme with appropriate colors and atmosphere
- Include particle effects and visual polish
- CRITICAL: Set gameType field to "${options.genre}" in the JSON

Generate a complete game structure in JSON format with:

IMPORTANT: The gameType field must be EXACTLY "${options.genre}" - do not change this to "platformer" or anything else.

{
  "title": "Creative game title matching the ${options.genre} genre",
  "description": "Engaging ${options.genre} game description (2-3 sentences)",
  "gameType": "${options.genre}",
  "visualStyle": "${options.visualStyle}",
  "theme": "${options.theme}",
  "assets": {
    "sprites": [
      {
        "name": "player_idle",
        "description": "Detailed sprite description",
        "width": ${assets.player.width},
        "height": ${assets.player.height},
        "color": "${assets.player.color}",
        "animations": ["idle", "run", "jump", "attack"]
      }
      // Include sprites for all entities, platforms, collectibles
    ],
    "sounds": ${options.audioEnabled ? JSON.stringify(themeData.sounds) : '[]'},
    "music": ${options.musicEnabled ? `"${themeData.music}"` : 'null'}
  },
  "entities": [
    {
      "name": "player",
      "type": "player", 
      "x": 100,
      "y": 300,
      "width": ${assets.player.width},
      "height": ${assets.player.height},
      "color": "${assets.player.color}",
      "physics": {
        "gravity": ${['shooter', 'racing', 'puzzle', 'tetris', 'tower_defense'].includes(options.genre) ? 'false' : 'true'},
        "gravityForce": ${['shooter', 'racing', 'puzzle', 'tetris', 'tower_defense'].includes(options.genre) ? '0' : options.genre === 'flappy' ? '1.2' : '0.8'},
        "jumpForce": ${['shooter', 'racing', 'puzzle', 'tetris', 'tower_defense'].includes(options.genre) ? '0' : options.genre === 'flappy' ? '18' : '15'},
        "moveSpeed": ${options.genre === 'racing' ? '8' : options.genre === 'shooter' ? '8' : options.genre === 'flappy' ? '0' : options.genre === 'puzzle' || options.genre === 'tetris' ? '32' : '6'},
        "airControl": ${options.genre === 'shooter' || options.genre === 'racing' ? '1' : '0.7'}
      },
      "abilities": {
        ${options.genre === 'shooter' ? '"attack": true, "boostDash": true' : ''}
        ${options.genre !== 'shooter' && complexity.mechanics.includes('special-abilities') ? '"dash": true, "doubleJump": true,' : ''}
        ${options.genre !== 'shooter' && complexity.mechanics.includes('combat') ? '"attack": true,' : ''}
        ${options.genre !== 'shooter' ? '"wallJump": ' + (options.complexity !== 'simple') : ''}
      },
      "health": ${complexity.mechanics.includes('combat') ? '3' : '1'},
      "sprite": "player_idle"
    }
    // Add enemies, NPCs, and other entities based on complexity
  ],
  "levels": [
    {
      "name": "Level 1",
      "width": ${1600 + (complexity.levels * 400)},
      "height": 800,
      "background": "${themeData.background}",
      "platforms": [
        // For puzzle games like Tetris, no platforms needed
        // For platformers, add ground and jumping platforms
        ${options.genre === 'puzzle' || userPrompt.toLowerCase().includes('tetris') ? '// No platforms for puzzle games' : '{ "x": 0, "y": 750, "width": ' + (1600 + (complexity.levels * 400)) + ', "height": 50, "color": "' + assets.platform.color + '" }'}
      ],
      "collectibles": [
        ${options.genre === 'puzzle' ? '// Puzzle games may not need traditional collectibles' : '// Add collectibles for score and progression'}
        ${options.genre !== 'puzzle' ? '{ "type": "star", "x": 350, "y": 600, "points": 10, "color": "' + assets.collectible.color + '", "width": 24, "height": 24 }' : ''}
      ],
      ${complexity.mechanics.includes('combat') ? '"enemies": [/* Add enemies based on theme */],' : ''}
      ${complexity.mechanics.includes('puzzles') ? '"puzzles": [/* Add puzzle elements */],' : ''}
      "traps": [
        // Add environmental hazards
      ],
      "goal": {
        "x": ${1400 + (complexity.levels * 300)},
        "y": 700,
        "width": 64,
        "height": 64,
        "color": "#FFD700"
      }
    }
    ${complexity.levels > 1 ? '// Generate additional levels with increasing difficulty' : ''}
  ],
  "gameLogic": {
    "winCondition": "${complexity.mechanics.includes('story') ? 'Complete story objectives' : 'Reach the goal'}",
    "loseCondition": "${complexity.mechanics.includes('combat') ? 'Health reaches 0' : 'Fall off screen'}",
    "scoring": {
      "collectibles": 10,
      "enemies": ${complexity.mechanics.includes('combat') ? '25' : '0'},
      "timeBonus": true,
      "perfectBonus": ${options.complexity === 'epic' ? '100' : '50'}
    },
    ${complexity.mechanics.includes('achievements') ? '"achievements": [/* Add achievement system */],' : ''}
    "specialMechanics": {
      ${complexity.mechanics.map(m => `"${m}": "Detailed description of ${m} mechanic"`).join(',\n      ')}
    }
  },
  "visualEffects": {
    "particles": ${JSON.stringify(themeData.effects)},
    "screenEffects": ["camera_shake", "zoom_on_hit", "fade_transitions"],
    "lighting": "${options.visualStyle === 'cyberpunk' ? 'neon_glow' : options.theme}_ambient"
  }
}

IMPORTANT: Make the game FUN and ENGAGING with proper game balance, interesting challenges, and rewarding progression!`

  try {
    onProgress('🎨 Generating game structure with AI...')
    
    const gameData = await generateWithContinuation(enhancedPrompt, options, onProgress)
    
    // Apply asset enhancements based on options
    onProgress('✨ Applying visual enhancements...')
    const enhancedGame = await applyAssetEnhancements(gameData, options, onProgress)
    
    onProgress('🎵 Adding audio integration...') 
    const finalGame = await integrateAudioSystem(enhancedGame, options, onProgress)
    
    // Initialize asset manager for the game
    onProgress('🎮 Setting up game assets...')
    const assetManager = AssetManager.getInstance()
    await assetManager.preloadGameAssets(finalGame)
    
    // Auto-save the generated game
    onProgress('💾 Auto-saving game...')
    GamePersistenceManager.setCurrentGame(finalGame)
    GamePersistenceManager.autoSaveCurrentGame(finalGame)
    
    onProgress('🚀 Game generation complete!')
    return finalGame

  } catch (error) {
    console.error('Enhanced generation failed:', error)
    
    // Return a working fallback game instead of throwing
    onProgress('⚠️ AI response incomplete, creating enhanced fallback...')
    return createEnhancedFallbackGame(options)
  }
}

async function generateWithContinuation(prompt: string, options: GameOptions, onProgress: GenerationProgress) {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  onProgress('🔄 Processing AI response...')
  const data = await response.json()
  let content = data.choices[0].message.content

  // Handle continuation if needed - be more aggressive about detecting truncation
  if (data.choices[0].finish_reason === 'length' || !content.includes(']}') || content.length < 2000) {
    onProgress('📖 Response incomplete, requesting continuation...')
    content = await continueGeneration(content, prompt, options, onProgress)
  }

  // Clean and parse JSON
  onProgress('🔧 Parsing game data...')
  const parseResult = RobustJSONParser.parseGameData(content)
  
  if (!parseResult.success) {
    throw new Error(`Failed to parse game data: ${parseResult.error}`)
  }
  
  if (parseResult.warnings && parseResult.warnings.length > 0) {
    console.warn('Game parsing warnings:', parseResult.warnings)
    onProgress(`⚠️ Parsed with warnings: ${parseResult.warnings.join(', ')}`)
  }
  
  // Validate and fix the parsed data
  const validation = RobustJSONParser.validateAndFixGameData(parseResult.data)
  
  if (!validation.isValid) {
    console.warn('Game validation errors:', validation.errors)
    onProgress('🔧 Fixing game data issues...')
  }
  
  if (validation.warnings.length > 0) {
    console.warn('Game validation warnings:', validation.warnings)
  }
  
  return validation.fixedData || parseResult.data
}

async function continueGeneration(partialContent: string, _originalPrompt: string, options: GameOptions, onProgress: GenerationProgress): Promise<string> {
  onProgress('🔄 Requesting continuation from AI...')
  
  const continuePrompt = `Continue generating the game JSON. Previous partial response: "${partialContent.slice(-800)}". 
  
  Complete the remaining sections focusing on:
  - Detailed level design with ${COMPLEXITY_TEMPLATES[options.complexity as keyof typeof COMPLEXITY_TEMPLATES].levels} levels
  - Rich entity behaviors and interactions  
  - Advanced game mechanics and features
  - Professional polish and effects
  
  Continue from where the previous response ended and complete the full JSON structure.`

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat', 
      messages: [{ role: 'user', content: continuePrompt }],
      max_tokens: 4000,
      temperature: 0.7
    })
  })

  const data = await response.json()
  return partialContent + data.choices[0].message.content
}



async function applyAssetEnhancements(gameData: any, options: GameOptions, onProgress: GenerationProgress) {
  onProgress('🎨 Applying visual style enhancements...')
  
  const assets = ASSET_LIBRARIES[options.visualStyle as keyof typeof ASSET_LIBRARIES]
  const themeData = THEME_ENHANCEMENTS[options.theme as keyof typeof THEME_ENHANCEMENTS]
  
  // Enhance visual properties
  if (gameData.entities) {
    gameData.entities.forEach((entity: any) => {
      if (entity.type === 'player') {
        entity.color = assets.player.color
        entity.width = assets.player.width
        entity.height = assets.player.height
      }
    })
  }
  
  // Apply theme colors
  if (gameData.levels && Array.isArray(gameData.levels) && themeData) {
    gameData.levels.forEach((level: any) => {
      if (level && themeData.background) {
        level.background = themeData.background
      }
      if (level && level.platforms && Array.isArray(level.platforms) && assets) {
        level.platforms.forEach((platform: any) => {
          if (platform && assets.platform && assets.platform.color) {
            platform.color = assets.platform.color
          }
        })
      }
    })
  }
  
  return gameData
}

async function integrateAudioSystem(gameData: any, options: GameOptions, onProgress: GenerationProgress) {
  onProgress('🎵 Integrating audio system...')
  
  const themeData = THEME_ENHANCEMENTS[options.theme as keyof typeof THEME_ENHANCEMENTS]
  
  if (options.audioEnabled && gameData.assets) {
    gameData.assets.sounds = themeData.sounds
  }
  
  if (options.musicEnabled && gameData.assets) {
    gameData.assets.music = themeData.music
  }
  
  return gameData
}

export function createFallbackGame() {
  return createEnhancedFallbackGame({ 
    visualStyle: 'pixel', 
    theme: 'fantasy', 
    complexity: 'medium',
    assetLevel: 'prebuilt',
    audioEnabled: true,
    musicEnabled: true,
    genre: 'platformer'
  })
}

function createEnhancedFallbackGame(options: GameOptions) {
  // Try to use game-specific template first
  const gameTypeMap: { [key: string]: string } = {
    'flappy': 'flappy_bird',
    'shooter': 'space_shooter', 
    'racing': 'racing',
    'tetris': 'tetris_puzzle',
    'puzzle': 'tetris_puzzle',
    'fighting': 'fighting',
    'tower_defense': 'tower_defense',
    'endless_runner': 'endless_runner',
    'platformer': 'platformer'
  }
  
  const templateId = gameTypeMap[options.genre] || 'platformer'
  const template = getGameTemplate(templateId)
  
  if (template) {
    console.log(`🎯 Using ${template.name} template for fallback`)
    const customizedGame = customizeTemplate(template, options)
    
    // Ensure proper racing physics for racing games
    if (options.genre === 'racing' && customizedGame.entities) {
      customizedGame.entities.forEach((entity: any) => {
        if (entity.type === 'player') {
          // Ensure racing physics properties are set
          entity.physics = {
            ...entity.physics,
            gravity: false,
            maxSpeed: entity.physics?.maxSpeed || 12,
            acceleration: entity.physics?.acceleration || 0.3,
            braking: entity.physics?.braking || 0.5,
            turning: entity.physics?.turning || 0.2,
            drift: entity.physics?.drift || 0.1
          }
          
          // Add racing abilities
          if (!entity.abilities) entity.abilities = {}
          entity.abilities.boost = true
          
          // Initialize racing state
          entity.currentSpeed = 0
          entity.steeringAngle = 0
          entity.facingAngle = 0
        }
      })
    }
    
    return customizedGame
  }
  
  // Original fallback for unknown game types
  const assets = ASSET_LIBRARIES[options.visualStyle as keyof typeof ASSET_LIBRARIES] || ASSET_LIBRARIES.pixel
  const themeData = THEME_ENHANCEMENTS[options.theme as keyof typeof THEME_ENHANCEMENTS] || THEME_ENHANCEMENTS.fantasy
  const complexity = COMPLEXITY_TEMPLATES[options.complexity as keyof typeof COMPLEXITY_TEMPLATES] || COMPLEXITY_TEMPLATES.medium

  return {
    title: `${options.theme.charAt(0).toUpperCase() + options.theme.slice(1)} ${options.complexity.charAt(0).toUpperCase() + options.complexity.slice(1)} Adventure`,
    description: `An epic ${options.visualStyle} ${options.genre} with ${complexity.features.toLowerCase()}`,
    gameType: options.genre,
    visualStyle: options.visualStyle,
    theme: options.theme,
    entities: [{
      name: "player",
      type: "player",
      x: 100,
      y: 300,
      width: assets.player.width,
      height: assets.player.height,
      color: assets.player.color,
      physics: {
        gravity: true,
        gravityForce: 0.8,
        jumpForce: 15,
        moveSpeed: 6,
        airControl: 0.7
      },
      abilities: {
        dash: options.complexity !== 'simple',
        doubleJump: options.complexity === 'complex' || options.complexity === 'epic',
        wallJump: options.complexity === 'epic'
      }
    }],
    levels: [{
      name: "Level 1", 
      width: 1600 + (complexity.levels * 200),
      height: 800,
      background: themeData.background,
      platforms: [
        { x: 0, y: 750, width: 1600, height: 50, color: assets.platform.color },
        { x: 300, y: 650, width: 200, height: 20, color: assets.platform.color },
        { x: 600, y: 550, width: 200, height: 20, color: assets.platform.color },
        { x: 900, y: 450, width: 150, height: 20, color: assets.platform.color },
        { x: 1200, y: 350, width: 200, height: 20, color: assets.platform.color }
      ],
      collectibles: [
        { type: "star", x: 350, y: 600, points: 10, color: assets.collectible.color, width: 24, height: 24 },
        { type: "star", x: 650, y: 500, points: 10, color: assets.collectible.color, width: 24, height: 24 },
        { type: "star", x: 950, y: 400, points: 15, color: assets.collectible.color, width: 24, height: 24 },
        { type: "star", x: 1250, y: 300, points: 20, color: assets.collectible.color, width: 24, height: 24, floating: true }
      ],
      traps: options.complexity !== 'simple' ? [
        { type: "spikes", x: 500, y: 730, width: 64, height: 20, damage: 1, color: assets.enemy.color }
      ] : [],
      enemies: (options.complexity === 'complex' || options.complexity === 'epic') ? [
        { 
          name: "enemy1", 
          type: "enemy", 
          x: 800, 
          y: 700, 
          width: 32, 
          height: 32, 
          color: assets.enemy.color,
          health: 2,
          patrol: { start: 750, end: 950 }
        }
      ] : [],
      goal: { x: 1500, y: 700, width: 64, height: 64, color: "#FFD700" }
    }],
    gameLogic: {
      winCondition: "reach goal",
      loseCondition: options.complexity !== 'simple' ? "health reaches 0" : "fall off screen",
      scoring: {
        collectibles: 10,
        enemies: options.complexity !== 'simple' ? 25 : 0,
        timeBonus: true,
        perfectBonus: options.complexity === 'epic' ? 100 : 50
      }
    },
    assets: {
      sounds: options.audioEnabled ? themeData.sounds : [],
      music: options.musicEnabled ? themeData.music : null
    }
  }
}