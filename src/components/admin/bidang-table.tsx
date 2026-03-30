'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'

interface Bidang {
  id: string
  nama: string
  parent_id: string | null
  pic_user_id: string | null
  parent?: { nama: string } | null
  pic?: { full_name: string } | null
}

interface User {
  id: string
  full_name: string
  email: string
  role: string
}

export default function BidangTable({ bidangList, users }: { bidangList: Bidang[], users: User[] }) {
  const [data, setData] = useState(bidangList)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [editForm, setEditForm] = useState({
    nama: '',
    parent_id: '',
    pic_user_id: '',
  })

  const [addForm, setAddForm] = useState({
    nama: '',
    parent_id: '',
    pic_user_id: '',
  })

  const supabase = createClient()
    const getParentName = (parent_id: string | null) => {
    if (!parent_id) return '-'
    return data.find(b => b.id === parent_id)?.nama || '-'
    }

    const getPicName = (pic_user_id: string | null) => {
    if (!pic_user_id) return '-'
    return users.find(u => u.id === pic_user_id)?.full_name || '-'
    }
  const showMessage = (msg: string, isError = false) => {
    if (isError) setError(msg)
    else setMessage(msg)
    setTimeout(() => { setMessage(''); setError('') }, 3000)
  }

  const startEdit = (bidang: Bidang) => {
    setEditingId(bidang.id)
    setEditForm({
      nama: bidang.nama,
      parent_id: bidang.parent_id || '',
      pic_user_id: bidang.pic_user_id || '',
    })
  }

  const saveEdit = async (id: string) => {
    setLoading(true)
    const { error } = await supabase
      .from('bidang')
      .update({
        nama: editForm.nama,
        parent_id: editForm.parent_id || null,
        pic_user_id: editForm.pic_user_id || null,
      })
      .eq('id', id)

    if (error) {
      showMessage('Gagal menyimpan.', true)
    } else {
      setData(data.map(b => b.id === id ? {
        ...b,
        nama: editForm.nama,
        parent_id: editForm.parent_id || null,
        pic_user_id: editForm.pic_user_id || null,
        parent: data.find(x => x.id === editForm.parent_id) || null,
        pic: users.find(u => u.id === editForm.pic_user_id) ? 
          { full_name: users.find(u => u.id === editForm.pic_user_id)!.full_name } : null,
      } : b))
      setEditingId(null)
      showMessage('Bidang berhasil diupdate!')
    }
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!addForm.nama.trim()) {
      showMessage('Nama bidang wajib diisi!', true)
      return
    }
    setLoading(true)
    const { data: newBidang, error } = await supabase
      .from('bidang')
      .insert({
        nama: addForm.nama,
        parent_id: addForm.parent_id || null,
        pic_user_id: addForm.pic_user_id || null,
      })
      .select(`*`)
      .single()

    if (error) {
      showMessage('Gagal menambahkan bidang.', true)
    } else {
      setData([...data, newBidang])
      setAddForm({ nama: '', parent_id: '', pic_user_id: '' })
      setShowAddForm(false)
      showMessage('Bidang berhasil ditambahkan!')
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus bidang ini?')) return
    setLoading(true)
    const { error } = await supabase.from('bidang').delete().eq('id', id)

    if (error) {
      showMessage('Gagal menghapus. Pastikan tidak ada user/agenda terkait.', true)
    } else {
      setData(data.filter(b => b.id !== id))
      showMessage('Bidang berhasil dihapus!')
    }
    setLoading(false)
  }

  const inputClass = "px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
  const selectClass = "px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"

  return (
    <div>
      {message && (
        <div className="mb-4 p-3 rounded-lg text-sm border bg-green-500/10 border-green-500/20 text-green-400">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm border bg-red-500/10 border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <p className="text-sm font-medium text-zinc-900 dark:text-white">{data.length} bidang</p>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={14} />
            Tambah Bidang
          </button>
        </div>

        {showAddForm && (
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
            <p className="text-xs font-medium text-zinc-500 mb-3">Tambah Bidang Baru</p>
            <div className="grid grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Nama bidang"
                value={addForm.nama}
                onChange={(e) => setAddForm({ ...addForm, nama: e.target.value })}
                className={inputClass}
              />
              <select
                value={addForm.parent_id}
                onChange={(e) => setAddForm({ ...addForm, parent_id: e.target.value })}
                className={selectClass}
              >
                <option value="">— Induk (opsional) —</option>
                {data.map(b => (
                  <option key={b.id} value={b.id}>{b.nama}</option>
                ))}
              </select>
              <select
                value={addForm.pic_user_id}
                onChange={(e) => setAddForm({ ...addForm, pic_user_id: e.target.value })}
                className={selectClass}
              >
                <option value="">— PIC (opsional) —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Check size={12} /> Simpan
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex items-center gap-1 px-3 py-1 bg-zinc-700 text-white rounded text-xs hover:bg-zinc-600 transition-colors"
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
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Nama Bidang</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Induk</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">PIC</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {data.map((bidang) => (
              <tr key={bidang.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 text-zinc-900 dark:text-white font-medium">
                  {editingId === bidang.id ? (
                    <input
                      type="text"
                      value={editForm.nama}
                      onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                      className={inputClass}
                    />
                  ) : (
                    <span className="flex items-center gap-2">
                      {bidang.parent_id && <span className="text-zinc-500">↳</span>}
                      {bidang.nama}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {editingId === bidang.id ? (
                    <select
                      value={editForm.parent_id}
                      onChange={(e) => setEditForm({ ...editForm, parent_id: e.target.value })}
                      className={selectClass}
                    >
                      <option value="">— Tidak ada —</option>
                      {data.filter(b => b.id !== bidang.id).map(b => (
                        <option key={b.id} value={b.id}>{b.nama}</option>
                      ))}
                    </select>
                  ) : (
                    getParentName(bidang.parent_id)
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {editingId === bidang.id ? (
                    <select
                      value={editForm.pic_user_id}
                      onChange={(e) => setEditForm({ ...editForm, pic_user_id: e.target.value })}
                      className={selectClass}
                    >
                      <option value="">— Tidak ada —</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                      ))}
                    </select>
                  ) : (
                    getPicName(bidang.pic_user_id)
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === bidang.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(bidang.id)}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        <Check size={12} /> Simpan
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1 px-3 py-1 bg-zinc-700 text-white rounded text-xs hover:bg-zinc-600 transition-colors"
                      >
                        <X size={12} /> Batal
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(bidang)}
                        className="flex items-center gap-1 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(bidang.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-500/10 text-red-400 rounded text-xs hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 size={12} /> Hapus
                      </button>
                    </div>
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