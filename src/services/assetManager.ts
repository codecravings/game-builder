interface Asset {
  id: string
  name: string
  type: 'sprite' | 'audio' | 'texture' | 'animation'
  url: string
  data?: any
  width?: number
  height?: number
  loaded: boolean
  error?: string
}

interface SpriteSheet {
  id: string
  image: HTMLImageElement
  frames: { [key: string]: { x: number, y: number, width: number, height: number } }
}

interface GeneratedSprite {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
}

export class AssetManager {
  private static instance: AssetManager
  private assets = new Map<string, Asset>()
  private loadedImages = new Map<string, HTMLImageElement>()
  private loadedAudio = new Map<string, HTMLAudioElement>()
  private spriteSheets = new Map<string, SpriteSheet>()
  private generatedSprites = new Map<string, GeneratedSprite>()
  private loadingPromises = new Map<string, Promise<Asset>>()

  private constructor() {}

  static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager()
    }
    return AssetManager.instance
  }

  /**
   * Load an asset from URL
   */
  async loadAsset(id: string, url: string, type: Asset['type']): Promise<Asset> {
    // Return cached asset if already loaded
    if (this.assets.has(id)) {
      return this.assets.get(id)!
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id)!
    }

    const asset: Asset = {
      id,
      name: id.split('/').pop() || id,
      type,
      url,
      loaded: false
    }

    const loadingPromise = this.loadAssetData(asset)
    this.loadingPromises.set(id, loadingPromise)

    try {
      const loadedAsset = await loadingPromise
      this.assets.set(id, loadedAsset)
      this.loadingPromises.delete(id)
      return loadedAsset
    } catch (error) {
      this.loadingPromises.delete(id)
      asset.error = error instanceof Error ? error.message : 'Unknown error'
      asset.loaded = false
      this.assets.set(id, asset)
      throw error
    }
  }

  private async loadAssetData(asset: Asset): Promise<Asset> {
    switch (asset.type) {
      case 'sprite':
      case 'texture':
        return this.loadImage(asset)
      case 'audio':
        return this.loadAudio(asset)
      default:
        throw new Error(`Unsupported asset type: ${asset.type}`)
    }
  }

  private async loadImage(asset: Asset): Promise<Asset> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous' // Enable CORS
      
      img.onload = () => {
        asset.data = img
        asset.width = img.width
        asset.height = img.height
        asset.loaded = true
        this.loadedImages.set(asset.id, img)
        resolve(asset)
      }
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${asset.url}`))
      }
      
      img.src = asset.url
    })
  }

  private async loadAudio(asset: Asset): Promise<Asset> {
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      
      audio.oncanplaythrough = () => {
        asset.data = audio
        asset.loaded = true
        this.loadedAudio.set(asset.id, audio)
        resolve(asset)
      }
      
      audio.onerror = () => {
        reject(new Error(`Failed to load audio: ${asset.url}`))
      }
      
      audio.src = asset.url
    })
  }

  /**
   * Generate procedural sprite based on game data
   */
  generateSprite(id: string, config: {
    type: 'player' | 'enemy' | 'platform' | 'collectible' | 'background'
    style: 'pixel' | 'cartoon' | 'minimalist' | 'cyberpunk' | 'fantasy'
    width: number
    height: number
    color?: string
    theme?: string
  }): HTMLCanvasElement {
    
    // Check cache first
    if (this.generatedSprites.has(id)) {
      return this.generatedSprites.get(id)!.canvas
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = config.width
    canvas.height = config.height

    this.generatedSprites.set(id, { canvas, context: ctx })

    // Generate sprite based on type and style
    switch (config.type) {
      case 'player':
        this.generatePlayerSprite(ctx, config)
        break
      case 'enemy':
        this.generateEnemySprite(ctx, config)
        break
      case 'platform':
        this.generatePlatformSprite(ctx, config)
        break
      case 'collectible':
        this.generateCollectibleSprite(ctx, config)
        break
      case 'background':
        this.generateBackgroundSprite(ctx, config)
        break
    }

    return canvas
  }

  private generatePlayerSprite(ctx: CanvasRenderingContext2D, config: any) {
    const { width, height, color = '#FF6B6B', style } = config

    ctx.fillStyle = color
    
    switch (style) {
      case 'pixel':
        // Pixelated player character
        ctx.fillRect(width * 0.25, height * 0.1, width * 0.5, height * 0.3) // Head
        ctx.fillRect(width * 0.2, height * 0.4, width * 0.6, height * 0.4) // Body
        ctx.fillRect(width * 0.1, height * 0.4, width * 0.2, height * 0.5) // Left arm
        ctx.fillRect(width * 0.7, height * 0.4, width * 0.2, height * 0.5) // Right arm
        ctx.fillRect(width * 0.3, height * 0.8, width * 0.15, height * 0.2) // Left leg
        ctx.fillRect(width * 0.55, height * 0.8, width * 0.15, height * 0.2) // Right leg
        break
        
      case 'cartoon':
        // Rounded cartoon character
        ctx.beginPath()
        ctx.arc(width * 0.5, height * 0.25, width * 0.25, 0, Math.PI * 2) // Head
        ctx.fill()
        ctx.fillRect(width * 0.25, height * 0.4, width * 0.5, height * 0.4) // Body
        break
        
      case 'cyberpunk':
        // Neon cyberpunk style
        ctx.fillStyle = color
        ctx.fillRect(width * 0.3, height * 0.1, width * 0.4, height * 0.8)
        ctx.fillStyle = '#00FFFF'
        ctx.fillRect(width * 0.35, height * 0.15, width * 0.3, height * 0.1) // Visor
        break
        
      default:
        // Simple rectangle
        ctx.fillRect(0, 0, width, height)
    }
  }

  private generateEnemySprite(ctx: CanvasRenderingContext2D, config: any) {
    const { width, height, color = '#FF4500', style } = config
    
    ctx.fillStyle = color
    
    switch (style) {
      case 'pixel':
        // Menacing pixel enemy
        ctx.fillRect(width * 0.2, height * 0.2, width * 0.6, height * 0.6)
        ctx.fillStyle = '#FF0000'
        ctx.fillRect(width * 0.3, height * 0.3, width * 0.1, width * 0.1) // Left eye
        ctx.fillRect(width * 0.6, height * 0.3, width * 0.1, width * 0.1) // Right eye
        break
        
      case 'cyberpunk':
        // Robotic enemy
        ctx.fillRect(width * 0.1, height * 0.1, width * 0.8, height * 0.8)
        ctx.fillStyle = '#FF1493'
        ctx.fillRect(width * 0.2, height * 0.2, width * 0.6, height * 0.2) // Scanner
        break
        
      default:
        ctx.fillRect(0, 0, width, height)
    }
  }

  private generatePlatformSprite(ctx: CanvasRenderingContext2D, config: any) {
    const { width, height, color = '#8B4513', style } = config
    
    switch (style) {
      case 'pixel':
        // Pixelated stone blocks
        ctx.fillStyle = color
        ctx.fillRect(0, 0, width, height)
        
        // Add texture
        ctx.fillStyle = this.lightenColor(color, 20)
        for (let x = 0; x < width; x += 8) {
          for (let y = 0; y < height; y += 8) {
            if (Math.random() > 0.7) {
              ctx.fillRect(x, y, 4, 4)
            }
          }
        }
        break
        
      case 'cyberpunk':
        // Neon platform
        ctx.fillStyle = color
        ctx.fillRect(0, 0, width, height)
        
        // Neon edges
        ctx.strokeStyle = '#00FFFF'
        ctx.lineWidth = 2
        ctx.strokeRect(1, 1, width - 2, height - 2)
        break
        
      default:
        ctx.fillStyle = color
        ctx.fillRect(0, 0, width, height)
    }
  }

  private generateCollectibleSprite(ctx: CanvasRenderingContext2D, config: any) {
    const { width, height, color = '#FFD700', style } = config
    
    switch (style) {
      case 'pixel':
        // Pixelated star/gem
        ctx.fillStyle = color
        const centerX = width / 2
        const centerY = height / 2
        const size = Math.min(width, height) * 0.4
        
        // Draw star shape
        ctx.beginPath()
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5
          const x = centerX + Math.cos(angle) * size
          const y = centerY + Math.sin(angle) * size
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.fill()
        break
        
      case 'cyberpunk':
        // Digital crystal
        ctx.fillStyle = color
        ctx.fillRect(width * 0.2, height * 0.2, width * 0.6, height * 0.6)
        
        // Add glow effect
        const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2)
        gradient.addColorStop(0, color)
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
        break
        
      default:
        // Simple circle
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(width/2, height/2, Math.min(width, height)/2 - 2, 0, Math.PI * 2)
        ctx.fill()
    }
  }

  private generateBackgroundSprite(ctx: CanvasRenderingContext2D, config: any) {
    const { width, height, color = '#87CEEB', theme } = config
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    
    switch (theme) {
      case 'cyberpunk':
        gradient.addColorStop(0, '#1A0B3D')
        gradient.addColorStop(1, '#0D1B2A')
        break
      case 'fantasy':
        gradient.addColorStop(0, '#87CEEB')
        gradient.addColorStop(1, '#2D5C3D')
        break
      case 'space':
        gradient.addColorStop(0, '#000011')
        gradient.addColorStop(1, '#191970')
        break
      default:
        gradient.addColorStop(0, this.lightenColor(color, 30))
        gradient.addColorStop(1, color)
    }
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    
    // Add theme-specific details
    if (theme === 'space') {
      // Add stars
      ctx.fillStyle = 'white'
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * width
        const y = Math.random() * height
        const size = Math.random() * 2 + 1
        ctx.fillRect(x, y, size, size)
      }
    }
  }

  private lightenColor(color: string, percent: number): string {
    // Simple color lightening function
    const hex = color.replace('#', '')
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + percent)
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + percent)
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + percent)
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  /**
   * Get loaded asset
   */
  getAsset(id: string): Asset | null {
    return this.assets.get(id) || null
  }

  /**
   * Get loaded image
   */
  getImage(id: string): HTMLImageElement | null {
    return this.loadedImages.get(id) || null
  }

  /**
   * Get sprite (loaded image or generated canvas)
   */
  getSprite(id: string): HTMLImageElement | HTMLCanvasElement | null {
    // First try to get loaded image (from DALL-E)
    const loadedImage = this.loadedImages.get(id)
    if (loadedImage) {
      console.log(`🎨 Using loaded image sprite: ${id}`)
      return loadedImage
    }
    
    // Fallback to generated canvas
    const generatedSprite = this.generatedSprites.get(id)?.canvas
    if (generatedSprite) {
      console.log(`🎨 Using generated canvas sprite: ${id}`)
      return generatedSprite
    }
    
    console.warn(`🎨 No sprite found for: ${id}`)
    return null
  }

  /**
   * Preload assets for a game
   */
  async preloadGameAssets(gameData: any): Promise<void> {
    const loadPromises: Promise<Asset>[] = []
    
    console.log('🎮 Preloading game assets:', gameData.assets)
    
    // Load sprite assets
    if (gameData.assets?.sprites) {
      for (const sprite of gameData.assets.sprites) {
        if (sprite.url && sprite.url !== 'placeholder' && sprite.url.startsWith('data:image/')) {
          console.log(`🎨 Loading DALL-E sprite: ${sprite.name || sprite.id} from base64 data`)
          const spriteName = sprite.name || sprite.id
          const promise = this.loadAsset(spriteName, sprite.url, 'sprite')
            .then(asset => {
              console.log(`✅ Successfully loaded DALL-E sprite: ${spriteName}`)
              return asset
            })
            .catch(error => {
              console.warn(`❌ Failed to load DALL-E sprite ${spriteName}:`, error)
              // Generate fallback sprite
              this.generateGameSprite(sprite, gameData)
              return this.createFallbackAsset(spriteName, 'sprite')
            })
          loadPromises.push(promise)
        } else if (sprite.url && sprite.url !== 'placeholder') {
          console.log(`🎨 Loading sprite: ${sprite.name} from ${sprite.url.substring(0, 50)}...`)
          const promise = this.loadAsset(sprite.name, sprite.url, 'sprite')
            .then(asset => {
              console.log(`✅ Successfully loaded sprite: ${sprite.name}`)
              return asset
            })
            .catch(error => {
              console.warn(`❌ Failed to load sprite ${sprite.name}:`, error)
              // Generate fallback sprite
              this.generateGameSprite(sprite, gameData)
              return this.createFallbackAsset(sprite.name, 'sprite')
            })
          loadPromises.push(promise)
        } else {
          // Generate procedural sprite
          console.log(`🎨 Generating procedural sprite: ${sprite.name}`)
          this.generateGameSprite(sprite, gameData)
        }
      }
    }
    
    // Load background assets
    if (gameData.assets?.backgrounds) {
      for (const bg of gameData.assets.backgrounds) {
        if (bg.url && bg.url !== 'placeholder' && bg.url.startsWith('data:image/')) {
          console.log(`🖼️ Loading DALL-E background: ${bg.name || bg.id} from base64 data`)
          const bgName = bg.name || bg.id || 'background'
          const promise = this.loadAsset(bgName, bg.url, 'sprite')
            .then(asset => {
              console.log(`✅ Successfully loaded DALL-E background: ${bgName}`)
              return asset
            })
            .catch(error => {
              console.warn(`❌ Failed to load DALL-E background ${bgName}:`, error)
              return this.createFallbackAsset(bgName, 'sprite')
            })
          loadPromises.push(promise)
        } else if (bg.url && bg.url !== 'placeholder') {
          console.log(`🖼️ Loading background: ${bg.name} from ${bg.url.substring(0, 50)}...`)
          const promise = this.loadAsset(bg.name, bg.url, 'sprite')
            .then(asset => {
              console.log(`✅ Successfully loaded background: ${bg.name}`)
              return asset
            })
            .catch(error => {
              console.warn(`❌ Failed to load background ${bg.name}:`, error)
              return this.createFallbackAsset(bg.name, 'sprite')
            })
          loadPromises.push(promise)
        }
      }
    }

    // Load audio assets
    if (gameData.assets?.sounds) {
      for (const sound of gameData.assets.sounds) {
        if (sound.url && sound.url !== 'placeholder') {
          const promise = this.loadAsset(sound.name, sound.url, 'audio')
            .catch(error => {
              console.warn(`Failed to load audio ${sound.name}:`, error)
              return this.createFallbackAsset(sound.name, 'audio')
            })
          loadPromises.push(promise)
        }
      }
    }

    // Wait for all assets to load
    const results = await Promise.allSettled(loadPromises)
    console.log(`🎯 Asset loading complete: ${results.filter(r => r.status === 'fulfilled').length}/${results.length} successful`)
  }

  private generateGameSprite(spriteConfig: any, gameData: any) {
    const config = {
      type: this.inferSpriteType(spriteConfig.name),
      style: gameData.visualStyle || 'pixel',
      width: spriteConfig.width || 32,
      height: spriteConfig.height || 32,
      color: spriteConfig.color,
      theme: gameData.theme
    }
    
    this.generateSprite(spriteConfig.name, config)
  }

  private inferSpriteType(spriteName: string): any {
    const name = spriteName.toLowerCase()
    if (name.includes('player')) return 'player'
    if (name.includes('enemy')) return 'enemy'
    if (name.includes('platform')) return 'platform'
    if (name.includes('collectible') || name.includes('coin') || name.includes('star')) return 'collectible'
    if (name.includes('background')) return 'background'
    return 'player' // default
  }

  private createFallbackAsset(id: string, type: Asset['type']): Asset {
    return {
      id,
      name: id,
      type,
      url: '',
      loaded: true,
      data: null
    }
  }

  /**
   * Clear all assets
   */
  clear(): void {
    this.assets.clear()
    this.loadedImages.clear()
    this.loadedAudio.clear()
    this.spriteSheets.clear()
    this.generatedSprites.clear()
    this.loadingPromises.clear()
  }

  /**
   * Get loading progress
   */
  getLoadingProgress(): { loaded: number, total: number, percentage: number } {
    const total = this.assets.size
    const loaded = Array.from(this.assets.values()).filter(asset => asset.loaded).length
    
    return {
      loaded,
      total,
      percentage: total > 0 ? (loaded / total) * 100 : 100
    }
  }
}