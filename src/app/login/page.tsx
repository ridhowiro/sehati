'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Hmm, email atau password-nya kayaknya kurang tepat nih 🤔')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  const greetings = () => {
    const hour = new Date().getHours()
    if (hour < 11) return { text: 'Selamat pagi', emoji: '☀️' }
    if (hour < 15) return { text: 'Selamat siang', emoji: '🌤️' }
    if (hour < 18) return { text: 'Selamat sore', emoji: '🌅' }
    return { text: 'Selamat malam', emoji: '🌙' }
  }

  const { text, emoji } = greetings()

  return (
    <div className="min-h-screen bg-zinc-950 flex">

      {/* Sisi kiri — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-zinc-900 border-r border-zinc-800 relative overflow-hidden">

        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/5 rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600/5 rounded-full" />

        <div className="relative">
          <div className="flex items-center gap-4 mb-3">
            <img src="/logo/logo-kemdikbud.png" alt="Kemdiktisaintek" className="h-10 w-auto object-contain" />
            <img src="/logo/logo-diktisaintek.png" alt="Diktisaintek" className="h-10 w-auto object-contain" />
            <img src="/logo/logo-ditdaya.png" alt="Ditdaya" className="h-10 w-auto object-contain" />
            <img src="/logo/logo-heti.png" alt="HETI" className="h-10 w-auto object-contain" />
          </div>
          <p className="text-zinc-500 text-sm mt-1">Sekretariat PMU HETI · Kemdiktisaintek</p>
        </div>

        <div className="relative space-y-6">
          <div>
            <p className="text-4xl mb-3">👋</p>
            <h2 className="text-2xl font-semibold text-white mb-1 leading-snug">
              Hai, selamat datang<br />di SEHATI!
            </h2>
            <p className="text-zinc-500 text-xs mb-3">
              <span className="text-blue-400 font-medium">Sistem E-Office HETI Terintegrasi</span>
              <span className="mx-1.5">·</span>
              Karena kerja bareng itu harusnya, ya, sehati 🤝
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Tempat yang (semoga) bikin laporan bulanan kamu jadi lebih gampang, rapi, dan tidak drama. 😄
            </p>
          </div>
        </div>

        <div className="relative">
          <p className="text-zinc-600 text-xs">© 2026 PMU HETI · Kemdiktisaintek</p>
        </div>
      </div>

      {/* Sisi kanan — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">SEHATI</p>
              <p className="text-zinc-500 text-xs">Sekretariat PMU HETI</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-2xl mb-1">{emoji}</p>
            <h1 className="text-2xl font-semibold text-white mb-1">{text}!</h1>
            <p className="text-zinc-400 text-sm">
              Yuk masuk dulu, log bulananmu nunggu nih 😄
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="nama@email.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-zinc-300">
                  Password
                </label>
                <Link
                  href="/reset-password"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-24"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors text-xs"
                >
                  {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
            >
              {loading ? 'Lagi diproses nih... ⏳' : 'Masuk →'}
            </button>
          </form>

          <p className="text-zinc-600 text-xs text-center mt-8">
            Butuh bantuan? Hubungi admin SEHATI 😊
          </p>
        </div>
      </div>
    </div>
  )
}