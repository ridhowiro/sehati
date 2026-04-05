'use client'

import { useState } from 'react'
import { ChevronDown, FileText, Plane, HeartPulse, Loader2, CheckCircle } from 'lucide-react'
import { ajukanIzin, hapusIzin } from '@/app/actions/izin'

interface IzinSaya {
  id: string
  tanggal_mulai: string
  tanggal_selesai: string
  jenis: 'surat_tugas' | 'cuti' | 'sakit'
  keterangan: string | null
  status: 'pending' | 'disetujui' | 'ditolak'
}

const jenisConfig = {
  surat_tugas: { label: 'Surat Tugas', icon: FileText, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  cuti: { label: 'Cuti', icon: Plane, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  sakit: { label: 'Sakit', icon: HeartPulse, color: 'text-red-500 bg-red-500/10 border-red-500/20' },
}

const statusLabel = {
  pending: 'Menunggu persetujuan',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function IzinForm({ izinSaya: initial }: { izinSaya: IzinSaya[] }) {
  const [open, setOpen] = useState(false)
  const [list, setList] = useState(initial)
  const [form, setForm] = useState({
    tanggal_mulai: '',
    tanggal_selesai: '',
    jenis: 'cuti' as 'surat_tugas' | 'cuti' | 'sakit',
    keterangan: '',
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
      setForm({ tanggal_mulai: '', tanggal_selesai: '', jenis: 'cuti', keterangan: '' })
      setTimeout(() => { setSuccess(false); window.location.reload() }, 1500)
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
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Izin / ST / Sakit</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Ajukan izin agar tidak dihitung absen</p>
        </div>
        <ChevronDown size={16} className={`text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 p-5 space-y-4">
          {/* Riwayat izin */}
          {list.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-500">Pengajuan Saya</p>
              {list.map(izin => {
                const cfg = jenisConfig[izin.jenis]
                const Icon = cfg.icon
                return (
                  <div key={izin.id} className="flex items-center justify-between py-2 px-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Icon size={13} className={cfg.color.split(' ')[0]} />
                      <div>
                        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                          {cfg.label} — {formatDate(izin.tanggal_mulai)}
                          {izin.tanggal_mulai !== izin.tanggal_selesai && ` s/d ${formatDate(izin.tanggal_selesai)}`}
                        </p>
                        <p className={`text-[10px] ${izin.status === 'disetujui' ? 'text-green-500' : izin.status === 'ditolak' ? 'text-red-500' : 'text-yellow-500'}`}>
                          {statusLabel[izin.status]}
                        </p>
                      </div>
                    </div>
                    {izin.status === 'pending' && (
                      <button
                        onClick={() => handleHapus(izin.id)}
                        disabled={deletingId === izin.id}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        {deletingId === izin.id ? <Loader2 size={12} className="animate-spin" /> : 'Batalkan'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Form */}
          {success ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm py-2">
              <CheckCircle size={15} />
              Pengajuan berhasil dikirim!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
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
                <label className="text-xs text-zinc-500 mb-1 block">Jenis</label>
                <select
                  value={form.jenis}
                  onChange={e => setForm({ ...form, jenis: e.target.value as typeof form.jenis })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                >
                  <option value="cuti">Cuti</option>
                  <option value="sakit">Sakit</option>
                  <option value="surat_tugas">Surat Tugas (ST)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Keterangan (opsional)</label>
                <textarea
                  value={form.keterangan}
                  onChange={e => setForm({ ...form, keterangan: e.target.value })}
                  rows={2}
                  placeholder="Misal: Nama acara, nomor ST, dll."
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors"
              >
                {loading ? <Loader2 size={15} className="animate-spin mx-auto" /> : 'Ajukan Izin'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
