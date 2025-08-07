const DEEPSEEK_API_KEY = process.env.VITE_DEEPSEEK_API_KEY || 'your-deepseek-api-key-here'
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

interface GenerationProgress {
  (step: string, progress: number, details?: string, accomplished?: string[], nextSteps?: string[]): void
}

import { AssetGenerator } from './assetGenerator'

// Intelligent game type detection from user prompt
function detectGameTypeFromPrompt(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase()
  
  // Racing game keywords
  if (lowerPrompt.includes('race') || lowerPrompt.includes('car') || lowerPrompt.includes('speed') ||
      lowerPrompt.includes('track') || lowerPrompt.includes('lap') || lowerPrompt.includes('driving')) {
    return 'racing'
  }
  
  // Tetris/Puzzle keywords
  if (lowerPrompt.includes('tetris') || lowerPrompt.includes('block') || lowerPrompt.includes('puzzle') ||
      lowerPrompt.includes('falling') || lowerPrompt.includes('clear') || lowerPrompt.includes('match')) {
    return 'tetris'
  }
  
  // Flappy Bird keywords
  if (lowerPrompt.includes('flappy') || lowerPrompt.includes('bird') || lowerPrompt.includes('fly') ||
      lowerPrompt.includes('tap') || lowerPrompt.includes('pipe') || lowerPrompt.includes('wing')) {
    return 'flappy'
  }
  
  // Shooter keywords
  if (lowerPrompt.includes('shoot') || lowerPrompt.includes('space') || lowerPrompt.includes('laser') ||
      lowerPrompt.includes('alien') || lowerPrompt.includes('enemy') || lowerPrompt.includes('gun')) {
    return 'shooter'
  }
  
  // Fighting keywords
  if (lowerPrompt.includes('fight') || lowerPrompt.includes('combat') || lowerPrompt.includes('battle') ||
      lowerPrompt.includes('punch') || lowerPrompt.includes('kick') || lowerPrompt.includes('martial')) {
    return 'fighting'
  }
  
  // Tower Defense keywords
  if (lowerPrompt.includes('tower') || lowerPrompt.includes('defense') || lowerPrompt.includes('wave') ||
      lowerPrompt.includes('castle') || lowerPrompt.includes('protect')) {
    return 'tower_defense'
  }
  
  // Endless Runner keywords
  if (lowerPrompt.includes('endless') || lowerPrompt.includes('runner') || lowerPrompt.includes('temple') ||
      lowerPrompt.includes('obstacle') || lowerPrompt.includes('dash')) {
    return 'endless_runner'
  }
  
  return 'platformer'
}

function getGameTypeSpecifications(gameType: string): string {
  switch (gameType) {
    case 'racing':
      return `
RACING GAME REQUIREMENTS:
- Create multiple racing cars with different colors/designs
- Design a complete racing track with curves, straights, and obstacles
- Include rival AI cars with different behaviors
- Add racing elements: start/finish line, lap counter, speed zones
- Position cars at realistic starting positions
- Include track boundaries and collision zones
- Add power-ups, boost pads, or collectible items on track
- Design for top-down or side-scrolling racing view
- Include realistic car physics: acceleration, braking, turning`

    case 'flappy':
      return `
FLAPPY GAME REQUIREMENTS:
- Create a flying character (bird, plane, etc.) with proper animations
- Design vertical obstacles with gaps for navigation
- Add moving elements and environmental hazards
- Include collectible items between obstacles
- Create scrolling background with parallax effect
- Position obstacles at challenging but fair intervals
- Add varying difficulty with obstacle patterns
- Include ground and ceiling collision boundaries`

    case 'platformer':
      return `
PLATFORMER GAME REQUIREMENTS:
- Create detailed character with jumping abilities
- Design multi-level platforms with varying heights
- Add enemies with patrol or chase behaviors
- Include collectible items and power-ups
- Create environmental hazards and moving platforms
- Add goal or exit points for each level
- Include proper jump physics and collision detection
- Design levels with increasing difficulty`

    case 'shooter':
      return `
SHOOTER GAME REQUIREMENTS:
- Create player ship/character with shooting abilities
- Design enemy waves with different movement patterns
- Add various enemy types with different behaviors
- Include power-ups and weapon upgrades
- Create bullet/projectile systems for both player and enemies
- Add background with scrolling space/environment
- Include boss enemies or special challenges
- Design for continuous action and escalating difficulty`

    default:
      return `
GENERAL GAME REQUIREMENTS:
- Create engaging player character with unique abilities
- Design interactive environment with obstacles and goals
- Add enemies or challenges with AI behaviors
- Include collectible items and scoring system
- Create multiple levels or progressive difficulty
- Add proper physics and collision detection`
  }
}

export async function generateGame(prompt: string, onProgress: GenerationProgress) {
  const accomplished: string[] = []
  const nextSteps: string[] = ['Analyze game concept', 'Generate game structure', 'Create visual assets', 'Optimize for mobile']
  
  onProgress('🤖 Initializing DeepSeek AI...', 5, 'Connecting to neural network', accomplished, nextSteps)
  
  // Detect the intended game type from the prompt
  const detectedGameType = detectGameTypeFromPrompt(prompt)
  accomplished.push('Connected to DeepSeek API')
  nextSteps.shift() // Remove completed step
  onProgress('🎯 Analyzing game concept...', 10, `Detected: ${detectedGameType.toUpperCase()}`, accomplished, nextSteps)
  
  // Enhanced mobile-optimized game prompt with detailed specifications
  const gamePrompt = `
You are an expert MOBILE GAME developer. Create a complete, professional-quality 2D game: "${prompt}"

CRITICAL REQUIREMENTS:
- Mobile-first design with intuitive touch controls
- ${detectedGameType.toUpperCase()} game type with proper mechanics
- Detailed entities with proper physics and positioning
- Rich gameplay elements and challenging progression
- Export-ready for mobile devices with 60fps performance

GAME TYPE SPECIFICATIONS:
${getGameTypeSpecifications(detectedGameType)}

IMPORTANT: 
- Create VARIED themes and art styles (don't repeat cyberpunk/minimalist)
- Generate REALISTIC game physics and mechanics
- Include proper collision detection and game logic
- Design for portrait and landscape mobile orientations

Generate complete JSON with ALL required fields:
{
  "title": "Creative Game Title (based on concept)",
  "description": "Engaging game description matching the theme",
  "gameType": "${detectedGameType}",
  "theme": "Choose ONE: fantasy, cyberpunk, nature, space, retro, horror, underwater, steampunk, neon, medieval, western, jungle, arctic",
  "artStyle": "Choose ONE: pixel, cartoon, minimalist, neon, realistic, hand-drawn, vector, isometric, low-poly",
  "mobileOptimized": true,
  "touchControls": {"tap": "action", "swipe": "direction", "hold": "continuous"},
  "entities": [
    {
      "name": "player",
      "type": "player", 
      "x": 100, "y": 400,
      "width": 40, "height": 40,
      "physics": {
        "gravity": ${detectedGameType !== 'racing' && detectedGameType !== 'shooter'},
        "collision": true,
        "mobile": true,
        ${detectedGameType === 'racing' ? '"maxSpeed": 12, "acceleration": 0.3, "braking": 0.5, "turning": 0.2,' : ''}
        ${detectedGameType === 'platformer' ? '"jumpForce": 15, "moveSpeed": 6,' : ''}
        ${detectedGameType === 'shooter' ? '"moveSpeed": 5, "shootCooldown": 0.2,' : ''}
        "friction": 0.8
      },
      "animations": ["idle", "move", "action"],
      "color": "#FF6B6B"
    }
    // ADD 3-5 MORE ENTITIES (enemies, vehicles, obstacles) based on game type
  ],
  "levels": [
    {
      "name": "Level 1 - [Creative Name]",
      "width": ${detectedGameType === 'racing' ? '1600' : '1200'}, 
      "height": ${detectedGameType === 'flappy' ? '800' : '600'},
      "mobileLayout": true,
      "background": "#appropriate_color_for_theme",
      "platforms": [
        // CREATE MULTIPLE PLATFORMS with proper positioning
        {"x": 0, "y": 550, "width": 200, "height": 50, "color": "#8B4513"},
        // ADD MORE PLATFORMS FOR INTERESTING LEVEL DESIGN
      ],
      "enemies": [
        // CREATE 2-3 ENEMIES with different behaviors
        {"name": "enemy1", "x": 300, "y": 500, "width": 30, "height": 30, "speed": 2}
      ],
      "collectibles": [
        // ADD 5-8 COLLECTIBLES strategically placed
        {"x": 150, "y": 450, "width": 20, "height": 20, "points": 10}
      ],
      "goal": {"x": 1100, "y": 400, "width": 60, "height": 60}
    }
  ],
  "gameLogic": {
    "winCondition": "${detectedGameType === 'racing' ? 'finish race' : detectedGameType === 'shooter' ? 'defeat enemies' : 'reach goal'}",
    "loseCondition": "${detectedGameType === 'racing' ? 'crash or timeout' : detectedGameType === 'flappy' ? 'hit obstacle' : 'fall or lose health'}", 
    "scoring": {
      "collectibles": ${detectedGameType === 'shooter' ? '25' : '10'},
      "enemies": ${detectedGameType === 'shooter' ? '50' : '25'},
      "timeBonus": true,
      ${detectedGameType === 'racing' ? '"racePosition": 100,' : ''}
      "combo": ${detectedGameType === 'shooter'}
    },
    "difficulty": "progressive",
    "specialMechanics": []
  },
  "mobileFeatures": {
    "autoSave": true,
    "pauseOnFocusLoss": true,
    "responsiveUI": true,
    "touchFeedback": true,
    "orientationSupport": ["portrait", "landscape"]
  }
}

REQUIREMENTS:
- Fill in ALL placeholder comments with actual content
- Create DETAILED entities with proper names, positions, and properties
- Design levels with strategic placement of all elements
- Use creative, theme-appropriate names and colors
- Make gameplay challenging but fair
- Ensure proper mobile optimization

Make it ADDICTIVE and MOBILE-PERFECT!`

  try {
    accomplished.push(`Analyzed concept as ${detectedGameType} game`)
    nextSteps.shift()
    nextSteps[0] = 'Send prompt to DeepSeek neural network'
    onProgress('🚀 Sending to DeepSeek brain...', 15, 'Crafting perfect game prompt', accomplished, nextSteps)
    
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: gamePrompt }],
        max_tokens: 6000,
        temperature: 0.8,
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API failed: ${response.status}`)
    }

    accomplished.push('Sent prompt to DeepSeek AI')
    nextSteps[0] = 'Process AI response'
    onProgress('🧠 DeepSeek thinking...', 30, 'AI generating game concept', accomplished, nextSteps)
    
    const data = await response.json()
    let content = data.choices[0].message.content

    // Handle continuation for complex games
    if (data.choices[0].finish_reason === 'length') {
      accomplished.push('Received initial game structure')
      nextSteps[0] = 'Expand complex game details'
      onProgress('📝 Expanding game details...', 40, 'Generating additional content', accomplished, nextSteps)
      content = await continueGeneration(content, prompt, onProgress)
    }

    accomplished.push('Received complete game structure from AI')
    nextSteps[0] = 'Parse and validate game data'
    onProgress('⚙️ Processing game structure...', 50, 'Parsing AI-generated content', accomplished, nextSteps)
    
    // Enhanced JSON extraction and cleaning
    let gameData = await parseGameData(content, prompt, detectedGameType)
    
    accomplished.push('Parsed and validated game structure')
    nextSteps[0] = 'Generate DALL-E 3 visual assets'
    
    // DISABLED: Asset generation moved to Python backend
    onProgress('🎨 Skipping frontend asset generation...', 60, 'Assets will be generated by Python backend', accomplished, nextSteps)
    
    // No DALL-E requests from frontend - Python backend handles this with 5-request limit
    gameData.assets = { sprites: [], backgrounds: [] }
    accomplished.push('Frontend asset generation disabled - Python backend will handle assets')
    
    nextSteps[0] = 'Apply final mobile optimizations'
    onProgress('🔧 Finalizing mobile game...', 95, 'Applying mobile optimizations', accomplished, nextSteps)
    
    // Ensure mobile optimization
    gameData = optimizeForMobile(gameData)
    
    accomplished.push('Applied mobile optimizations')
    accomplished.push('Created complete playable game')
    const finalNextSteps = ['Play your game in Preview tab', 'Use Game Improver for enhancements', 'Export to mobile device', 'Generate variations']
    onProgress('✨ Epic mobile game ready!', 100, 'Game generation complete!', accomplished, finalNextSteps)
    return gameData

  } catch (error) {
    console.error('DeepSeek Generation Error:', error)
    onProgress('❌ Generation failed', 0, error.message)
    throw new Error(`Game generation failed: ${error.message}`)
  }
}

async function parseGameData(content: string, prompt: string, detectedGameType: string): Promise<any> {
  let jsonContent = content
  
  // Extract JSON from various formats
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```|```\s*([\s\S]*?)\s*```|\{[\s\S]*\}/)
  if (jsonMatch) {
    jsonContent = jsonMatch[1] || jsonMatch[2] || jsonMatch[0]
  }
  
  // Clean up common JSON issues
  jsonContent = jsonContent
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":') // Add quotes
    .replace(/:\s*'([^']*)'/g, ': "$1"') // Fix quotes
    .replace(/,\s*}/g, '}') // Remove trailing commas
    .replace(/,\s*]/g, ']')
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\/\/.*$/gm, '') // Remove line comments
  
  try {
    return JSON.parse(jsonContent)
  } catch (parseError) {
    console.warn('JSON Parse failed, creating fallback game')
    
    // Smart fallback based on detected type
    return createFallbackGame(detectedGameType, prompt)
  }
}

function createFallbackGame(gameType: string, prompt: string): any {
  const themes = ['fantasy', 'cyberpunk', 'space', 'nature', 'retro', 'horror', 'underwater', 'steampunk', 'neon', 'medieval']
  const artStyles = ['pixel', 'cartoon', 'minimalist', 'neon', 'realistic', 'hand-drawn']
  
  const randomTheme = themes[Math.floor(Math.random() * themes.length)]
  const randomArtStyle = artStyles[Math.floor(Math.random() * artStyles.length)]
  
  const gameTemplates = {
    flappy: {
      title: "Sky Dash",
      description: `Navigate through obstacles in this fast-paced flying adventure. ${prompt}`,
      entities: [
        { 
          name: "player", 
          type: "player", 
          x: 100, 
          y: 300, 
          width: 32, 
          height: 32,
          physics: { gravity: true, collision: true, mobile: true },
          animations: ["idle", "fly", "fall"],
          controls: { tap: "fly" }
        }
      ],
      levels: [{ 
        name: "Sky Highway", 
        width: 800, 
        height: 600,
        mobileLayout: true,
        background: "#87CEEB",
        platforms: [],
        enemies: [
          { name: "pipe_top", x: 400, y: 0, width: 60, height: 200, color: "#228B22" },
          { name: "pipe_bottom", x: 400, y: 400, width: 60, height: 200, color: "#228B22" },
          { name: "pipe_top2", x: 600, y: 0, width: 60, height: 150, color: "#228B22" },
          { name: "pipe_bottom2", x: 600, y: 450, width: 60, height: 150, color: "#228B22" }
        ],
        collectibles: [
          { x: 450, y: 250, width: 20, height: 20, color: "#FFD700", points: 10 },
          { x: 650, y: 200, width: 20, height: 20, color: "#FFD700", points: 10 }
        ],
        goal: { x: 750, y: 300, width: 40, height: 40 }
      }]
    },
    racing: {
      title: "Turbo Speedway",
      description: `High-speed racing with drifting mechanics and competitive AI opponents. ${prompt}`,
      entities: [
        { 
          name: "player_car", 
          type: "player", 
          x: 100, 
          y: 450, 
          width: 40, 
          height: 20,
          physics: { 
            collision: true, 
            mobile: true, 
            speed: 8,
            maxSpeed: 15,
            acceleration: 0.3,
            braking: 0.5,
            turning: 0.2,
            drift: 0.1,
            gravity: false
          },
          animations: ["idle", "accelerate", "turn", "drift"],
          controls: { swipe: "steer", hold: "accelerate", tap: "brake" }
        }
      ],
      levels: [{ 
        name: "Speed Circuit", 
        width: 1200, 
        height: 600,
        mobileLayout: true,
        background: "#1a1a1a", // Dark track background
        platforms: [
          { x: 0, y: 500, width: 1200, height: 100, color: "#333333" }, // Track base
          { x: 50, y: 520, width: 1100, height: 60, color: "#555555" }, // Main road
          { x: 100, y: 540, width: 1000, height: 20, color: "#777777" } // Road lines
        ],
        enemies: [
          { name: "rival_red", x: 250, y: 460, width: 35, height: 18, color: "#FF2222", speed: 6 },
          { name: "rival_blue", x: 400, y: 465, width: 35, height: 18, color: "#2222FF", speed: 7 },
          { name: "rival_green", x: 550, y: 455, width: 35, height: 18, color: "#22FF22", speed: 5 }
        ],
        collectibles: [
          { x: 200, y: 480, width: 20, height: 20, color: "#FFD700", points: 10 },
          { x: 350, y: 485, width: 20, height: 20, color: "#FFD700", points: 10 },
          { x: 500, y: 480, width: 20, height: 20, color: "#FFD700", points: 10 },
          { x: 650, y: 485, width: 20, height: 20, color: "#FFD700", points: 10 }
        ],
        goal: { x: 1100, y: 470, width: 40, height: 40 }
      }]
    },
    platformer: {
      title: "Jump Quest",
      description: `Classic platforming adventure with precise jumping and exploration. ${prompt}`,
      entities: [
        { 
          name: "hero", 
          type: "player", 
          x: 50, 
          y: 450, 
          width: 32, 
          height: 32,
          physics: { gravity: true, collision: true, mobile: true, jumpPower: 12 },
          animations: ["idle", "run", "jump", "fall"],
          controls: { tap: "jump", swipe: "move" }
        }
      ],
      levels: [{ 
        name: "Forest Beginning", 
        width: 1200, 
        height: 600,
        mobileLayout: true,
        background: "#87CEEB",
        platforms: [
          { x: 0, y: 550, width: 1200, height: 50, color: "#8B4513" },      // Ground
          { x: 150, y: 480, width: 120, height: 20, color: "#228B22" },     // Platform 1
          { x: 320, y: 420, width: 100, height: 20, color: "#228B22" },     // Platform 2
          { x: 480, y: 360, width: 80, height: 20, color: "#228B22" },      // Platform 3
          { x: 620, y: 300, width: 100, height: 20, color: "#228B22" },     // Platform 4
          { x: 780, y: 450, width: 120, height: 20, color: "#228B22" },     // Platform 5
          { x: 950, y: 380, width: 100, height: 20, color: "#228B22" }      // Platform 6
        ],
        enemies: [
          { name: "goomba1", x: 300, y: 520, width: 24, height: 24, color: "#8B4513", speed: 1 },
          { name: "goomba2", x: 600, y: 270, width: 24, height: 24, color: "#8B4513", speed: 1 }
        ],
        collectibles: [
          { x: 200, y: 450, width: 20, height: 20, color: "#FFD700", points: 10 },
          { x: 360, y: 390, width: 20, height: 20, color: "#FFD700", points: 10 },
          { x: 510, y: 330, width: 20, height: 20, color: "#FFD700", points: 10 },
          { x: 660, y: 270, width: 20, height: 20, color: "#FFD700", points: 10 },
          { x: 830, y: 420, width: 20, height: 20, color: "#FFD700", points: 10 }
        ],
        goal: { x: 1000, y: 350, width: 40, height: 40 }
      }]
    },
    shooter: {
      title: "Space Defender",
      description: `Intense space combat with waves of enemies and power-ups. ${prompt}`,
      entities: [
        { 
          name: "spaceship", 
          type: "player", 
          x: 400, 
          y: 500, 
          width: 40, 
          height: 30,
          physics: { collision: true, mobile: true, speed: 6 },
          animations: ["idle", "thrust", "shoot"],
          controls: { swipe: "move", tap: "shoot" }
        }
      ],
      levels: [{ 
        name: "Asteroid Field", 
        width: 800, 
        height: 600,
        mobileLayout: true,
        background: "#000020",
        platforms: [],
        enemies: [
          { name: "alien1", x: 100, y: 100, width: 30, height: 25, color: "#FF4444", speed: 2 },
          { name: "alien2", x: 300, y: 150, width: 30, height: 25, color: "#FF4444", speed: 2 },
          { name: "alien3", x: 500, y: 120, width: 30, height: 25, color: "#FF4444", speed: 2 },
          { name: "asteroid1", x: 200, y: 250, width: 40, height: 40, color: "#696969", speed: 1 },
          { name: "asteroid2", x: 600, y: 280, width: 35, height: 35, color: "#696969", speed: 1 }
        ],
        collectibles: [
          { x: 150, y: 300, width: 25, height: 25, color: "#00FFFF", points: 20 },
          { x: 450, y: 350, width: 25, height: 25, color: "#FF69B4", points: 30 }
        ],
        goal: { x: 400, y: 50, width: 50, height: 30 }
      }]
    }
  }
  
  const template = gameTemplates[gameType] || gameTemplates.platformer
  
  return {
    ...template,
    gameType,
    theme: randomTheme,
    artStyle: randomArtStyle,
    mobileOptimized: true,
    touchControls: template.entities[0]?.controls || { tap: "action", swipe: "move" },
    gameLogic: {
      winCondition: gameType === 'racing' ? 'reach finish line' : gameType === 'shooter' ? 'defeat all enemies' : 'reach goal',
      loseCondition: gameType === 'flappy' ? 'hit obstacle' : gameType === 'racing' ? 'crash or time out' : 'fall or hit enemy',
      scoring: { 
        collectibles: gameType === 'shooter' ? 20 : 10,
        enemies: gameType === 'shooter' ? 50 : 25,
        timeBonus: gameType !== 'flappy',
        combo: gameType === 'shooter'
      }
    },
    mobileFeatures: {
      autoSave: true,
      pauseOnFocusLoss: true,
      responsiveUI: true,
      touchFriendlyUI: true,
      hapticFeedback: true
    }
  }
}

function optimizeForMobile(gameData: any): any {
  // Mobile-specific optimizations
  if (gameData.levels) {
    gameData.levels.forEach(level => {
      // Limit level width for mobile screens
      level.width = Math.min(level.width || 800, 1200)
      level.height = Math.min(level.height || 600, 800)
      
      // Ensure minimum platform sizes for touch
      if (level.platforms) {
        level.platforms.forEach(platform => {
          platform.height = Math.max(platform.height || 20, 40)
          platform.width = Math.max(platform.width || 50, 80)
        })
      }
    })
  }
  
  // Ensure entities are touch-friendly sizes
  if (gameData.entities) {
    gameData.entities.forEach(entity => {
      entity.width = Math.max(entity.width || 32, 24)
      entity.height = Math.max(entity.height || 32, 24)
    })
  }
  
  // Add mobile-specific properties if missing
  gameData.mobileOptimized = true
  gameData.touchControls = gameData.touchControls || { tap: "action", swipe: "move" }
  gameData.mobileFeatures = gameData.mobileFeatures || {
    autoSave: true,
    pauseOnFocusLoss: true,
    responsiveUI: true,
    touchFriendlyUI: true
  }
  
  return gameData
}

async function continueGeneration(partialContent: string, originalPrompt: string, onProgress: GenerationProgress): Promise<string> {
  onProgress('🔄 Continuing generation...', 45)
  
  const continuePrompt = `Continue and complete this JSON for mobile game: "${originalPrompt}". Previous partial: "${partialContent.slice(-300)}". Complete the JSON structure.`

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

  if (!response.ok) {
    throw new Error(`Continuation failed: ${response.status}`)
  }

  const data = await response.json()
  return partialContent + data.choices[0].message.content
}