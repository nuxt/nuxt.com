const CONFETTI_COLORS = ['#00DC82', '#36E4DA', '#0047E1', '#FBBF24', '#F472B6', '#A78BFA', '#FB7185']

type Shape = 'square' | 'circle' | 'ribbon'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  shape: Shape
  tilt: number
  tiltSpeed: number
  wobble: number
  wobbleSpeed: number
  life: number
  maxLife: number
}

// Tuned in "frames at 60fps" and scaled by the real frame delta
const GRAVITY = 0.32
const DRAG = 0.965

let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let particles: Particle[] = []
let frame = 0
let lastTime = 0

function ensureCanvas() {
  if (canvas) return
  canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:100'
  document.body.appendChild(canvas)
  ctx = canvas.getContext('2d')
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
}

function resizeCanvas() {
  if (!canvas || !ctx) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function teardown() {
  window.removeEventListener('resize', resizeCanvas)
  canvas?.remove()
  canvas = null
  ctx = null
  frame = 0
}

function draw(p: Particle) {
  if (!ctx) return
  const progress = p.life / p.maxLife
  ctx.globalAlpha = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3
  ctx.fillStyle = p.color

  // Flip the piece around its tilt axis so it reads as paper fluttering in 3D
  const flip = Math.cos(p.wobble)
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.tilt)
  ctx.scale(1, Math.abs(flip) < 0.08 ? 0.08 : flip)

  if (p.shape === 'circle') {
    ctx.beginPath()
    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
    ctx.fill()
  } else if (p.shape === 'ribbon') {
    ctx.fillRect(-p.size * 0.9, -p.size * 0.18, p.size * 1.8, p.size * 0.36)
  } else {
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7)
  }
  ctx.restore()
}

function tick(time: number) {
  if (!ctx || !canvas) return
  const dt = lastTime ? Math.min((time - lastTime) / (1000 / 60), 3) : 1
  lastTime = time

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

  particles = particles.filter((p) => {
    const drag = DRAG ** dt
    p.vx *= drag
    p.vy = p.vy * drag + GRAVITY * dt
    p.x += p.vx * dt + Math.sin(p.wobble) * 0.6 * dt
    p.y += p.vy * dt
    p.tilt += p.tiltSpeed * dt
    p.wobble += p.wobbleSpeed * dt
    p.life += dt

    if (p.life >= p.maxLife || p.y > window.innerHeight + 40) return false
    draw(p)
    return true
  })
  ctx.globalAlpha = 1

  if (particles.length) {
    frame = requestAnimationFrame(tick)
  } else {
    teardown()
  }
}

export function burstConfetti(origin: { x: number, y: number }, count = 130) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

  // Aim toward the middle of the viewport with an upward lift, so bursts from
  // elements near an edge (e.g. the header) still land on screen
  const toCenterX = window.innerWidth / 2 - origin.x
  const toCenterY = window.innerHeight / 2 - origin.y
  const distance = Math.hypot(toCenterX, toCenterY) || 1
  const aim = Math.atan2(toCenterY / distance - 1.1, toCenterX / distance)
  const spread = Math.PI * 0.42

  for (let i = 0; i < count; i++) {
    const angle = aim + (Math.random() - 0.5) * 2 * spread
    const speed = 6 + Math.random() * 13
    const roll = Math.random()
    particles.push({
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 7 + Math.random() * 6,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!,
      shape: roll < 0.5 ? 'square' : roll < 0.8 ? 'ribbon' : 'circle',
      tilt: Math.random() * Math.PI * 2,
      tiltSpeed: (Math.random() - 0.5) * 0.3,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.08 + Math.random() * 0.14,
      life: 0,
      maxLife: 110 + Math.random() * 70
    })
  }

  ensureCanvas()
  if (!frame) {
    lastTime = 0
    frame = requestAnimationFrame(tick)
  }
}
