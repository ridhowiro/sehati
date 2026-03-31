'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createUser } from '@/app/actions/user'
import { Pencil, Trash2, X, Check, Plus } from 'lucide-react'

type UserRole = 'admin' | 'kasubdit' | 'kepala_sekretariat' | 'pic' | 'karyawan'

interface User {
  id: string
  full_name: string
  email: string
  role: UserRole
  is_active: boolean
  bidang_id: string | null
  bidang?: { nama: string } | null
}

interface Bidang {
  id: string
  nama: string
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrator',
  kasubdit: 'Kasubdit',
  kepala_sekretariat: 'Kepala Sekretariat',
  pic: 'PIC / Koordinator',
  karyawan: 'Karyawan',
}

const roleBadgeColors: Record<UserRole, string> = {
  admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  kasubdit: 'bg-red-500/10 text-red-400 border-red-500/20',
  kepala_sekretariat: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  pic: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  karyawan: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

export default function UsersTable({ users, bidangList }: { users: User[], bidangList: Bidang[] }) {
  const [data, setData] = useState(users)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ role: UserRole, bidang_id: string, is_active: boolean }>({
    role: 'karyawan',
    bidang_id: '',
    is_active: true,
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showInviteForm, setShowInviteForm] = useState(false)
const [inviteForm, setInviteForm] = useState({
  email: '',
  password: '',
  full_name: '',
  role: 'karyawan',
  bidang_id: '',
})
const [inviteLoading, setInviteLoading] = useState(false)
  const supabase = createClient()

const handleInvite = async () => {
  if (!inviteForm.email || !inviteForm.password || !inviteForm.full_name) {
    setMessage('Email, password, dan nama wajib diisi!')
    return
  }
  setInviteLoading(true)

  const result = await createUser(inviteForm)

  if (result.error) {
    setMessage('Gagal: ' + result.error)
    setInviteLoading(false)
  } else {
    setMessage('User berhasil ditambahkan!')
    setInviteForm({ email: '', password: '', full_name: '', role: 'karyawan', bidang_id: '' })
    setShowInviteForm(false)
    setInviteLoading(false)
    window.location.reload()
  }
}


  const startEdit = (user: User) => {
    setEditingId(user.id)
    setEditForm({
      role: user.role,
      bidang_id: user.bidang_id || '',
      is_active: user.is_active,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setMessage('')
  }

  const saveEdit = async (userId: string) => {
    setLoading(true)
    setMessage('')

    const { error } = await supabase
      .from('users')
      .update({
        role: editForm.role,
        bidang_id: editForm.bidang_id || null,
        is_active: editForm.is_active,
      })
      .eq('id', userId)

    if (error) {
      setMessage('Gagal menyimpan perubahan.')
    } else {
      setData(data.map(u => u.id === userId ? {
        ...u,
        role: editForm.role,
        bidang_id: editForm.bidang_id || null,
        is_active: editForm.is_active,
        bidang: bidangList.find(b => b.id === editForm.bidang_id) ? 
          { nama: bidangList.find(b => b.id === editForm.bidang_id)!.nama } : null,
      } : u))
      setEditingId(null)
      setMessage('Berhasil disimpan!')
      setTimeout(() => setMessage(''), 3000)
    }
    setLoading(false)
  }

  return (
    <div>
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm border ${
          message.includes('Gagal')
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : 'bg-green-500/10 border-green-500/20 text-green-400'
        }`}>
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
  <p className="text-sm font-medium text-zinc-900 dark:text-white">{data.length} user</p>
  <button
    onClick={() => setShowInviteForm(!showInviteForm)}
    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
  >
    <Plus size={14} />
    Tambah User
  </button>
</div>

{showInviteForm && (
  <div className="px-4 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
    <p className="text-xs font-medium text-zinc-500 mb-3">Tambah User Baru</p>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Nama Lengkap *</label>
        <input
          type="text"
          value={inviteForm.full_name}
          onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nama lengkap"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Email *</label>
        <input
          type="email"
          value={inviteForm.email}
          onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="email@domain.com"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Password *</label>
        <input
          type="password"
          value={inviteForm.password}
          onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Minimal 6 karakter"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Role</label>
        <select
          value={inviteForm.role}
          onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.entries(roleLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Bidang</label>
        <select
          value={inviteForm.bidang_id}
          onChange={(e) => setInviteForm({ ...inviteForm, bidang_id: e.target.value })}
          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— Pilih Bidang —</option>
          {bidangList.map((b) => (
            <option key={b.id} value={b.id}>{b.nama}</option>
          ))}
        </select>
      </div>
      <div className="flex items-end gap-2">
        <button
          onClick={handleInvite}
          disabled={inviteLoading}
          className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Check size={12} /> {inviteLoading ? 'Menyimpan...' : 'Simpan'}
        </button>
        <button
          onClick={() => { setShowInviteForm(false); setInviteForm({ email: '', password: '', full_name: '', role: 'karyawan', bidang_id: '' }) }}
          className="flex items-center gap-1 px-4 py-2 bg-zinc-700 text-white rounded-lg text-xs font-medium hover:bg-zinc-600 transition-colors"
        >
          <X size={12} /> Batal
        </button>
      </div>
    </div>
  </div>
)}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Nama</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Email</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Role</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Bidang</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Status</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {data.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 text-zinc-900 dark:text-white font-medium">
                  {user.full_name || '-'}
                </td>
                <td className="px-4 py-3 text-zinc-500">{user.email}</td>
                <td className="px-4 py-3">
                  {editingId === user.id ? (
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                      className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${roleBadgeColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {editingId === user.id ? (
                    <select
                      value={editForm.bidang_id}
                      onChange={(e) => setEditForm({ ...editForm, bidang_id: e.target.value })}
                      className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">— Pilih Bidang —</option>
                      {bidangList.map((b) => (
                        <option key={b.id} value={b.id}>{b.nama}</option>
                      ))}
                    </select>
                  ) : (
                    user.bidang?.nama || '-'
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === user.id ? (
                    <select
                      value={editForm.is_active ? 'true' : 'false'}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === 'true' })}
                      className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="true">Aktif</option>
                      <option value="false">Nonaktif</option>
                    </select>
                  ) : (
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${
                      user.is_active
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {user.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === user.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(user.id)}
                        disabled={loading}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {loading ? 'Simpan...' : 'Simpan'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-zinc-700 text-white rounded text-xs hover:bg-zinc-600 transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(user)}
                      className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}