'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Loader2, FileText, Plane, HeartPulse, CalendarClock, Link as LinkIcon } from 'lucide-react'
import { prosesIzin } from '@/app/actions/izin'

interface IzinItem {
  id: string
  user_id: string
  tanggal_mulai: string
  tanggal_selesai: string
  jenis: string
  keterangan: string | null
  gdrive_link: string | null
  status: 'pending' | 'disetujui' | 'ditolak'
  catatan_prosesor: string | null
  created_at: string
  users: { full_name: string } | null
}

const jenisConfig: Record<string, { label: string; icon: any; color: string }> = {
  surat_tugas: { label: 'Surat Tugas', icon: FileText, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  cuti: { label: 'Cuti', icon: Plane, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  sakit: { label: 'Sakit', icon: HeartPulse, color: 'text-red-500 bg-red-500/10 border-red-500/20' },
  izin: { label: 'Izin', icon: CalendarClock, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
}

const statusConfig = {
  pending: { label: 'Menunggu', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' },
  disetujui: { label: 'Dikonfirmasi', color: 'text-green-500 bg-green-500/10 border-green-500/20' },
  ditolak: { label: 'Ditolak', color: 'text-red-500 bg-red-500/10 border-red-500/20' },
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function durasiHari(mulai: string, selesai: string) {
  const diff = (new Date(selesai).getTime() - new Date(mulai).getTime()) / 86400000 + 1
  return `${diff} hari`
}

export default function ProsesIzinTable({ izinList: initial }: { izinList: IzinItem[] }) {
  const [list, setList] = useState(initial)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [catatanMap, setCatatanMap] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<'semua' | 'pending' | 'disetujui' | 'ditolak'>('pending')

  const handleProses = async (id: string, action: 'disetujui' | 'ditolak') => {
    setLoadingId(id)
    const res = await prosesIzin(id, action, catatanMap[id])
    if (!res.error) {
      setList(list.map(i => i.id === id ? { ...i, status: action } : i))
    }
    setLoadingId(null)
  }

  const filtered = list.filter(i => filter === 'semua' || i.status === filter)
  const pendingCount = list.filter(i => i.status === 'pending').length

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(['semua', 'pending', 'disetujui', 'ditolak'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                : 'border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            {f === 'semua' ? 'Semua' : f === 'pending' ? 'Menunggu' : f === 'disetujui' ? 'Dikonfirmasi' : 'Ditolak'}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-yellow-500 text-white rounded-full px-1.5 py-0.5 text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-zinc-400 text-sm bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          Tidak ada data.
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(izin => {
          const jCfg = jenisConfig[izin.jenis] ?? jenisConfig.izin
          const sCfg = statusConfig[izin.status]
          const Icon = jCfg.icon
          const isST = izin.jenis === 'surat_tugas'

          return (
            <div key={izin.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg border ${jCfg.color} shrink-0`}>
                    <Icon size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {izin.users?.full_name ?? '—'}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {formatDate(izin.tanggal_mulai)} – {formatDate(izin.tanggal_selesai)}
                      <span className="ml-1.5 text-zinc-300 dark:text-zinc-600">({durasiHari(izin.tanggal_mulai, izin.tanggal_selesai)})</span>
                    </p>
                    {izin.keterangan && (
                      <p className="text-xs text-zinc-500 mt-0.5 italic">"{izin.keterangan}"</p>
                    )}
                    {izin.gdrive_link ? (
                      <a
                        href={izin.gdrive_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-700 mt-0.5"
                      >
                        <LinkIcon size={10} />
                        Lihat dokumen
                      </a>
                    ) : (
                      <p className="text-[11px] text-zinc-400 mt-0.5 italic">Tidak ada dokumen pendukung</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${jCfg.color}`}>
                    {jCfg.label}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sCfg.color}`}>
                    {sCfg.label}
                  </span>
                </div>
              </div>

              {/* Approval — hanya izin/cuti/sakit yang pending; ST auto-confirmed */}
              {izin.status === 'pending' && !isST && (
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Catatan (opsional)"
                    value={catatanMap[izin.id] ?? ''}
                    onChange={e => setCatatanMap({ ...catatanMap, [izin.id]: e.target.value })}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none"
                  />
                  <button
                    onClick={() => handleProses(izin.id, 'disetujui')}
                    disabled={loadingId === izin.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                  >
                    {loadingId === izin.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                    Konfirmasi
                  </button>
                  <button
                    onClick={() => handleProses(izin.id, 'ditolak')}
                    disabled={loadingId === izin.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                  >
                    <XCircle size={12} />
                    Tolak
                  </button>
                </div>
              )}

              {isST && (
                <p className="text-[11px] text-zinc-400 italic">ST otomatis dikonfirmasi — verifikasi dilakukan di aplikasi lain.</p>
              )}

              {izin.catatan_prosesor && (
                <p className="text-xs text-zinc-400 italic">Catatan: {izin.catatan_prosesor}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
