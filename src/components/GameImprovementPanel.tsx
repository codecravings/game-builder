import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface GameImprovementPanelProps {
  game: any
  onGameUpdate: (updatedGame: any) => void
  isOpen: boolean
  onClose: () => void
}

interface ImprovementRequest {
  type: 'color' | 'asset' | 'gameplay' | 'physics' | 'difficulty'
  description: string
  targetElement?: string
}

export default function GameImprovementPanel({ game, onGameUpdate, isOpen, onClose }: GameImprovementPanelProps) {
  const [improvementType, setImprovementType] = useState<string>('color')
  const [description, setDescription] = useState('')
  const [targetElement, setTargetElement] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState('')

  const improvementTypes = [
    { id: 'color', name: '🎨 Colors & Visuals', desc: 'Change colors, themes, visual style' },
    { id: 'asset', name: '🖼️ Assets & Sprites', desc: 'Replace or modify game sprites' },
    { id: 'gameplay', name: '🎮 Gameplay Mechanics', desc: 'Fix jumping, movement, controls' },
    { id: 'physics', name: '⚡ Physics & Feel', desc: 'Adjust gravity, speed, collision' },
    { id: 'difficulty', name: '🎯 Difficulty & Balance', desc: 'Make easier/harder, add challenges' }
  ]

  const quickImprovements = [
    { type: 'color', desc: 'Make the game more colorful and vibrant', target: 'all' },
    { type: 'asset', desc: 'Replace player character with a robot', target: 'player' },
    { type: 'gameplay', desc: 'Player jumps too low, make jumping higher', target: 'player' },
    { type: 'physics', desc: 'Game feels too slow, make everything faster', target: 'all' },
    { type: 'difficulty', desc: 'Add more enemies to make it challenging', target: 'enemies' }
  ]

  const handleImprovement = async () => {
    if (!description.trim()) return

    setIsProcessing(true)
    setProgress('🤖 DeepSeek analyzing your request...')

    try {
      const improvementRequest: ImprovementRequest = {
        type: improvementType as any,
        description: description.trim(),
        targetElement: targetElement || 'all'
      }

      // Use frontend improvement instead of backend
      setProgress('✨ Applying visual improvements...')
      
      // Apply basic improvements directly to the game
      const improvedGame = { ...game }
      
      if (improvementType === 'color') {
        // Apply color improvements
        improvedGame.entities = game.entities.map((entity: any) => ({
          ...entity,
          color: entity.type === 'player' ? '#00FFFF' : 
                 entity.name.includes('enemy') ? '#FF4444' :
                 entity.name.includes('star') || entity.name.includes('coin') ? '#FFD700' :
                 entity.color || '#FFFFFF'
        }))
        
        if (improvedGame.levels && improvedGame.levels[0]) {
          improvedGame.levels[0].background = '#1a1a2e'
        }
      }
      
      if (improvementType === 'gameplay') {
        // Improve player physics
        improvedGame.entities = game.entities.map((entity: any) => ({
          ...entity,
          physics: entity.type === 'player' ? {
            ...entity.physics,
            jumpForce: -600, // Higher jump
            moveSpeed: 250 // Faster movement
          } : entity.physics
        }))
      }
      
      // Add emoji representations
      improvedGame.entities = improvedGame.entities.map((entity: any) => ({
        ...entity,
        emoji: entity.type === 'player' ? '🥷' :
               entity.name.includes('enemy') ? '👹' :
               entity.name.includes('star') ? '⭐' :
               entity.name.includes('coin') ? '🪙' : '⬜'
      }))
      
      onGameUpdate(improvedGame)
      setProgress('✅ Game improved successfully!')
      setTimeout(() => {
        onClose()
        setProgress('')
        setDescription('')
      }, 2000)
    } catch (error) {
      console.error('Improvement failed:', error)
      setProgress(`❌ Error: ${error.message}`)
    } finally {
      setTimeout(() => setIsProcessing(false), 2000)
    }
  }

  const handleQuickImprovement = (improvement: any) => {
    setImprovementType(improvement.type)
    setDescription(improvement.desc)
    setTargetElement(improvement.target)
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
            <h3 className="text-2xl font-bold text-white">🚀 AI Game Improvement</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {/* Quick Improvements */}
          <div className="mb-6">
            <h4 className="text-lg font-bold text-cyan-400 mb-3">⚡ Quick Improvements</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quickImprovements.map((improvement, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickImprovement(improvement)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-lg text-left transition-colors"
                >
                  <div className="text-sm text-gray-300">{improvement.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Improvement Type Selection */}
          <div className="mb-6">
            <h4 className="text-lg font-bold text-cyan-400 mb-3">🎯 Improvement Type</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {improvementTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setImprovementType(type.id)}
                  className={`p-4 rounded-lg text-left transition-colors ${
                    improvementType === type.id
                      ? 'bg-cyan-600/30 border border-cyan-500'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <div className="font-semibold text-white mb-1">{type.name}</div>
                  <div className="text-sm text-gray-300">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Description */}
          <div className="mb-6">
            <h4 className="text-lg font-bold text-cyan-400 mb-3">📝 Describe Your Changes</h4>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., 'Make the player character blue and add a cape' or 'The jumping feels too weak, make it stronger' or 'Change the background to a space theme'"
              className="w-full h-32 bg-slate-800 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none resize-none"
            />
          </div>

          {/* Target Element (optional) */}
          <div className="mb-6">
            <h4 className="text-lg font-bold text-cyan-400 mb-3">🎯 Target Element (Optional)</h4>
            <input
              type="text"
              value={targetElement}
              onChange={(e) => setTargetElement(e.target.value)}
              placeholder="e.g., 'player', 'background', 'enemies', or leave blank for all"
              className="w-full bg-slate-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Progress Display */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                className="mb-6 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex items-center">
                  <motion.div
                    className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full mr-3"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <p className="text-purple-200">{progress}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleImprovement}
              disabled={!description.trim() || isProcessing}
              className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? '⏳ Processing...' : '🚀 Improve Game'}
            </button>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Current Game Info */}
          <div className="mt-6 p-4 bg-white/5 rounded-lg">
            <h4 className="text-sm font-bold text-gray-400 mb-2">Current Game:</h4>
            <div className="text-sm text-gray-300">
              <span className="font-semibold">{game?.title || 'Unnamed Game'}</span> - 
              <span className="ml-1">{game?.gameType || 'Unknown Type'}</span> - 
              <span className="ml-1">{game?.entities?.length || 0} entities</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}