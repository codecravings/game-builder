import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  opacity: number
  angle: number
  pulse: number
  type: 'star' | 'dot' | 'triangle' | 'square'
}

interface DynamicBackgroundProps {
  theme?: 'default' | 'space' | 'cyber' | 'nature' | 'magic'
  intensity?: 'low' | 'medium' | 'high'
}

export default function ParticleBackground({ theme = 'default', intensity = 'medium' }: DynamicBackgroundProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>()
  const timeRef = useRef<number>(0)
  const lastFrameTime = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      const devicePixelRatio = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * devicePixelRatio
      canvas.height = window.innerHeight * devicePixelRatio
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.scale(devicePixelRatio, devicePixelRatio)
    }

    const getThemeConfig = () => {
      const configs = {
        default: {
          colors: ['#06b6d4', '#8b5cf6', '#ec4899', '#10b981'],
          speed: 0.5,
          glow: true
        },
        space: {
          colors: ['#ffffff', '#60a5fa', '#a78bfa', '#fbbf24'],
          speed: 0.3,
          glow: true,
          twinkle: true
        },
        cyber: {
          colors: ['#00ff88', '#ff0080', '#00ffff', '#ff4444'],
          speed: 1.0,
          glow: true,
          electric: true
        },
        nature: {
          colors: ['#22c55e', '#84cc16', '#eab308', '#f97316'],
          speed: 0.4,
          organic: true
        },
        magic: {
          colors: ['#a855f7', '#ec4899', '#f59e0b', '#06b6d4'],
          speed: 0.6,
          glow: true,
          sparkle: true
        }
      }
      return configs[theme]
    }

    const createParticles = () => {
      const particles: Particle[] = []
      const config = getThemeConfig()
      const intensityMultiplier = intensity === 'low' ? 0.5 : intensity === 'high' ? 2 : 1
      const particleCount = Math.floor((canvas.width * canvas.height) / (15000 / intensityMultiplier))
      
      for (let i = 0; i < particleCount; i++) {
        const particleTypes: Particle['type'][] = ['dot', 'star', 'triangle', 'square']
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * config.speed,
          vy: (Math.random() - 0.5) * config.speed,
          size: Math.random() * 3 + 0.5,
          color: config.colors[Math.floor(Math.random() * config.colors.length)],
          opacity: Math.random() * 0.6 + 0.2,
          angle: Math.random() * Math.PI * 2,
          pulse: Math.random() * Math.PI * 2,
          type: particleTypes[Math.floor(Math.random() * particleTypes.length)]
        })
      }
      
      particlesRef.current = particles
    }

    const drawParticle = (particle: Particle) => {
      const config = getThemeConfig()
      
      ctx.save()
      ctx.translate(particle.x, particle.y)
      ctx.rotate(particle.angle)
      
      // Pulsing effect
      const pulseScale = 1 + Math.sin(particle.pulse + timeRef.current * 0.003) * 0.3
      ctx.scale(pulseScale, pulseScale)
      
      // Glow effect
      if (config.glow) {
        ctx.shadowBlur = particle.size * 3
        ctx.shadowColor = particle.color
      }
      
      ctx.fillStyle = particle.color
      ctx.globalAlpha = particle.opacity
      
      // Draw different shapes based on type
      switch (particle.type) {
        case 'star':
          drawStar(ctx, 0, 0, 5, particle.size, particle.size * 0.5)
          break
        case 'triangle':
          drawTriangle(ctx, 0, 0, particle.size)
          break
        case 'square':
          ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size)
          break
        default: // dot
          ctx.beginPath()
          ctx.arc(0, 0, particle.size, 0, Math.PI * 2)
          ctx.fill()
      }
      
      // Special effects based on theme
      if (config.twinkle && Math.random() < 0.01) {
        ctx.shadowBlur = particle.size * 8
        ctx.fill()
      }
      
      if (config.electric && Math.random() < 0.005) {
        // Electric spark effect
        ctx.strokeStyle = particle.color
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let i = 0; i < 3; i++) {
          const angle = Math.random() * Math.PI * 2
          const length = particle.size * 2
          ctx.moveTo(0, 0)
          ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length)
        }
        ctx.stroke()
      }
      
      ctx.restore()
    }
    
    const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
      let rot = Math.PI / 2 * 3
      let x = cx
      let y = cy
      const step = Math.PI / spikes
      
      ctx.beginPath()
      ctx.moveTo(cx, cy - outerRadius)
      
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius
        y = cy + Math.sin(rot) * outerRadius
        ctx.lineTo(x, y)
        rot += step
        
        x = cx + Math.cos(rot) * innerRadius
        y = cy + Math.sin(rot) * innerRadius
        ctx.lineTo(x, y)
        rot += step
      }
      
      ctx.lineTo(cx, cy - outerRadius)
      ctx.closePath()
      ctx.fill()
    }
    
    const drawTriangle = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) => {
      ctx.beginPath()
      ctx.moveTo(cx, cy - size)
      ctx.lineTo(cx - size, cy + size)
      ctx.lineTo(cx + size, cy + size)
      ctx.closePath()
      ctx.fill()
    }

    const connectParticles = (p1: Particle, p2: Particle) => {
      const dx = p1.x - p2.x
      const dy = p1.y - p2.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < 100) {
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.strokeStyle = p1.color
        ctx.globalAlpha = (100 - distance) / 100 * 0.2
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    }

    const animate = (currentTime: number) => {
      // Throttle to 60 FPS max
      if (currentTime - lastFrameTime.current < 16.67) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }
      lastFrameTime.current = currentTime
      
      timeRef.current = currentTime
      const config = getThemeConfig()
      
      // Clear canvas completely to prevent artifacts
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Set composite operation to ensure clean background
      ctx.globalCompositeOperation = 'source-over'
      
      // Create gradient background with full opacity to ensure clean clear
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
      )
      
      switch (theme) {
        case 'space':
          gradient.addColorStop(0, 'rgba(10, 10, 30, 1.0)')
          gradient.addColorStop(1, 'rgba(0, 0, 0, 1.0)')
          break
        case 'cyber':
          gradient.addColorStop(0, 'rgba(20, 0, 40, 1.0)')
          gradient.addColorStop(1, 'rgba(0, 0, 0, 1.0)')
          break
        case 'nature':
          gradient.addColorStop(0, 'rgba(10, 30, 10, 1.0)')
          gradient.addColorStop(1, 'rgba(0, 0, 0, 1.0)')
          break
        case 'magic':
          gradient.addColorStop(0, 'rgba(30, 10, 40, 1.0)')
          gradient.addColorStop(1, 'rgba(0, 0, 0, 1.0)')
          break
        default:
          gradient.addColorStop(0, 'rgba(15, 15, 35, 1.0)')
          gradient.addColorStop(1, 'rgba(0, 0, 0, 1.0)')
      }
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      particlesRef.current.forEach((particle, i) => {
        // Update position with wave motion for organic themes
        if (config.organic) {
          particle.x += particle.vx + Math.sin(timeRef.current * 0.001 + particle.y * 0.01) * 0.2
          particle.y += particle.vy + Math.cos(timeRef.current * 0.001 + particle.x * 0.01) * 0.2
        } else {
          particle.x += particle.vx
          particle.y += particle.vy
        }
        
        // Update rotation and pulse
        particle.angle += 0.01
        particle.pulse += 0.02
        
        // Bounce off edges with energy loss
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.vx *= -0.8
          particle.x = Math.max(0, Math.min(canvas.width, particle.x))
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.vy *= -0.8
          particle.y = Math.max(0, Math.min(canvas.height, particle.y))
        }
        
        // Gravity effect for magic theme
        if (config.sparkle) {
          particle.vy += 0.002
        }
        
        // Draw particle
        drawParticle(particle)
        
        // Connect nearby particles (less frequent for performance)
        if (i % 3 === 0) {
          for (let j = i + 1; j < Math.min(i + 10, particlesRef.current.length); j++) {
            connectParticles(particle, particlesRef.current[j])
          }
        }
      })
      
      animationRef.current = requestAnimationFrame(animate)
    }

    resizeCanvas()
    createParticles()
    animate(0)

    const handleResize = () => {
      resizeCanvas()
      createParticles()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [theme, intensity])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ 
        zIndex: 1,
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)' // Force hardware acceleration
      }}
    />
  )
}