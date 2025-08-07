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

export class SmartGameGeneration {
  static async generateWorkingGame(
    userPrompt: string, 
    options: GameOptions, 
    onProgress: GenerationProgress
  ): Promise<any> {
    onProgress('🧠 AI analyzing your request...')
    
    try {
      // Step 1: Let DeepSeek analyze what type of game to create
      const gameAnalysis = await this.analyzeUserRequest(userPrompt, options, onProgress)
      
      // Step 2: Generate the game structure with DeepSeek
      const gameStructure = await this.generateGameStructure(gameAnalysis, options, onProgress)
      
      // Step 3: Validate and enhance the generated game
      const validatedGame = await this.validateAndEnhanceGame(gameStructure, options, onProgress)
      
      // Step 4: Test the game and fix any issues immediately
      const workingGame = await this.testAndFixGame(validatedGame, options, onProgress)
      
      onProgress('🎉 Amazing game created successfully!')
      return workingGame
      
    } catch (error) {
      console.error('Smart generation failed:', error)
      onProgress('⚠️ AI generation failed, creating working fallback...')
      return this.createIntelligentFallback(userPrompt, options)
    }
  }

  private static async analyzeUserRequest(
    userPrompt: string, 
    options: GameOptions, 
    onProgress: GenerationProgress
  ): Promise<any> {
    onProgress('🔍 AI understanding your game idea...')
    
    const analysisPrompt = `
You are a game design expert. Analyze this user request and determine the best approach:

USER REQUEST: "${userPrompt}"
SELECTED GENRE: ${options.genre}
VISUAL STYLE: ${options.visualStyle}
COMPLEXITY: ${options.complexity}

Analyze and respond with a JSON object containing:
{
  "recommendedGameType": "the best game type for this request",
  "coreGameplayLoop": "main gameplay mechanic in one sentence",
  "keyFeatures": ["feature1", "feature2", "feature3"],
  "playerGoal": "what the player is trying to achieve",
  "mainChallenge": "primary obstacle or challenge",
  "visualElements": ["element1", "element2"],
  "gameplayStyle": "action/puzzle/strategy/etc",
  "estimatedFun": 85,
  "technicalComplexity": "low/medium/high",
  "recommendations": {
    "entities": "what entities are needed",
    "mechanics": "what game mechanics to include", 
    "progression": "how the game should progress",
    "feedback": "what feedback to give the player"
  }
}

Focus on creating something genuinely fun and engaging, not just technically correct.`

    const response = await this.callDeepSeek(analysisPrompt)
    return this.parseAIResponse(response)
  }

  private static async generateGameStructure(
    analysis: any, 
    options: GameOptions, 
    onProgress: GenerationProgress
  ): Promise<any> {
    onProgress('🎮 AI creating your game mechanics...')
    
    const structurePrompt = `
Based on this game analysis, create a COMPLETE, WORKING game structure:

ANALYSIS: ${JSON.stringify(analysis)}
USER OPTIONS: ${JSON.stringify(options)}

Create a game that is:
1. IMMEDIATELY PLAYABLE - no broken mechanics
2. VISUALLY CLEAR - easy to understand what's happening  
3. FUN TO INTERACT WITH - responsive controls and feedback
4. PROPERLY BALANCED - not too easy or impossible

Generate this EXACT JSON structure (no extra text):

{
  "title": "Creative and engaging title",
  "description": "Clear 2-sentence description of the gameplay",
  "gameType": "${analysis.recommendedGameType || options.genre}",
  "visualStyle": "${options.visualStyle}",
  "theme": "${options.theme}",
  
  "entities": [
    {
      "name": "player",
      "type": "player", 
      "x": 100,
      "y": 400,
      "width": 32,
      "height": 32,
      "color": "#FF6B6B",
      "emoji": "🎮",
      "renderMode": "emoji",
      "physics": {
        "gravity": true,
        "gravityForce": 0.8,
        "jumpForce": 15,
        "moveSpeed": 6,
        "airControl": 0.7,
        "friction": 0.8
      },
      "abilities": {
        "jump": true,
        "dash": ${options.complexity !== 'simple'},
        "doubleJump": ${options.complexity === 'complex' || options.complexity === 'epic'}
      },
      "health": 3,
      "maxHealth": 3,
      "controls": {
        "left": "ArrowLeft",
        "right": "ArrowRight", 
        "jump": "Space"
      }
    }
  ],
  
  "levels": [
    {
      "name": "Level 1",
      "width": 1600,
      "height": 800,
      "background": "#2E8B57",
      "platforms": [
        {"x": 0, "y": 750, "width": 1600, "height": 50, "color": "#8B4513"},
        {"x": 300, "y": 650, "width": 200, "height": 20, "color": "#8B4513"},
        {"x": 600, "y": 550, "width": 150, "height": 20, "color": "#8B4513"},
        {"x": 900, "y": 450, "width": 200, "height": 20, "color": "#8B4513"}
      ],
      "collectibles": [
        {"type": "coin", "x": 350, "y": 600, "points": 10, "color": "#FFD700", "width": 24, "height": 24, "emoji": "🪙"},
        {"type": "coin", "x": 650, "y": 500, "points": 10, "color": "#FFD700", "width": 24, "height": 24, "emoji": "🪙"},
        {"type": "gem", "x": 950, "y": 400, "points": 50, "color": "#FF69B4", "width": 32, "height": 32, "emoji": "💎"}
      ],
      "enemies": [
        {
          "name": "enemy1",
          "type": "enemy",
          "x": 500,
          "y": 700,
          "width": 32,
          "height": 32,
          "color": "#FF4500",
          "emoji": "👾",
          "renderMode": "emoji",
          "health": 1,
          "movePattern": "patrol",
          "patrolRange": 150,
          "moveSpeed": 2
        }
      ],
      "goal": {
        "x": 1400,
        "y": 650, 
        "width": 64,
        "height": 100,
        "color": "#FFD700",
        "emoji": "🏆",
        "type": "flag"
      }
    }
  ],
  
  "gameLogic": {
    "winCondition": "reach_goal",
    "loseCondition": "health_reaches_zero",
    "scoring": {
      "collectibles": 10,
      "enemies": 25,
      "timeBonus": true,
      "perfectRun": 100
    },
    "mechanics": {
      "movement": "platformer",
      "combat": "stomp_enemies",
      "collection": "automatic_on_touch",
      "progression": "linear_levels"
    }
  },
  
  "assets": {
    "sounds": ${options.audioEnabled ? '["jump.wav", "collect.wav", "win.wav"]' : '[]'},
    "music": ${options.musicEnabled ? '"background_music.ogg"' : 'null'}
  }
}

CRITICAL: Make sure this game is immediately playable and fun. Every entity should have proper physics, every platform should be reachable, every collectible should be obtainable. Test the level design mentally before generating.`

    const response = await this.callDeepSeek(structurePrompt)
    return this.parseAIResponse(response)
  }

  private static async validateAndEnhanceGame(
    gameStructure: any, 
    options: GameOptions, 
    onProgress: GenerationProgress
  ): Promise<any> {
    onProgress('🔧 AI testing and fixing game mechanics...')
    
    // Run through validation and auto-fix obvious issues
    const validationResult = RobustJSONParser.validateAndFixGameData(gameStructure)
    let fixedGame = validationResult.fixedData || gameStructure
    
    // Apply game-type specific fixes
    fixedGame = this.applyGameTypeSpecificFixes(fixedGame, options)
    
    // Enhance visual presentation
    fixedGame = this.enhanceVisualPresentation(fixedGame, options)
    
    return fixedGame
  }

  private static async testAndFixGame(
    game: any, 
    options: GameOptions, 
    onProgress: GenerationProgress
  ): Promise<any> {
    onProgress('🧪 AI running final game tests...')
    
    // Simulate basic game testing
    const testResults = this.runGameTests(game)
    
    if (testResults.hasIssues) {
      onProgress('🔨 AI fixing detected issues...')
      game = this.applyTestBasedFixes(game, testResults)
    }
    
    // Ensure game meets quality standards
    game = this.ensureQualityStandards(game, options)
    
    return game
  }

  private static applyGameTypeSpecificFixes(game: any, options: GameOptions): any {
    const gameType = game.gameType || options.genre
    
    switch (gameType) {
      case 'racing':
        return this.fixRacingGame(game)
      case 'shooter':
      case 'space':
        return this.fixShooterGame(game)
      case 'puzzle':
      case 'tetris':
        return this.fixPuzzleGame(game)
      case 'platformer':
      default:
        return this.fixPlatformerGame(game)
    }
  }

  private static fixRacingGame(game: any): any {
    // Ensure racing games have proper car physics
    if (game.entities) {
      game.entities.forEach((entity: any) => {
        if (entity.type === 'player') {
          entity.physics = {
            gravity: false,
            maxSpeed: 12,
            acceleration: 0.3,
            braking: 0.5,
            turning: 0.2,
            drift: 0.1
          }
          entity.abilities = { boost: true }
          entity.currentSpeed = 0
          entity.steeringAngle = 0  
          entity.facingAngle = 0
          entity.emoji = entity.emoji || '🏎️'
          entity.renderMode = 'emoji'
        }
      })
    }
    
    // Ensure racing levels have tracks, not platforms
    if (game.levels) {
      game.levels.forEach((level: any) => {
        level.platforms = level.platforms || []
        // Add track boundaries
        level.trackBounds = [
          { x: 0, y: 100, width: level.width, height: 20, color: '#8B4513', type: 'barrier' },
          { x: 0, y: level.height - 120, width: level.width, height: 20, color: '#8B4513', type: 'barrier' }
        ]
      })
    }
    
    return game
  }

  private static fixShooterGame(game: any): any {
    // Ensure shooter games have proper space physics
    if (game.entities) {
      game.entities.forEach((entity: any) => {
        if (entity.type === 'player') {
          entity.physics = {
            gravity: false,
            moveSpeed: 8,
            airControl: 1
          }
          entity.abilities = { shooting: true, boostDash: true }
          entity.emoji = entity.emoji || '🚀'
          entity.renderMode = 'emoji'
        }
      })
    }
    
    // Remove platforms from space games
    if (game.levels) {
      game.levels.forEach((level: any) => {
        level.platforms = []
        level.background = '#0D1B2A'
      })
    }
    
    return game
  }

  private static fixPuzzleGame(game: any): any {
    // Puzzle games need grid-based movement
    if (game.entities) {
      game.entities.forEach((entity: any) => {
        if (entity.type === 'player') {
          entity.physics = {
            gravity: false,
            moveSpeed: 32, // Grid-based
            gridBased: true
          }
          entity.emoji = entity.emoji || '🧩'
          entity.renderMode = 'emoji'
        }
      })
    }
    
    return game
  }

  private static fixPlatformerGame(game: any): any {
    // Ensure platformer games have proper jumping physics
    if (game.entities) {
      game.entities.forEach((entity: any) => {
        if (entity.type === 'player') {
          entity.physics = {
            gravity: true,
            gravityForce: 0.8,
            jumpForce: 15,
            moveSpeed: 6,
            airControl: 0.7,
            friction: 0.8,
            ...entity.physics
          }
          entity.emoji = entity.emoji || '🎮'
          entity.renderMode = 'emoji'
        }
      })
    }
    
    return game
  }

  private static enhanceVisualPresentation(game: any, options: GameOptions): any {
    // Add emoji rendering for better visual appeal
    if (game.entities) {
      game.entities.forEach((entity: any) => {
        if (!entity.emoji) {
          entity.emoji = this.getEmojiForEntity(entity.type, game.theme)
        }
        entity.renderMode = options.visualStyle === 'emoji' ? 'emoji' : 'color'
      })
    }
    
    // Add emojis to collectibles
    if (game.levels) {
      game.levels.forEach((level: any) => {
        if (level.collectibles) {
          level.collectibles.forEach((collectible: any) => {
            if (!collectible.emoji) {
              collectible.emoji = this.getEmojiForCollectible(collectible.type)
            }
          })
        }
        
        if (level.enemies) {
          level.enemies.forEach((enemy: any) => {
            if (!enemy.emoji) {
              enemy.emoji = this.getEmojiForEntity('enemy', game.theme)
            }
            enemy.renderMode = 'emoji'
          })
        }
      })
    }
    
    return game
  }

  private static getEmojiForEntity(type: string, theme?: string): string {
    const entityEmojis = {
      player: {
        fantasy: '🧙‍♂️',
        scifi: '🤖',
        cyberpunk: '🥷',
        racing: '🏎️',
        space: '🚀',
        default: '🎮'
      },
      enemy: {
        fantasy: '👾',
        scifi: '👽',
        cyberpunk: '🤖',
        space: '🛸',
        default: '👹'
      }
    }
    
    return entityEmojis[type as keyof typeof entityEmojis]?.[theme as keyof typeof entityEmojis.player] || 
           entityEmojis[type as keyof typeof entityEmojis]?.default || '⭐'
  }

  private static getEmojiForCollectible(type: string): string {
    const collectibleEmojis = {
      coin: '🪙',
      gem: '💎', 
      star: '⭐',
      heart: '❤️',
      key: '🗝️',
      powerup: '⚡',
      default: '🎁'
    }
    
    return collectibleEmojis[type as keyof typeof collectibleEmojis] || collectibleEmojis.default
  }

  private static runGameTests(game: any): any {
    const issues: string[] = []
    
    // Test 1: Player can reach goal
    const player = game.entities?.find((e: any) => e.type === 'player')
    const goal = game.levels?.[0]?.goal
    
    if (player && goal) {
      if (Math.abs(player.y - goal.y) > 200) {
        issues.push('goal_unreachable')
      }
    }
    
    // Test 2: Platforms are properly spaced
    const platforms = game.levels?.[0]?.platforms || []
    for (let i = 1; i < platforms.length; i++) {
      const prev = platforms[i-1]
      const curr = platforms[i]
      const distance = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2))
      if (distance > 300) {
        issues.push('platforms_too_far')
        break
      }
    }
    
    // Test 3: Game has interactive elements
    const hasCollectibles = game.levels?.[0]?.collectibles?.length > 0
    const hasEnemies = game.levels?.[0]?.enemies?.length > 0
    const hasGoal = !!game.levels?.[0]?.goal
    
    if (!hasCollectibles && !hasEnemies && !hasGoal) {
      issues.push('no_interactivity')
    }
    
    return {
      hasIssues: issues.length > 0,
      issues
    }
  }

  private static applyTestBasedFixes(game: any, testResults: any): any {
    testResults.issues.forEach((issue: string) => {
      switch (issue) {
        case 'goal_unreachable':
          this.fixGoalPosition(game)
          break
        case 'platforms_too_far':
          this.addIntermediatePlatforms(game)
          break
        case 'no_interactivity':
          this.addInteractiveElements(game)
          break
      }
    })
    
    return game
  }

  private static fixGoalPosition(game: any): void {
    const level = game.levels?.[0]
    if (level?.goal) {
      level.goal.x = Math.min(level.goal.x, level.width - 200)
      level.goal.y = level.height - 150 // Place on or near ground
    }
  }

  private static addIntermediatePlatforms(game: any): void {
    const level = game.levels?.[0]
    if (level?.platforms) {
      // Add stepping stone platforms
      level.platforms.push(
        { x: 450, y: 600, width: 100, height: 20, color: '#8B4513' },
        { x: 750, y: 500, width: 100, height: 20, color: '#8B4513' }
      )
    }
  }

  private static addInteractiveElements(game: any): void {
    const level = game.levels?.[0]
    if (level) {
      // Add collectibles
      if (!level.collectibles || level.collectibles.length === 0) {
        level.collectibles = [
          { type: 'coin', x: 300, y: 650, points: 10, color: '#FFD700', width: 24, height: 24, emoji: '🪙' },
          { type: 'coin', x: 600, y: 550, points: 10, color: '#FFD700', width: 24, height: 24, emoji: '🪙' }
        ]
      }
      
      // Add goal if missing
      if (!level.goal) {
        level.goal = {
          x: level.width - 200,
          y: level.height - 150,
          width: 64,
          height: 100,
          color: '#FFD700',
          emoji: '🏆'
        }
      }
    }
  }

  private static ensureQualityStandards(game: any, options: GameOptions): any {
    // Ensure game title is engaging
    if (!game.title || game.title === 'Generated Game') {
      game.title = this.generateEngagingTitle(game.gameType, options.theme)
    }
    
    // Ensure description is clear
    if (!game.description || game.description.length < 20) {
      game.description = this.generateGameDescription(game)
    }
    
    // Add visual polish
    game = this.addVisualPolish(game, options)
    
    return game
  }

  private static generateEngagingTitle(gameType: string, theme: string): string {
    const titleTemplates = {
      racing: ['Speed Demon Rally', 'Turbo Championship', 'Racing Thunder'],
      shooter: ['Galactic Defender', 'Space Squadron', 'Stellar Combat'],
      platformer: ['Adventure Quest', 'Hero\'s Journey', 'Epic Escape'],
      puzzle: ['Mind Bender', 'Logic Master', 'Brain Challenge']
    }
    
    const themeModifiers = {
      fantasy: ['Magical', 'Mystical', 'Legendary'],
      scifi: ['Cyber', 'Quantum', 'Neural'],
      cyberpunk: ['Neon', 'Digital', 'Matrix']
    }
    
    const titles = titleTemplates[gameType as keyof typeof titleTemplates] || titleTemplates.platformer
    const modifiers = themeModifiers[theme as keyof typeof themeModifiers] || ['Epic']
    
    const title = titles[Math.floor(Math.random() * titles.length)]
    const modifier = modifiers[Math.floor(Math.random() * modifiers.length)]
    
    return `${modifier} ${title}`
  }

  private static generateGameDescription(game: any): string {
    const gameType = game.gameType || 'adventure'
    const playerEntity = game.entities?.find((e: any) => e.type === 'player')
    const hasEnemies = game.levels?.[0]?.enemies?.length > 0
    const hasCollectibles = game.levels?.[0]?.collectibles?.length > 0
    
    let description = `Embark on an exciting ${gameType} adventure! `
    
    if (hasCollectibles && hasEnemies) {
      description += 'Collect treasures while avoiding dangerous enemies on your quest to victory!'
    } else if (hasCollectibles) {
      description += 'Gather all the collectibles and reach the goal to complete your mission!'
    } else if (hasEnemies) {
      description += 'Navigate through enemy-filled territories to reach your destination!'
    } else {
      description += 'Master the controls and overcome challenging obstacles!'
    }
    
    return description
  }

  private static addVisualPolish(game: any, options: GameOptions): any {
    // Add particle effects configuration
    game.visualEffects = {
      particles: ['sparkle_on_collect', 'jump_dust', 'goal_celebration'],
      screenShake: true,
      smoothCamera: true
    }
    
    // Ensure proper color scheme
    if (game.levels) {
      game.levels.forEach((level: any) => {
        if (!level.background || level.background === '#000000') {
          level.background = this.getThemeBackground(options.theme)
        }
      })
    }
    
    return game
  }

  private static getThemeBackground(theme: string): string {
    const backgrounds = {
      fantasy: '#2E8B57',
      scifi: '#0D1B2A', 
      cyberpunk: '#1A0B3D',
      space: '#191970',
      default: '#87CEEB'
    }
    
    return backgrounds[theme as keyof typeof backgrounds] || backgrounds.default
  }

  private static async callDeepSeek(prompt: string): Promise<string> {
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
      throw new Error(`DeepSeek API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  private static parseAIResponse(response: string): any {
    const parseResult = RobustJSONParser.parseGameData(response)
    if (parseResult.success) {
      return parseResult.data
    }
    
    throw new Error(`Failed to parse AI response: ${parseResult.error}`)
  }

  private static createIntelligentFallback(userPrompt: string, options: GameOptions): any {
    // Create a template-based fallback that's guaranteed to work
    const templateId = this.getTemplateForPrompt(userPrompt, options.genre)
    const template = getGameTemplate(templateId)
    
    if (template) {
      const customized = customizeTemplate(template, options)
      
      // Apply user prompt insights to the template
      return this.applyPromptInsights(customized, userPrompt, options)
    }
    
    // Ultimate fallback - a simple working platformer
    return this.createUltimateFallback(options)
  }

  private static getTemplateForPrompt(prompt: string, genre: string): string {
    const promptLower = prompt.toLowerCase()
    
    if (promptLower.includes('car') || promptLower.includes('race') || promptLower.includes('speed')) {
      return 'racing'
    }
    if (promptLower.includes('space') || promptLower.includes('shoot') || promptLower.includes('laser')) {
      return 'space_shooter'
    }
    if (promptLower.includes('puzzle') || promptLower.includes('block')) {
      return 'tetris_puzzle'
    }
    if (promptLower.includes('fight') || promptLower.includes('combat')) {
      return 'fighting'
    }
    
    return genre === 'platformer' ? 'platformer' : genre
  }

  private static applyPromptInsights(game: any, prompt: string, options: GameOptions): any {
    const promptLower = prompt.toLowerCase()
    
    // Apply theme insights
    if (promptLower.includes('magic') || promptLower.includes('wizard')) {
      game.theme = 'fantasy'
      if (game.entities) {
        game.entities.forEach((e: any) => {
          if (e.type === 'player') e.emoji = '🧙‍♂️'
        })
      }
    }
    
    // Apply difficulty insights
    if (promptLower.includes('hard') || promptLower.includes('challenging')) {
      if (game.levels?.[0]?.enemies) {
        game.levels[0].enemies.push({
          name: 'tough_enemy',
          type: 'enemy',
          x: 800,
          y: 700,
          width: 40,
          height: 40,
          color: '#8B0000',
          emoji: '💀',
          health: 3,
          movePattern: 'chase'
        })
      }
    }
    
    return game
  }

  private static createUltimateFallback(options: GameOptions): any {
    return {
      title: `${options.theme.charAt(0).toUpperCase() + options.theme.slice(1)} Adventure`,
      description: 'A fun platformer adventure with jumping, collecting, and goal-reaching action!',
      gameType: 'platformer',
      visualStyle: options.visualStyle,
      theme: options.theme,
      
      entities: [{
        name: 'player',
        type: 'player',
        x: 100,
        y: 400,
        width: 32,
        height: 32,
        color: '#FF6B6B',
        emoji: '🎮',
        renderMode: 'emoji',
        physics: {
          gravity: true,
          gravityForce: 0.8,
          jumpForce: 15,
          moveSpeed: 6,
          airControl: 0.7,
          friction: 0.8
        },
        abilities: {
          jump: true,
          dash: options.complexity !== 'simple'
        },
        health: 3,
        maxHealth: 3
      }],
      
      levels: [{
        name: 'Adventure Begins',
        width: 1600,
        height: 800,
        background: this.getThemeBackground(options.theme),
        platforms: [
          { x: 0, y: 750, width: 1600, height: 50, color: '#8B4513' },
          { x: 300, y: 650, width: 200, height: 20, color: '#8B4513' },
          { x: 600, y: 550, width: 150, height: 20, color: '#8B4513' },
          { x: 900, y: 450, width: 200, height: 20, color: '#8B4513' }
        ],
        collectibles: [
          { type: 'coin', x: 350, y: 600, points: 10, color: '#FFD700', width: 24, height: 24, emoji: '🪙' },
          { type: 'coin', x: 650, y: 500, points: 10, color: '#FFD700', width: 24, height: 24, emoji: '🪙' },
          { type: 'gem', x: 950, y: 400, points: 50, color: '#FF69B4', width: 32, height: 32, emoji: '💎' }
        ],
        goal: {
          x: 1400,
          y: 650,
          width: 64,
          height: 100,
          color: '#FFD700',
          emoji: '🏆'
        }
      }],
      
      gameLogic: {
        winCondition: 'reach_goal',
        loseCondition: 'health_reaches_zero',
        scoring: {
          collectibles: 10,
          timeBonus: true
        }
      },
      
      visualEffects: {
        particles: ['sparkle_on_collect', 'jump_dust'],
        screenShake: false,
        smoothCamera: true
      }
    }
  }
}