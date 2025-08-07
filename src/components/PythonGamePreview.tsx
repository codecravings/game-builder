import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GameImprovementPanel from './GameImprovementPanel'
import SaveLoadPanel from './SaveLoadPanel'

interface PythonGamePreviewProps {
  game: any
  onGameUpdate?: (game: any) => void
}

interface GameState {
  score: number
  health: number
  time: number
  level: number
  game_over: boolean
  win: boolean
  fps: number
}

const PYTHON_BACKEND_URL = 'http://127.0.0.1:8002'

export default function PythonGamePreview({ game, onGameUpdate }: PythonGamePreviewProps) {
  const [gameInitialized, setGameInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    health: 100,
    time: 0,
    level: 0,
    game_over: false,
    win: false,
    fps: 60
  })
  
  const [gameFrame, setGameFrame] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [assetsGenerated, setAssetsGenerated] = useState(0)
  const [dalleRequestsUsed, setDalleRequestsUsed] = useState(0)
  const [showImprovementPanel, setShowImprovementPanel] = useState(false)
  const [showSaveLoadPanel, setShowSaveLoadPanel] = useState(false)
  
  const keysPressed = useRef<Set<string>>(new Set())
  const gameLoopRef = useRef<number | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  
  // Initialize game when game data changes
  useEffect(() => {
    if (game && game.title) {
      initializeGame()
    }
    
    return () => {
      cleanup()
    }
  }, [game?.title, game?.gameType])
  
  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code)
      sendInputToBackend()
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code)
      sendInputToBackend()
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameInitialized])
  
  const cleanup = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current)
      gameLoopRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsPlaying(false)
  }
  
  const initializeGame = async () => {
    setIsLoading(true)
    setError(null)
    setGameInitialized(false)
    cleanup()
    
    try {
      console.log('🚀 Initializing Python game backend...')
      
      // Check if backend is reachable first
      const healthCheck = await fetch(`${PYTHON_BACKEND_URL}/`, {
        method: 'GET',
        mode: 'cors'
      }).catch(() => null)
      
      if (!healthCheck) {
        throw new Error('Python backend not available. Please start the backend server first.')
      }
      
      const response = await fetch(`${PYTHON_BACKEND_URL}/api/game/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(game)
      })
      
      if (!response.ok) {
        throw new Error(`Backend initialization failed: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('✅ Game initialized:', result)
      
      setAssetsGenerated(result.assets_generated || 0)
      setDalleRequestsUsed(result.dalle_requests_used || 0)
      setGameInitialized(true)
      setIsPlaying(true)
      
      // Start game loop
      startGameLoop()
      
    } catch (error) {
      console.error('❌ Game initialization failed:', error)
      setError(`Python Backend Error: ${error instanceof Error ? error.message : 'Unknown error'}. Make sure to start the Python backend first with: cd python_backend && python main.py`)
    } finally {
      setIsLoading(false)
    }
  }
  
  const startGameLoop = () => {
    console.log('🎮 Starting game loop...')
    // Start requesting frames from backend
    gameLoopRef.current = setInterval(async () => {
      if (!gameInitialized || !isPlaying) {
        console.log('Game loop paused:', { gameInitialized, isPlaying })
        return
      }
      
      try {
        console.log('📡 Requesting frame from backend...')
        const response = await fetch(`${PYTHON_BACKEND_URL}/api/game/frame/base64`)
        if (response.ok) {
          const data = await response.json()
          console.log('📦 Received frame data:', data.game_state)
          setGameFrame(data.frame)
          setGameState(data.game_state)
        } else {
          console.error('Frame request failed:', response.status)
        }
      } catch (error) {
        console.error('Frame fetch failed:', error)
      }
    }, 1000 / 10) // 10 FPS to reduce backend load
  }
  
  const sendInputToBackend = useCallback(async () => {
    if (!gameInitialized) return
    
    try {
      await fetch(`${PYTHON_BACKEND_URL}/api/game/input`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keys: Array.from(keysPressed.current),
          timestamp: Date.now()
        })
      })
    } catch (error) {
      console.warn('Input send failed:', error)
    }
  }, [gameInitialized])
  
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
    if (!isPlaying) {
      startGameLoop()
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
        gameLoopRef.current = null
      }
    }
  }
  
  const restartGame = async () => {
    if (!gameInitialized) return
    
    try {
      await fetch(`${PYTHON_BACKEND_URL}/api/game/reset`, {
        method: 'POST'
      })
      
      setGameState({
        score: 0,
        health: 100,
        time: 0,
        level: 0,
        game_over: false,
        win: false,
        fps: 60
      })
      
    } catch (error) {
      console.error('Game restart failed:', error)
    }
  }
  
  const clearAssetCache = async () => {
    try {
      await fetch(`${PYTHON_BACKEND_URL}/api/assets/cache/clear`, {
        method: 'DELETE'
      })
      console.log('🗑️ Asset cache cleared')
    } catch (error) {
      console.error('Cache clear failed:', error)
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
        <p className="text-red-400 text-lg mb-4">Python Backend Error</p>
        <p className="text-gray-400 text-sm mb-4">{error}</p>
        <div className="space-x-4">
          <button
            onClick={initializeGame}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
          <button
            onClick={clearAssetCache}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Clear Cache
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Game Preview */}
      <motion.div
        className="glass rounded-xl p-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center space-x-2">
            <span>🐍 Python Game Engine</span>
            {gameState.fps && (
              <span className="text-sm text-green-400 bg-green-400/20 px-2 py-1 rounded">
                {Math.round(gameState.fps)} FPS
              </span>
            )}
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={togglePlayPause}
              disabled={isLoading || !gameInitialized}
              className={`px-4 py-2 rounded-lg transition-all font-semibold text-sm hover:scale-105 disabled:opacity-50 ${
                isPlaying 
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg' 
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
              }`}
            >
              {isLoading ? '⏳ Loading...' : isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
            <button
              onClick={restartGame}
              disabled={!gameInitialized}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors text-white font-semibold text-sm"
            >
              🔄 Restart
            </button>
            <button
              onClick={() => setShowImprovementPanel(true)}
              disabled={!gameInitialized}
              className="px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 rounded-lg transition-colors text-white font-semibold text-sm"
            >
              🚀 Improve Game
            </button>
            <button
              onClick={() => setShowSaveLoadPanel(true)}
              className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-colors text-white font-semibold text-sm"
            >
              💾 Save/Load
            </button>
            <button
              onClick={clearAssetCache}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white font-semibold text-sm"
            >
              🗑️ Clear Cache
            </button>
          </div>
        </div>
        
        {/* Asset Generation Status */}
        <AnimatePresence>
          {(assetsGenerated > 0 || dalleRequestsUsed > 0) && (
            <motion.div
              className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30 mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex justify-between items-center">
                <p className="text-purple-200">
                  🎨 Assets Generated: <span className="font-bold">{assetsGenerated}</span>
                </p>
                <p className="text-pink-200">
                  🤖 DALL-E Requests: <span className="font-bold">{dalleRequestsUsed}/5</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Game Display */}
        <div className="flex justify-center relative">
          <div
            className="border-2 border-cyan-500/50 rounded-lg shadow-2xl shadow-cyan-500/20 bg-black"
            style={{ 
              width: '800px', 
              height: '600px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isLoading ? (
              <div className="text-center">
                <div className="text-4xl mb-4">🐍</div>
                <div className="text-white text-lg font-semibold">Initializing Python Engine...</div>
                <div className="text-gray-300 text-sm mt-2">Generating assets with DALL-E 3</div>
              </div>
            ) : gameFrame ? (
              <img 
                src={gameFrame} 
                alt="Game Frame" 
                className="max-w-full max-h-full rounded"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : gameInitialized ? (
              <div className="text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <div className="text-white text-lg font-semibold">Frame Rendering Issue</div>
                <div className="text-gray-300 text-sm">Backend ready but no frames received</div>
                <div className="text-cyan-400 text-xs mt-2">Try clicking Play or check browser console</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-4">🎮</div>
                <div className="text-white text-lg font-semibold">Game Ready</div>
                <div className="text-gray-300 text-sm">Click Play to start</div>
              </div>
            )}
            
            {!isPlaying && gameInitialized && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-4xl mb-2">⏸️</div>
                  <div className="text-lg font-semibold">Game Paused</div>
                  <div className="text-sm text-gray-300">Click Play to continue</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Game Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-cyan-400 font-semibold text-sm">Score</div>
            <div className="text-xl font-bold text-white">{gameState.score}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-purple-400 font-semibold text-sm">Time</div>
            <div className="text-xl font-bold text-white">{Math.floor(gameState.time)}s</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-green-400 font-semibold text-sm">Health</div>
            <div className="text-xl font-bold text-white">{gameState.health}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-yellow-400 font-semibold text-sm">Level</div>
            <div className="text-xl font-bold text-white">{gameState.level + 1}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-orange-400 font-semibold text-sm">FPS</div>
            <div className="text-xl font-bold text-white">{Math.round(gameState.fps)}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-pink-400 font-semibold text-sm">DALL-E</div>
            <div className="text-xl font-bold text-white">{dalleRequestsUsed}/5</div>
          </div>
        </div>
        
        {/* Game Status */}
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-400 mb-2">
            Game Type: <span className="text-cyan-400 font-semibold">{game?.gameType?.toUpperCase() || 'UNKNOWN'}</span>
            <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
              ✓ Python Powered
            </span>
          </div>
          <div className="text-sm text-cyan-400 mb-2">Controls:</div>
          <div className="bg-white/5 rounded px-4 py-2 text-sm">
            {game?.gameType === 'racing' 
              ? 'WASD or Arrow Keys: Drive | W/Up: Forward | S/Down: Reverse | A/D: Left/Right'
              : 'WASD or Arrow Keys: Move | W/Up: Jump | A/D: Left/Right | Space: Jump'
            }
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Powered by Pygame + Pymunk Physics | Real-time Python rendering
            <span className="ml-2 text-cyan-400">| DALL-E 3 optimized (max 5 requests)</span>
          </div>
          
          {/* Game Over / Win States */}
          {gameState.game_over && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <div className="text-red-300 font-bold text-lg">GAME OVER</div>
              <button
                onClick={restartGame}
                className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
          
          {gameState.win && (
            <div className="mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
              <div className="text-green-300 font-bold text-lg">YOU WIN! 🎉</div>
              <div className="text-sm text-green-200 mt-1">
                Score: {gameState.score} | Time: {Math.floor(gameState.time)}s
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Game Improvement Panel */}
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