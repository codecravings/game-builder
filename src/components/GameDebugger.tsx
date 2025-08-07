import { useState } from 'react'
import { motion } from 'framer-motion'

interface GameDebuggerProps {
  game: any
}

export default function GameDebugger({ game }: GameDebuggerProps) {
  const [showRaw, setShowRaw] = useState(false)

  if (!game) return null

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-50 bg-black/80 text-green-400 rounded-lg p-4 max-w-md max-h-96 overflow-auto text-xs font-mono"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-cyan-400 font-bold">🐛 Game Debug</span>
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="text-yellow-400 hover:text-white text-xs"
        >
          {showRaw ? 'Hide Raw' : 'Show Raw'}
        </button>
      </div>
      
      <div className="space-y-2">
        <div><span className="text-blue-400">Title:</span> {game.title}</div>
        <div><span className="text-blue-400">Theme:</span> {game.theme}</div>
        <div><span className="text-blue-400">Style:</span> {game.visualStyle}</div>
        
        {game.entities && (
          <div>
            <span className="text-purple-400">Entities:</span>
            {game.entities.map((entity: any, i: number) => (
              <div key={i} className="ml-2">
                • {entity.name} ({entity.type}) - Color: <span style={{color: entity.color}}>{entity.color}</span>
              </div>
            ))}
          </div>
        )}
        
        {game.levels && game.levels[0] && (
          <div>
            <span className="text-orange-400">Level:</span>
            <div className="ml-2">
              • BG: <span style={{color: game.levels[0].background}}>{game.levels[0].background}</span>
              <div>• Platforms: {game.levels[0].platforms?.length || 0}</div>
              <div>• Collectibles: {game.levels[0].collectibles?.length || 0}</div>
            </div>
          </div>
        )}
      </div>
      
      {showRaw && (
        <div className="mt-4 pt-2 border-t border-gray-600">
          <pre className="text-xs overflow-auto max-h-48">
            {JSON.stringify(game, null, 2)}
          </pre>
        </div>
      )}
    </motion.div>
  )
}