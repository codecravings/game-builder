import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AssetGenerator } from '../services/assetGenerator'
import { generateGame } from '../services/deepseek'

interface GameImproverProps {
  game: any
  onGameUpdate: (updatedGame: any) => void
  isOpen: boolean
  onClose: () => void
}

interface ImprovementOption {
  id: string
  title: string
  description: string
  icon: string
  category: 'assets' | 'gameplay' | 'visuals' | 'mechanics'
}

export default function GameImprover({ game, onGameUpdate, isOpen, onClose }: GameImproverProps) {
  const [customPrompt, setCustomPrompt] = useState('')
  const [isImproving, setIsImproving] = useState(false)
  const [improvementProgress, setImprovementProgress] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

  const improvementOptions: ImprovementOption[] = [
    {
      id: 'better-sprites',
      title: 'Enhance Sprites',
      description: 'Generate higher quality character and vehicle sprites',
      icon: '🎨',
      category: 'assets'
    },
    {
      id: 'racing-track',
      title: 'Better Racing Track',
      description: 'Create a professional racing circuit background',
      icon: '🏁',
      category: 'assets'
    },
    {
      id: 'add-enemies',
      title: 'More Enemies',
      description: 'Add challenging AI opponents and obstacles',
      icon: '👾',
      category: 'gameplay'
    },
    {
      id: 'power-ups',
      title: 'Power-ups',
      description: 'Add boost pads, weapons, and collectible power-ups',
      icon: '⚡',
      category: 'gameplay'
    },
    {
      id: 'improve-physics',
      title: 'Better Physics',
      description: 'Enhance movement, collision, and realistic physics',
      icon: '🔬',
      category: 'mechanics'
    },
    {
      id: 'add-levels',
      title: 'More Levels',
      description: 'Generate additional challenging levels',
      icon: '🏗️',
      category: 'gameplay'
    },
    {
      id: 'visual-effects',
      title: 'Visual Effects',
      description: 'Add particle effects, explosions, and trails',
      icon: '✨',
      category: 'visuals'
    },
    {
      id: 'difficulty-modes',
      title: 'Difficulty Levels',
      description: 'Add easy, normal, hard, and expert modes',
      icon: '🎯',
      category: 'gameplay'
    },
    {
      id: 'theme-variation',
      title: 'New Themes',
      description: 'Generate space, underwater, or fantasy variations',
      icon: '🌟',
      category: 'assets'
    }
  ]

  const handleCustomImprovement = async () => {
    if (!customPrompt.trim() || isImproving) return

    setIsImproving(true)
    setImprovementProgress('🤖 Processing your request...')

    try {
      // For now, let's implement asset regeneration with user feedback
      if (customPrompt.toLowerCase().includes('sprite') || customPrompt.toLowerCase().includes('asset')) {
        setImprovementProgress('🎨 Regenerating assets based on your feedback...')
        
        const improvedAssets = await AssetGenerator.generateAssetsForGameData(
          { ...game, userFeedback: customPrompt },
          (step, progress) => {
            setImprovementProgress(`${step} (${Math.round(progress)}%)`)
          }
        )

        // Update game with new assets
        const updatedGame = {
          ...game,
          assets: {
            sprites: improvedAssets.filter(a => a.type === 'character').map(a => ({
              name: a.name,
              id: a.name,
              url: a.url,
              width: a.width,
              height: a.height,
              type: 'sprite'
            })),
            backgrounds: improvedAssets.filter(a => a.type === 'background').map(a => ({
              name: a.name,
              id: a.name,
              url: a.url,
              width: a.width,
              height: a.height,
              type: 'sprite'
            }))
          }
        }

        onGameUpdate(updatedGame)
        setImprovementProgress('✅ Game improved successfully!')
      } else {
        setImprovementProgress('💡 Feature coming soon! For now, try asset-related improvements.')
      }

    } catch (error) {
      console.error('Improvement failed:', error)
      setImprovementProgress('❌ Improvement failed. Please try again.')
    }

    setTimeout(() => {
      setIsImproving(false)
      setImprovementProgress('')
      setCustomPrompt('')
    }, 3000)
  }

  const handleQuickImprovement = async (optionId: string) => {
    setIsImproving(true)
    setImprovementProgress('🔧 Applying improvement...')

    try {
      switch (optionId) {
        case 'better-sprites':
          setImprovementProgress('🎨 Creating higher quality sprites...')
          const improvedAssets = await AssetGenerator.generateAssetsForGameData(
            { ...game, userFeedback: 'Create much higher quality, detailed, professional sprites with better textures and lighting' },
            (step, progress) => setImprovementProgress(`${step} (${Math.round(progress)}%)`)
          )
          
          const updatedGame = {
            ...game,
            assets: {
              sprites: improvedAssets.filter(a => a.type === 'character').map(a => ({
                name: a.name,
                id: a.name,
                url: a.url,
                width: a.width,
                height: a.height,
                type: 'sprite'
              })),
              backgrounds: improvedAssets.filter(a => a.type === 'background').map(a => ({
                name: a.name,
                id: a.name,
                url: a.url,
                width: a.width,
                height: a.height,
                type: 'sprite'
              }))
            }
          }
          
          onGameUpdate(updatedGame)
          setImprovementProgress('✅ Sprites enhanced with higher quality!')
          break
          
        case 'racing-track':
          setImprovementProgress('🏁 Creating professional racing track...')
          const trackAssets = await AssetGenerator.generateAssetsForGameData(
            { ...game, userFeedback: 'Create a professional Formula 1 style racing track with detailed asphalt, proper racing lines, pit lanes, and grandstands' },
            (step, progress) => setImprovementProgress(`${step} (${Math.round(progress)}%)`)
          )
          
          const trackUpdatedGame = {
            ...game,
            assets: {
              ...game.assets,
              backgrounds: trackAssets.filter(a => a.type === 'background').map(a => ({
                name: a.name,
                id: a.name,
                url: a.url,
                width: a.width,
                height: a.height,
                type: 'sprite'
              }))
            }
          }
          
          onGameUpdate(trackUpdatedGame)
          setImprovementProgress('✅ Professional racing track created!')
          break
          
        case 'add-enemies':
          setImprovementProgress('👾 Adding more challenging enemies...')
          const currentEnemies = game.levels[0]?.enemies || []
          const newEnemies = []
          
          // Add 3-5 more enemies based on game type
          for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
            if (game.gameType === 'racing') {
              newEnemies.push({
                name: `rival_car_${currentEnemies.length + i + 1}`,
                type: 'enemy',
                x: 200 + (i * 150) + Math.random() * 100,
                y: 400 + Math.random() * 100,
                width: 35,
                height: 18,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                speed: 4 + Math.random() * 4,
                aiDifficulty: 'normal'
              })
            } else {
              newEnemies.push({
                name: `enemy_${currentEnemies.length + i + 1}`,
                type: 'enemy',
                x: 200 + (i * 100) + Math.random() * 200,
                y: 400 + Math.random() * 100,
                width: 30,
                height: 30,
                color: `hsl(${Math.random() * 60}, 70%, 40%)`,
                speed: 2 + Math.random() * 3,
                aiType: Math.random() > 0.5 ? 'patrol' : 'chase'
              })
            }
          }
          
          const enemyUpdatedGame = {
            ...game,
            levels: game.levels.map((level: any, index: number) => 
              index === 0 ? { ...level, enemies: [...currentEnemies, ...newEnemies] } : level
            )
          }
          
          onGameUpdate(enemyUpdatedGame)
          setImprovementProgress(`✅ Added ${newEnemies.length} new challenging enemies!`)
          break
          
        case 'power-ups':
          setImprovementProgress('⚡ Adding power-ups and collectibles...')
          const currentCollectibles = game.levels[0]?.collectibles || []
          const newPowerUps = []
          
          // Add various power-ups
          const powerUpTypes = game.gameType === 'racing' 
            ? ['speed_boost', 'shield', 'turbo', 'nitro']
            : ['health_pack', 'jump_boost', 'speed_up', 'invincibility']
            
          for (let i = 0; i < 4; i++) {
            const powerUpType = powerUpTypes[i % powerUpTypes.length]
            newPowerUps.push({
              id: `powerup_${i}`,
              type: 'powerup',
              subType: powerUpType,
              x: 300 + (i * 200) + Math.random() * 100,
              y: 350 + Math.random() * 100,
              width: 30,
              height: 30,
              color: powerUpType === 'speed_boost' ? '#FFD700' : 
                     powerUpType === 'shield' ? '#00FFFF' :
                     powerUpType === 'turbo' ? '#FF4444' : '#44FF44',
              points: 50,
              effect: powerUpType,
              duration: 5000, // 5 seconds
              collected: false
            })
          }
          
          const powerUpGame = {
            ...game,
            levels: game.levels.map((level: any, index: number) => 
              index === 0 ? { 
                ...level, 
                collectibles: [...currentCollectibles, ...newPowerUps],
                powerUps: newPowerUps // Also add as separate power-ups array
              } : level
            )
          }
          
          onGameUpdate(powerUpGame)
          setImprovementProgress(`✅ Added ${newPowerUps.length} exciting power-ups!`)
          break
          
        case 'add-levels':
          setImprovementProgress('🏗️ Generating additional levels...')
          const promptForLevels = `Create ${Math.floor(Math.random() * 3) + 2} additional challenging levels for this ${game.gameType} game: ${game.title}. Make each level progressively harder with unique obstacles and layouts.`
          
          const levelGame = await generateGame(promptForLevels, (step, progress) => {
            setImprovementProgress(`${step} (${Math.round(progress)}%)`)
          })
          
          // Merge new levels with existing game
          const enhancedLevelGame = {
            ...game,
            levels: [...game.levels, ...levelGame.levels.slice(1)] // Skip first level to avoid duplicates
          }
          
          onGameUpdate(enhancedLevelGame)
          setImprovementProgress(`✅ Added ${levelGame.levels.length - 1} new levels!`)
          break
          
        case 'theme-variation':
          setImprovementProgress('🌟 Creating themed variation...')
          const themes = ['space', 'underwater', 'fantasy', 'cyberpunk', 'medieval', 'jungle', 'arctic']
          const newTheme = themes[Math.floor(Math.random() * themes.length)]
          
          const themedAssets = await AssetGenerator.generateAssetsForGameData(
            { ...game, theme: newTheme, userFeedback: `Transform this into a ${newTheme} themed game with matching sprites and background` },
            (step, progress) => setImprovementProgress(`${step} (${Math.round(progress)}%)`)
          )
          
          const themedGame = {
            ...game,
            theme: newTheme,
            title: `${game.title} - ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} Edition`,
            assets: {
              sprites: themedAssets.filter(a => a.type === 'character').map(a => ({
                name: a.name,
                id: a.name,
                url: a.url,
                width: a.width,
                height: a.height,
                type: 'sprite'
              })),
              backgrounds: themedAssets.filter(a => a.type === 'background').map(a => ({
                name: a.name,
                id: a.name,
                url: a.url,
                width: a.width,
                height: a.height,
                type: 'sprite'
              }))
            }
          }
          
          onGameUpdate(themedGame)
          setImprovementProgress(`✅ Created ${newTheme} themed variation!`)
          break
          
        case 'improve-physics':
          setImprovementProgress('🔬 Enhancing physics system...')
          const physicsGame = {
            ...game,
            entities: game.entities.map((entity: any) => ({
              ...entity,
              physics: {
                ...entity.physics,
                friction: entity.physics?.friction || 0.8,
                bounce: 0.3,
                mass: entity.type === 'player' ? 1.2 : 1.0,
                airControl: 0.8,
                maxSpeed: (entity.physics?.maxSpeed || 10) * 1.2,
                acceleration: (entity.physics?.acceleration || 0.5) * 1.1
              }
            }))
          }
          
          onGameUpdate(physicsGame)
          setImprovementProgress('✅ Physics system enhanced!')
          break
          
        case 'difficulty-modes':
          setImprovementProgress('🎯 Adding difficulty levels...')
          const difficultyGame = {
            ...game,
            difficultyModes: {
              easy: { enemySpeed: 0.7, playerHealth: 150, collectibleBonus: 1.5 },
              normal: { enemySpeed: 1.0, playerHealth: 100, collectibleBonus: 1.0 },
              hard: { enemySpeed: 1.3, playerHealth: 75, collectibleBonus: 0.8 },
              expert: { enemySpeed: 1.6, playerHealth: 50, collectibleBonus: 0.6 }
            },
            currentDifficulty: 'normal'
          }
          
          onGameUpdate(difficultyGame)
          setImprovementProgress('✅ Added 4 difficulty modes!')
          break
          
        default:
          setImprovementProgress('💡 This improvement is coming soon!')
      }
    } catch (error) {
      console.error('Improvement failed:', error)
      setImprovementProgress('❌ Improvement failed. Please try again.')
    }

    setTimeout(() => {
      setIsImproving(false)
      setImprovementProgress('')
    }, 3000)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'assets': return '🎨'
      case 'gameplay': return '🎮'
      case 'visuals': return '✨'
      case 'mechanics': return '⚙️'
      default: return '🔧'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'assets': return 'from-purple-600 to-pink-600'
      case 'gameplay': return 'from-blue-600 to-cyan-600'
      case 'visuals': return 'from-yellow-600 to-orange-600'
      case 'mechanics': return 'from-green-600 to-emerald-600'
      default: return 'from-gray-600 to-slate-600'
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
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              🚀 Improve Your Game
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {/* Quick Improvements */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-cyan-400 mb-4">Quick Improvements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {improvementOptions.map((option) => (
                <motion.button
                  key={option.id}
                  onClick={() => handleQuickImprovement(option.id)}
                  disabled={isImproving}
                  className={`p-4 rounded-lg bg-gradient-to-r ${getCategoryColor(option.category)} disabled:opacity-50 transition-all hover:scale-105`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <h4 className="font-semibold text-white text-sm mb-1">{option.title}</h4>
                  <p className="text-xs text-white/80">{option.description}</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Custom Improvement */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-cyan-400 mb-4">Custom Improvement</h3>
            <div className="space-y-4">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe what you want to improve... (e.g., 'Make the car sprites look more realistic', 'Add flame effects to the racing cars', 'Create a night-time racing track')"
                className="w-full h-32 bg-slate-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none resize-none"
                disabled={isImproving}
              />
              <button
                onClick={handleCustomImprovement}
                disabled={!customPrompt.trim() || isImproving}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 rounded-lg font-semibold text-white transition-all"
              >
                {isImproving ? 'Improving...' : '✨ Improve Game'}
              </button>
            </div>
          </div>

          {/* Progress Display */}
          <AnimatePresence>
            {improvementProgress && (
              <motion.div
                className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30 text-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <p className="text-purple-200 font-medium">{improvementProgress}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips */}
          <div className="mt-6 bg-cyan-500/10 rounded-lg p-4 border border-cyan-500/30">
            <h4 className="text-cyan-300 font-semibold mb-2">💡 Tips for Better Results</h4>
            <ul className="text-sm text-cyan-100/80 space-y-1">
              <li>• Be specific about what you want to improve</li>
              <li>• Mention visual style preferences (realistic, cartoon, retro, etc.)</li>
              <li>• For racing games, specify car types or track environments</li>
              <li>• Asset improvements work best (sprites, backgrounds, effects)</li>
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}