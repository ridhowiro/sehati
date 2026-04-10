'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// --- 8-bit Sound Engine (Web Audio API) ---
function createAudioCtx() {
  if (typeof window === 'undefined') return null
  return new (window.AudioContext || (window as any).webkitAudioContext)()
}

function playTone(
  ctx: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType = 'square',
  volume = 0.15,
  startDelay = 0
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay)
  gain.gain.setValueAtTime(volume, ctx.currentTime + startDelay)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration)
  osc.start(ctx.currentTime + startDelay)
  osc.stop(ctx.currentTime + startDelay + duration)
}

function sfxHit(ctx: AudioContext) {
  // descending blip
  playTone(ctx, 880, 0.06, 'square', 0.2)
  playTone(ctx, 440, 0.08, 'square', 0.15, 0.06)
}

function sfxCombo(ctx: AudioContext) {
  // ascending arpeggio
  ;[523, 659, 784, 1047].forEach((f, i) => playTone(ctx, f, 0.1, 'square', 0.18, i * 0.07))
}

function sfxMiss(ctx: AudioContext) {
  playTone(ctx, 200, 0.12, 'sawtooth', 0.1)
}

function sfxStart(ctx: AudioContext) {
  ;[330, 392, 523, 659].forEach((f, i) => playTone(ctx, f, 0.12, 'square', 0.2, i * 0.08))
}

function sfxGameOver(ctx: AudioContext) {
  ;[523, 415, 330, 262].forEach((f, i) => playTone(ctx, f, 0.18, 'square', 0.2, i * 0.12))
}

const GRID_SIZE = 9
const GAME_DURATION = 30
const MOLE_INTERVAL = 800

const EMOJIS = ['🐹', '🐭', '🐱', '🐸', '🐰', '🐺', '🦊', '🐻', '🐼']

function getRandomEmoji() {
  return EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
}

export default function MaintenancePage() {
  const router = useRouter()
  const supabase = createClient()

  const handleRefresh = () => router.refresh()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [activeMole, setActiveMole] = useState<number | null>(null)
  const [moleEmoji, setMoleEmoji] = useState('🐹')
  const [hitCell, setHitCell] = useState<number | null>(null)
  const [highScore, setHighScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [showCombo, setShowCombo] = useState(false)
  const moleTimer = useRef<NodeJS.Timeout | null>(null)
  const gameTimer = useRef<NodeJS.Timeout | null>(null)
  const audioCtx = useRef<AudioContext | null>(null)

  const getAudio = () => {
    if (!audioCtx.current) audioCtx.current = createAudioCtx()
    return audioCtx.current
  }

  const spawnMole = useCallback(() => {
    const idx = Math.floor(Math.random() * GRID_SIZE)
    setActiveMole(idx)
    setMoleEmoji(getRandomEmoji())
  }, [])

  const startGame = () => {
    const ctx = getAudio()
    if (ctx) sfxStart(ctx)
    setScore(0)
    setCombo(0)
    setTimeLeft(GAME_DURATION)
    setActiveMole(null)
    setHitCell(null)
    setGameState('playing')
  }

  useEffect(() => {
    if (gameState !== 'playing') return

    moleTimer.current = setInterval(() => {
      spawnMole()
    }, MOLE_INTERVAL)

    gameTimer.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('ended')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (moleTimer.current) clearInterval(moleTimer.current)
      if (gameTimer.current) clearInterval(gameTimer.current)
    }
  }, [gameState, spawnMole])

  useEffect(() => {
    if (gameState === 'ended') {
      if (moleTimer.current) clearInterval(moleTimer.current)
      if (gameTimer.current) clearInterval(gameTimer.current)
      setActiveMole(null)
      setHighScore(prev => Math.max(prev, score))
      const ctx = getAudio()
      if (ctx) sfxGameOver(ctx)
    }
  }, [gameState, score])

  const handleWhack = (idx: number) => {
    if (gameState !== 'playing') return
    const ctx = getAudio()
    if (activeMole !== idx) {
      if (ctx) sfxMiss(ctx)
      return
    }
    setHitCell(idx)
    setActiveMole(null)
    const newCombo = combo + 1
    setCombo(newCombo)
    setScore(prev => prev + (newCombo >= 3 ? 2 : 1))
    setShowCombo(true)
    if (ctx) newCombo >= 3 ? sfxCombo(ctx) : sfxHit(ctx)
    setTimeout(() => {
      setHitCell(null)
      setShowCombo(false)
    }, 400)
  }

  const timerPct = (timeLeft / GAME_DURATION) * 100
  const timerColor = timeLeft > 10 ? 'bg-emerald-400' : 'bg-red-400'

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-indigo-100 dark:from-zinc-900 dark:to-zinc-950 flex flex-col items-center justify-center p-6 gap-8">

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-6xl animate-bounce">🔧</div>
        <h1 className="text-3xl font-extrabold text-zinc-800 dark:text-white tracking-tight">
          Lagi Maintenance nih~
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs">
          Tenang, tim kami lagi kerja keras. Sambil nunggu, main dulu yuk!
        </p>
      </div>

      {/* Game Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-6 w-full max-w-sm space-y-4">

        {/* Game Title */}
        <div className="text-center">
          <h2 className="font-bold text-lg text-zinc-800 dark:text-white">🐹 Pukul Marmotnya!</h2>
          <p className="text-xs text-zinc-400">Klik marmot sebelum kabur — combo ×2 setelah 3 beruntun!</p>
        </div>

        {/* Score & Timer */}
        {gameState !== 'idle' && (
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-xs text-zinc-400">Skor</p>
              <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{score}</p>
            </div>
            <div className="flex-1 mx-4 space-y-1">
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-1000 ${timerColor}`}
                  style={{ width: `${timerPct}%` }}
                />
              </div>
              <p className="text-center text-xs text-zinc-400">{timeLeft}s</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-400">Combo</p>
              <p className={`text-2xl font-extrabold ${combo >= 3 ? 'text-amber-500' : 'text-zinc-400'}`}>
                {combo >= 3 ? `×${combo}` : combo}
              </p>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: GRID_SIZE }).map((_, idx) => {
            const isActive = activeMole === idx
            const isHit = hitCell === idx
            return (
              <button
                key={idx}
                onClick={() => handleWhack(idx)}
                className={`
                  aspect-square rounded-2xl text-3xl flex items-center justify-center transition-all duration-150 select-none
                  ${isHit
                    ? 'bg-yellow-200 dark:bg-yellow-700 scale-90'
                    : isActive
                    ? 'bg-emerald-100 dark:bg-emerald-900 scale-110 shadow-md cursor-pointer hover:scale-105'
                    : 'bg-zinc-100 dark:bg-zinc-800 cursor-default'}
                `}
              >
                {isHit ? '💥' : isActive ? moleEmoji : '🌿'}
              </button>
            )
          })}
        </div>

        {/* Combo flash */}
        {showCombo && combo >= 3 && (
          <div className="text-center text-amber-500 font-bold text-sm animate-ping absolute">
            COMBO! +2
          </div>
        )}

        {/* CTA */}
        {gameState === 'idle' && (
          <button
            onClick={startGame}
            className="w-full py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-colors"
          >
            Mulai Main 🎮
          </button>
        )}

        {gameState === 'ended' && (
          <div className="space-y-3 text-center">
            <div>
              <p className="text-zinc-500 text-sm">Waktu habis!</p>
              <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{score} poin</p>
              {score === highScore && score > 0 && (
                <p className="text-amber-500 text-xs font-semibold">🏆 Rekor baru!</p>
              )}
              {highScore > 0 && score < highScore && (
                <p className="text-zinc-400 text-xs">Rekor tertinggi: {highScore}</p>
              )}
            </div>
            <button
              onClick={startGame}
              className="w-full py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-colors"
            >
              Main Lagi 🔄
            </button>
          </div>
        )}
      </div>

      {/* Footer note + actions */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          >
            🔄 Coba Lagi
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          >
            🚪 Logout
          </button>
        </div>
        <p className="text-xs text-zinc-400 text-center">
          Butuh bantuan? Hubungi administrator sistem.
        </p>
      </div>
    </div>
  )
}
