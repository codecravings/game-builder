import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SaveLoadPanelProps {
  game: any
  onGameLoad: (game: any) => void
  isOpen: boolean
  onClose: () => void
}

interface SavedGame {
  id: string
  title: string
  gameType: string
  timestamp: string
  thumbnail?: string
  assets_count?: number
  dalle_requests?: number
}

export default function SaveLoadPanel({ game, onGameLoad, isOpen, onClose }: SaveLoadPanelProps) {
  const [savedGames, setSavedGames] = useState<SavedGame[]>([])
  const [saveName, setSaveName] = useState('')
  const [activeTab, setActiveTab] = useState<'save' | 'load'>('save')
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadSavedGames()
    }
  }, [isOpen])

  const loadSavedGames = () => {
    try {
      const saved = localStorage.getItem('ai_game_engine_saves')
      if (saved) {
        const games = JSON.parse(saved)
        setSavedGames(games)
      }
    } catch (error) {
      console.error('Failed to load saved games:', error)
    }
  }

  const saveGame = async () => {
    if (!saveName.trim() || !game) return

    setIsProcessing(true)
    setMessage('💾 Saving game...')

    try {
      const saveData: SavedGame = {
        id: Date.now().toString(),
        title: saveName.trim(),
        gameType: game.gameType || 'unknown',
        timestamp: new Date().toISOString(),
        assets_count: game.assets?.sprites?.length + game.assets?.backgrounds?.length || 0,
        dalle_requests: 0 // Will be updated from backend if available
      }

      // Save to backend for asset preservation
      const response = await fetch('http://127.0.0.1:8002/api/game/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          save_data: saveData,
          game_data: game
        })
      })

      let backendSaved = false
      if (response.ok) {
        const result = await response.json()
        saveData.dalle_requests = result.dalle_requests_used || 0
        backendSaved = true
      }

      // Save to localStorage as backup
      const existingSaves = JSON.parse(localStorage.getItem('ai_game_engine_saves') || '[]')
      existingSaves.unshift(saveData)
      
      // Keep only last 10 saves to avoid storage issues
      const trimmedSaves = existingSaves.slice(0, 10)
      localStorage.setItem('ai_game_engine_saves', JSON.stringify(trimmedSaves))
      localStorage.setItem(`ai_game_${saveData.id}`, JSON.stringify(game))

      setSavedGames(trimmedSaves)
      setMessage(`✅ Game saved ${backendSaved ? 'with assets' : 'locally'}!`)
      setSaveName('')
      
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Save failed:', error)
      setMessage('❌ Save failed. Saved locally only.')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  const loadGame = async (savedGame: SavedGame) => {
    setIsProcessing(true)
    setMessage('📂 Loading game...')

    try {
      // Try to load from backend first (with assets)
      const response = await fetch(`http://127.0.0.1:8002/api/game/load/${savedGame.id}`)
      
      if (response.ok) {
        const gameData = await response.json()
        onGameLoad(gameData)
        setMessage('✅ Game loaded with assets!')
      } else {
        // Fallback to localStorage
        const localGame = localStorage.getItem(`ai_game_${savedGame.id}`)
        if (localGame) {
          const gameData = JSON.parse(localGame)
          onGameLoad(gameData)
          setMessage('✅ Game loaded from local storage!')
        } else {
          throw new Error('Game data not found')
        }
      }
      
      setTimeout(() => {
        onClose()
        setMessage('')
      }, 1500)
    } catch (error) {
      console.error('Load failed:', error)
      setMessage('❌ Failed to load game')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  const deleteGame = (gameId: string) => {
    try {
      const existingSaves = JSON.parse(localStorage.getItem('ai_game_engine_saves') || '[]')
      const filtered = existingSaves.filter((save: SavedGame) => save.id !== gameId)
      
      localStorage.setItem('ai_game_engine_saves', JSON.stringify(filtered))
      localStorage.removeItem(`ai_game_${gameId}`)
      
      setSavedGames(filtered)
      setMessage('🗑️ Game deleted')
      setTimeout(() => setMessage(''), 2000)
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const exportGame = (savedGame: SavedGame) => {
    try {
      const gameData = localStorage.getItem(`ai_game_${savedGame.id}`)
      if (gameData) {
        const blob = new Blob([gameData], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${savedGame.title.replace(/[^a-z0-9]/gi, '_')}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        setMessage('📥 Game exported!')
        setTimeout(() => setMessage(''), 2000)
      }
    } catch (error) {
      console.error('Export failed:', error)
      setMessage('❌ Export failed')
      setTimeout(() => setMessage(''), 2000)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl border border-cyan-500/50 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-white">💾 Save & Load Games</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('save')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'save' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              💾 Save Game
            </button>
            <button
              onClick={() => setActiveTab('load')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'load' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              📂 Load Game ({savedGames.length})
            </button>
          </div>

          {/* Message Display */}
          <AnimatePresence>
            {message && (
              <motion.div
                className="mb-4 p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <p className="text-blue-200 text-center">{message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Save Tab */}
          {activeTab === 'save' && (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {game ? (
                <>
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-cyan-400 font-bold mb-2">Current Game:</h4>
                    <div className="text-gray-300">
                      <p><span className="font-semibold">Title:</span> {game.title || 'Unnamed Game'}</p>
                      <p><span className="font-semibold">Type:</span> {game.gameType || 'Unknown'}</p>
                      <p><span className="font-semibold">Entities:</span> {game.entities?.length || 0}</p>
                      <p><span className="font-semibold">Assets:</span> {(game.assets?.sprites?.length || 0) + (game.assets?.backgrounds?.length || 0)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Save Name:
                    </label>
                    <input
                      type="text"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      placeholder={`${game.title || 'My Game'} - ${new Date().toLocaleDateString()}`}
                      className="w-full bg-slate-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
                      maxLength={50}
                    />
                  </div>
                  
                  <button
                    onClick={saveGame}
                    disabled={!saveName.trim() || isProcessing}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? '💾 Saving...' : '💾 Save Game'}
                  </button>
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-4">🎮</div>
                  <p>No game to save. Generate a game first!</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Load Tab */}
          {activeTab === 'load' && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {savedGames.length > 0 ? (
                <div className="grid gap-4">
                  {savedGames.map((savedGame) => (
                    <div
                      key={savedGame.id}
                      className="bg-white/5 rounded-lg p-4 border border-gray-700 hover:border-cyan-500/50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-bold text-white text-lg">{savedGame.title}</h4>
                          <div className="text-sm text-gray-400 mt-1">
                            <p>Type: <span className="text-cyan-400">{savedGame.gameType}</span></p>
                            <p>Saved: {new Date(savedGame.timestamp).toLocaleString()}</p>
                            {savedGame.assets_count > 0 && (
                              <p>Assets: <span className="text-green-400">{savedGame.assets_count}</span></p>
                            )}
                            {savedGame.dalle_requests > 0 && (
                              <p>DALL-E: <span className="text-purple-400">{savedGame.dalle_requests}/5</span></p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => loadGame(savedGame)}
                            disabled={isProcessing}
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-semibold transition-colors disabled:opacity-50"
                          >
                            📂 Load
                          </button>
                          <button
                            onClick={() => exportGame(savedGame)}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold transition-colors"
                          >
                            📥 Export
                          </button>
                          <button
                            onClick={() => deleteGame(savedGame.id)}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-semibold transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-4">📂</div>
                  <p>No saved games found.</p>
                  <p className="text-sm mt-2">Save a game first to see it here!</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Close Button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}