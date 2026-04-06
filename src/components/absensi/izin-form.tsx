'use client'

import { useState } from 'react'
import { ChevronDown, FileText, Plane, HeartPulse, CalendarClock, Loader2, CheckCircle, Link as LinkIcon, Plus, X } from 'lucide-react'
import { ajukanIzin, hapusIzin, type JenisIzin } from '@/app/actions/izin'

interface IzinSaya {
  id: string
  tanggal_mulai: string
  tanggal_selesai: string
  jenis: string
  keterangan: string | null
  gdrive_link?: string | null
  status: 'pending' | 'disetujui' | 'ditolak'
}

const jenisConfig: Record<string, { label: string; icon: any; color: string }> = {
  surat_tugas: { label: 'Surat Tugas', icon: FileText, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  cuti:        { label: 'Cuti',        icon: Plane,      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  sakit:       { label: 'Sakit',       icon: HeartPulse, color: 'text-red-500 bg-red-500/10 border-red-500/20' },
  izin:        { label: 'Izin',        icon: CalendarClock, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Menunggu konfirmasi', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' },
  disetujui: { label: 'Dikonfirmasi',        color: 'text-green-500 bg-green-500/10 border-green-500/20' },
  ditolak:   { label: 'Ditolak',             color: 'text-red-500 bg-red-500/10 border-red-500/20' },
}

const jenisOptions: { value: JenisIzin; label: string }[] = [
  { value: 'izin',        label: 'Izin' },
  { value: 'cuti',        label: 'Cuti' },
  { value: 'sakit',       label: 'Sakit' },
  { value: 'surat_tugas', label: 'Surat Tugas (ST)' },
]

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function IzinForm({ izinSaya: initial }: { izinSaya: IzinSaya[] }) {
  const [list, setList] = useState(initial)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({
    tanggal_mulai: '',
    tanggal_selesai: '',
    jenis: 'izin' as JenisIzin,
    keterangan: '',
    gdrive_link: '',
  })
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await ajukanIzin(form)
    if (res.error) {
      setError(res.error)
    } else {
      setSuccess(true)
      setForm({ tanggal_mulai: '', tanggal_selesai: '', jenis: 'izin', keterangan: '', gdrive_link: '' })
      setTimeout(() => { setSuccess(false); setFormOpen(false); window.location.reload() }, 1500)
    }
    setLoading(false)
  }

  const handleHapus = async (id: string) => {
    setDeletingId(id)
    const res = await hapusIzin(id)
    if (!res.error) setList(list.filter(i => i.id !== id))
    setDeletingId(null)
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Izin / Cuti / Sakit / ST</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Riwayat pengajuan bulan ini</p>
        </div>
        <button
          onClick={() => setFormOpen(!formOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
        >
          {formOpen ? <X size={13} /> : <Plus size={13} />}
          {formOpen ? 'Batal' : 'Ajukan'}
        </button>
      </div>

      {/* Form pengajuan — collapsible */}
      {formOpen && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 py-4">
          {success ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm py-2">
              <CheckCircle size={15} />
              Pengajuan berhasil dikirim!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Jenis</label>
                <select
                  value={form.jenis}
                  onChange={e => setForm({ ...form, jenis: e.target.value as JenisIzin })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                >
                  {jenisOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {form.jenis === 'surat_tugas' && (
                  <p className="text-[11px] text-zinc-400 mt-1">ST otomatis dikonfirmasi — verifikasi dilakukan di aplikasi lain.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Dari tanggal</label>
                  <input
                    type="date"
                    value={form.tanggal_mulai}
                    onChange={e => setForm({ ...form, tanggal_mulai: e.target.value, tanggal_selesai: form.tanggal_selesai || e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Sampai tanggal</label>
                  <input
                    type="date"
                    value={form.tanggal_selesai}
                    min={form.tanggal_mulai}
                    onChange={e => setForm({ ...form, tanggal_selesai: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Keterangan (opsional)</label>
                <input
                  type="text"
                  value={form.keterangan}
                  onChange={e => setForm({ ...form, keterangan: e.target.value })}
                  placeholder="Misal: nama acara, nomor ST, dsb."
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                  <LinkIcon size={11} />
                  Link Google Drive <span className="text-zinc-400">(surat / dokumen pendukung)</span>
                </label>
                <input
                  type="url"
                  value={form.gdrive_link}
                  onChange={e => setForm({ ...form, gdrive_link: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
                <p className="text-[11px] text-zinc-400 mt-1">Upload dokumen ke Google Drive tim, lalu paste linknya di sini.</p>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors"
              >
                {loading ? <Loader2 size={15} className="animate-spin mx-auto" /> : 'Ajukan'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Riwayat — selalu tampil */}
      {list.length === 0 ? (
        <div className="px-5 pb-4 text-xs text-zinc-400">
          {!formOpen && 'Belum ada pengajuan bulan ini.'}
        </div>
      ) : (
        <div className={`divide-y divide-zinc-100 dark:divide-zinc-800 ${formOpen ? 'border-t border-zinc-100 dark:border-zinc-800' : ''}`}>
          {list.map(izin => {
            const cfg = jenisConfig[izin.jenis] ?? jenisConfig.izin
            const sCfg = statusConfig[izin.status]
            const Icon = cfg.icon
            return (
              <div key={izin.id} className="flex items-start justify-between gap-3 px-5 py-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg border ${cfg.color} shrink-0 mt-0.5`}>
                    <Icon size={12} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      {cfg.label}
                      <span className="font-normal text-zinc-500 ml-1">
                        {formatDate(izin.tanggal_mulai)}
                        {izin.tanggal_mulai !== izin.tanggal_selesai && ` – ${formatDate(izin.tanggal_selesai)}`}
                      </span>
                    </p>
                    {izin.keterangan && (
                      <p className="text-[10px] text-zinc-500 italic truncate">{izin.keterangan}</p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${sCfg.color}`}>
                        {sCfg.label}
                      </span>
                      {izin.gdrive_link && (
                        <a
                          href={izin.gdrive_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-[10px] text-blue-500 hover:text-blue-700"
                        >
                          <LinkIcon size={9} />
                          Dokumen
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                {izin.status === 'pending' && (
                  <button
                    onClick={() => handleHapus(izin.id)}
                    disabled={deletingId === izin.id}
                    className="text-[11px] text-red-400 hover:text-red-600 shrink-0 mt-1"
                  >
                    {deletingId === izin.id ? <Loader2 size={12} className="animate-spin" /> : 'Batalkan'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
