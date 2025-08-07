import { generateEnhancedGame } from './enhancedGameGeneration'

// Use local backend proxy to avoid CORS issues
const BACKEND_API_URL = 'http://localhost:3003/api/deepseek'

export interface AssetSuggestion {
  type: 'file' | 'emoji' | 'css' | 'sprite'
  category: 'player' | 'background' | 'platform' | 'collectible' | 'enemy' | 'sound' | 'music' | 'effect'
  current: string
  suggestions: {
    name: string
    description: string
    implementation: string
    example?: string
  }[]
  priority: 'high' | 'medium' | 'low'
  reason: string
}

export interface GameAnalysis {
  overallScore: number
  strengths: string[]
  improvements: string[]
  assetSuggestions: AssetSuggestion[]
  codeEnhancements: {
    description: string
    code: string
    benefit: string
  }[]
  visualUpgrades: {
    area: string
    current: string
    improved: string
    implementation: string
  }[]
}

export class AIGameEnhancer {
  
  static async analyzeGame(gameData: any): Promise<GameAnalysis> {
    const analysisPrompt = `
Analyze this AI-generated game and provide comprehensive improvement suggestions:

GAME DATA:
${JSON.stringify(gameData, null, 2)}

Please analyze and provide specific suggestions in JSON format:

{
  "overallScore": 75,
  "strengths": ["Good basic mechanics", "Clear game structure"],
  "improvements": ["Visuals need enhancement", "Audio missing", "Effects lacking"],
  "assetSuggestions": [
    {
      "type": "file",
      "category": "player", 
      "current": "${gameData.entities?.find((e: any) => e.type === 'player')?.color || 'basic rectangle'}",
      "suggestions": [
        {
          "name": "player_sprite.png",
          "description": "32x32 pixel art character sprite with idle/run/jump animations",
          "implementation": "Replace solid color rectangle with animated sprite",
          "example": "🧙‍♂️ Use wizard emoji as temporary placeholder"
        },
        {
          "name": "emoji_upgrade",
          "description": "Use emojis for immediate visual improvement",
          "implementation": "Replace entity.color with emoji characters",
          "example": "🧙‍♂️ for player, 🏰 for platforms, ⭐ for collectibles"
        }
      ],
      "priority": "high",
      "reason": "Player character is currently just a colored rectangle - needs personality"
    },
    {
      "type": "file",
      "category": "background",
      "current": "${gameData.levels?.[0]?.background || 'solid color'}",
      "suggestions": [
        {
          "name": "background.png",
          "description": "Parallax scrolling background with ${gameData.theme || 'fantasy'} theme",
          "implementation": "Add layered background images with depth",
          "example": "🌄 Mountains, 🌙 night sky, ⭐ twinkling stars"
        },
        {
          "name": "css_gradient",
          "description": "Animated CSS gradient background",
          "implementation": "background: linear-gradient(45deg, #colors...)",
          "example": "Animated gradient shifting colors based on game state"
        }
      ],
      "priority": "high", 
      "reason": "Background is too plain - needs atmosphere and depth"
    },
    {
      "type": "file",
      "category": "sound",
      "current": "no audio",
      "suggestions": [
        {
          "name": "jump_sound.mp3",
          "description": "Satisfying jump sound effect",
          "implementation": "Play on player jump action",
          "example": "🔊 'boing' or 'whoosh' sound"
        },
        {
          "name": "collect_sound.mp3", 
          "description": "Reward sound for collecting items",
          "implementation": "Play when collectible is picked up",
          "example": "🎵 'ding' or 'chime' sound"
        },
        {
          "name": "background_music.mp3",
          "description": "Looping ambient music for ${gameData.theme || 'fantasy'} theme",
          "implementation": "Background audio loop",
          "example": "🎼 Orchestral/electronic based on theme"
        }
      ],
      "priority": "medium",
      "reason": "Audio greatly enhances game feel and immersion"
    }
  ],
  "codeEnhancements": [
    {
      "description": "Add particle effects for actions",
      "code": "this.particles.createEffect(player.x, player.y, 'jump_sparkles')",
      "benefit": "Visual feedback makes actions feel more impactful"
    },
    {
      "description": "Implement screen shake on impacts", 
      "code": "this.camera.shake(intensity, duration)",
      "benefit": "Adds weight and feedback to collisions"
    },
    {
      "description": "Add smooth camera following",
      "code": "this.camera.smoothFollow(target, lerpFactor)",
      "benefit": "Professional camera movement enhances gameplay"
    }
  ],
  "visualUpgrades": [
    {
      "area": "Entity Rendering",
      "current": "Basic colored rectangles",
      "improved": "Animated sprites with emojis or custom art",
      "implementation": "Replace fillRect with drawImage or emoji text rendering"
    },
    {
      "area": "Lighting System", 
      "current": "No lighting effects",
      "improved": "Dynamic shadows and glowing effects",
      "implementation": "Add shadow rendering and glow filters"
    },
    {
      "area": "UI Polish",
      "current": "Basic HUD",
      "improved": "Styled UI with animations and effects", 
      "implementation": "CSS animations and smooth transitions"
    }
  ]
}

Focus on practical, immediately implementable suggestions. Prioritize visual improvements that can be done with emojis, CSS, or simple file replacements. Be specific about file names and implementation steps.
`

    try {
      console.log('🤖 Sending analysis request to backend...')
      const response = await fetch(BACKEND_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: analysisPrompt,
          maxTokens: 3000,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content

      // Parse the JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not parse AI response')
      }

    } catch (error) {
      console.error('Game analysis failed:', error)
      // Return fallback analysis
      return this.createFallbackAnalysis(gameData)
    }
  }

  static createFallbackAnalysis(gameData: any): GameAnalysis {
    return {
      overallScore: 65,
      strengths: [
        "Basic game mechanics work",
        "Player can move and interact", 
        "Level structure is solid"
      ],
      improvements: [
        "Visuals need major upgrade",
        "Add sound effects and music",
        "Enhance visual feedback",
        "Improve user interface"
      ],
      assetSuggestions: [
        {
          type: 'emoji',
          category: 'player',
          current: gameData.entities?.find((e: any) => e.type === 'player')?.color || '#FF6B6B',
          suggestions: [
            {
              name: 'Emoji Player',
              description: 'Use emojis for immediate visual upgrade',
              implementation: 'Replace color rendering with emoji characters',
              example: '🧙‍♂️ Wizard, 🥷 Ninja, 🤖 Robot, 👨‍🚀 Astronaut'
            }
          ],
          priority: 'high',
          reason: 'Player is currently just a colored rectangle'
        },
        {
          type: 'emoji',
          category: 'platform',
          current: gameData.levels?.[0]?.platforms?.[0]?.color || '#8B4513',
          suggestions: [
            {
              name: 'Platform Emojis',
              description: 'Use emoji patterns for platforms',
              implementation: 'Render emoji tiles instead of solid colors',
              example: '🟫 Dirt, 🧱 Brick, 🟦 Ice, 🌿 Grass'
            }
          ],
          priority: 'medium',
          reason: 'Platforms look too basic'
        },
        {
          type: 'file',
          category: 'sound',
          current: 'No audio',
          suggestions: [
            {
              name: 'jump.mp3',
              description: 'Jump sound effect',
              implementation: 'Play when player jumps',
              example: 'Add to assets folder and reference in game'
            },
            {
              name: 'collect.wav',
              description: 'Item collection sound',
              implementation: 'Play when collecting items',
              example: 'Short "ding" or "chime" sound'
            }
          ],
          priority: 'medium',
          reason: 'Audio makes games feel much more alive'
        }
      ],
      codeEnhancements: [
        {
          description: 'Add emoji rendering system',
          code: `
// Replace entity rendering with emojis
renderEntity(entity) {
  const emojiMap = {
    player: '🧙‍♂️',
    enemy: '👹', 
    collectible: '⭐'
  }
  this.ctx.font = '${entity.width}px serif'
  this.ctx.fillText(emojiMap[entity.type] || '⬜', entity.x, entity.y)
}`,
          benefit: 'Instant visual upgrade without needing image files'
        }
      ],
      visualUpgrades: [
        {
          area: 'Entity Visuals',
          current: 'Solid color rectangles',
          improved: 'Emoji characters or sprites',
          implementation: 'Use canvas fillText with emojis or drawImage with sprites'
        }
      ]
    }
  }

  static async enhanceGameVisuals(gameData: any, selectedUpgrades: string[]): Promise<any> {
    const enhancePrompt = `
Enhance this game's visual aspects based on selected improvements:

CURRENT GAME:
${JSON.stringify(gameData, null, 2)}

SELECTED UPGRADES:
${selectedUpgrades.map(upgrade => `- ${upgrade}`).join('\n')}

Return the enhanced game data in JSON format with:
1. Better visual properties (colors, effects, animations)
2. Emoji integration where appropriate  
3. Enhanced particle effects and visual feedback
4. Improved UI elements

Focus on practical improvements that work with the existing engine structure.
`

    try {
      console.log('🎨 Sending enhancement request to backend...')
      const response = await fetch(BACKEND_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: enhancePrompt,
          maxTokens: 2000,
          temperature: 0.6
        })
      })

      const data = await response.json()
      const content = data.choices[0].message.content

      // Parse and return enhanced game data
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

    } catch (error) {
      console.error('Visual enhancement failed:', error)
    }

    // Fallback enhancement
    return {
      ...gameData,
      title: gameData.title + ' - Enhanced',
      entities: gameData.entities.map((entity: any) => ({
        ...entity,
        emoji: entity.type === 'player' ? '🧙‍♂️' : 
               entity.type === 'enemy' ? '👹' : '⭐',
        color: entity.type === 'player' ? '#00FFFF' : entity.color
      }))
    }
  }

  static async generateCustomCode(gameData: any, userPrompt: string): Promise<string> {
    const codePrompt = `
Generate custom code to enhance this game based on user request:

GAME DATA:
${JSON.stringify(gameData, null, 2)}

USER REQUEST:
"${userPrompt}"

Generate JavaScript/TypeScript code that:
1. Integrates with the existing EnhancedGameEngine
2. Adds the requested functionality
3. Includes proper error handling
4. Has clear comments explaining what it does

Return executable code that can be added to the game engine.
`

    try {
      console.log('💻 Sending code generation request to backend...')
      const response = await fetch(BACKEND_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: codePrompt,
          maxTokens: 2000,
          temperature: 0.7
        })
      })

      const data = await response.json()
      return data.choices[0].message.content

    } catch (error) {
      console.error('Code generation failed:', error)
      return `// Custom code generation failed\n// Error: ${error}\n// Please try a simpler request`
    }
  }
}