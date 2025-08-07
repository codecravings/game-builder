import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GamePersistenceManager } from '../services/gamePersistence'

interface GameMetadata {
  id: string
  title: string
  description: string
  thumbnail?: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
}

interface SaveLoadSystemProps {
  currentGame?: any
  onGameLoad: (game: any) => void
  isOpen: boolean
  onClose: () => void
}

export default function SaveLoadSystem({ currentGame, onGameLoad, isOpen, onClose }: SaveLoadSystemProps) {
  const [savedGames, setSavedGames] = useState<GameMetadata[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [saveTitle, setSaveTitle] = useState('')
  const [saveDescription, setSaveDescription] = useState('')
  const [view, setView] = useState<'load' | 'save' | 'import'>('load')

  useEffect(() => {
    if (isOpen) {
      loadSavedGames()
    }
  }, [isOpen])

  useEffect(() => {
    if (currentGame && currentGame.title) {
      setSaveTitle(currentGame.title)
      setSaveDescription(currentGame.description || 'An AI generated game')
    }
  }, [currentGame?.title, currentGame?.description])

  const loadSavedGames = async () => {
    setLoading(true)
    try {
      const games = await GamePersistenceManager.getAllGames()
      setSavedGames(games)
    } catch (error) {
      console.error('Failed to load saved games:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveGame = async () => {
    if (!currentGame || !saveTitle.trim()) return
    
    setLoading(true)
    try {
      const gameId = await GamePersistenceManager.saveGame(currentGame, {
        title: saveTitle,
        description: saveDescription,
        tags: generateTags(currentGame)
      })
      
      console.log('Game saved successfully:', gameId)
      await loadSavedGames()
      setView('load')
    } catch (error) {
      console.error('Failed to save game:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadGame = async (gameId: string) => {
    setLoading(true)
    try {
      const savedGame = await GamePersistenceManager.loadGame(gameId)
      if (savedGame) {
        onGameLoad(savedGame.gameData)
        onClose()
      }
    } catch (error) {
      console.error('Failed to load game:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game?')) return
    
    setLoading(true)
    try {
      await GamePersistenceManager.deleteGame(gameId)
      await loadSavedGames()
    } catch (error) {
      console.error('Failed to delete game:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportGame = () => {
    if (!currentGame) return
    
    GamePersistenceManager.exportGame(currentGame, saveTitle)
  }

  const handleImportGame = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setLoading(true)
    try {
      const gameData = await GamePersistenceManager.importGame(file)
      onGameLoad(gameData)
      onClose()
    } catch (error) {
      console.error('Failed to import game:', error)
      alert('Failed to import game. Please check the file format.')
    } finally {
      setLoading(false)
    }
  }

  const generateTags = (gameData: any): string[] => {
    const tags: string[] = []
    
    if (gameData.gameType) tags.push(gameData.gameType)
    if (gameData.theme) tags.push(gameData.theme)
    if (gameData.visualStyle) tags.push(gameData.visualStyle)
    
    return tags
  }

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString()
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
          className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden border border-cyan-500/30"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex space-x-4">
              <button
                onClick={() => setView('load')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  view === 'load' 
                    ? 'bg-cyan-500 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                📁 Load Game
              </button>
              <button
                onClick={() => setView('save')}
                disabled={!currentGame}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  view === 'save' 
                    ? 'bg-cyan-500 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50'
                }`}
              >
                💾 Save Game
              </button>
              <button
                onClick={() => setView('import')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  view === 'import' 
                    ? 'bg-cyan-500 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                📤 Import/Export
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[60vh]">
            {view === 'load' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-4">Load Saved Game</h3>
                
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <motion.div
                      className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                ) : savedGames.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>No saved games found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedGames.map((game) => (
                      <motion.div
                        key={game.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedGame === game.id
                            ? 'border-cyan-400 bg-cyan-500/20'
                            : 'border-gray-600 bg-gray-800/50 hover:border-cyan-400/50'
                        }`}
                        onClick={() => setSelectedGame(game.id)}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-start space-x-3">
                          {game.thumbnail ? (
                            <img 
                              src={game.thumbnail} 
                              alt={game.title}
                              className="w-16 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-16 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded flex items-center justify-center text-white text-xs">
                              🎮
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white truncate">{game.title}</h4>
                            <p className="text-sm text-gray-400 truncate">{game.description}</p>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex flex-wrap gap-1">
                                {game.tags.slice(0, 2).map((tag) => (
                                  <span 
                                    key={tag}
                                    className="px-2 py-1 bg-purple-500/30 text-purple-300 text-xs rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <span className="text-xs text-gray-500">
                                {formatDate(game.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleLoadGame(game.id)
                            }}
                            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
                          >
                            Load
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteGame(game.id)
                            }}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {view === 'save' && currentGame && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-4">Save Current Game</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Game Title
                    </label>
                    <input
                      type="text"
                      value={saveTitle}
                      onChange={(e) => setSaveTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:border-cyan-400 focus:outline-none"
                      placeholder="Enter game title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={saveDescription}
                      onChange={(e) => setSaveDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:border-cyan-400 focus:outline-none resize-none"
                      rows={3}
                      placeholder="Enter game description"
                    />
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Game Preview</h4>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>Type: {currentGame.gameType}</p>
                      <p>Theme: {currentGame.theme}</p>
                      <p>Entities: {currentGame.entities?.length || 0}</p>
                      <p>Levels: {currentGame.levels?.length || 0}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSaveGame}
                    disabled={!saveTitle.trim() || loading}
                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    {loading ? 'Saving...' : 'Save Game'}
                  </button>
                </div>
              </div>
            )}

            {view === 'import' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-4">Import & Export</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Import Game</h4>
                    <p className="text-sm text-gray-400 mb-3">
                      Load a game from a .aigame file
                    </p>
                    <input
                      type="file"
                      accept=".aigame,.json"
                      onChange={handleImportGame}
                      className="w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
                    />
                  </div>
                  
                  {currentGame && (
                    <div className="p-4 bg-gray-800/50 rounded-lg">
                      <h4 className="font-semibold text-white mb-2">Export Current Game</h4>
                      <p className="text-sm text-gray-400 mb-3">
                        Save your current game as a .aigame file
                      </p>
                      <button
                        onClick={handleExportGame}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        📥 Export Game
                      </button>
                    </div>
                  )}
                  
                  <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                    <h4 className="font-semibold text-blue-300 mb-2">💡 Tips</h4>
                    <ul className="text-sm text-blue-200 space-y-1">
                      <li>• Exported games can be shared with others</li>
                      <li>• Games are auto-saved every 30 seconds</li>
                      <li>• Use tags to organize your games</li>
                      <li>• Import supports both .aigame and .json files</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}