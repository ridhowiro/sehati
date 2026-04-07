'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserCircle } from 'lucide-react'

export default function CompleteProfileModal() {
  const supabase = createClient()
  const [visible, setVisible] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    tanggal_lahir: '',
    no_hp: '',
    alamat: '',
  })

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const { data: profil } = await supabase
        .from('pegawai_profil')
        .select('tanggal_lahir, no_hp, alamat')
        .eq('user_id', user.id)
        .single()

      const missing =
        !profil?.tanggal_lahir ||
        !profil?.no_hp ||
        !profil?.alamat

      if (missing) {
        setForm({
          tanggal_lahir: profil?.tanggal_lahir || '',
          no_hp: profil?.no_hp || '',
          alamat: profil?.alamat || '',
        })
        setVisible(true)
      }
    }

    check()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.tanggal_lahir || !form.no_hp || !form.alamat) {
      setError('Semua field wajib diisi.')
      return
    }

    setLoading(true)
    setError('')

    const { error: profilError } = await supabase
      .from('pegawai_profil')
      .upsert({
        user_id: userId,
        tanggal_lahir: form.tanggal_lahir,
        no_hp: form.no_hp,
        alamat: form.alamat,
      })

    if (profilError) {
      setError('Gagal menyimpan profil. Coba lagi.')
    } else {
      setMessage('Profil berhasil dilengkapi!')
      setTimeout(() => setVisible(false), 1000)
    }
    setLoading(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">

        <div className="px-6 pt-6 pb-2 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
            <UserCircle className="text-blue-500" size={32} />
          </div>
          <h2 className="text-zinc-900 dark:text-white font-semibold text-xl mb-1">
            Lengkapi Profil Kamu
          </h2>
          <p className="text-zinc-500 text-sm mb-4">
            Sebelum menggunakan SEHATI, mohon lengkapi data profil berikut.
          </p>
        </div>

        <form onSubmit={handleSave} className="px-6 pb-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}
          {message && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-green-500 text-sm">{message}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Tanggal Lahir <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={form.tanggal_lahir}
              onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              No. HP <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="Contoh: 08123456789"
              value={form.no_hp}
              onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Alamat <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              placeholder="Masukkan alamat lengkap"
              value={form.alamat}
              onChange={(e) => setForm({ ...form, alamat: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? 'Menyimpan...' : 'Simpan & Lanjutkan'}
          </button>
        </form>
      </div>
    </div>
  )
}
