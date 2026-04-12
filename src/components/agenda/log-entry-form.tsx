'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle, BookMarked, AlertTriangle, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const tagOptions = [
  'Administrasi', 'Keuangan', 'Rapat', 'Perjalanan Dinas',
  'Pelaporan', 'Koordinasi', 'Lainnya',
]

const statusLogLabel: Record<string, string> = {
  submitted:        'Sudah disubmit',
  reviewed_pic:     'Sedang direview PIC',
  verified_kasek:   'Sedang diverifikasi Kasek',
  approved:         'Sudah disetujui',
}

interface Props {
  tanggal: string   // YYYY-MM-DD
  year: number
  month: number
  userId: string
  prefill?: { kegiatan?: string; tag_kategori?: string; dariAgenda?: boolean }
  onClose: () => void
  onSaved: (entry: { tanggal: string; kegiatan: string; output: string | null; status_kegiatan: string }) => void
}

export default function LogEntryForm({ tanggal, year, month, userId, prefill, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    kegiatan: prefill?.kegiatan ?? '',
    output: '',
    link_dokumen: '',
    tag_kategori: prefill?.tag_kategori ?? 'Administrasi',
    status_kegiatan: 'selesai' as 'selesai' | 'proses' | 'ditunda',
  })
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [blockReason, setBlockReason] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  // Cek validasi saat mount
  useEffect(() => {
    const check = async () => {
      // 1. Cek tanggal masa depan (WIB)
      const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
      if (tanggal > todayWib) {
        setBlockReason('Tidak dapat mengisi log untuk tanggal yang belum terjadi.')
        setChecking(false)
        return
      }

      // 2. Cek status log_bulanan
      const { data: logBulanan } = await supabase
        .from('log_bulanan')
        .select('status')
        .eq('user_id', userId)
        .eq('bulan', month)
        .eq('tahun', year)
        .maybeSingle()

      if (logBulanan && !['draft', 'revision'].includes(logBulanan.status)) {
        const label = statusLogLabel[logBulanan.status] ?? logBulanan.status
        setBlockReason(`Log bulan ini sudah berstatus "${label}". Minta reviewer untuk mengembalikan ke revisi sebelum menambah entri baru.`)
      }

      setChecking(false)
    }
    check()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.kegiatan.trim()) {
      setError('Kegiatan wajib diisi')
      return
    }
    setLoading(true)
    setError(null)

    // Cari atau buat log_bulanan
    let logBulananId: string

    const { data: existing } = await supabase
      .from('log_bulanan')
      .select('id, status')
      .eq('user_id', userId)
      .eq('bulan', month)
      .eq('tahun', year)
      .maybeSingle()

    if (existing) {
      // Double-check status (race condition guard)
      if (!['draft', 'revision'].includes(existing.status)) {
        setError('Log bulan ini tidak dapat diedit karena statusnya sudah ' + (statusLogLabel[existing.status] ?? existing.status))
        setLoading(false)
        return
      }
      logBulananId = existing.id
    } else {
      const { data: created, error: createErr } = await supabase
        .from('log_bulanan')
        .insert({ user_id: userId, bulan: month, tahun: year, status: 'draft' })
        .select('id')
        .single()

      if (createErr || !created) {
        setError('Gagal membuat log bulanan: ' + createErr?.message)
        setLoading(false)
        return
      }
      logBulananId = created.id
    }

    const { error: insertErr } = await supabase.from('log_entry').insert({
      log_bulanan_id: logBulananId,
      tanggal,
      kegiatan: form.kegiatan.trim(),
      output: form.output.trim() || null,
      link_dokumen: form.link_dokumen.trim() || null,
      tag_kategori: form.tag_kategori,
      status_kegiatan: form.status_kegiatan,
    })

    setLoading(false)
    if (insertErr) {
      setError('Gagal menyimpan: ' + insertErr.message)
      return
    }

    setSuccess(true)
    onSaved({ tanggal, kegiatan: form.kegiatan.trim(), output: form.output.trim() || null, status_kegiatan: form.status_kegiatan })
    router.refresh()
    setTimeout(() => onClose(), 1000)
  }

  const tanggalLabel = new Date(tanggal + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Tambah Log Harian</h3>
            <p className="text-xs text-zinc-400 mt-0.5">{tanggalLabel}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Checking state */}
        {checking ? (
          <div className="px-5 py-10 flex flex-col items-center gap-3">
            <Loader2 size={28} className="text-zinc-400 animate-spin" />
            <p className="text-xs text-zinc-400">Memeriksa status log...</p>
          </div>
        ) : blockReason ? (
          /* Blocked state */
          <div className="p-5 space-y-4">
            <div className="flex gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl p-4">
              <Lock size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Tidak dapat menambah log</p>
                <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{blockReason}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Tutup
            </button>
          </div>
        ) : success ? (
          <div className="px-5 py-10 flex flex-col items-center gap-3">
            <CheckCircle size={36} className="text-green-500" />
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Log berhasil disimpan!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Banner: dari agenda */}
            {prefill?.dariAgenda && (
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg px-3 py-2">
                <BookMarked size={13} className="text-blue-500 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Kegiatan diisi dari agenda. Lengkapi output dan link data dukung kamu.
                </p>
              </div>
            )}

            {/* Kegiatan */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Kegiatan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.kegiatan}
                onChange={e => setForm(f => ({ ...f, kegiatan: e.target.value }))}
                placeholder="Deskripsikan kegiatan yang dilakukan..."
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-600 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Output */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Output / Hasil</label>
              <input
                type="text"
                value={form.output}
                onChange={e => setForm(f => ({ ...f, output: e.target.value }))}
                placeholder="Dokumen, laporan, notulen, dll..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-600 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            {/* Link data dukung */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Link Data Dukung</label>
              <input
                type="url"
                value={form.link_dokumen}
                onChange={e => setForm(f => ({ ...f, link_dokumen: e.target.value }))}
                placeholder="https://drive.google.com/..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-600 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            {/* Tag & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Kategori</label>
                <select
                  value={form.tag_kategori}
                  onChange={e => setForm(f => ({ ...f, tag_kategori: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                >
                  {tagOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Status</label>
                <select
                  value={form.status_kegiatan}
                  onChange={e => setForm(f => ({ ...f, status_kegiatan: e.target.value as any }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                >
                  <option value="selesai">Selesai</option>
                  <option value="proses">Proses</option>
                  <option value="ditunda">Ditunda</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg px-3 py-2">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Simpan
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
