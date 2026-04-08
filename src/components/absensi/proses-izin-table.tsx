'use client'

import { useState, useMemo } from 'react'
import {
  CheckCircle, XCircle, Loader2, FileText, Plane, HeartPulse,
  CalendarClock, Link as LinkIcon, Search, ChevronUp, ChevronDown, ChevronsUpDown,
} from 'lucide-react'
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
  pending: { label: 'Menunggu', color: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/30' },
  disetujui: { label: 'Dikonfirmasi', color: 'text-green-600 bg-green-500/10 border-green-500/30' },
  ditolak: { label: 'Ditolak', color: 'text-red-600 bg-red-500/10 border-red-500/30' },
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function durasiHari(mulai: string, selesai: string) {
  const diff = (new Date(selesai).getTime() - new Date(mulai).getTime()) / 86400000 + 1
  return `${diff}h`
}

type SortField = 'nama' | 'tanggal_mulai' | 'jenis' | 'status'
type SortDir = 'asc' | 'desc'

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ChevronsUpDown size={12} className="text-zinc-400" />
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-zinc-900 dark:text-white" />
    : <ChevronDown size={12} className="text-zinc-900 dark:text-white" />
}

export default function ProsesIzinTable({ izinList: initial }: { izinList: IzinItem[] }) {
  const [list, setList] = useState(initial)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [catatanMap, setCatatanMap] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<'semua' | 'pending' | 'disetujui' | 'ditolak'>('pending')

  // Search states
  const [searchNama, setSearchNama] = useState('')
  const [searchKegiatan, setSearchKegiatan] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Sort states
  const [sortField, setSortField] = useState<SortField>('tanggal_mulai')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Expanded row for inline action
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const handleProses = async (id: string, action: 'disetujui' | 'ditolak') => {
    setLoadingId(id)
    const res = await prosesIzin(id, action, catatanMap[id])
    if (!res.error) {
      setList(list.map(i => i.id === id ? { ...i, status: action } : i))
      setExpandedId(null)
    }
    setLoadingId(null)
  }

  const processed = useMemo(() => {
    let result = list.filter(i => {
      if (filter !== 'semua' && i.status !== filter) return false
      if (searchNama && !i.users?.full_name.toLowerCase().includes(searchNama.toLowerCase())) return false
      if (searchKegiatan && !i.keterangan?.toLowerCase().includes(searchKegiatan.toLowerCase())) return false
      if (dateFrom && i.tanggal_mulai < dateFrom) return false
      if (dateTo && i.tanggal_selesai > dateTo) return false
      return true
    })

    result.sort((a, b) => {
      let valA = '', valB = ''
      if (sortField === 'nama') {
        valA = a.users?.full_name ?? ''
        valB = b.users?.full_name ?? ''
      } else if (sortField === 'tanggal_mulai') {
        valA = a.tanggal_mulai
        valB = b.tanggal_mulai
      } else if (sortField === 'jenis') {
        valA = a.jenis
        valB = b.jenis
      } else if (sortField === 'status') {
        valA = a.status
        valB = b.status
      }
      const cmp = valA.localeCompare(valB)
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [list, filter, searchNama, searchKegiatan, dateFrom, dateTo, sortField, sortDir])

  const pendingCount = list.filter(i => i.status === 'pending').length

  const thClass = "px-3 py-2.5 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap select-none"
  const thSortClass = `${thClass} cursor-pointer hover:text-zinc-900 dark:hover:text-white`

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
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

      {/* Search bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama pegawai..."
            value={searchNama}
            onChange={e => setSearchNama(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama kegiatan..."
            value={searchKegiatan}
            onChange={e => setSearchKegiatan(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="w-full px-2 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="w-full px-2 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>
      </div>

      {/* Result count */}
      <p className="text-xs text-zinc-400">
        Menampilkan <span className="font-medium text-zinc-600 dark:text-zinc-300">{processed.length}</span> data
        {(searchNama || searchKegiatan || dateFrom || dateTo) && ' (filter aktif)'}
      </p>

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700">
              <tr>
                <th className={`${thClass} w-8 text-center`}>#</th>
                <th className={thSortClass} onClick={() => handleSort('nama')}>
                  <div className="flex items-center gap-1">
                    Pegawai
                    <SortIcon field="nama" sortField={sortField} sortDir={sortDir} />
                  </div>
                </th>
                <th className={thClass}>Kegiatan / Keterangan</th>
                <th className={thSortClass} onClick={() => handleSort('jenis')}>
                  <div className="flex items-center gap-1">
                    Jenis
                    <SortIcon field="jenis" sortField={sortField} sortDir={sortDir} />
                  </div>
                </th>
                <th className={thSortClass} onClick={() => handleSort('tanggal_mulai')}>
                  <div className="flex items-center gap-1">
                    Tanggal
                    <SortIcon field="tanggal_mulai" sortField={sortField} sortDir={sortDir} />
                  </div>
                </th>
                <th className={`${thClass} text-center`}>Durasi</th>
                <th className={thClass}>Dokumen</th>
                <th className={thSortClass} onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">
                    Status
                    <SortIcon field="status" sortField={sortField} sortDir={sortDir} />
                  </div>
                </th>
                <th className={`${thClass} text-center`}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {processed.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-zinc-400 text-xs bg-white dark:bg-zinc-900">
                    Tidak ada data.
                  </td>
                </tr>
              ) : processed.map((izin, idx) => {
                const jCfg = jenisConfig[izin.jenis] ?? jenisConfig.izin
                const sCfg = statusConfig[izin.status]
                const Icon = jCfg.icon
                const isST = izin.jenis === 'surat_tugas'
                const isExpanded = expandedId === izin.id

                return (
                  <>
                    <tr
                      key={izin.id}
                      className={`bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${isExpanded ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''}`}
                    >
                      <td className="px-3 py-3 text-center text-xs text-zinc-400">{idx + 1}</td>
                      <td className="px-3 py-3">
                        <span className="text-xs font-medium text-zinc-900 dark:text-white whitespace-nowrap">
                          {izin.users?.full_name ?? '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3 max-w-xs">
                        {izin.keterangan ? (
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 italic">
                            "{izin.keterangan}"
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-300 dark:text-zinc-600 italic">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium ${jCfg.color}`}>
                          <Icon size={10} />
                          {jCfg.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-xs text-zinc-700 dark:text-zinc-300">
                          {formatDate(izin.tanggal_mulai)}
                        </span>
                        {izin.tanggal_mulai !== izin.tanggal_selesai && (
                          <span className="text-xs text-zinc-400 block">s/d {formatDate(izin.tanggal_selesai)}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs text-zinc-500">{durasiHari(izin.tanggal_mulai, izin.tanggal_selesai)}</span>
                      </td>
                      <td className="px-3 py-3">
                        {izin.gdrive_link ? (
                          <a
                            href={izin.gdrive_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-700"
                          >
                            <LinkIcon size={10} />
                            Lihat
                          </a>
                        ) : (
                          <span className="text-[11px] text-zinc-300 dark:text-zinc-600 italic">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${sCfg.color}`}>
                          {sCfg.label}
                        </span>
                        {isST && (
                          <span className="block text-[10px] text-zinc-400 mt-0.5 italic">auto</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {izin.status === 'pending' && !isST ? (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : izin.id)}
                            className="text-[11px] px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-medium"
                          >
                            {isExpanded ? 'Tutup' : 'Proses'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-zinc-300 dark:text-zinc-600">—</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded action row */}
                    {isExpanded && (
                      <tr key={`${izin.id}-action`} className="bg-zinc-50 dark:bg-zinc-800/30">
                        <td colSpan={9} className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">Proses izin:</span>
                            <input
                              type="text"
                              placeholder="Catatan (opsional)"
                              value={catatanMap[izin.id] ?? ''}
                              onChange={e => setCatatanMap({ ...catatanMap, [izin.id]: e.target.value })}
                              className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none"
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
                          {izin.catatan_prosesor && (
                            <p className="text-xs text-zinc-400 italic mt-1.5">Catatan sebelumnya: {izin.catatan_prosesor}</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
