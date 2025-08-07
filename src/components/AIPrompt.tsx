import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateGame } from '../services/deepseek'

interface AIPromptProps {
  onGameGenerated: (game: any) => void
}

export default function AIPrompt({ onGameGenerated }: AIPromptProps) {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState('')
  const [progressPercentage, setProgressPercentage] = useState(0)
  const [progressDetails, setProgressDetails] = useState('')
  const [accomplished, setAccomplished] = useState<string[]>([])
  const [nextSteps, setNextSteps] = useState<string[]>([])
  const [showExamples, setShowExamples] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    setGenerationProgress('Initializing AI generation...')
    
    try {
      const game = await generateGame(prompt, (step, percentage, details, accomplishedSteps, nextStepsList) => {
        setGenerationProgress(step)
        setProgressPercentage(percentage)
        setProgressDetails(details || '')
        setAccomplished(accomplishedSteps || [])
        setNextSteps(nextStepsList || [])
      })
      onGameGenerated(game)
    } catch (error) {
      console.error('Generation failed:', error)
      setGenerationProgress('❌ Generation failed. Please try again.')
      setProgressPercentage(0)
    } finally {
      setIsGenerating(false)
    }
  }

  const examplePrompts = [
    {
      title: "🥷 Ninja Platformer",
      description: "Create a side-scrolling platformer with a ninja character collecting stars and avoiding deadly traps",
      genre: "Platformer"
    },
    {
      title: "🚀 Space Shooter", 
      description: "Make an intense space shooter game with power-ups, enemy waves, and epic boss battles",
      genre: "Shooter"
    },
    {
      title: "🧩 Hex Tetris",
      description: "Build a puzzle game like Tetris but with hexagonal pieces and rotating mechanics",
      genre: "Puzzle"
    },
    {
      title: "🗺️ Treasure Hunt",
      description: "Design a top-down adventure game with treasure hunting, dungeons, and magical items",
      genre: "Adventure"
    },
    {
      title: "🏎️ Racing Game",
      description: "Create a high-speed racing game with drifting mechanics and multiple tracks", 
      genre: "Racing"
    },
    {
      title: "⚔️ RPG Battle",
      description: "Build a turn-based RPG with character classes, magic spells, and leveling system",
      genre: "RPG"
    }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <motion.div
        className="text-center space-y-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h2 
          className="text-6xl font-black bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
          animate={{ 
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        >
          DREAM IT. DESCRIBE IT. PLAY IT.
        </motion.h2>
        <motion.p 
          className="text-xl text-cyan-300 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Transform your wildest game ideas into reality using the power of advanced AI. 
          Just describe your vision and watch it come to life.
        </motion.p>
      </motion.div>

      {/* Main Input Section */}
      <motion.div
        className="relative backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-8 border border-white/20 shadow-2xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <div className="space-y-6">
          <div className="relative">
            <motion.div
              className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-2xl blur opacity-30"
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.02, 1]
              }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            />
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="🎮 Describe your dream game in detail...

Example: 'Create a cyberpunk platformer where you play as a hacker cat navigating through neon-lit digital landscapes, collecting data crystals while avoiding security drones. Include wall-jumping, stealth mechanics, and electronic music.'"
              className="relative w-full h-40 bg-slate-900/80 border-2 border-cyan-500/30 rounded-2xl p-6 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none resize-none text-lg backdrop-blur-xl transition-all duration-300 focus:shadow-2xl focus:shadow-cyan-500/25"
              disabled={isGenerating}
              style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)'
              }}
            />
            <div className="absolute bottom-4 right-4 text-sm text-gray-400">
              {prompt.length}/1000
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <motion.button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="relative group px-12 py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-2xl font-bold text-lg text-white disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden transition-all duration-300"
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(6, 182, 212, 0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                animate={{
                  background: [
                    'linear-gradient(45deg, #06b6d4, #8b5cf6)',
                    'linear-gradient(45deg, #8b5cf6, #ec4899)',
                    'linear-gradient(45deg, #ec4899, #06b6d4)'
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <span className="relative flex items-center space-x-2">
                {isGenerating ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>GENERATING...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>GENERATE GAME</span>
                  </>
                )}
              </span>
            </motion.button>
            
            <div className="flex items-center space-x-3 text-cyan-300">
              <motion.div
                className="w-3 h-3 bg-green-400 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm font-medium">DeepSeek AI Neural Network</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Generation Progress */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            className="backdrop-blur-xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl p-8 border border-cyan-500/30 shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -50 }}
          >
            <div className="space-y-6">
              {/* Main Progress Display */}
              <div className="flex items-center space-x-4">
                <motion.div
                  className="relative w-16 h-16 flex items-center justify-center"
                >
                  <motion.div
                    className="absolute inset-0 border-4 border-cyan-400/30 rounded-full"
                  />
                  <motion.div
                    className="absolute inset-0 border-4 border-cyan-400 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🤖
                  </motion.div>
                </motion.div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-cyan-300">{generationProgress}</h3>
                    <span className="text-lg font-mono text-purple-400">{progressPercentage.toFixed(0)}%</span>
                  </div>
                  {progressDetails && (
                    <p className="text-sm text-gray-300 opacity-80">{progressDetails}</p>
                  )}
                  
                  {/* Enhanced Progress Bar */}
                  <div className="relative w-full bg-white/10 rounded-full h-4 overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full"
                      initial={{ x: '-100%' }}
                      animate={{ x: `${progressPercentage - 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full"
                      animate={{ x: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                </div>
              </div>

              {/* What's Been Accomplished */}
              {accomplished.length > 0 && (
                <div className="bg-white/5 rounded-xl p-6 border border-green-500/20">
                  <h4 className="text-lg font-bold text-green-400 mb-4 flex items-center">
                    ✅ Accomplished by DeepSeek AI
                  </h4>
                  <div className="space-y-2">
                    {accomplished.map((task, index) => (
                      <motion.div 
                        key={index}
                        className="flex items-center space-x-3 text-green-300"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                        <span className="text-sm">{task}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* What's Coming Next */}
              {nextSteps.length > 0 && (
                <div className="bg-white/5 rounded-xl p-6 border border-blue-500/20">
                  <h4 className="text-lg font-bold text-blue-400 mb-4 flex items-center">
                    🔮 Next Steps
                  </h4>
                  <div className="space-y-2">
                    {nextSteps.map((step, index) => (
                      <motion.div 
                        key={index}
                        className="flex items-center space-x-3 text-blue-300"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-blue-400 animate-pulse' : 'bg-blue-400/50'}`} />
                        <span className={`text-sm ${index === 0 ? 'font-semibold' : ''}`}>{step}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Activity Indicators */}
              <div className="grid grid-cols-3 gap-4">
                <motion.div 
                  className="bg-white/5 rounded-xl p-4 border border-cyan-500/20"
                  animate={{ opacity: progressPercentage > 10 ? 1 : 0.5 }}
                >
                  <div className="flex items-center space-x-2">
                    <motion.div 
                      className="w-3 h-3 bg-cyan-400 rounded-full"
                      animate={{ scale: progressPercentage > 10 ? [1, 1.3, 1] : 1 }}
                      transition={{ duration: 1, repeat: progressPercentage > 10 ? Infinity : 0 }}
                    />
                    <span className="text-sm text-cyan-300">DeepSeek AI</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="bg-white/5 rounded-xl p-4 border border-purple-500/20"
                  animate={{ opacity: progressPercentage > 60 ? 1 : 0.5 }}
                >
                  <div className="flex items-center space-x-2">
                    <motion.div 
                      className="w-3 h-3 bg-purple-400 rounded-full"
                      animate={{ scale: progressPercentage > 60 ? [1, 1.3, 1] : 1 }}
                      transition={{ duration: 1, repeat: progressPercentage > 60 ? Infinity : 0 }}
                    />
                    <span className="text-sm text-purple-300">DALL-E 3</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="bg-white/5 rounded-xl p-4 border border-pink-500/20"
                  animate={{ opacity: progressPercentage > 90 ? 1 : 0.5 }}
                >
                  <div className="flex items-center space-x-2">
                    <motion.div 
                      className="w-3 h-3 bg-pink-400 rounded-full"
                      animate={{ scale: progressPercentage > 90 ? [1, 1.3, 1] : 1 }}
                      transition={{ duration: 1, repeat: progressPercentage > 90 ? Infinity : 0 }}
                    />
                    <span className="text-sm text-pink-300">Mobile Opt</span>
                  </div>
                </motion.div>
              </div>

              {/* Fun Generation Tips */}
              <motion.div
                className="text-center p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <p className="text-sm text-blue-200">
                  🎮 Creating your epic mobile game with AI-generated visuals and optimized gameplay...
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Example Prompts */}
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            🎯 Quick Start Templates
          </h3>
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="text-cyan-400 hover:text-white transition-colors"
          >
            {showExamples ? '🔼 Hide' : '🔽 Show'}
          </button>
        </div>
        
        <AnimatePresence>
          {showExamples && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {examplePrompts.map((example, index) => (
                <motion.button
                  key={index}
                  onClick={() => setPrompt(example.description)}
                  className="group relative text-left p-6 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/20 hover:border-cyan-400/50 transition-all duration-300 backdrop-blur-xl"
                  disabled={isGenerating}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 10px 30px rgba(6, 182, 212, 0.2)"
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {example.title}
                      </h4>
                      <span className="text-xs px-2 py-1 bg-purple-500/30 rounded-full text-purple-300">
                        {example.genre}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 group-hover:text-white transition-colors line-clamp-3">
                      {example.description}
                    </p>
                  </div>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}