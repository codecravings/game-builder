import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface GameEditorProps {
  game: any
  onGameUpdate?: (game: any) => void
}

export default function EnhancedGameEditor({ game, onGameUpdate }: GameEditorProps) {
  const [gameData, setGameData] = useState(game)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'entities' | 'levels' | 'assets' | 'code'>('overview')
  const [selectedEntity, setSelectedEntity] = useState<number | null>(null)
  const [selectedLevel, setSelectedLevel] = useState(0)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    setGameData(game)
  }, [game])

  useEffect(() => {
    if (onGameUpdate && gameData !== game) {
      onGameUpdate(gameData)
    }
  }, [gameData, onGameUpdate, game])

  if (!gameData) {
    return (
      <div className="text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="text-6xl">🎮</div>
          <h3 className="text-2xl font-bold text-cyan-400">No Game to Edit</h3>
          <p className="text-gray-400">Generate a game first to start editing</p>
        </motion.div>
      </div>
    )
  }

  const updateGameData = (updates: any) => {
    const newGameData = { ...gameData, ...updates }
    setGameData(newGameData)
  }

  const updateEntity = (entityIndex: number, updates: any) => {
    const newEntities = [...gameData.entities]
    newEntities[entityIndex] = { ...newEntities[entityIndex], ...updates }
    updateGameData({ entities: newEntities })
  }

  const updateLevel = (levelIndex: number, updates: any) => {
    const newLevels = [...gameData.levels]
    newLevels[levelIndex] = { ...newLevels[levelIndex], ...updates }
    updateGameData({ levels: newLevels })
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Game Info Card */}
      <motion.div
        className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl p-6 border border-cyan-500/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-cyan-300">🎮 {gameData.title}</h3>
          <span className="px-3 py-1 bg-purple-500/30 rounded-full text-purple-300 text-sm font-semibold">
            {gameData.gameType?.toUpperCase()}
          </span>
        </div>
        
        <p className="text-gray-300 mb-4">{gameData.description}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-sm text-gray-400">Entities</div>
            <div className="text-xl font-bold text-cyan-300">{gameData.entities?.length || 0}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-sm text-gray-400">Levels</div>
            <div className="text-xl font-bold text-purple-300">{gameData.levels?.length || 0}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-sm text-gray-400">Assets</div>
            <div className="text-xl font-bold text-pink-300">
              {(gameData.assets?.sprites?.length || 0) + (gameData.assets?.backgrounds?.length || 0)}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-sm text-gray-400">Mobile Ready</div>
            <div className="text-xl font-bold text-green-300">
              {gameData.mobileOptimized ? '✅' : '❌'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          className="bg-white/5 rounded-xl p-6 border border-white/10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h4 className="text-lg font-bold text-cyan-400 mb-3">🎯 Game Features</h4>
          <div className="space-y-2 text-sm">
            {gameData.touchControls && (
              <div className="flex items-center space-x-2">
                <span className="text-green-400">📱</span>
                <span>Touch Controls Ready</span>
              </div>
            )}
            {gameData.mobileFeatures?.autoSave && (
              <div className="flex items-center space-x-2">
                <span className="text-blue-400">💾</span>
                <span>Auto-Save Enabled</span>
              </div>
            )}
            {gameData.gameLogic?.scoring && (
              <div className="flex items-center space-x-2">
                <span className="text-yellow-400">🏆</span>
                <span>Scoring System</span>
              </div>
            )}
            {gameData.levels?.[0]?.enemies?.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-red-400">👾</span>
                <span>{gameData.levels[0].enemies.length} Enemies</span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          className="bg-white/5 rounded-xl p-6 border border-white/10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="text-lg font-bold text-purple-400 mb-3">⚙️ Technical Info</h4>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-400">Theme:</span> {gameData.theme || 'Default'}</div>
            <div><span className="text-gray-400">Art Style:</span> {gameData.artStyle || 'Pixel'}</div>
            <div><span className="text-gray-400">Win Condition:</span> {gameData.gameLogic?.winCondition || 'Reach goal'}</div>
            <div><span className="text-gray-400">Lose Condition:</span> {gameData.gameLogic?.loseCondition || 'Fall off screen'}</div>
          </div>
        </motion.div>
      </div>
    </div>
  )

  const renderEntities = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entity List */}
        <motion.div
          className="bg-white/5 rounded-xl p-6 border border-white/10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h4 className="text-lg font-bold text-cyan-400 mb-4">🎭 Game Entities</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {gameData.entities?.map((entity: any, index: number) => (
              <button
                key={index}
                onClick={() => setSelectedEntity(index)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedEntity === index
                    ? 'bg-cyan-500/30 border-2 border-cyan-400'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{entity.name}</div>
                    <div className="text-sm text-gray-400">{entity.type}</div>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <div>x: {entity.x}, y: {entity.y}</div>
                    <div>{entity.width}×{entity.height}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Entity Properties */}
        <motion.div
          className="bg-white/5 rounded-xl p-6 border border-white/10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {selectedEntity !== null && gameData.entities?.[selectedEntity] ? (
            <div>
              <h4 className="text-lg font-bold text-purple-400 mb-4">
                ⚙️ {gameData.entities[selectedEntity].name} Properties
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">X Position</label>
                    <input
                      type="number"
                      value={gameData.entities[selectedEntity].x}
                      onChange={(e) => updateEntity(selectedEntity, { x: parseInt(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Y Position</label>
                    <input
                      type="number"
                      value={gameData.entities[selectedEntity].y}
                      onChange={(e) => updateEntity(selectedEntity, { y: parseInt(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Width</label>
                    <input
                      type="number"
                      value={gameData.entities[selectedEntity].width}
                      onChange={(e) => updateEntity(selectedEntity, { width: parseInt(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Height</label>
                    <input
                      type="number"
                      value={gameData.entities[selectedEntity].height}
                      onChange={(e) => updateEntity(selectedEntity, { height: parseInt(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                  </div>
                </div>

                {gameData.entities[selectedEntity].physics && (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Physics Properties</label>
                    <div className="bg-black/20 rounded-lg p-3 text-sm">
                      <pre className="text-cyan-300 whitespace-pre-wrap">
                        {JSON.stringify(gameData.entities[selectedEntity].physics, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-2">🎭</div>
              <p>Select an entity to edit its properties</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )

  const renderLevels = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold text-cyan-400">🏗️ Level Editor</h4>
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(parseInt(e.target.value))}
          className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
        >
          {gameData.levels?.map((level: any, index: number) => (
            <option key={index} value={index} className="bg-slate-800">
              {level.name || `Level ${index + 1}`}
            </option>
          ))}
        </select>
      </div>

      {gameData.levels?.[selectedLevel] && (
        <motion.div
          key={selectedLevel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/5 rounded-xl p-6 border border-white/10"
        >
          <div className="mb-4">
            <h5 className="text-lg font-semibold text-white mb-2">
              {gameData.levels[selectedLevel].name || `Level ${selectedLevel + 1}`}
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-black/20 rounded-lg p-3">
                <div className="text-sm text-gray-400">Width</div>
                <div className="text-lg font-bold text-cyan-300">
                  {gameData.levels[selectedLevel].width || 800}px
                </div>
              </div>
              <div className="bg-black/20 rounded-lg p-3">
                <div className="text-sm text-gray-400">Height</div>
                <div className="text-lg font-bold text-purple-300">
                  {gameData.levels[selectedLevel].height || 600}px
                </div>
              </div>
              <div className="bg-black/20 rounded-lg p-3">
                <div className="text-sm text-gray-400">Platforms</div>
                <div className="text-lg font-bold text-pink-300">
                  {gameData.levels[selectedLevel].platforms?.length || 0}
                </div>
              </div>
              <div className="bg-black/20 rounded-lg p-3">
                <div className="text-sm text-gray-400">Enemies</div>
                <div className="text-lg font-bold text-red-300">
                  {gameData.levels[selectedLevel].enemies?.length || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Level Preview */}
          <div 
            className="relative border-2 border-dashed border-white/20 rounded-lg overflow-hidden mb-4"
            style={{ 
              width: '100%', 
              height: '300px',
              background: gameData.levels[selectedLevel].background || '#87CEEB'
            }}
          >
            {/* Platforms */}
            {gameData.levels[selectedLevel].platforms?.map((platform: any, index: number) => (
              <div
                key={`platform-${index}`}
                className="absolute border border-white/30"
                style={{
                  left: `${(platform.x / gameData.levels[selectedLevel].width) * 100}%`,
                  top: `${(platform.y / gameData.levels[selectedLevel].height) * 100}%`,
                  width: `${(platform.width / gameData.levels[selectedLevel].width) * 100}%`,
                  height: `${(platform.height / gameData.levels[selectedLevel].height) * 100}%`,
                  background: platform.color || '#8B4513'
                }}
                title={`Platform ${index + 1}`}
              />
            ))}

            {/* Entities in this level */}
            {gameData.entities?.map((entity: any, index: number) => (
              <div
                key={`entity-${index}`}
                className="absolute border-2 border-cyan-400 rounded"
                style={{
                  left: `${(entity.x / gameData.levels[selectedLevel].width) * 100}%`,
                  top: `${(entity.y / gameData.levels[selectedLevel].height) * 100}%`,
                  width: `${(entity.width / gameData.levels[selectedLevel].width) * 100}%`,
                  height: `${(entity.height / gameData.levels[selectedLevel].height) * 100}%`,
                  background: entity.type === 'player' ? 'rgba(6, 182, 212, 0.5)' : 'rgba(168, 85, 247, 0.5)'
                }}
                title={entity.name}
              />
            ))}

            {/* Goal */}
            {gameData.levels[selectedLevel].goal && (
              <div
                className="absolute border-2 border-yellow-400 rounded"
                style={{
                  left: `${(gameData.levels[selectedLevel].goal.x / gameData.levels[selectedLevel].width) * 100}%`,
                  top: `${(gameData.levels[selectedLevel].goal.y / gameData.levels[selectedLevel].height) * 100}%`,
                  width: `${(gameData.levels[selectedLevel].goal.width / gameData.levels[selectedLevel].width) * 100}%`,
                  height: `${(gameData.levels[selectedLevel].goal.height / gameData.levels[selectedLevel].height) * 100}%`,
                  background: 'rgba(255, 215, 0, 0.7)'
                }}
                title="Goal"
              />
            )}
          </div>
        </motion.div>
      )}
    </div>
  )

  const renderAssets = () => (
    <div className="space-y-6">
      <motion.div
        className="bg-white/5 rounded-xl p-6 border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h4 className="text-lg font-bold text-cyan-400 mb-4">🎨 Game Assets</h4>
        
        {gameData.assets ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sprites */}
            {gameData.assets.sprites?.length > 0 && (
              <div>
                <h5 className="font-semibold text-purple-300 mb-3">🎭 Sprites</h5>
                <div className="space-y-2">
                  {gameData.assets.sprites.map((sprite: any, index: number) => (
                    <div key={index} className="bg-black/20 rounded-lg p-3 flex items-center space-x-3">
                      {sprite.url && sprite.url.startsWith('data:image') ? (
                        <img 
                          src={sprite.url} 
                          alt={sprite.name}
                          className="w-16 h-16 object-cover rounded border border-white/20"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-cyan-500 rounded border border-white/20 flex items-center justify-center text-white font-bold">
                          {sprite.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-white">{sprite.name}</div>
                        <div className="text-sm text-gray-400">{sprite.width}×{sprite.height}px</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Backgrounds */}
            {gameData.assets.backgrounds?.length > 0 && (
              <div>
                <h5 className="font-semibold text-pink-300 mb-3">🖼️ Backgrounds</h5>
                <div className="space-y-2">
                  {gameData.assets.backgrounds.map((bg: any, index: number) => (
                    <div key={index} className="bg-black/20 rounded-lg p-3 flex items-center space-x-3">
                      {bg.url && bg.url.startsWith('data:image') ? (
                        <img 
                          src={bg.url} 
                          alt={bg.name}
                          className="w-16 h-10 object-cover rounded border border-white/20"
                        />
                      ) : (
                        <div className="w-16 h-10 bg-purple-500 rounded border border-white/20 flex items-center justify-center text-white font-bold text-xs">
                          BG
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-white">{bg.name}</div>
                        <div className="text-sm text-gray-400">{bg.width}×{bg.height}px</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <div className="text-4xl mb-2">🎨</div>
            <p>No custom assets generated</p>
            <p className="text-sm">Game will use colored shapes</p>
          </div>
        )}
      </motion.div>
    </div>
  )

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'entities', label: 'Entities', icon: '🎭' },
    { id: 'levels', label: 'Levels', icon: '🏗️' },
    { id: 'assets', label: 'Assets', icon: '🎨' }
  ]

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-2 bg-white/5 rounded-2xl p-2 border border-white/10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              selectedTab === tab.id
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {selectedTab === 'overview' && renderOverview()}
          {selectedTab === 'entities' && renderEntities()}
          {selectedTab === 'levels' && renderLevels()}
          {selectedTab === 'assets' && renderAssets()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}