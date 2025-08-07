interface ParseResult {
  success: boolean
  data?: any
  error?: string
  warnings?: string[]
}

interface GameValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  fixedData?: any
}

export class RobustJSONParser {
  private static readonly REQUIRED_FIELDS = ['title', 'entities', 'levels']
  
  /**
   * Multi-stage JSON parsing with fallback strategies
   */
  static parseGameData(content: string): ParseResult {
    const warnings: string[] = []
    
    // Stage 1: Direct JSON parse
    let result = this.tryDirectParse(content)
    if (result.success) {
      return { ...result, warnings }
    }
    warnings.push('Direct JSON parse failed, trying extraction methods')

    // Stage 2: Extract from code blocks
    result = this.tryExtractFromCodeBlocks(content)
    if (result.success) {
      return { ...result, warnings }
    }
    warnings.push('Code block extraction failed, trying pattern matching')

    // Stage 3: Pattern-based extraction
    result = this.tryPatternExtraction(content)
    if (result.success) {
      return { ...result, warnings }
    }
    warnings.push('Pattern extraction failed, trying repair strategies')

    // Stage 4: Repair and retry
    result = this.tryRepairAndParse(content)
    if (result.success) {
      return { ...result, warnings }
    }
    warnings.push('All parsing strategies failed, generating fallback')

    // Stage 5: Generate from partial data
    return this.generateFromPartialData(content, warnings)
  }

  private static tryDirectParse(content: string): ParseResult {
    try {
      const data = JSON.parse(content)
      return { success: true, data }
    } catch (error) {
      return { success: false, error: `Direct parse failed: ${error}` }
    }
  }

  private static tryExtractFromCodeBlocks(content: string): ParseResult {
    const patterns = [
      /```json\s*([\s\S]*?)\s*```/gi,
      /```\s*([\s\S]*?)\s*```/gi,
      /`([^`]+)`/gi
    ]

    for (const pattern of patterns) {
      const matches = content.match(pattern)
      if (matches) {
        for (const match of matches) {
          const cleaned = match.replace(/```(json)?\s*/gi, '').replace(/```\s*$/gi, '')
          const result = this.tryDirectParse(cleaned)
          if (result.success) {
            return result
          }
        }
      }
    }
    
    return { success: false, error: 'No valid JSON found in code blocks' }
  }

  private static tryPatternExtraction(content: string): ParseResult {
    // Find JSON-like patterns in text
    const jsonPattern = /\{[\s\S]*\}/g
    const matches = content.match(jsonPattern)
    
    if (matches) {
      for (const match of matches) {
        const cleaned = this.cleanJsonString(match)
        const result = this.tryDirectParse(cleaned)
        if (result.success) {
          return result
        }
      }
    }
    
    return { success: false, error: 'No valid JSON patterns found' }
  }

  private static tryRepairAndParse(content: string): ParseResult {
    // Find the most promising JSON-like string
    let jsonStr = content
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    // Apply multiple repair strategies
    const repairStrategies = [
      this.repairQuotes,
      this.repairCommas,
      this.repairBraces,
      this.repairPropertyNames,
      this.removeComments,
      this.fixTrailingCommas
    ]

    for (const repair of repairStrategies) {
      try {
        const repaired = repair(jsonStr)
        const result = this.tryDirectParse(repaired)
        if (result.success) {
          return result
        }
        jsonStr = repaired // Use repaired version for next strategy
      } catch (error) {
        continue
      }
    }

    return { success: false, error: 'All repair strategies failed' }
  }

  private static generateFromPartialData(content: string, warnings: string[]): ParseResult {
    // Extract whatever we can from the content
    const partialData = this.extractPartialData(content)
    const gameData = this.buildValidGameFromPartial(partialData)
    
    warnings.push('Generated fallback game from partial data')
    return { 
      success: true, 
      data: gameData, 
      warnings 
    }
  }

  private static cleanJsonString(str: string): string {
    return str
      .replace(/^\s*```json?\s*/i, '') // Remove opening code block
      .replace(/\s*```\s*$/, '') // Remove closing code block
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .trim()
  }

  private static repairQuotes(str: string): string {
    // Fix unescaped quotes in string values
    return str.replace(/:\s*"([^"\\]*(\\.[^"\\]*)*)"/g, (match, content) => {
      const escaped = content.replace(/"/g, '\\"')
      return match.replace(content, escaped)
    })
  }

  private static repairCommas(str: string): string {
    // Fix missing commas between properties
    return str.replace(/"\s*\n\s*"/g, '",\n"')
      .replace(/}\s*\n\s*"/g, '},\n"')
      .replace(/]\s*\n\s*"/g, '],\n"')
  }

  private static repairBraces(str: string): string {
    // Try to balance braces
    let openBraces = 0
    let openBrackets = 0
    let result = ''
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i]
      result += char
      
      if (char === '{') openBraces++
      else if (char === '}') openBraces--
      else if (char === '[') openBrackets++
      else if (char === ']') openBrackets--
    }
    
    // Add missing closing braces/brackets
    while (openBraces > 0) {
      result += '}'
      openBraces--
    }
    while (openBrackets > 0) {
      result += ']'
      openBrackets--
    }
    
    return result
  }

  private static repairPropertyNames(str: string): string {
    // Add quotes to unquoted property names
    return str.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
  }

  private static removeComments(str: string): string {
    // Remove JavaScript-style comments
    return str
      .replace(/\/\*[\s\S]*?\*\//g, '') // Block comments
      .replace(/\/\/.*$/gm, '') // Line comments
  }

  private static fixTrailingCommas(str: string): string {
    // Remove trailing commas
    return str
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
  }

  private static extractPartialData(content: string): any {
    const data: any = {}
    
    // Extract title
    const titleMatch = content.match(/"title":\s*"([^"]*)"/)
    if (titleMatch) data.title = titleMatch[1]
    
    // Extract description
    const descMatch = content.match(/"description":\s*"([^"]*)"/)
    if (descMatch) data.description = descMatch[1]
    
    // Extract game type
    const typeMatch = content.match(/"gameType":\s*"([^"]*)"/)
    if (typeMatch) data.gameType = typeMatch[1]
    
    // Extract visual style
    const styleMatch = content.match(/"visualStyle":\s*"([^"]*)"/)
    if (styleMatch) data.visualStyle = styleMatch[1]
    
    // Extract theme
    const themeMatch = content.match(/"theme":\s*"([^"]*)"/)
    if (themeMatch) data.theme = themeMatch[1]
    
    return data
  }

  private static buildValidGameFromPartial(partialData: any): any {
    const gameType = partialData.gameType || "platformer"
    const isRacing = gameType === 'racing'
    
    // Create game-appropriate player entity
    const player = isRacing ? {
      name: "player_car",
      type: "player",
      x: 400,
      y: 500,
      width: 24,
      height: 48,
      color: "#FF0000",
      emoji: "🏎️",
      renderMode: "emoji",
      physics: {
        gravity: false,
        maxSpeed: 12,
        acceleration: 0.3,
        braking: 0.5,
        turning: 0.2,
        drift: 0.1
      },
      abilities: {
        boost: true
      },
      currentSpeed: 0,
      steeringAngle: 0,
      facingAngle: 0
    } : {
      name: "player",
      type: "player",
      x: 100,
      y: 300,
      width: 32,
      height: 48,
      color: "#FF6B6B",
      physics: {
        gravity: true,
        gravityForce: 0.8,
        jumpForce: 15,
        moveSpeed: 6,
        airControl: 0.7,
        friction: 0.8
      },
      abilities: {
        dash: true,
        doubleJump: false,
        wallJump: false
      },
      health: 3,
      maxHealth: 3
    }

    return {
      title: partialData.title || "AI Generated Game",
      description: partialData.description || "An exciting game created with AI",
      gameType: gameType,
      visualStyle: partialData.visualStyle || "pixel",
      theme: partialData.theme || "fantasy",
      entities: [player],
      levels: [{
        name: "Level 1",
        width: 1600,
        height: 800,
        background: "#2D5C3D",
        platforms: [
          { x: 0, y: 750, width: 1600, height: 50, color: "#8B4513" },
          { x: 300, y: 650, width: 200, height: 20, color: "#8B4513" },
          { x: 600, y: 550, width: 200, height: 20, color: "#8B4513" },
          { x: 900, y: 450, width: 150, height: 20, color: "#8B4513" },
          { x: 1200, y: 350, width: 200, height: 20, color: "#8B4513" }
        ],
        collectibles: [
          { type: "star", x: 350, y: 600, points: 10, color: "#FFD700", width: 24, height: 24 },
          { type: "star", x: 650, y: 500, points: 10, color: "#FFD700", width: 24, height: 24 },
          { type: "star", x: 950, y: 400, points: 15, color: "#FFD700", width: 24, height: 24, floating: true },
          { type: "star", x: 1250, y: 300, points: 20, color: "#FFD700", width: 24, height: 24, floating: true }
        ],
        traps: [
          { type: "spikes", x: 500, y: 730, width: 64, height: 20, damage: 1, color: "#FF0000" }
        ],
        goal: { x: 1500, y: 700, width: 64, height: 64, color: "#FFD700" }
      }],
      gameLogic: {
        winCondition: "reach goal",
        loseCondition: "health reaches 0",
        scoring: {
          collectibles: 10,
          enemies: 25,
          timeBonus: true,
          perfectBonus: 50
        }
      }
    }
  }

  /**
   * Validate and fix game data structure
   */
  static validateAndFixGameData(data: any): GameValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    let fixedData = JSON.parse(JSON.stringify(data)) // Deep clone

    // Check required fields
    for (const field of this.REQUIRED_FIELDS) {
      if (!fixedData[field]) {
        errors.push(`Missing required field: ${field}`)
      }
    }

    // Validate and fix entities
    if (!Array.isArray(fixedData.entities)) {
      errors.push('Entities must be an array')
      fixedData.entities = []
    }

    if (fixedData.entities.length === 0) {
      warnings.push('No entities found, adding default player')
      fixedData.entities.push(this.createDefaultPlayer(fixedData.gameType))
    }

    // Ensure player exists
    const hasPlayer = fixedData.entities.some((e: any) => e.type === 'player')
    if (!hasPlayer) {
      warnings.push('No player entity found, adding default player')
      fixedData.entities.unshift(this.createDefaultPlayer(fixedData.gameType))
    }

    // Fix racing game specific properties
    if (fixedData.gameType === 'racing') {
      fixedData.entities.forEach((entity: any) => {
        if (entity.type === 'player') {
          // Ensure racing physics
          entity.physics = {
            ...entity.physics,
            gravity: false,
            maxSpeed: entity.physics?.maxSpeed || 12,
            acceleration: entity.physics?.acceleration || 0.3,
            braking: entity.physics?.braking || 0.5,
            turning: entity.physics?.turning || 0.2,
            drift: entity.physics?.drift || 0.1
          }
          
          // Initialize racing state
          if (entity.currentSpeed === undefined) entity.currentSpeed = 0
          if (entity.steeringAngle === undefined) entity.steeringAngle = 0
          if (entity.facingAngle === undefined) entity.facingAngle = 0
          
          // Add racing abilities
          if (!entity.abilities) entity.abilities = {}
          entity.abilities.boost = true
        }
      })
    }

    // Validate and fix levels
    if (!Array.isArray(fixedData.levels)) {
      errors.push('Levels must be an array')
      fixedData.levels = []
    }

    if (fixedData.levels.length === 0) {
      warnings.push('No levels found, adding default level')
      fixedData.levels.push(this.createDefaultLevel())
    }

    // Fix level structure
    fixedData.levels.forEach((level: any, index: number) => {
      if (!level.width || !level.height) {
        warnings.push(`Level ${index + 1} missing dimensions, using defaults`)
        level.width = level.width || 1600
        level.height = level.height || 800
      }

      if (!level.platforms || !Array.isArray(level.platforms)) {
        warnings.push(`Level ${index + 1} missing platforms, adding ground`)
        level.platforms = [
          { x: 0, y: level.height - 50, width: level.width, height: 50, color: "#8B4513" }
        ]
      }

      if (!level.background) {
        level.background = "#87CEEB"
      }
    })

    // Validate entity properties
    fixedData.entities.forEach((entity: any, index: number) => {
      if (typeof entity.x !== 'number') entity.x = 100
      if (typeof entity.y !== 'number') entity.y = 300
      if (typeof entity.width !== 'number') entity.width = 32
      if (typeof entity.height !== 'number') entity.height = 48
      if (!entity.color) entity.color = entity.type === 'player' ? '#FF6B6B' : '#4ECDC4'
      if (!entity.name) entity.name = `${entity.type || 'entity'}_${index}`
      if (!entity.type) entity.type = 'entity'
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fixedData: errors.length === 0 ? fixedData : undefined
    }
  }

  private static createDefaultPlayer(gameType?: string) {
    if (gameType === 'racing') {
      return {
        name: "player_car",
        type: "player",
        x: 400,
        y: 500,
        width: 24,
        height: 48,
        color: "#FF0000",
        emoji: "🏎️",
        renderMode: "emoji",
        physics: {
          gravity: false,
          maxSpeed: 12,
          acceleration: 0.3,
          braking: 0.5,
          turning: 0.2,
          drift: 0.1
        },
        abilities: {
          boost: true
        },
        currentSpeed: 0,
        steeringAngle: 0,
        facingAngle: 0
      }
    }
    
    return {
      name: "player",
      type: "player",
      x: 100,
      y: 300,
      width: 32,
      height: 48,
      color: "#FF6B6B",
      physics: {
        gravity: true,
        gravityForce: 0.8,
        jumpForce: 15,
        moveSpeed: 6,
        airControl: 0.7,
        friction: 0.8
      },
      abilities: {
        dash: true,
        doubleJump: false,
        wallJump: false
      },
      health: 3,
      maxHealth: 3
    }
  }

  private static createDefaultLevel() {
    return {
      name: "Level 1",
      width: 1600,
      height: 800,
      background: "#87CEEB",
      platforms: [
        { x: 0, y: 750, width: 1600, height: 50, color: "#8B4513" }
      ],
      collectibles: [],
      goal: { x: 1500, y: 700, width: 50, height: 50, color: "#FFD700" }
    }
  }
}