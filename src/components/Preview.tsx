import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { PhaserGameEngine } from '../engine/PhaserGameEngine'
import GameDebugger from './GameDebugger'
import SaveLoadSystem from './SaveLoadSystem'
import GameImprover from './GameImprover'
import GameImprovementPanel from './GameImprovementPanel'
import SaveLoadPanel from './SaveLoadPanel'
import { GamePersistenceManager } from '../services/gamePersistence'
import { AnimatePresence } from 'framer-motion'
import { AIGameEnhancer, type GameAnalysis } from '../services/aiGameEnhancer'
import { getGameTemplate } from '../services/gameTemplates'
import { MobileExporter } from '../services/mobileExporter'
import { GameDataAdapter } from '../services/gameDataAdapter'

interface PreviewProps {
  game: any
  onGameUpdate?: (game: any) => void
}

export default function Preview({ game, onGameUpdate }: PreviewProps) {
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameCode, setGameCode] = useState('')
  const [gameEngine, setGameEngine] = useState<PhaserGameEngine | null>(null)
  const [gameState, setGameState] = useState<any>({})
  const [showSaveLoad, setShowSaveLoad] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showReplaceAssets, setShowReplaceAssets] = useState(false)
  const [showCustomCode, setShowCustomCode] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhanceProgress, setEnhanceProgress] = useState('')
  const [gameAnalysis, setGameAnalysis] = useState<GameAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [customCodeInput, setCustomCodeInput] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState('')
  const [showGameImprover, setShowGameImprover] = useState(false)
  const [showImprovementPanel, setShowImprovementPanel] = useState(false)
  const [showSaveLoadPanel, setShowSaveLoadPanel] = useState(false)

  useEffect(() => {
    if (game && gameContainerRef.current) {
      console.log('🎮 Preview received new game data:', game.title, game.gameType)
      
      // Stop existing engine first
      if (gameEngine) {
        console.log('🛑 Destroying existing Phaser engine')
        gameEngine.destroy()
        setGameEngine(null)
      }
      
      const timeoutId = setTimeout(() => {
        console.log('🚀 Initializing new Phaser engine for:', game.title)
        initializeEngine()
        generateGameCode()
      }, 300) // Slightly longer delay for cleanup
      
      return () => {
        clearTimeout(timeoutId)
        if (gameEngine) {
          gameEngine.destroy()
        }
      }
    }
  }, [game?.title, game?.gameType, game?.entities?.length]) // Re-initialize on key changes

  useEffect(() => {
    if (gameEngine) {
      const interval = setInterval(() => {
        setGameState(gameEngine.getGameState())
      }, 100)
      
      return () => clearInterval(interval)
    }
  }, [gameEngine])

  const initializeEngine = () => {
    if (!gameContainerRef.current || !game) return
    
    // Clear the container
    gameContainerRef.current.innerHTML = ''
    
    // Stop existing engine if it exists
    if (gameEngine) {
      gameEngine.destroy()
      setGameEngine(null)
    }
    
    try {
      setError(null)
      console.log('🎮 Initializing Phaser engine with data:', game)
      console.log('🎯 Game type:', game.gameType)
      
      // Create unique container ID
      const containerId = `phaser-game-${Date.now()}`
      const gameDiv = document.createElement('div')
      gameDiv.id = containerId
      gameDiv.style.width = '100%'
      gameDiv.style.height = '600px'
      gameContainerRef.current.appendChild(gameDiv)
      
      // Create Phaser engine
      const engine = new PhaserGameEngine(containerId, game)
      setGameEngine(engine)
      setIsPlaying(true)
      
      // Update persistence - but catch quota errors
      try {
        GamePersistenceManager.setCurrentGame(game)
      } catch (error) {
        console.warn('localStorage quota exceeded, skipping save:', error)
      }
      
      console.log('✅ Phaser game engine initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Phaser engine:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize game engine'
      setError(`Phaser Engine Error: ${errorMessage}`)
      
      if (error instanceof Error && error.stack) {
        console.error('Error stack:', error.stack)
      }
    }
  }

  const togglePlayPause = () => {
    if (gameEngine) {
      if (isPlaying) {
        gameEngine.pause()
      } else {
        gameEngine.resume()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const restartGame = () => {
    initializeEngine()
  }
  
  // Intelligent game validation and enhancement
  const validateAndEnhanceGame = (gameData: any) => {
    try {
      // Detect actual game type from content
      const detectedType = GameTypeRouter.detectGameTypeFromContent(gameData)
      
      // Get the appropriate template for validation
      const template = getGameTemplate(detectedType)
      
      if (template && (gameData.gameType !== detectedType || isGameDataIncomplete(gameData))) {
        console.log(`🔧 Enhancing ${gameData.gameType || 'unknown'} game using ${detectedType} template`)
        
        // Merge game data with template to fill missing parts
        const enhancedGame = {
          ...template.template,
          ...gameData,
          gameType: detectedType,
          // Preserve user's title and description if they exist
          title: gameData.title || template.template.title,
          description: gameData.description || template.template.description,
          // Merge entities, preferring user data but ensuring we have a player
          entities: mergeEntities(gameData.entities || [], template.template.entities),
          // Merge levels, ensuring we have at least one
          levels: mergeLevels(gameData.levels || [], template.template.levels)
        }
        
        return enhancedGame
      }
      
      return { ...gameData, gameType: detectedType }
    } catch (error) {
      console.error('Game validation failed:', error)
      return gameData
    }
  }
  
  // Check if game data is incomplete
  const isGameDataIncomplete = (gameData: any): boolean => {
    return (
      !gameData.entities || 
      gameData.entities.length === 0 ||
      !gameData.entities.some((e: any) => e.type === 'player') ||
      !gameData.levels || 
      gameData.levels.length === 0 ||
      !gameData.levels[0]?.width ||
      !gameData.levels[0]?.height
    )
  }
  
  // Merge entities, ensuring we have essential ones
  const mergeEntities = (userEntities: any[], templateEntities: any[]) => {
    const merged = [...userEntities]
    
    // Ensure we have a player entity
    const hasPlayer = merged.some(e => e.type === 'player')
    if (!hasPlayer && templateEntities.length > 0) {
      const templatePlayer = templateEntities.find(e => e.type === 'player')
      if (templatePlayer) {
        merged.unshift({ ...templatePlayer })
      }
    }
    
    return merged
  }
  
  // Merge levels with template defaults
  const mergeLevels = (userLevels: any[], templateLevels: any[]) => {
    if (userLevels.length === 0 && templateLevels.length > 0) {
      return [...templateLevels]
    }
    
    // Enhance user levels with template properties
    return userLevels.map((level, index) => {
      const templateLevel = templateLevels[index] || templateLevels[0]
      if (!templateLevel) return level
      
      return {
        ...templateLevel,
        ...level,
        // Ensure essential properties exist
        width: level.width || templateLevel.width || 1600,
        height: level.height || templateLevel.height || 800,
        background: level.background || templateLevel.background || '#87CEEB',
        platforms: level.platforms || templateLevel.platforms || []
      }
    })
  }

  const toggleDebugMode = () => {
    const newDebugMode = !debugMode
    setDebugMode(newDebugMode)
    if (gameEngine) {
      gameEngine.setDebugMode(newDebugMode)
    }
  }

  const handleGameLoad = (loadedGame: any) => {
    if (onGameUpdate) {
      onGameUpdate(loadedGame)
    }
  }

  // AI-powered game analysis and enhancement
  const analyzeGameWithAI = async () => {
    setIsAnalyzing(true)
    try {
      console.log('Starting AI analysis...')
      const analysis = await AIGameEnhancer.analyzeGame(game)
      console.log('AI Analysis result:', analysis)
      setGameAnalysis(analysis)
      setShowReplaceAssets(true)
    } catch (error) {
      console.error('Game analysis failed:', error)
      alert('AI analysis failed. Please check the console for details.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const enhanceGameWithAI = async (selectedUpgrades: string[] = []) => {
    setIsEnhancing(true)
    setEnhanceProgress('🤖 DeepSeek analyzing your game...')
    
    try {
      console.log('Starting AI enhancement...')
      
      // First analyze if we haven't already
      if (!gameAnalysis) {
        console.log('Getting game analysis...')
        const analysis = await AIGameEnhancer.analyzeGame(game)
        console.log('Analysis complete:', analysis)
        setGameAnalysis(analysis)
      }
      
      setEnhanceProgress('✨ AI identifying improvements...')
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setEnhanceProgress('🎨 Applying visual enhancements...')
      console.log('Enhancing game visuals...')
      const enhancedGame = await AIGameEnhancer.enhanceGameVisuals(game, selectedUpgrades)
      console.log('Enhanced game result:', enhancedGame)
      
      setEnhanceProgress('🚀 Enhancement complete!')
      
      if (onGameUpdate && enhancedGame) {
        onGameUpdate(enhancedGame)
      } else {
        console.warn('No enhanced game returned or onGameUpdate not available')
      }
      
    } catch (error) {
      console.error('Enhancement failed:', error)
      setEnhanceProgress(`❌ Enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setTimeout(() => {
        setIsEnhancing(false)
        setEnhanceProgress('')
      }, 3000)
    }
  }

  const addCustomCodeWithAI = async () => {
    if (!customCodeInput.trim()) return
    
    setIsEnhancing(true)
    setEnhanceProgress('🤖 AI generating custom code...')
    
    try {
      console.log('Generating custom code for:', customCodeInput)
      const generatedCode = await AIGameEnhancer.generateCustomCode(game, customCodeInput)
      console.log('Generated Code:', generatedCode)
      setEnhanceProgress('✅ Code generated! Check console for implementation.')
      
      // Show the generated code in an alert for now
      alert('Generated code (also in console):\n\n' + generatedCode.substring(0, 500) + '...')
    } catch (error) {
      console.error('Code generation failed:', error)
      setEnhanceProgress('❌ Code generation failed.')
    } finally {
      setTimeout(() => {
        setIsEnhancing(false)
        setEnhanceProgress('')
        setShowCustomCode(false)
      }, 3000)
    }
  }

  // Note: Save functionality is now handled by SaveLoadSystem component

  const generateGameCode = () => {
    const code = `
// Generated Game Code
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.gameData = ${JSON.stringify(game, null, 2)};
    this.player = this.gameData.entities.find(e => e.type === 'player');
    this.keys = {};
    this.init();
  }

  init() {
    this.canvas.width = 800;
    this.canvas.height = 400;
    
    // Key event listeners
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
    
    this.gameLoop();
  }

  update() {
    // Player movement
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
      this.player.x -= 5;
    }
    if (this.keys['KeyD'] || this.keys['ArrowRight']) {
      this.player.x += 5;
    }
    if (this.keys['KeyW'] || this.keys['ArrowUp']) {
      this.player.y -= 5;
    }
    if (this.keys['KeyS'] || this.keys['ArrowDown']) {
      this.player.y += 5;
    }
    
    // Boundary checks
    this.player.x = Math.max(0, Math.min(this.gameData.levels[0].width - this.player.width, this.player.x));
    this.player.y = Math.max(0, Math.min(this.gameData.levels[0].height - this.player.height, this.player.y));
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Background
    this.ctx.fillStyle = this.gameData.levels[0].background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const scaleX = this.canvas.width / this.gameData.levels[0].width;
    const scaleY = this.canvas.height / this.gameData.levels[0].height;
    
    // Platforms
    this.gameData.levels[0].platforms.forEach(platform => {
      this.ctx.fillStyle = platform.color;
      this.ctx.fillRect(
        platform.x * scaleX,
        platform.y * scaleY,
        platform.width * scaleX,
        platform.height * scaleY
      );
    });
    
    // Entities
    this.gameData.entities.forEach(entity => {
      this.ctx.fillStyle = entity.type === 'player' ? '#ff6b6b' : '#4ecdc4';
      this.ctx.fillRect(
        entity.x * scaleX,
        entity.y * scaleY,
        entity.width * scaleX,
        entity.height * scaleY
      );
    });
    
    // Goal
    if (this.gameData.levels[0].goal) {
      const goal = this.gameData.levels[0].goal;
      this.ctx.fillStyle = 'gold';
      this.ctx.fillRect(
        goal.x * scaleX,
        goal.y * scaleY,
        goal.width * scaleX,
        goal.height * scaleY
      );
    }
  }

  gameLoop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }
}

// Start the game
const game = new Game();
    `
    setGameCode(code)
  }

  const handleMobileExport = async () => {
    if (!game) return
    
    setIsExporting(true)
    setExportMessage('🚀 Preparing mobile export...')
    
    try {
      const result = await MobileExporter.generateAndDownload(game)
      
      if (result.success) {
        setExportMessage(`✅ ${result.message}`)
        setTimeout(() => setExportMessage(''), 3000)
      } else {
        setExportMessage(`❌ ${result.message}`)
        setTimeout(() => setExportMessage(''), 5000)
      }
    } catch (error) {
      setExportMessage(`❌ Export failed: ${error.message}`)
      setTimeout(() => setExportMessage(''), 5000)
    } finally {
      setIsExporting(false)
    }
  }

  if (!game) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🎮</div>
        <p className="text-gray-400 text-lg">Generate a game first to preview it</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-red-400 text-lg mb-4">Failed to load game</p>
        <p className="text-gray-400 text-sm">{error}</p>
        <button
          onClick={initializeEngine}
          className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      {/* Game Preview */}
      <motion.div
        className="glass rounded-xl p-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center space-x-2">
            <span>Game Preview</span>
            {gameState.fps && (
              <span className="text-sm text-green-400 bg-green-400/20 px-2 py-1 rounded">
                {gameState.fps} FPS
              </span>
            )}
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={togglePlayPause}
              className={`px-4 py-2 rounded-lg transition-all font-semibold text-sm hover:scale-105 ${
                isPlaying 
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg' 
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
              }`}
            >
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
            <button
              onClick={() => analyzeGameWithAI()}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all text-white font-semibold text-sm hover:scale-105 shadow-lg disabled:opacity-50"
            >
              {isAnalyzing ? '🔍 Analyzing...' : '✨ Enhance Game'}
            </button>
            <button
              onClick={() => setShowImprovementPanel(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all text-white font-semibold text-sm hover:scale-105 shadow-lg"
            >
              🚀 AI Improve
            </button>
            <button
              onClick={() => setShowSaveLoadPanel(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all text-white font-semibold text-sm hover:scale-105 shadow-lg"
            >
              💾 Save/Load
            </button>
            <button
              onClick={() => {
                if (game && onGameUpdate) {
                  // Force engine restart by destroying current instance
                  if (gameEngine) {
                    console.log('🛑 Destroying existing engine for visual update')
                    gameEngine.destroy()
                    setGameEngine(null)
                  }
                  
                  const fixedGame = {
                    ...game,
                    entities: game.entities.map((entity: any) => ({
                      ...entity,
                      color: entity.type === 'player' ? '#00FFFF' : 
                             entity.name.includes('enemy') || entity.name.includes('guardian') ? '#FF4444' :
                             entity.name.includes('star') || entity.name.includes('coin') ? '#FFD700' :
                             entity.color || '#FFFFFF',
                      emoji: entity.type === 'player' ? '🥷' :
                             entity.name.includes('enemy') || entity.name.includes('guardian') ? '👹' :
                             entity.name.includes('star') ? '⭐' :
                             entity.name.includes('coin') ? '🪙' :
                             entity.name.includes('ball') ? '💥' : '⬜'
                    })),
                    levels: game.levels.map((level: any) => ({
                      ...level,
                      background: '#1a1a2e',
                      platforms: level.platforms.map((platform: any) => ({
                        ...platform,
                        color: '#654321'
                      }))
                    }))
                  }
                  
                  // Update game data first
                  onGameUpdate(fixedGame)
                  
                  // Force re-initialization after a short delay
                  setTimeout(() => {
                    console.log('🚀 Re-initializing engine with visual fixes')
                    initializeEngine()
                  }, 100)
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg transition-all text-white font-semibold text-sm hover:scale-105 shadow-lg"
            >
              ✨ Fix Visuals Now
            </button>
            <button
              onClick={() => setShowCustomCode(true)}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-lg transition-all text-white font-semibold text-sm hover:scale-105 shadow-lg"
            >
              💻 Add Code
            </button>
            <button
              onClick={restartGame}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white font-semibold text-sm"
            >
              🔄 Restart
            </button>
            <button
              onClick={toggleDebugMode}
              className={`px-3 py-2 rounded-lg transition-colors font-semibold text-sm ${
                debugMode 
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              🐛 Debug
            </button>
            <button
              onClick={() => setShowSaveLoad(true)}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-white font-semibold text-sm"
            >
              💾 Save/Load
            </button>
            <button
              onClick={handleMobileExport}
              disabled={isExporting}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-white font-semibold text-sm"
            >
              {isExporting ? '⏳' : '📱'} {isExporting ? 'Exporting...' : 'Export Mobile'}
            </button>
          </div>
        </div>
        
        {/* Export Status Message */}
        <AnimatePresence>
          {exportMessage && (
            <motion.div
              className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30 text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <p className="text-purple-200">{exportMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex justify-center relative">
          <div
            ref={gameContainerRef}
            className="border-2 border-cyan-500/50 rounded-lg shadow-2xl shadow-cyan-500/20"
            style={{ 
              width: '100%', 
              maxWidth: '1200px', 
              height: '600px',
              minHeight: '400px',
              backgroundColor: '#1a1a1a'
            }}
          />
          
          {!isPlaying && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-4xl mb-2">⏸️</div>
                <div className="text-lg font-semibold">Game Paused</div>
                <div className="text-sm text-gray-300">Click Play to continue</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Game Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-cyan-400 font-semibold text-sm">Score</div>
            <div className="text-xl font-bold text-white">{gameState.score || 0}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-purple-400 font-semibold text-sm">Time</div>
            <div className="text-xl font-bold text-white">{Math.floor(gameState.time || 0)}s</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-green-400 font-semibold text-sm">Health</div>
            <div className="text-xl font-bold text-white">{gameState.player?.health || 'N/A'}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-yellow-400 font-semibold text-sm">Level</div>
            <div className="text-xl font-bold text-white">{(gameState.level || 0) + 1}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-orange-400 font-semibold text-sm">Entities</div>
            <div className="text-xl font-bold text-white">{gameState.entities || 0}</div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-400 mb-2">
            Game Type: <span className="text-cyan-400 font-semibold">{game?.gameType?.toUpperCase() || 'UNKNOWN'}</span>
            {gameEngine && (
              <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                ✓ Optimized
              </span>
            )}
          </div>
          <div className="text-sm text-cyan-400 mb-2">Controls:</div>
          <div className="bg-white/5 rounded px-4 py-2 text-sm">
            {game?.gameType === 'racing' 
              ? 'WASD or Arrow Keys: Drive | Up: Forward | Down: Reverse | Left/Right: Steer'
              : 'WASD or Arrow Keys: Move | W/Up: Jump | A/D: Left/Right'
            }
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Powered by Phaser.js Engine | Click game area to focus
            <span className="ml-2 text-cyan-400">| Stable & Reliable Gaming</span>
          </div>
        </div>
      </motion.div>

      {/* Generated Code */}
      <motion.div
        className="glass rounded-xl p-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Generated Code</h3>
          <div className="text-sm text-cyan-400">
            Powered by Universal Game Engine
          </div>
        </div>
        <div className="bg-slate-900 p-4 rounded-lg text-sm overflow-x-auto">
          <div className="text-green-400 mb-2">// Game Data Structure</div>
          <pre className="text-gray-300">{JSON.stringify(game, null, 2).substring(0, 1000)}...</pre>
        </div>
        <div className="mt-4 text-xs text-gray-400">
          This game is powered by a universal engine that can run any AI-generated game with physics, collisions, and advanced mechanics!
        </div>
      </motion.div>

      {/* Debug Panel */}
      <GameDebugger game={game} />

      {/* Enhancement Progress */}
      <AnimatePresence>
        {isEnhancing && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-purple-900 to-blue-900 p-8 rounded-2xl border border-purple-500/50 max-w-md w-full mx-4"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
            >
              <div className="text-center">
                <motion.div
                  className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <h3 className="text-xl font-bold text-white mb-2">AI Enhancement in Progress</h3>
                <p className="text-purple-200 text-lg">{enhanceProgress}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Asset Replacement Modal */}
      <AnimatePresence>
        {showReplaceAssets && gameAnalysis && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl border border-cyan-500/50 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">🤖 AI Game Analysis & Suggestions</h3>
                <button
                  onClick={() => setShowReplaceAssets(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Analysis Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-cyan-400">{gameAnalysis.overallScore}/100</div>
                  <div className="text-sm text-gray-300">Overall Score</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">{gameAnalysis.strengths.length}</div>
                  <div className="text-sm text-gray-300">Strengths Found</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-orange-400">{gameAnalysis.assetSuggestions.length}</div>
                  <div className="text-sm text-gray-300">Improvements</div>
                </div>
              </div>

              {/* Asset Suggestions */}
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-cyan-400">🎨 Asset Replacement Suggestions</h4>
                {gameAnalysis.assetSuggestions.map((suggestion, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4 border-l-4 border-purple-500">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-bold text-white capitalize">{suggestion.category} Enhancement</h5>
                      <span className={`px-2 py-1 rounded text-xs ${
                        suggestion.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                        suggestion.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {suggestion.priority} priority
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">{suggestion.reason}</p>
                    <div className="space-y-2">
                      {suggestion.suggestions.map((sug, i) => (
                        <div key={i} className="bg-black/20 rounded p-3">
                          <div className="font-semibold text-cyan-300">{sug.name}</div>
                          <div className="text-sm text-gray-300 mb-2">{sug.description}</div>
                          {sug.example && (
                            <div className="text-sm text-purple-300 font-mono bg-black/30 p-2 rounded">
                              Example: {sug.example}
                            </div>
                          )}
                          <button
                            onClick={() => enhanceGameWithAI([`${suggestion.category}_${sug.name}`])}
                            className="mt-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors"
                          >
                            Apply This Enhancement
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-6 space-x-4">
                <button
                  onClick={() => enhanceGameWithAI(['all_visual_upgrades'])}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition-all"
                >
                  🚀 Apply All Suggestions
                </button>
                <button
                  onClick={() => setShowReplaceAssets(false)}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Code Modal */}
      <AnimatePresence>
        {showCustomCode && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl border border-orange-500/50 max-w-2xl w-full"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-white">💻 Add Custom Code with AI</h3>
                <button
                  onClick={() => setShowCustomCode(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Describe what you want to add to your game:
                </label>
                <textarea
                  value={customCodeInput}
                  onChange={(e) => setCustomCodeInput(e.target.value)}
                  placeholder="e.g., Add a power-up that makes the player jump higher for 10 seconds"
                  className="w-full h-32 bg-slate-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none"
                />
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={addCustomCodeWithAI}
                  disabled={!customCodeInput.trim() || isEnhancing}
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-lg font-semibold transition-all disabled:opacity-50"
                >
                  🤖 Generate Code
                </button>
                <button
                  onClick={() => setShowCustomCode(false)}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save/Load System */}
      <SaveLoadSystem
        currentGame={game}
        onGameLoad={handleGameLoad}
        isOpen={showSaveLoad}
        onClose={() => setShowSaveLoad(false)}
      />

      {/* Game Improver */}
      <GameImprover
        game={game}
        onGameUpdate={onGameUpdate || (() => {})}
        isOpen={showGameImprover}
        onClose={() => setShowGameImprover(false)}
      />

      {/* AI Game Improvement Panel */}
      <GameImprovementPanel
        game={game}
        onGameUpdate={onGameUpdate || (() => {})}
        isOpen={showImprovementPanel}
        onClose={() => setShowImprovementPanel(false)}
      />

      {/* Save/Load Panel */}
      <SaveLoadPanel
        game={game}
        onGameLoad={(loadedGame) => {
          if (onGameUpdate) {
            onGameUpdate(loadedGame)
          }
        }}
        isOpen={showSaveLoadPanel}
        onClose={() => setShowSaveLoadPanel(false)}
      />
    </div>
  )
}