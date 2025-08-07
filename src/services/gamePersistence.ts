interface SavedGame {
  id: string
  title: string
  description: string
  gameData: any
  thumbnail?: string
  createdAt: Date
  updatedAt: Date
  version: string
  tags: string[]
}

interface GameMetadata {
  id: string
  title: string
  description: string
  thumbnail?: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
}

export class GamePersistenceManager {
  private static readonly STORAGE_KEY = 'ai_game_engine_games'
  private static readonly CURRENT_GAME_KEY = 'ai_game_engine_current'
  private static readonly AUTO_SAVE_KEY = 'ai_game_engine_autosave'
  private static readonly VERSION = '1.0.0'
  
  // IndexedDB setup for large games
  private static dbName = 'AIGameEngineDB'
  private static dbVersion = 1
  private static db: IDBDatabase | null = null

  /**
   * Initialize the persistence system
   */
  static async initialize(): Promise<void> {
    try {
      await this.initIndexedDB()
      this.startAutoSave()
      console.log('Game persistence system initialized')
    } catch (error) {
      console.warn('IndexedDB not available, falling back to localStorage:', error)
    }
  }

  private static async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create games store
        if (!db.objectStoreNames.contains('games')) {
          const store = db.createObjectStore('games', { keyPath: 'id' })
          store.createIndex('title', 'title', { unique: false })
          store.createIndex('createdAt', 'createdAt', { unique: false })
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true })
        }
      }
    })
  }

  /**
   * Save a game
   */
  static async saveGame(gameData: any, metadata?: Partial<SavedGame>): Promise<string> {
    const gameId = metadata?.id || this.generateId()
    const now = new Date()
    
    const savedGame: SavedGame = {
      id: gameId,
      title: metadata?.title || gameData.title || 'Untitled Game',
      description: metadata?.description || gameData.description || 'An AI generated game',
      gameData: this.sanitizeGameData(gameData),
      thumbnail: metadata?.thumbnail || await this.generateThumbnail(gameData),
      createdAt: metadata?.createdAt || now,
      updatedAt: now,
      version: this.VERSION,
      tags: metadata?.tags || this.generateTags(gameData)
    }

    try {
      // Try IndexedDB first
      if (this.db) {
        await this.saveToIndexedDB(savedGame)
      } else {
        // Fallback to localStorage
        this.saveToLocalStorage(savedGame)
      }
      
      console.log(`Game saved: ${savedGame.title} (${gameId})`)
      return gameId
    } catch (error) {
      console.error('Failed to save game:', error)
      throw new Error('Failed to save game')
    }
  }

  /**
   * Load a game by ID
   */
  static async loadGame(gameId: string): Promise<SavedGame | null> {
    try {
      if (this.db) {
        return await this.loadFromIndexedDB(gameId)
      } else {
        return this.loadFromLocalStorage(gameId)
      }
    } catch (error) {
      console.error('Failed to load game:', error)
      return null
    }
  }

  /**
   * Get all saved games metadata
   */
  static async getAllGames(): Promise<GameMetadata[]> {
    try {
      if (this.db) {
        return await this.getAllFromIndexedDB()
      } else {
        return this.getAllFromLocalStorage()
      }
    } catch (error) {
      console.error('Failed to load games list:', error)
      return []
    }
  }

  /**
   * Delete a game
   */
  static async deleteGame(gameId: string): Promise<boolean> {
    try {
      if (this.db) {
        await this.deleteFromIndexedDB(gameId)
      } else {
        this.deleteFromLocalStorage(gameId)
      }
      console.log(`Game deleted: ${gameId}`)
      return true
    } catch (error) {
      console.error('Failed to delete game:', error)
      return false
    }
  }

  /**
   * Auto-save current game
   */
  static autoSaveCurrentGame(gameData: any): void {
    try {
      const autoSave = {
        gameData: this.sanitizeGameData(gameData),
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(this.AUTO_SAVE_KEY, JSON.stringify(autoSave))
    } catch (error) {
      console.warn('Auto-save failed:', error)
    }
  }

  /**
   * Load auto-saved game
   */
  static loadAutoSave(): any | null {
    try {
      const autoSave = localStorage.getItem(this.AUTO_SAVE_KEY)
      if (autoSave) {
        const data = JSON.parse(autoSave)
        // Check if auto-save is recent (within last hour)
        const timestamp = new Date(data.timestamp)
        const now = new Date()
        const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)
        
        if (timestamp > hourAgo) {
          return data.gameData
        }
      }
    } catch (error) {
      console.warn('Failed to load auto-save:', error)
    }
    return null
  }

  /**
   * Export game as shareable file
   */
  static exportGame(gameData: any, title?: string): void {
    const exportData = {
      version: this.VERSION,
      title: title || gameData.title || 'Exported Game',
      gameData: this.sanitizeGameData(gameData),
      exportedAt: new Date().toISOString(),
      generator: 'AI Game Engine'
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(title || 'game').replace(/\s+/g, '_')}.aigame`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Import game from file
   */
  static async importGame(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const importData = JSON.parse(content)
          
          if (importData.gameData && importData.version) {
            resolve(importData.gameData)
          } else {
            // Try to parse as direct game data
            resolve(importData)
          }
        } catch (error) {
          reject(new Error('Invalid game file format'))
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  // Private helper methods
  private static async saveToIndexedDB(game: SavedGame): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['games'], 'readwrite')
      const store = transaction.objectStore('games')
      const request = store.put(game)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private static async loadFromIndexedDB(gameId: string): Promise<SavedGame | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['games'], 'readonly')
      const store = transaction.objectStore('games')
      const request = store.get(gameId)
      
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  private static async getAllFromIndexedDB(): Promise<GameMetadata[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['games'], 'readonly')
      const store = transaction.objectStore('games')
      const request = store.getAll()
      
      request.onsuccess = () => {
        const games = request.result.map(game => ({
          id: game.id,
          title: game.title,
          description: game.description,
          thumbnail: game.thumbnail,
          createdAt: game.createdAt,
          updatedAt: game.updatedAt,
          tags: game.tags
        }))
        resolve(games.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()))
      }
      request.onerror = () => reject(request.error)
    })
  }

  private static async deleteFromIndexedDB(gameId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['games'], 'readwrite')
      const store = transaction.objectStore('games')
      const request = store.delete(gameId)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private static saveToLocalStorage(game: SavedGame): void {
    const games = this.getLocalStorageGames()
    games[game.id] = game
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(games))
  }

  private static loadFromLocalStorage(gameId: string): SavedGame | null {
    const games = this.getLocalStorageGames()
    return games[gameId] || null
  }

  private static getAllFromLocalStorage(): GameMetadata[] {
    const games = this.getLocalStorageGames()
    return Object.values(games)
      .map(game => ({
        id: game.id,
        title: game.title,
        description: game.description,
        thumbnail: game.thumbnail,
        createdAt: new Date(game.createdAt),
        updatedAt: new Date(game.updatedAt),
        tags: game.tags
      }))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  private static deleteFromLocalStorage(gameId: string): void {
    const games = this.getLocalStorageGames()
    delete games[gameId]
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(games))
  }

  private static getLocalStorageGames(): Record<string, SavedGame> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.warn('Failed to parse saved games:', error)
      return {}
    }
  }

  private static generateId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private static sanitizeGameData(gameData: any): any {
    // Remove any circular references and non-serializable data
    return JSON.parse(JSON.stringify(gameData))
  }

  private static async generateThumbnail(gameData: any): Promise<string> {
    // Generate a simple SVG thumbnail based on game data
    const level = gameData.levels?.[0]
    if (!level) return ''

    const svg = `
      <svg width="200" height="120" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="120" fill="${level.background || '#87CEEB'}"/>
        ${level.platforms?.slice(0, 3).map((platform: any) => 
          `<rect x="${(platform.x / level.width) * 200}" y="${(platform.y / level.height) * 120}" 
                 width="${(platform.width / level.width) * 200}" height="${(platform.height / level.height) * 120}" 
                 fill="${platform.color || '#8B4513'}"/>`
        ).join('') || ''}
        ${gameData.entities?.slice(0, 1).map((entity: any) => 
          `<rect x="${(entity.x / level.width) * 200}" y="${(entity.y / level.height) * 120}" 
                 width="${(entity.width / level.width) * 200}" height="${(entity.height / level.height) * 120}" 
                 fill="${entity.color || '#FF6B6B'}"/>`
        ).join('') || ''}
      </svg>
    `
    
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }

  private static generateTags(gameData: any): string[] {
    const tags: string[] = []
    
    if (gameData.gameType) tags.push(gameData.gameType)
    if (gameData.theme) tags.push(gameData.theme)
    if (gameData.visualStyle) tags.push(gameData.visualStyle)
    
    // Add gameplay tags based on content
    if (gameData.levels?.some((level: any) => level.enemies?.length > 0)) {
      tags.push('combat')
    }
    if (gameData.levels?.some((level: any) => level.collectibles?.length > 0)) {
      tags.push('collectibles')
    }
    if (gameData.entities?.some((entity: any) => entity.abilities)) {
      tags.push('abilities')
    }
    
    return tags
  }

  private static startAutoSave(): void {
    // Auto-save every 30 seconds if there's current game data
    setInterval(() => {
      const currentGame = sessionStorage.getItem(this.CURRENT_GAME_KEY)
      if (currentGame) {
        try {
          const gameData = JSON.parse(currentGame)
          this.autoSaveCurrentGame(gameData)
        } catch (error) {
          console.warn('Auto-save failed:', error)
        }
      }
    }, 30000)
  }

  /**
   * Set current game for auto-save
   */
  static setCurrentGame(gameData: any): void {
    try {
      sessionStorage.setItem(this.CURRENT_GAME_KEY, JSON.stringify(gameData))
    } catch (error) {
      console.warn('Failed to set current game:', error)
    }
  }

  /**
   * Get current game
   */
  static getCurrentGame(): any | null {
    try {
      const current = sessionStorage.getItem(this.CURRENT_GAME_KEY)
      return current ? JSON.parse(current) : null
    } catch (error) {
      console.warn('Failed to get current game:', error)
      return null
    }
  }
}