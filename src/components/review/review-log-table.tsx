'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

const bulanNames = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const statusConfig: Record<string, { label: string; color: string }> = {
  submitted: { label: 'Menunggu Review', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  reviewed_pic: { label: 'Menunggu Kasek', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  verified_kasek: { label: 'Menunggu Kasubdit', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  approved: { label: 'Disetujui', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  revision: { label: 'Perlu Revisi', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  draft: { label: 'Draft', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
}

type SortField = 'nama' | 'periode' | 'status' | 'submitted_at'
type SortDir = 'asc' | 'desc'

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ChevronsUpDown size={12} className="text-zinc-400" />
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-zinc-900 dark:text-white" />
    : <ChevronDown size={12} className="text-zinc-900 dark:text-white" />
}

const selectClass = "w-full px-2 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"

interface ReviewLogTableProps {
  logs: any[]
  showReviewButton: boolean
  showSearch?: boolean
}

export default function ReviewLogTable({ logs, showReviewButton, showSearch = true }: ReviewLogTableProps) {
  const [searchNama, setSearchNama] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPeriode, setFilterPeriode] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortField, setSortField] = useState<SortField>('submitted_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  // Derive unique periode options from data
  const periodeOptions = useMemo(() => {
    const seen = new Set<string>()
    const opts: { value: string; label: string }[] = []
    logs.forEach(log => {
      const key = `${log.tahun}-${String(log.bulan).padStart(2, '0')}`
      if (!seen.has(key)) {
        seen.add(key)
        opts.push({ value: key, label: `${bulanNames[log.bulan]} ${log.tahun}` })
      }
    })
    return opts.sort((a, b) => b.value.localeCompare(a.value))
  }, [logs])

  // Derive unique status options from data
  const statusOptions = useMemo(() => {
    const seen = new Set<string>()
    logs.forEach(log => seen.add(log.status))
    return Array.from(seen).map(s => ({ value: s, label: statusConfig[s]?.label ?? s }))
  }, [logs])

  const processed = useMemo(() => {
    let result = logs.filter(log => {
      const nama = log.users?.full_name || log.users?.email || ''
      const periodeKey = `${log.tahun}-${String(log.bulan).padStart(2, '0')}`

      if (searchNama && !nama.toLowerCase().includes(searchNama.toLowerCase())) return false
      if (filterPeriode && periodeKey !== filterPeriode) return false
      if (filterStatus && log.status !== filterStatus) return false
      if (dateFrom && log.submitted_at && log.submitted_at < dateFrom) return false
      if (dateTo && log.submitted_at && log.submitted_at > dateTo + 'T23:59:59') return false
      return true
    })

    result.sort((a, b) => {
      let valA = '', valB = ''
      if (sortField === 'nama') {
        valA = a.users?.full_name || a.users?.email || ''
        valB = b.users?.full_name || b.users?.email || ''
      } else if (sortField === 'periode') {
        valA = `${a.tahun}-${String(a.bulan).padStart(2, '0')}`
        valB = `${b.tahun}-${String(b.bulan).padStart(2, '0')}`
      } else if (sortField === 'status') {
        valA = a.status
        valB = b.status
      } else if (sortField === 'submitted_at') {
        valA = a.submitted_at ?? ''
        valB = b.submitted_at ?? ''
      }
      const cmp = valA.localeCompare(valB)
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [logs, searchNama, filterPeriode, filterStatus, dateFrom, dateTo, sortField, sortDir])

  const thClass = "px-3 py-2.5 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap"
  const thSort = `${thClass} cursor-pointer select-none hover:text-zinc-900 dark:hover:text-white`

  const hasFilter = searchNama || filterPeriode || filterStatus || dateFrom || dateTo

  return (
    <div className="space-y-3">
      {showSearch && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 items-end">
          {/* Cari nama */}
          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium">Nama pegawai</label>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama..."
                value={searchNama}
                onChange={e => setSearchNama(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-600 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>

          {/* Filter periode */}
          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium">Periode</label>
            <select value={filterPeriode} onChange={e => setFilterPeriode(e.target.value)} className={selectClass}>
              <option value="">Semua periode</option>
              {periodeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Filter status */}
          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectClass}>
              <option value="">Semua status</option>
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Range tanggal disubmit */}
          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium">Disubmit mulai</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className={selectClass}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400 font-medium">Disubmit sampai</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className={selectClass}
            />
          </div>
        </div>
      )}

      {showSearch && (
        <p className="text-xs text-zinc-400">
          Menampilkan <span className="font-medium text-zinc-600 dark:text-zinc-300">{processed.length}</span> dari {logs.length} data
          {hasFilter && ' (filter aktif)'}
        </p>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className={`${thClass} w-8 text-center`}>#</th>
                <th className={thSort} onClick={() => handleSort('nama')}>
                  <div className="flex items-center gap-1">
                    Nama
                    <SortIcon field="nama" sortField={sortField} sortDir={sortDir} />
                  </div>
                </th>
                <th className={thSort} onClick={() => handleSort('periode')}>
                  <div className="flex items-center gap-1">
                    Periode
                    <SortIcon field="periode" sortField={sortField} sortDir={sortDir} />
                  </div>
                </th>
                <th className={thSort} onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">
                    Status
                    <SortIcon field="status" sortField={sortField} sortDir={sortDir} />
                  </div>
                </th>
                <th className={thSort} onClick={() => handleSort('submitted_at')}>
                  <div className="flex items-center gap-1">
                    Disubmit
                    <SortIcon field="submitted_at" sortField={sortField} sortDir={sortDir} />
                  </div>
                </th>
                <th className={thClass}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {processed.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-zinc-400 text-xs">
                    Tidak ada data.
                  </td>
                </tr>
              ) : processed.map((log: any, idx) => {
                const status = statusConfig[log.status as keyof typeof statusConfig]
                return (
                  <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-3 py-3 text-center text-xs text-zinc-400">{idx + 1}</td>
                    <td className="px-3 py-3 text-zinc-900 dark:text-white font-medium text-xs whitespace-nowrap">
                      {log.users?.full_name || log.users?.email || '-'}
                    </td>
                    <td className="px-3 py-3 text-zinc-700 dark:text-zinc-300 text-xs whitespace-nowrap">
                      {bulanNames[log.bulan]} {log.tahun}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] border ${status?.color ?? ''}`}>
                        {status?.label ?? log.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-zinc-500 text-xs whitespace-nowrap">
                      {log.submitted_at
                        ? new Date(log.submitted_at).toLocaleDateString('id-ID')
                        : '-'}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/review/${log.id}`}
                        className={`px-3 py-1 rounded text-xs transition-colors ${
                          showReviewButton
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {showReviewButton ? 'Review' : 'Lihat'}
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
