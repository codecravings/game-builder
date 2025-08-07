export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  alpha: number
}

export class ParticleSystem {
  private particles: Particle[] = []

  update(deltaTime: number) {
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx * deltaTime * 60
      particle.y += particle.vy * deltaTime * 60
      particle.life -= deltaTime
      particle.alpha = particle.life / particle.maxLife
      
      return particle.life > 0
    })
  }

  render(ctx: CanvasRenderingContext2D) {
    this.particles.forEach(particle => {
      ctx.save()
      ctx.globalAlpha = particle.alpha
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
  }

  createExplosion(x: number, y: number, color: string = '#FFD700') {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1,
        maxLife: 1,
        size: Math.random() * 3 + 1,
        color,
        alpha: 1
      })
    }
  }

  createTrail(x: number, y: number, color: string = '#00FFFF') {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 0.5,
      maxLife: 0.5,
      size: Math.random() * 2 + 1,
      color,
      alpha: 1
    })
  }

  createJumpEffect(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + 5,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * -3,
        life: 0.8,
        maxLife: 0.8,
        size: Math.random() * 3 + 1,
        color: '#FFFFFF',
        alpha: 1
      })
    }
  }
}

