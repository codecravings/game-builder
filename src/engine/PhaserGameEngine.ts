import Phaser from 'phaser'

export class PhaserGameEngine {
  private game: Phaser.Game | null = null
  private scene: Phaser.Scene | null = null
  private player: Phaser.GameObjects.Rectangle | null = null
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null
  private wasd: any = null
  private gameData: any = null
  private enemies: Phaser.GameObjects.Rectangle[] = []
  private collectibles: Phaser.GameObjects.Rectangle[] = []

  constructor(containerId: string, gameData: any) {
    this.gameData = gameData
    this.initPhaser(containerId)
  }

  private initPhaser(containerId: string) {
    const self = this
    
    class GameScene extends Phaser.Scene {
      constructor() {
        super({ key: 'GameScene' })
      }

      preload() {
        console.log('🎮 Phaser preload starting...')
        self.scene = this
      }

      create() {
        console.log('🎮 Phaser create starting...', self.gameData)
        self.scene = this
        self.createGameContent()
      }

      update() {
        self.updateGame()
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 1200,
      height: 600,
      parent: containerId,
      backgroundColor: this.gameData.levels?.[0]?.background || '#1a1a1a',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: this.gameData.gameType === 'racing' ? 0 : 300, x: 0 },
          debug: false
        }
      },
      scene: GameScene
    }

    this.game = new Phaser.Game(config)
  }

  private createGameContent() {
    console.log('🎮 Creating game content...', this.gameData)
    
    if (!this.scene) {
      console.error('❌ Scene is null in createGameContent')
      return
    }

    try {

    // Set background color via scene config instead of rectangle
    if (this.scene.cameras && this.scene.cameras.main) {
      const bgColor = this.gameData.levels?.[0]?.background || '#2a2a2a'
      const bgColorHex = bgColor.startsWith('#') ? parseInt(bgColor.slice(1), 16) : 0x2a2a2a
      this.scene.cameras.main.setBackgroundColor(bgColorHex)
      console.log('🎨 Background color set to:', bgColor)
    }
    
    // Add game title
    this.scene.add.text(20, 20, this.gameData.title || 'AI Game', { 
      fontSize: '24px', 
      color: '#ffffff' 
    })

    // Create player from game data
    console.log('🔍 Checking for entities:', this.gameData.entities?.length || 0)
    if (this.gameData.entities) {
      console.log('🔍 Entity types:', this.gameData.entities.map((e: any) => `${e.name}(${e.type})`))
    }
    const playerEntity = this.gameData.entities?.find((e: any) => e.type === 'player')
    console.log('🔍 Player entity found:', !!playerEntity, playerEntity)
    if (playerEntity) {
      const playerColor = playerEntity.color?.startsWith('#') ? parseInt(playerEntity.color.slice(1), 16) : 0x00FFFF
      const playerX = playerEntity.x || 100
      const playerY = playerEntity.y || 400
      this.player = this.scene.add.rectangle(
        playerX, 
        playerY, 
        playerEntity.width || 40, 
        playerEntity.height || 40, 
        playerColor
      )
      this.player.setStrokeStyle(2, 0xFFFFFF) // Add white border for visibility
      
      console.log('🎮 Player created:', {
        x: playerX, 
        y: playerY, 
        color: playerEntity.color,
        colorHex: playerColor.toString(16)
      })
      
      // Add emoji text if available
      if (playerEntity.emoji) {
        const emojiText = this.scene.add.text(
          playerX, 
          playerY - 10, 
          playerEntity.emoji, 
          { fontSize: '32px' }
        ).setOrigin(0.5)
        console.log('🎮 Player emoji added:', playerEntity.emoji)
      }
    } else {
      this.player = this.scene.add.rectangle(100, 400, 40, 40, 0x00FFFF)
      this.player.setStrokeStyle(2, 0xFFFFFF)
    }
    console.log('🎮 Player final position:', this.player.x, this.player.y, 'visible:', this.player.visible)
      
    // Enable physics
    this.scene.physics.add.existing(this.player)
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body
    
    if (this.gameData.gameType === 'racing') {
      playerBody.setDrag(200)
      playerBody.setMaxVelocity(300, 300)
      console.log('🏎️ Racing physics enabled')
    } else {
      playerBody.setBounce(0.2)
      playerBody.setCollideWorldBounds(true)
      console.log('🎮 Platform physics enabled')
    }

    // Create enemies from game data  
    const enemyEntities = this.gameData.entities?.filter((e: any) => 
      e.type === 'enemy' || 
      e.name?.includes('enemy') || 
      e.name?.includes('guardian') || 
      e.name?.includes('guard') || 
      e.name?.includes('archer')
    ) || []
    console.log('🦹 Found enemies:', enemyEntities.length, enemyEntities.map(e => e.name))
    enemyEntities.forEach((enemy: any, i: number) => {
      const enemyColor = enemy.color?.startsWith('#') ? parseInt(enemy.color.slice(1), 16) : 0xFF4444
      const enemyX = enemy.x || (300 + i * 150)
      const enemyY = enemy.y || 350
      const enemySprite = this.scene.add.rectangle(
        enemyX,
        enemyY,
        enemy.width || 30,
        enemy.height || 30,
        enemyColor
      )
      enemySprite.setStrokeStyle(2, 0xFFFFFF) // Add white border for visibility
      
      console.log('🦹 Enemy created:', {
        name: enemy.name,
        x: enemyX, 
        y: enemyY, 
        color: enemy.color,
        colorHex: enemyColor.toString(16)
      })
      
      // Add emoji if available
      if (enemy.emoji) {
        const emojiText = this.scene.add.text(
          enemyX, 
          enemyY - 10, 
          enemy.emoji, 
          { fontSize: '28px' }
        ).setOrigin(0.5)
        console.log('🦹 Enemy emoji added:', enemy.emoji)
      }
      
      this.scene.physics.add.existing(enemySprite)
      const enemyBody = enemySprite.body as Phaser.Physics.Arcade.Body
      
      if (this.gameData.gameType === 'racing') {
        enemyBody.setVelocityY(-50 - Math.random() * 50)
        enemyBody.setDrag(100)
      } else {
        enemyBody.setVelocityX(50 * (Math.random() > 0.5 ? 1 : -1))
        enemyBody.setBounce(1, 0)
        enemyBody.setCollideWorldBounds(true)
      }
      
      this.enemies.push(enemySprite)
    })

    // Create collectibles from game data
    const collectibleEntities = this.gameData.entities?.filter((e: any) => 
      e.type === 'collectible' || 
      e.type === 'powerup' ||
      e.name?.includes('star') || 
      e.name?.includes('coin') ||
      e.name?.includes('spring') ||
      e.name?.includes('bamboo')
    ) || []
    console.log('⭐ Found collectibles:', collectibleEntities.length, collectibleEntities.map(e => e.name))
    collectibleEntities.forEach((collectible: any, i: number) => {
      const collectibleColor = collectible.color?.startsWith('#') ? parseInt(collectible.color.slice(1), 16) : 0xFFD700
      const collectibleX = collectible.x || (400 + i * 200)
      const collectibleY = collectible.y || 300
      const collectibleSprite = this.scene.add.rectangle(
        collectibleX,
        collectibleY,
        collectible.width || 20,
        collectible.height || 20,
        collectibleColor
      )
      collectibleSprite.setStrokeStyle(2, 0xFFFFFF) // Add white border for visibility
      
      console.log('⭐ Collectible created:', {
        name: collectible.name,
        x: collectibleX, 
        y: collectibleY, 
        color: collectible.color,
        colorHex: collectibleColor.toString(16)
      })
      
      // Add emoji if available
      if (collectible.emoji) {
        const emojiText = this.scene.add.text(
          collectibleX, 
          collectibleY - 5, 
          collectible.emoji, 
          { fontSize: '24px' }
        ).setOrigin(0.5)
        console.log('⭐ Collectible emoji added:', collectible.emoji)
      }
      
      this.collectibles.push(collectibleSprite)
    })

    // Create hazards and other entities that weren't caught
    const otherEntities = this.gameData.entities?.filter((e: any) => 
      e.type !== 'player' && 
      !enemyEntities.includes(e) && 
      !collectibleEntities.includes(e)
    ) || []
    console.log('🔧 Found other entities:', otherEntities.length, otherEntities.map(e => `${e.name}(${e.type})`))
    
    otherEntities.forEach((entity: any, i: number) => {
      const entityColor = entity.color?.startsWith('#') ? parseInt(entity.color.slice(1), 16) : 0xFFAA00
      const entityX = entity.x || (600 + i * 100)
      const entityY = entity.y || 350
      const entitySprite = this.scene.add.rectangle(
        entityX,
        entityY,
        entity.width || 30,
        entity.height || 30,
        entityColor
      )
      entitySprite.setStrokeStyle(2, 0xFF0000) // Red border for hazards
      
      console.log('🔧 Other entity created:', {
        name: entity.name,
        type: entity.type,
        x: entityX, 
        y: entityY, 
        color: entity.color,
        colorHex: entityColor.toString(16)
      })
      
      // Add emoji if available
      if (entity.emoji) {
        const emojiText = this.scene.add.text(
          entityX, 
          entityY - 10, 
          entity.emoji, 
          { fontSize: '24px' }
        ).setOrigin(0.5)
        console.log('🔧 Other entity emoji added:', entity.emoji)
      }
      
      // Add physics for hazards
      this.scene.physics.add.existing(entitySprite)
      const entityBody = entitySprite.body as Phaser.Physics.Arcade.Body
      
      if (entity.name?.includes('blade')) {
        entityBody.setVelocityX(100) // Spinning blade movement
        entityBody.setBounce(1, 0)
        entityBody.setCollideWorldBounds(true)
      }
    })

    // Set up controls
    this.cursors = this.scene.input.keyboard!.createCursorKeys()
    this.wasd = this.scene.input.keyboard!.addKeys('W,S,A,D')

      // Add test entities to ensure visibility
      console.log('🧪 Adding test entities for debugging...')
      const testPlayer = this.scene.add.rectangle(150, 300, 50, 50, 0xFF0000) // Red
      testPlayer.setStrokeStyle(3, 0xFFFFFF)
      this.scene.add.text(150, 280, '🔴', { fontSize: '40px' }).setOrigin(0.5)
      
      const testEnemy = this.scene.add.rectangle(300, 300, 40, 40, 0x00FF00) // Green
      testEnemy.setStrokeStyle(3, 0xFFFFFF)
      this.scene.add.text(300, 280, '🟢', { fontSize: '32px' }).setOrigin(0.5)
      
      const testCollectible = this.scene.add.rectangle(450, 300, 25, 25, 0x0000FF) // Blue
      testCollectible.setStrokeStyle(2, 0xFFFFFF)
      this.scene.add.text(450, 285, '🔵', { fontSize: '24px' }).setOrigin(0.5)

      console.log('✅ Phaser game created successfully!')
      console.log('📊 Scene summary:', {
        playerVisible: this.player?.visible,
        enemyCount: this.enemies.length,
        collectibleCount: this.collectibles.length,
        sceneChildren: this.scene.children.list.length,
        testEntitiesAdded: 3
      })
    } catch (error) {
      console.error('❌ Error in Phaser create:', error)
      console.error('❌ Error details:', {
        gameData: this.gameData,
        entities: this.gameData?.entities,
        scene: !!this.scene
      })
    }
  }

  private updateGame() {
    if (!this.player || !this.cursors || !this.wasd) return

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body
    
    if (this.gameData.gameType === 'racing') {
      // Racing controls
      if (this.cursors.up.isDown || this.wasd.W.isDown) {
        playerBody.setVelocityY(-200) // Forward
      } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
        playerBody.setVelocityY(100) // Backward
      }
      
      if (this.cursors.left.isDown || this.wasd.A.isDown) {
        playerBody.setVelocityX(-150) // Left
      } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
        playerBody.setVelocityX(150) // Right
      }
    } else {
      // Platform controls
      if (this.cursors.left.isDown || this.wasd.A.isDown) {
        playerBody.setVelocityX(-160)
      } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
        playerBody.setVelocityX(160)
      } else {
        playerBody.setVelocityX(0)
      }

      if ((this.cursors.up.isDown || this.wasd.W.isDown) && playerBody.touching.down) {
        playerBody.setVelocityY(-330) // Jump
      }
    }

    // Simple AI for racing games
    if (this.gameData.gameType === 'racing') {
      this.enemies.forEach((enemy) => {
        const enemyBody = enemy.body as Phaser.Physics.Arcade.Body
        
        // Keep AI cars moving forward
        if (Math.abs(enemyBody.velocity.y) < 30) {
          enemyBody.setVelocityY(-80 - Math.random() * 40)
        }
        
        // Simple lane changing
        if (Math.random() < 0.01) { // 1% chance per frame
          enemyBody.setVelocityX((Math.random() - 0.5) * 200)
        }
        
        // Reset position if off screen
        if (enemy.y < -50) {
          enemy.y = 650
          enemy.x = 200 + Math.random() * 800
        }
      })
    }

    // Reset player if off screen
    if (this.player.y > 650) {
      this.player.y = 50
    }
  }

  public destroy() {
    if (this.game) {
      this.game.destroy(true)
      this.game = null
    }
  }

  public pause() {
    if (this.scene) {
      this.scene.scene.pause()
    }
  }

  public resume() {
    if (this.scene) {
      this.scene.scene.resume()
    }
  }

  public getGameState() {
    return {
      score: 0,
      time: 0,
      fps: this.game?.loop.actualFps || 0,
      entities: this.enemies.length + this.collectibles.length + 1
    }
  }
}