'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

interface BirthdayPerson {
  user_id: string
  full_name: string
  avatar_url: string | null
  tanggal_lahir: string
}

// ── 8-bit Audio ───────────────────────────────────────────────────────────────

function createAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  return new (window.AudioContext || (window as any).webkitAudioContext)()
}

function playExplosion(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.type = 'square'
  const now = ctx.currentTime
  osc.frequency.setValueAtTime(520 + Math.random() * 200, now)
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.18)

  gain.gain.setValueAtTime(0.18, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

  osc.start(now)
  osc.stop(now + 0.2)
}

// Happy Birthday intro — 2 baris pertama (8-bit square wave)
// G4 G4 A4 G4 C5 B4 | G4 G4 A4 G4 D5 C5
const HBD_NOTES: [number, number][] = [
  [392, 0.18], [0, 0.04],
  [392, 0.18], [0, 0.04],
  [440, 0.36], [0, 0.04],
  [392, 0.36], [0, 0.04],
  [523, 0.36], [0, 0.04],
  [494, 0.56], [0, 0.18],

  [392, 0.18], [0, 0.04],
  [392, 0.18], [0, 0.04],
  [440, 0.36], [0, 0.04],
  [392, 0.36], [0, 0.04],
  [587, 0.36], [0, 0.04],
  [523, 0.56], [0, 0.0],
]

function playHappyBirthday(ctx: AudioContext) {
  let t = ctx.currentTime + 0.1
  for (const [freq, dur] of HBD_NOTES) {
    if (freq === 0) { t += dur; continue }
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'square'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.12, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.start(t)
    osc.stop(t + dur)
    t += dur
  }
}

// ── Fireworks canvas ──────────────────────────────────────────────────────────

interface Particle {
  x: number; y: number
  vx: number; vy: number
  alpha: number; color: string
  radius: number; decay: number; gravity: number
}

interface Rocket {
  x: number; y: number
  vy: number; color: string
  trail: { x: number; y: number; alpha: number }[]
}

const COLORS = [
  '#ff6b9d', '#ff9f43', '#ffd32a', '#0be881',
  '#48dbfb', '#ff4d4f', '#a29bfe', '#fd79a8',
]
const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)]

function explode(
  x: number,
  y: number,
  particles: Particle[],
  onExplode?: () => void,
) {
  const count = 60 + Math.floor(Math.random() * 40)
  const color = randomColor()
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4
    const speed = 2 + Math.random() * 4
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1, color,
      radius: 2 + Math.random() * 2,
      decay: 0.012 + Math.random() * 0.008,
      gravity: 0.06,
    })
  }
  onExplode?.()
}

function FireworksCanvas({
  active,
  onExplode,
}: {
  active: boolean
  onExplode: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{
    rockets: Rocket[]
    particles: Particle[]
    raf: number
    lastLaunch: number
  }>({ rockets: [], particles: [], raf: 0, lastLaunch: 0 })

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const s = stateRef.current

    const loop = (now: number) => {
      s.raf = requestAnimationFrame(loop)

      // Semi-transparent clear — biar ada trail tapi tetap jernih
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      if (now - s.lastLaunch > 650) {
        s.lastLaunch = now
        s.rockets.push({
          x: canvas.width * (0.1 + Math.random() * 0.8),
          y: canvas.height,
          vy: -(11 + Math.random() * 6),
          color: randomColor(),
          trail: [],
        })
      }

      s.rockets = s.rockets.filter((r) => {
        r.trail.push({ x: r.x, y: r.y, alpha: 1 })
        if (r.trail.length > 12) r.trail.shift()
        r.y += r.vy
        r.vy += 0.15

        r.trail.forEach((t, i) => {
          t.alpha -= 0.07
          ctx.beginPath()
          ctx.arc(t.x, t.y, 2.5, 0, Math.PI * 2)
          ctx.fillStyle = r.color
          ctx.globalAlpha = Math.max(0, t.alpha) * ((i + 1) / r.trail.length)
          ctx.fill()
          ctx.globalAlpha = 1
        })

        if (r.vy >= -1) {
          explode(r.x, r.y, s.particles, onExplode)
          return false
        }
        return true
      })

      s.particles = s.particles.filter((p) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += p.gravity
        p.vx *= 0.98
        p.alpha -= p.decay
        if (p.alpha <= 0) return false
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fill()
        ctx.globalAlpha = 1
        return true
      })
    }

    s.raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(s.raf)
      window.removeEventListener('resize', resize)
    }
  }, [active])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 52 }}  // di atas overlay & modal — pointer-events-none jadi tetap bisa klik
    />
  )
}

// ── Birthday Popup ────────────────────────────────────────────────────────────

export default function BirthdayPopup({
  birthdays,
  isMyBirthday,
}: {
  birthdays: BirthdayPerson[]
  isMyBirthday: boolean
}) {
  const [visible, setVisible] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA')
    const key = `birthday_popup_shown_${today}`
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1')
      setVisible(true)
    }
  }, [])

  // Mulai audio — inisialisasi AudioContext, tapi tunggu interaksi user
  useEffect(() => {
    if (!visible) return
    const ctx = createAudioCtx()
    if (!ctx) return
    audioCtxRef.current = ctx

    // Browser memblokir audio sebelum interaksi — resume dulu lalu play
    const tryPlay = () => {
      ctx.resume().then(() => playHappyBirthday(ctx))
    }

    if (ctx.state === 'running') {
      playHappyBirthday(ctx)
    } else {
      // Tunggu interaksi apapun (klik/sentuh) untuk unlock audio
      window.addEventListener('pointerdown', tryPlay, { once: true })
      window.addEventListener('keydown', tryPlay, { once: true })
    }

    return () => {
      window.removeEventListener('pointerdown', tryPlay)
      window.removeEventListener('keydown', tryPlay)
    }
  }, [visible])

  const handleExplodeSound = () => {
    const ctx = audioCtxRef.current
    if (ctx && ctx.state === 'running') playExplosion(ctx)
  }

  const close = () => {
    setVisible(false)
    audioCtxRef.current?.close()
  }

  if (!visible) return null

  return (
    <>
      {/* 1. Overlay gelap — paling bawah, klik untuk tutup */}
      <div
        className="fixed inset-0 bg-black/65"
        style={{ zIndex: 50 }}
        onClick={close}
      />

      {/* 2. Canvas kembang api — tengah, pointer-events-none */}
      <FireworksCanvas active={visible} onExplode={handleExplodeSound} />

      {/* 3. Modal card — paling atas, pisah dari overlay agar z-index global */}
      <div
        className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
        style={{ zIndex: 53 }}
      >
        <div
          className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={close}
            className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="text-6xl mb-4 select-none">🎂</div>

          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">
            {isMyBirthday ? 'Selamat Ulang Tahun!' : 'Ada yang Ulang Tahun Nih! 🎉'}
          </h2>

          <p className="text-sm font-medium mb-3 text-pink-500">
            {isMyBirthday
              ? 'Semoga panjang umur, sehat, dan sukses selalu!'
              : 'Jangan lupa ucapkan selamat ya!'}
          </p>

          <div className="mt-4 space-y-2">
            {birthdays.map((b) => (
              <div
                key={b.user_id}
                className="flex items-center gap-3 bg-pink-500/10 border border-pink-500/20 rounded-xl px-4 py-3"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-pink-400/50">
                  {b.avatar_url ? (
                    <img src={b.avatar_url} alt={b.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                      {b.full_name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="font-semibold text-zinc-900 dark:text-white text-sm flex-1 text-left">{b.full_name}</span>
                <span className="text-lg">🎉</span>
              </div>
            ))}
          </div>

          <button
            onClick={close}
            className="mt-6 w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Terima Kasih 🎊
          </button>
        </div>
      </div>
    </>
  )
}
