const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY || 'your-openai-api-key-here'
const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations'

interface AssetGenerationProgress {
  (step: string, progress: number): void
}

interface GameAsset {
  name: string
  type: 'character' | 'background' | 'ui' | 'particle'
  url: string
  width: number
  height: number
}

export class AssetGenerator {
  static async generateMinimalAssets(
    gameType: string, 
    theme: string, 
    artStyle: string,
    onProgress: AssetGenerationProgress
  ): Promise<GameAsset[]> {
    
    onProgress('🎨 Designing asset prompts...', 10)
    
    // Minimal but essential assets for mobile games
    const assetPrompts = this.getMinimalAssetPrompts(gameType, theme, artStyle)
    
    const assets: GameAsset[] = []
    const totalAssets = assetPrompts.length
    
    for (let i = 0; i < assetPrompts.length; i++) {
      const prompt = assetPrompts[i]
      const progress = 20 + (i / totalAssets) * 70
      
      onProgress(`🖼️ Creating ${prompt.name}...`, progress)
      
      try {
        const imageUrl = await this.generateSingleAsset(prompt.prompt)
        
        assets.push({
          name: prompt.name,
          type: prompt.type,
          url: imageUrl,
          width: prompt.width,
          height: prompt.height
        })
        
        // Small delay to show progress nicely
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error) {
        console.warn(`Failed to generate ${prompt.name}, using fallback`)
        // Use colored rectangle fallbacks for mobile compatibility
        assets.push({
          name: prompt.name,
          type: prompt.type,
          url: this.createColoredRectangle(prompt.width, prompt.height, prompt.fallbackColor || '#4A90E2'),
          width: prompt.width,
          height: prompt.height
        })
      }
    }
    
    onProgress('✨ Assets ready!', 100)
    return assets
  }
  
  // NEW: Generate assets based on actual game data entities
  static async generateAssetsForGameData(
    gameData: any,
    onProgress: AssetGenerationProgress
  ): Promise<GameAsset[]> {
    
    onProgress('🔍 Analyzing game entities...', 10)
    
    const assets: GameAsset[] = []
    const theme = gameData.theme || 'fantasy'
    const artStyle = gameData.artStyle || 'pixel'
    const baseStyle = `${artStyle} style, ${theme} theme, mobile game asset, clean design, high contrast`
    
    // Collect unique entity names that need sprites
    const entityNames = new Set<string>()
    if (gameData.entities) {
      gameData.entities.forEach((entity: any) => {
        if (entity.name && entity.type !== 'projectile') {
          entityNames.add(entity.name)
        }
      })
    }
    
    console.log('🎨 Found entities needing sprites:', Array.from(entityNames))
    
    const totalAssets = entityNames.size + 1 // +1 for background
    let currentAsset = 0
    
    // Generate background
    onProgress('🖼️ Creating background...', 20)
    try {
      const backgroundPrompt = this.getBackgroundPrompt(gameData.gameType, theme, artStyle)
      const backgroundUrl = await this.generateSingleAsset(backgroundPrompt)
      assets.push({
        name: 'background',
        type: 'background',
        url: backgroundUrl,
        width: 512,
        height: 256
      })
      console.log('✅ Generated background asset')
    } catch (error) {
      console.warn('❌ Failed to generate background:', error)
      assets.push({
        name: 'background',
        type: 'background',
        url: this.createColoredRectangle(512, 256, '#87CEEB'),
        width: 512,
        height: 256
      })
    }
    currentAsset++
    
    // Generate sprites for each unique entity
    for (const entityName of entityNames) {
      const progress = 20 + (currentAsset / totalAssets) * 70
      onProgress(`🎨 Creating ${entityName}...`, progress)
      
      try {
        const entityPrompt = this.getEntityPrompt(entityName, gameData.gameType, theme, artStyle)
        const entityUrl = await this.generateSingleAsset(entityPrompt)
        
        assets.push({
          name: entityName,
          type: 'character',
          url: entityUrl,
          width: 32,
          height: 32
        })
        
        console.log(`✅ Generated sprite for: ${entityName}`)
        await new Promise(resolve => setTimeout(resolve, 300)) // Shorter delay
        
      } catch (error) {
        console.warn(`❌ Failed to generate ${entityName}:`, error)
        
        // Use fallback color based on entity name
        const fallbackColor = this.getFallbackColor(entityName)
        assets.push({
          name: entityName,
          type: 'character',
          url: this.createColoredRectangle(32, 32, fallbackColor),
          width: 32,
          height: 32
        })
      }
      
      currentAsset++
    }
    
    onProgress('✨ All assets ready!', 100)
    console.log(`🎯 Generated ${assets.length} assets for game entities`)
    return assets
  }
  
  private static getMinimalAssetPrompts(gameType: string, theme: string, artStyle: string) {
    const baseStyle = `${artStyle} style, ${theme} theme, mobile game asset, clean design, high contrast`
    
    switch (gameType) {
      case 'platformer':
        return [
          {
            name: 'player',
            type: 'character' as const,
            prompt: `${baseStyle}, cute character sprite, 32x32 pixels, simple design, bright colors`,
            width: 32, height: 32, fallbackColor: '#FF6B9D'
          },
          {
            name: 'background',
            type: 'background' as const,
            prompt: `${baseStyle}, scrolling game background, parallax layers, mobile optimized`,
            width: 512, height: 256, fallbackColor: '#87CEEB'
          }
        ]
      
      case 'flappy':
        return [
          {
            name: 'bird',
            type: 'character' as const,
            prompt: `${baseStyle}, flying bird character, cute and simple, 24x24 pixels`,
            width: 24, height: 24, fallbackColor: '#FFD700'
          },
          {
            name: 'pipe',
            type: 'character' as const,
            prompt: `${baseStyle}, obstacle pipe, simple design, green color`,
            width: 32, height: 128, fallbackColor: '#228B22'
          }
        ]
      
      case 'racing':
        return [
          {
            name: 'car',
            type: 'character' as const,
            prompt: `${baseStyle}, top-down race car, sleek design, 32x16 pixels`,
            width: 32, height: 16, fallbackColor: '#FF4444'
          },
          {
            name: 'track',
            type: 'background' as const,
            prompt: `${baseStyle}, racing track background, asphalt texture, mobile game`,
            width: 512, height: 512, fallbackColor: '#333333'
          }
        ]
      
      default:
        return [
          {
            name: 'player',
            type: 'character' as const,
            prompt: `${baseStyle}, game character, simple and clean, 32x32 pixels`,
            width: 32, height: 32, fallbackColor: '#4A90E2'
          }
        ]
    }
  }
  
  private static async generateSingleAsset(prompt: string): Promise<string> {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'b64_json'  // Get base64 instead of URL to avoid CORS
      })
    })
    
    if (!response.ok) {
      throw new Error(`DALL-E API error: ${response.status}`)
    }
    
    const data = await response.json()
    // Convert base64 to data URL
    return `data:image/png;base64,${data.data[0].b64_json}`
  }
  
  private static createColoredRectangle(width: number, height: number, color: string): string {
    // Create a data URL for a colored rectangle as fallback
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    
    ctx.fillStyle = color
    ctx.fillRect(0, 0, width, height)
    
    // Add a subtle border for better visibility
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, width, height)
    
    return canvas.toDataURL()
  }
  
  private static getBackgroundPrompt(gameType: string, theme: string, artStyle: string): string {
    const baseStyle = `${artStyle} art style, ${theme} theme, mobile game background`
    
    switch (gameType) {
      case 'racing':
        return `${baseStyle}, professional racing track circuit, asphalt road surface, white lane markings, tire barriers, grandstands in distance, aerial top-down view, high-quality racing venue, detailed track surface, 1920x1080 landscape orientation`
      case 'flappy':
        return `${baseStyle}, beautiful sky environment, fluffy white clouds, gradient blue sky, distant mountains or cityscape, parallax-ready layers, bright and cheerful atmosphere, endless runner style, 1920x1080 landscape orientation`
      case 'platformer':
        return `${baseStyle}, detailed platform game environment, lush forest with trees, rocky platforms, atmospheric lighting, layered background for parallax scrolling, adventure game quality, 1920x1080 landscape orientation`
      case 'shooter':
        return `${baseStyle}, deep space environment, star field with nebulae, distant galaxies, cosmic dust, asteroid fields, sci-fi atmosphere, space combat setting, 1920x1080 landscape orientation`
      case 'tetris':
        return `${baseStyle}, abstract geometric background, subtle grid patterns, clean minimalist design, soft gradients, puzzle game aesthetic, 1920x1080 landscape orientation`
      default:
        return `${baseStyle}, versatile game environment suitable for ${gameType || 'adventure'} gameplay, detailed and atmospheric, 1920x1080 landscape orientation`
    }
  }
  
  private static getEntityPrompt(entityName: string, gameType: string, theme: string, artStyle: string): string {
    const baseStyle = `${artStyle} art style, ${theme} theme, mobile game sprite`
    
    // Enhanced prompts for better quality
    if (entityName.includes('player') || entityName === 'hero') {
      switch (gameType) {
        case 'racing':
          return `${baseStyle}, top-down view racing car, Formula 1 style, sleek aerodynamic design, bright racing colors, detailed wheels and body, professional racing livery, high-quality game asset, transparent background, centered, 512x512 pixels`
        case 'flappy':
          return `${baseStyle}, cute cartoon bird character, vibrant feathers, expressive eyes, flying pose with spread wings, colorful and friendly design, game mascot quality, transparent background, centered, 256x256 pixels`
        case 'shooter':
          return `${baseStyle}, futuristic spaceship, detailed hull design, engine thrusters, weapon systems, metallic finish, space combat vehicle, sci-fi aesthetic, transparent background, centered, 256x256 pixels`
        default:
          return `${baseStyle}, heroic character sprite, detailed armor or clothing, determined expression, action-ready pose, vibrant colors, RPG game quality, transparent background, centered, 256x256 pixels`
      }
    }
    
    if (entityName.includes('enemy') || entityName.includes('goomba') || entityName.includes('alien')) {
      switch (gameType) {
        case 'racing':
          return `${baseStyle}, rival racing car, aggressive design, different color scheme, competitive racing vehicle, detailed body and wheels, transparent background, centered, 512x512 pixels`
        case 'shooter':
          return `${baseStyle}, hostile alien spaceship, menacing design, weapon arrays, dark metallic colors, sci-fi enemy craft, transparent background, centered, 256x256 pixels`
        default:
          return `${baseStyle}, enemy creature or character, menacing appearance, detailed features, hostile design, video game boss quality, transparent background, centered, 256x256 pixels`
      }
    }
    
    if (entityName.includes('car') || entityName.includes('vehicle')) {
      return `${baseStyle}, detailed racing car top-down view, realistic automotive design, racing stripes, detailed wheels and body panels, professional livery, transparent background, centered, 512x512 pixels`
    }
    
    if (entityName.includes('pipe')) {
      return `${baseStyle}, green obstacle pipe, industrial design, realistic texture, clear edges, game obstacle quality, transparent background, centered, 128x512 pixels, vertical orientation`
    }
    
    if (entityName.includes('bird')) {
      return `${baseStyle}, detailed bird character, realistic feathers, expressive features, flying animation pose, nature-inspired colors, transparent background, centered, 256x256 pixels`
    }
    
    // Enhanced fallback with better context
    return `${baseStyle}, detailed ${entityName} game sprite, high-quality design, clear features, professional game asset, transparent background, centered, 256x256 pixels`
  }
  
  private static getFallbackColor(entityName: string): string {
    // Return appropriate fallback colors based on entity name
    if (entityName.includes('player') || entityName === 'hero') return '#4A90E2'
    if (entityName.includes('enemy') || entityName.includes('goomba')) return '#FF4444'
    if (entityName.includes('car')) return '#FF6B6B'
    if (entityName.includes('pipe')) return '#228B22'
    if (entityName.includes('bird')) return '#FFD700'
    if (entityName.includes('alien')) return '#9B59B6'
    if (entityName.includes('coin') || entityName.includes('star')) return '#F1C40F'
    
    return '#4A90E2' // Default blue
  }
}