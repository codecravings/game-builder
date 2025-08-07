import { useMemo } from 'react'

interface StaticBackgroundProps {
  theme?: 'default' | 'space' | 'cyber' | 'nature' | 'magic'
  animated?: boolean
}

export default function StaticBackground({ theme = 'default', animated = true }: StaticBackgroundProps = {}) {
  const backgroundStyle = useMemo(() => {
    const baseClass = "fixed inset-0 pointer-events-none"
    
    const themes = {
      default: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
      space: 'bg-gradient-to-br from-indigo-950 via-slate-900 to-black',
      cyber: 'bg-gradient-to-br from-purple-950 via-slate-900 to-black',
      nature: 'bg-gradient-to-br from-green-950 via-slate-900 to-black',
      magic: 'bg-gradient-to-br from-violet-950 via-purple-900 to-slate-900'
    }
    
    return `${baseClass} ${themes[theme]}`
  }, [theme])

  const overlayStyle = useMemo(() => {
    const overlays = {
      default: 'from-blue-500/10 via-purple-500/5 to-pink-500/10',
      space: 'from-blue-400/8 via-indigo-500/4 to-purple-500/8',
      cyber: 'from-cyan-400/12 via-pink-500/6 to-purple-500/12',
      nature: 'from-green-400/10 via-emerald-500/5 to-lime-500/10',
      magic: 'from-purple-400/15 via-pink-500/8 to-violet-500/15'
    }
    
    return overlays[theme]
  }, [theme])

  return (
    <>
      {/* Base gradient background */}
      <div 
        className={backgroundStyle}
        style={{ zIndex: 1 }}
      />
      
      {/* Animated overlay */}
      <div 
        className={`fixed inset-0 pointer-events-none bg-gradient-to-br ${overlayStyle} ${animated ? 'animate-pulse' : ''}`}
        style={{ 
          zIndex: 2,
          animationDuration: '4s',
          animationTimingFunction: 'ease-in-out'
        }}
      />
      
      {/* Subtle moving dots for space theme */}
      {theme === 'space' && (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 3 }}>
          <div className="absolute w-1 h-1 bg-white rounded-full opacity-70 animate-twinkle" style={{ top: '20%', left: '15%', animationDelay: '0s' }} />
          <div className="absolute w-1 h-1 bg-blue-200 rounded-full opacity-60 animate-twinkle" style={{ top: '40%', left: '80%', animationDelay: '1s' }} />
          <div className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-50 animate-twinkle" style={{ top: '70%', left: '25%', animationDelay: '2s' }} />
          <div className="absolute w-1 h-1 bg-purple-200 rounded-full opacity-40 animate-twinkle" style={{ top: '15%', left: '70%', animationDelay: '3s' }} />
          <div className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-twinkle" style={{ top: '85%', left: '60%', animationDelay: '1.5s' }} />
          <div className="absolute w-1 h-1 bg-blue-100 rounded-full opacity-30 animate-twinkle" style={{ top: '30%', left: '40%', animationDelay: '2.5s' }} />
        </div>
      )}
      
      {/* Cyber grid effect */}
      {theme === 'cyber' && (
        <div 
          className="fixed inset-0 pointer-events-none opacity-10"
          style={{ 
            zIndex: 3,
            backgroundImage: 'linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            animation: animated ? 'gridMove 20s linear infinite' : 'none'
          }}
        />
      )}
      
      {/* Nature floating elements */}
      {theme === 'nature' && animated && (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 3 }}>
          <div className="absolute text-green-400 opacity-20 animate-float" style={{ top: '25%', left: '20%', animationDelay: '0s' }}>🍃</div>
          <div className="absolute text-green-300 opacity-15 animate-float" style={{ top: '60%', left: '75%', animationDelay: '2s' }}>🍃</div>
          <div className="absolute text-emerald-400 opacity-10 animate-float" style={{ top: '40%', left: '10%', animationDelay: '4s' }}>🍃</div>
          <div className="absolute text-lime-400 opacity-20 animate-float" style={{ top: '80%', left: '85%', animationDelay: '1s' }}>🍃</div>
        </div>
      )}
      
      {/* Magic sparkles */}
      {theme === 'magic' && animated && (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 3 }}>
          <div className="absolute text-purple-400 opacity-30 animate-sparkle" style={{ top: '20%', left: '30%', animationDelay: '0s' }}>✨</div>
          <div className="absolute text-pink-400 opacity-25 animate-sparkle" style={{ top: '50%', left: '70%', animationDelay: '1.5s' }}>✨</div>
          <div className="absolute text-violet-400 opacity-20 animate-sparkle" style={{ top: '70%', left: '20%', animationDelay: '3s' }}>⭐</div>
          <div className="absolute text-fuchsia-400 opacity-30 animate-sparkle" style={{ top: '30%', left: '80%', animationDelay: '2s' }}>✨</div>
        </div>
      )}
    </>
  )
}

// Add custom CSS animations to global styles
const customStyles = `
@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

@keyframes gridMove {
  0% { transform: translateX(0) translateY(0); }
  100% { transform: translateX(50px) translateY(50px); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-10px) rotate(5deg); }
  66% { transform: translateY(5px) rotate(-3deg); }
}

@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
  50% { opacity: 0.8; transform: scale(1.2) rotate(180deg); }
}

.animate-twinkle {
  animation: twinkle 3s ease-in-out infinite;
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-sparkle {
  animation: sparkle 4s ease-in-out infinite;
}
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = customStyles
  document.head.appendChild(styleSheet)
}