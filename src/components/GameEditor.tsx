import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface GameEditorProps {
  game: any
}

export default function GameEditor({ game }: GameEditorProps) {
  const [selectedEntity, setSelectedEntity] = useState<any>(null)
  const [gameData, setGameData] = useState(game)

  useEffect(() => {
    setGameData(game)
  }, [game])

  if (!gameData) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Generate a game first to start editing</p>
      </div>
    )
  }

  const updateEntity = (entityIndex: number, updates: any) => {
    const newGameData = { ...gameData }
    newGameData.entities[entityIndex] = { ...newGameData.entities[entityIndex], ...updates }
    setGameData(newGameData)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Game Canvas */}
      <div className="lg:col-span-2">
        <motion.div
          className="glass rounded-xl p-6"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="text-xl font-bold mb-4">Game Canvas</h3>
          <div 
            className="relative border-2 border-dashed border-white/20 rounded-lg overflow-hidden"
            style={{ 
              width: '100%', 
              height: '400px',
              background: gameData.levels?.[0]?.background || '#87CEEB'
            }}
          >
            {/* Render platforms */}
            {gameData.levels?.[0]?.platforms?.map((platform: any, index: number) => (
              <div
                key={`platform-${index}`}
                className="absolute"
                style={{
                  left: `${(platform.x / gameData.levels[0].width) * 100}%`,
                  top: `${(platform.y / gameData.levels[0].height) * 100}%`,
                  width: `${(platform.width / gameData.levels[0].width) * 100}%`,
                  height: `${(platform.height / gameData.levels[0].height) * 100}%`,
                  background: platform.color || '#8B4513'
                }}
              />
            ))}

            {/* Render entities */}
            {gameData.entities?.map((entity: any, index: number) => (
              <div
                key={`entity-${index}`}
                className={`absolute border-2 border-white/50 cursor-pointer hover:border-primary-400 transition-colors ${
                  selectedEntity === index ? 'border-primary-500 glow' : ''
                }`}
                style={{
                  left: `${(entity.x / gameData.levels[0].width) * 100}%`,
                  top: `${(entity.y / gameData.levels[0].height) * 100}%`,
                  width: `${(entity.width / gameData.levels[0].width) * 100}%`,
                  height: `${(entity.height / gameData.levels[0].height) * 100}%`,
                  background: entity.type === 'player' ? '#ff6b6b' : '#4ecdc4'
                }}
                onClick={() => setSelectedEntity(index)}
              >
                <div className="text-xs text-white p-1">{entity.name}</div>
              </div>
            ))}

            {/* Render goal */}
            {gameData.levels?.[0]?.goal && (
              <div
                className="absolute border-2 border-yellow-400"
                style={{
                  left: `${(gameData.levels[0].goal.x / gameData.levels[0].width) * 100}%`,
                  top: `${(gameData.levels[0].goal.y / gameData.levels[0].height) * 100}%`,
                  width: `${(gameData.levels[0].goal.width / gameData.levels[0].width) * 100}%`,
                  height: `${(gameData.levels[0].goal.height / gameData.levels[0].height) * 100}%`,
                  background: 'gold'
                }}
              >
                <div className="text-xs text-black p-1">Goal</div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Properties Panel */}
      <div>
        <motion.div
          className="glass rounded-xl p-6"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="text-xl font-bold mb-4">Properties</h3>
          
          {/* Game Info */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Game Info</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Title:</strong> {gameData.title}</div>
              <div><strong>Type:</strong> {gameData.gameType}</div>
              <div><strong>Description:</strong> {gameData.description}</div>
            </div>
          </div>

          {/* Entity List */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Entities</h4>
            <div className="space-y-2">
              {gameData.entities?.map((entity: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedEntity(index)}
                  className={`w-full text-left p-2 rounded text-sm transition-all ${
                    selectedEntity === index 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {entity.name} ({entity.type})
                </button>
              ))}
            </div>
          </div>

          {/* Selected Entity Properties */}
          {selectedEntity !== null && gameData.entities?.[selectedEntity] && (
            <div>
              <h4 className="font-semibold mb-2">Selected Entity</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">X Position</label>
                  <input
                    type="number"
                    value={gameData.entities[selectedEntity].x}
                    onChange={(e) => updateEntity(selectedEntity, { x: parseInt(e.target.value) })}
                    className="w-full bg-dark-200 border border-white/20 rounded px-3 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Y Position</label>
                  <input
                    type="number"
                    value={gameData.entities[selectedEntity].y}
                    onChange={(e) => updateEntity(selectedEntity, { y: parseInt(e.target.value) })}
                    className="w-full bg-dark-200 border border-white/20 rounded px-3 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Width</label>
                  <input
                    type="number"
                    value={gameData.entities[selectedEntity].width}
                    onChange={(e) => updateEntity(selectedEntity, { width: parseInt(e.target.value) })}
                    className="w-full bg-dark-200 border border-white/20 rounded px-3 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Height</label>
                  <input
                    type="number"
                    value={gameData.entities[selectedEntity].height}
                    onChange={(e) => updateEntity(selectedEntity, { height: parseInt(e.target.value) })}
                    className="w-full bg-dark-200 border border-white/20 rounded px-3 py-1 text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}