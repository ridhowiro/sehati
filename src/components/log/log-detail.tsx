'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, X, Check, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

const bulanNames = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const tagOptions = [
  'Administrasi', 'Keuangan', 'Rapat', 'Perjalanan Dinas',
  'Pelaporan', 'Koordinasi', 'Lainnya'
]

interface LogEntry {
  id: string
  log_bulanan_id: string
  tanggal: string
  kegiatan: string
  output: string | null
  link_dokumen: string | null
  tag_kategori: string | null
  status_kegiatan: string
}

interface LogBulanan {
  id: string
  bulan: number
  tahun: number
  status: string
  user_id: string
}

const emptyForm = {
  tanggal: '',
  kegiatan: '',
  output: '',
  link_dokumen: '',
  tag_kategori: 'Administrasi',
  status_kegiatan: 'selesai' as const,
}

export default function LogDetail({
  log,
  entries,
  userId,
}: {
  log: LogBulanan
  entries: LogEntry[]
  userId: string
}) {
  const [data, setData] = useState(entries)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const router = useRouter()
  const supabase = createClient()
const minDate = `${log.tahun}-${String(log.bulan).padStart(2, '0')}-01`

const lastDay = new Date(log.tahun, log.bulan, 0).getDate()
const lastDayOfMonth = `${log.tahun}-${String(log.bulan).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
const maxDate = lastDayOfMonth < todayWib ? lastDayOfMonth : todayWib


  const isDraft = log.status === 'draft' || log.status === 'revision'

  const showMsg = (msg: string, isError = false) => {
    if (isError) setError(msg)
    else setMessage(msg)
    setTimeout(() => { setMessage(''); setError('') }, 3000)
  }

  const handleAdd = async () => {
    if (!addForm.tanggal || !addForm.kegiatan) {
      showMsg('Tanggal dan kegiatan wajib diisi!', true)
      return
    }
    if (addForm.tanggal > todayWib) {
      showMsg('Tidak dapat mengisi log untuk tanggal yang belum terjadi.', true)
      return
    }
    setLoading(true)

    const { data: newEntry, error } = await supabase
      .from('log_entry')
      .insert({
        log_bulanan_id: log.id,
        tanggal: addForm.tanggal,
        kegiatan: addForm.kegiatan,
        output: addForm.output || null,
        link_dokumen: addForm.link_dokumen || null,
        tag_kategori: addForm.tag_kategori || null,
        status_kegiatan: addForm.status_kegiatan,
      })
      .select()
      .single()

    if (error) {
      showMsg('Gagal menambahkan kegiatan.', true)
    } else {
      setData([...data, newEntry].sort((a, b) =>
        new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
      ))
      setAddForm(emptyForm)
      setShowAddForm(false)
      showMsg('Kegiatan berhasil ditambahkan!')
    }
    setLoading(false)
  }

  const startEdit = (entry: LogEntry) => {
    setEditingId(entry.id)
    setEditForm({
      tanggal: entry.tanggal,
      kegiatan: entry.kegiatan,
      output: entry.output || '',
      link_dokumen: entry.link_dokumen || '',
      tag_kategori: entry.tag_kategori || 'Administrasi',
      status_kegiatan: entry.status_kegiatan as any,
    })
  }

  const saveEdit = async (id: string) => {
    if (editForm.tanggal > todayWib) {
      showMsg('Tidak dapat mengisi log untuk tanggal yang belum terjadi.', true)
      return
    }
    setLoading(true)
    const { error } = await supabase
      .from('log_entry')
      .update({
        tanggal: editForm.tanggal,
        kegiatan: editForm.kegiatan,
        output: editForm.output || null,
        link_dokumen: editForm.link_dokumen || null,
        tag_kategori: editForm.tag_kategori || null,
        status_kegiatan: editForm.status_kegiatan,
      })
      .eq('id', id)

    if (error) {
      showMsg('Gagal menyimpan.', true)
    } else {
      setData(data.map(e => e.id === id ? { ...e, ...editForm } : e))
      setEditingId(null)
      showMsg('Kegiatan berhasil diupdate!')
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus kegiatan ini?')) return
    setLoading(true)
    const { error } = await supabase.from('log_entry').delete().eq('id', id)

    if (error) {
      showMsg('Gagal menghapus.', true)
    } else {
      setData(data.filter(e => e.id !== id))
      showMsg('Kegiatan berhasil dihapus!')
    }
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (data.length === 0) {
      showMsg('Tambahkan minimal satu kegiatan sebelum submit!', true)
      return
    }
    if (!confirm(`Submit log ${bulanNames[log.bulan]} ${log.tahun} ke PIC untuk direview?`)) return

    setLoading(true)
    const { error } = await supabase
      .from('log_bulanan')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', log.id)

    if (error) {
      showMsg('Gagal submit log.', true)
    } else {
      showMsg('Log berhasil disubmit ke PIC!')
      setTimeout(() => router.push('/log'), 1500)
    }
    setLoading(false)
  }

  const inputClass = "w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
  const statusColors = {
    selesai: 'bg-green-500/10 text-green-400 border-green-500/20',
    proses: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    ditunda: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="p-3 rounded-lg text-sm border bg-green-500/10 border-green-500/20 text-green-400">
          {message}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg text-sm border bg-red-500/10 border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <p className="text-sm font-medium text-zinc-900 dark:text-white">
            {data.length} kegiatan
          </p>
          <div className="flex gap-2">
            {isDraft && (
              <>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus size={14} />
                  Tambah Kegiatan
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <Send size={14} />
                  Submit ke PIC
                </button>
              </>
            )}
          </div>
        </div>

        {showAddForm && (
          <div className="px-4 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
            <p className="text-xs font-medium text-zinc-500 mb-3">Tambah Kegiatan Baru</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Tanggal *</label>
                <input
                  type="date"
                  value={addForm.tanggal}
                  onChange={(e) => setAddForm({ ...addForm, tanggal: e.target.value })}
                    min={minDate}
                    max={maxDate}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Tag Kategori</label>
                <select
                  value={addForm.tag_kategori}
                  onChange={(e) => setAddForm({ ...addForm, tag_kategori: e.target.value })}
                  className={inputClass}
                >
                  {tagOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-zinc-500 mb-1">Kegiatan *</label>
                <textarea
                  value={addForm.kegiatan}
                  onChange={(e) => setAddForm({ ...addForm, kegiatan: e.target.value })}
                  rows={2}
                  className={inputClass}
                  placeholder="Deskripsi kegiatan..."
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Output</label>
                <input
                  type="text"
                  value={addForm.output}
                  onChange={(e) => setAddForm({ ...addForm, output: e.target.value })}
                  className={inputClass}
                  placeholder="Hasil/output kegiatan"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Link Dokumen</label>
                <input
                  type="text"
                  value={addForm.link_dokumen}
                  onChange={(e) => setAddForm({ ...addForm, link_dokumen: e.target.value })}
                  className={inputClass}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Status</label>
                <select
                  value={addForm.status_kegiatan}
                  onChange={(e) => setAddForm({ ...addForm, status_kegiatan: e.target.value as any })}
                  className={inputClass}
                >
                  <option value="selesai">Selesai</option>
                  <option value="proses">Dalam Proses</option>
                  <option value="ditunda">Ditunda</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleAdd}
                  disabled={loading}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Check size={12} /> Simpan
                </button>
                <button
                  onClick={() => { setShowAddForm(false); setAddForm(emptyForm) }}
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
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 w-28">Tanggal</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Kegiatan</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Output</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 w-28">Kategori</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 w-24">Status</th>
              {isDraft && <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 w-24">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  Belum ada kegiatan — klik "Tambah Kegiatan" untuk mulai
                </td>
              </tr>
            ) : data.map((entry) => (
              <tr key={entry.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 text-zinc-900 dark:text-white">
                  {editingId === entry.id ? (
                    <input type="date" value={editForm.tanggal}
                      min={minDate} max={maxDate}
                      onChange={(e) => setEditForm({ ...editForm, tanggal: e.target.value })}
                      className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white w-full" />
                  ) : (
                    new Date(entry.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-900 dark:text-white">
                  {editingId === entry.id ? (
                    <textarea value={editForm.kegiatan}
                      onChange={(e) => setEditForm({ ...editForm, kegiatan: e.target.value })}
                      rows={2} className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white w-full" />
                  ) : (
                    <span className="line-clamp-2">{entry.kegiatan}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {editingId === entry.id ? (
                    <input type="text" value={editForm.output}
                      onChange={(e) => setEditForm({ ...editForm, output: e.target.value })}
                      className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white w-full" />
                  ) : (
                    entry.output || '-'
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {editingId === entry.id ? (
                    <select value={editForm.tag_kategori}
                      onChange={(e) => setEditForm({ ...editForm, tag_kategori: e.target.value })}
                      className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white">
                      {tagOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  ) : (
                    <span className="text-xs">{entry.tag_kategori || '-'}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === entry.id ? (
                    <select value={editForm.status_kegiatan}
                      onChange={(e) => setEditForm({ ...editForm, status_kegiatan: e.target.value as any })}
                      className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white">
                      <option value="selesai">Selesai</option>
                      <option value="proses">Proses</option>
                      <option value="ditunda">Ditunda</option>
                    </select>
                  ) : (
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${statusColors[entry.status_kegiatan as keyof typeof statusColors]}`}>
                      {entry.status_kegiatan === 'selesai' ? 'Selesai' : entry.status_kegiatan === 'proses' ? 'Proses' : 'Ditunda'}
                    </span>
                  )}
                </td>
                {isDraft && (
                  <td className="px-4 py-3">
                    {editingId === entry.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => saveEdit(entry.id)} disabled={loading}
                          className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                          <Check size={12} />
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="p-1.5 bg-zinc-700 text-white rounded hover:bg-zinc-600">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(entry)}
                          className="p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded hover:bg-zinc-200 dark:hover:bg-zinc-700">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => handleDelete(entry.id)}
                          className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}