'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface ProfilFormProps {
  user: User
  profil: any
  userData: any
}

export default function ProfilForm({ user, profil, userData }: ProfilFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'profil' | 'password' | 'foto'>('profil')

  const [form, setForm] = useState({
    full_name: userData?.full_name || '',
    no_hp: profil?.no_hp || '',
    alamat: profil?.alamat || '',
    jabatan_formal: profil?.jabatan_formal || '',
    tanggal_lahir: profil?.tanggal_lahir || '',
  })

  const [passwords, setPasswords] = useState({
    password: '',
    confirmPassword: '',
  })

  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState(userData?.avatar_url || '')

  const handleProfilSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    const { error: userError } = await supabase
      .from('users')
      .update({ full_name: form.full_name })
      .eq('id', user.id)

    const { error: profilError } = await supabase
      .from('pegawai_profil')
      .upsert({
        user_id: user.id,
        no_hp: form.no_hp,
        alamat: form.alamat,
        jabatan_formal: form.jabatan_formal,
        tanggal_lahir: form.tanggal_lahir || null,
      }, { onConflict: 'user_id' })

    if (userError || profilError) {
      setError('Gagal menyimpan profil.')
    } else {
      setMessage('Profil berhasil disimpan!')
    }
    setLoading(false)
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (passwords.password !== passwords.confirmPassword) {
      setError('Password tidak sama!')
      return
    }
    if (passwords.password.length < 8) {
      setError('Password minimal 8 karakter')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({
      password: passwords.password,
    })

    if (error) {
      setError('Gagal ganti password.')
    } else {
      setMessage('Password berhasil diubah!')
      setPasswords({ password: '', confirmPassword: '' })
    }
    setLoading(false)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatar(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleAvatarSave = async () => {
    if (!avatar) return
    setLoading(true)
    setError('')
    setMessage('')

    const fileExt = avatar.name.split('.').pop()
    const filePath = `avatars/${user.id}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatar, { upsert: true })

    if (uploadError) {
      setError('Gagal upload foto.')
      setLoading(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

    await supabase
      .from('users')
      .update({ avatar_url: data.publicUrl })
      .eq('id', user.id)

    setMessage('Foto profil berhasil diupdate!')
    setLoading(false)
  }

  const tabs = [
    { id: 'profil', label: 'Info Profil' },
    { id: 'password', label: 'Ganti Password' },
    { id: 'foto', label: 'Foto Profil' },
  ] as const

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setMessage(''); setError('') }}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {message && (
          <div className="mb-4 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <p className="text-green-400 text-sm">{message}</p>
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {activeTab === 'profil' && (
          <form onSubmit={handleProfilSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Jabatan</label>
              <input
                type="text"
                value={form.jabatan_formal}
                onChange={(e) => setForm({ ...form, jabatan_formal: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tanggal Lahir</label>
              <input
                type="date"
                value={form.tanggal_lahir}
                onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">No. HP</label>
              <input
                type="text"
                value={form.no_hp}
                onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Alamat</label>
              <textarea
                value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </form>
        )}

        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password Baru</label>
              <input
                type="password"
                value={passwords.password}
                onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Minimal 8 karakter"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Konfirmasi Password</label>
              <input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ulangi password baru"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Menyimpan...' : 'Ganti Password'}
            </button>
          </form>
        )}

        {activeTab === 'foto' && (
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-zinc-400">
                    {user.email?.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Pilih Foto
                </label>
                <p className="text-xs text-zinc-500 mt-2">JPG, PNG maksimal 2MB</p>
              </div>
            </div>
            {avatar && (
              <button
                onClick={handleAvatarSave}
                disabled={loading}
                className="bg-blue-600 text-white py-2 px-6 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Mengupload...' : 'Simpan Foto'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}