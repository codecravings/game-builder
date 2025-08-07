import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import EnhancedGameEditor from './components/EnhancedGameEditor'
import AIPrompt from './components/AIPrompt'
import Preview from './components/Preview'
import ParticleBackground from './components/ParticleBackground'
import StaticBackground from './components/StaticBackground'
import { ErrorBoundary, useToasts } from './components/ErrorBoundary'
import { GamePersistenceManager } from './services/gamePersistence'

function App() {
  const [currentView, setCurrentView] = useState<'prompt' | 'editor' | 'preview'>('prompt')
  const [generatedGame, setGeneratedGame] = useState<any>(null)
  const [useStaticBackground, setUseStaticBackground] = useState(false)
  const { addToast, ToastContainer } = useToasts()

  useEffect(() => {
    // Initialize persistence system
    const initializeApp = async () => {
      try {
        await GamePersistenceManager.initialize()
        
        // Check for auto-saved game
        const autoSave = GamePersistenceManager.loadAutoSave()
        if (autoSave) {
          setGeneratedGame(autoSave)
          setCurrentView('editor')
          addToast('Auto-saved game restored', 'success')
        }
      } catch (error) {
        console.error('Failed to initialize app:', error)
        addToast('Failed to initialize app', 'error')
      }
    }
    
    initializeApp()
  }, [addToast])

  const handleGameGenerated = (game: any) => {
    setGeneratedGame(game)
    setCurrentView('editor')
    addToast('Game generated successfully!', 'success')
  }

  const handleGameUpdate = (updatedGame: any) => {
    setGeneratedGame(updatedGame)
    GamePersistenceManager.setCurrentGame(updatedGame)
    addToast('Game updated', 'info')
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen relative overflow-x-hidden">
        {useStaticBackground ? (
          <StaticBackground theme="default" animated={true} />
        ) : (
          <ParticleBackground theme="default" intensity="medium" />
        )}
        
        {/* Background toggle button */}
        <button
          onClick={() => setUseStaticBackground(!useStaticBackground)}
          className="fixed top-4 right-4 z-50 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white text-sm backdrop-blur-sm border border-white/10 transition-all"
          title="Toggle background performance mode"
        >
          {useStaticBackground ? '🎨 Animated' : '⚡ Performance'}
        </button>
      
      <header className="relative z-10 p-8 border-b border-white/10 backdrop-blur-xl bg-white/5">
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="flex items-center space-x-4">
            <motion.div
              className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 p-0.5"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-2xl">
                🎮
              </div>
            </motion.div>
            <div>
              <motion.h1 
                className="text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                AI GAME ENGINE
              </motion.h1>
              <motion.p 
                className="text-cyan-400 mt-2 text-lg font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                Generate Epic 2D Games with Neural Networks
              </motion.p>
            </div>
          </div>
          <motion.div
            className="hidden lg:flex items-center space-x-2 text-sm text-cyan-300"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>DeepSeek AI Connected</span>
          </motion.div>
        </motion.div>
      </header>

      <nav className="relative z-10 p-6 border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="flex justify-center">
          <div className="flex space-x-2 bg-white/10 rounded-2xl p-2 backdrop-blur-xl border border-white/20">
            {(['prompt', 'editor', 'preview'] as const).map((view, index) => {
              const icons = { prompt: '🤖', editor: '⚡', preview: '🚀' }
              const labels = { prompt: 'AI Prompt', editor: 'Editor', preview: 'Preview' }
              return (
                <motion.button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`relative px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                    currentView === view 
                      ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white shadow-2xl shadow-cyan-500/25' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                >
                  <span className="mr-2">{icons[view]}</span>
                  {labels[view]}
                  {currentView === view && (
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/20 to-purple-500/20 blur-xl"
                      layoutId="activeTab"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      </nav>

      <main className="relative z-10 p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            {currentView === 'prompt' && (
              <AIPrompt onGameGenerated={handleGameGenerated} />
            )}
            {currentView === 'editor' && (
              <EnhancedGameEditor game={generatedGame} onGameUpdate={handleGameUpdate} />
            )}
            {currentView === 'preview' && (
              <Preview
                key={`${generatedGame?.title}-${generatedGame?.gameType}-${JSON.stringify(generatedGame?.entities?.map(e => e.name) || [])}`}
                game={generatedGame} 
                onGameUpdate={handleGameUpdate}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Toast notifications */}
      <ToastContainer />
    </div>
    </ErrorBoundary>
  )
}

export default App