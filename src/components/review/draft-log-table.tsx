'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

const selectClass = "w-full px-2 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"

const bulanNames = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

type SortField = 'nama' | 'periode' | 'entry_count' | 'created_at'
type SortDir = 'asc' | 'desc'

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ChevronsUpDown size={12} className="text-zinc-400" />
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-zinc-900 dark:text-white" />
    : <ChevronDown size={12} className="text-zinc-900 dark:text-white" />
}

export default function DraftLogTable({ logs }: { logs: any[] }) {
  const [searchNama, setSearchNama] = useState('')
  const [filterPeriode, setFilterPeriode] = useState('')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

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

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const processed = useMemo(() => {
    let result = logs.filter(log => {
      const nama = log.users?.full_name || log.users?.email || ''
      const periodeKey = `${log.tahun}-${String(log.bulan).padStart(2, '0')}`
      if (searchNama && !nama.toLowerCase().includes(searchNama.toLowerCase())) return false
      if (filterPeriode && periodeKey !== filterPeriode) return false
      return true
    })

    result.sort((a, b) => {
      let cmp = 0
      if (sortField === 'nama') {
        cmp = (a.users?.full_name || '').localeCompare(b.users?.full_name || '')
      } else if (sortField === 'periode') {
        const aKey = `${a.tahun}-${String(a.bulan).padStart(2, '0')}`
        const bKey = `${b.tahun}-${String(b.bulan).padStart(2, '0')}`
        cmp = aKey.localeCompare(bKey)
      } else if (sortField === 'entry_count') {
        cmp = (a.entry_count ?? 0) - (b.entry_count ?? 0)
      } else if (sortField === 'created_at') {
        cmp = (a.created_at ?? '').localeCompare(b.created_at ?? '')
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [logs, searchNama, filterPeriode, sortField, sortDir])

  const thClass = "px-3 py-2.5 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap"
  const thSort = `${thClass} cursor-pointer select-none hover:text-zinc-900 dark:hover:text-white`

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
        <div className="space-y-1">
          <label className="text-[11px] text-zinc-400 font-medium">Nama pegawai</label>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama..."
              value={searchNama}
              onChange={e => setSearchNama(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-zinc-400 font-medium">Periode</label>
          <select value={filterPeriode} onChange={e => setFilterPeriode(e.target.value)} className={selectClass}>
            <option value="">Semua periode</option>
            {periodeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-zinc-400">
        Menampilkan <span className="font-medium text-zinc-600 dark:text-zinc-300">{processed.length}</span> dari {logs.length} data
        {(searchNama || filterPeriode) && ' (filter aktif)'}
      </p>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className={`${thClass} w-8 text-center`}>#</th>
                <th className={thSort} onClick={() => handleSort('nama')}>
                  <div className="flex items-center gap-1">Nama <SortIcon field="nama" sortField={sortField} sortDir={sortDir} /></div>
                </th>
                <th className={thSort} onClick={() => handleSort('periode')}>
                  <div className="flex items-center gap-1">Periode <SortIcon field="periode" sortField={sortField} sortDir={sortDir} /></div>
                </th>
                <th className={thSort} onClick={() => handleSort('entry_count')}>
                  <div className="flex items-center gap-1">Entri Diisi <SortIcon field="entry_count" sortField={sortField} sortDir={sortDir} /></div>
                </th>
                <th className={thSort} onClick={() => handleSort('created_at')}>
                  <div className="flex items-center gap-1">Dibuat <SortIcon field="created_at" sortField={sortField} sortDir={sortDir} /></div>
                </th>
                <th className={thClass}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {processed.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-zinc-400 text-xs">Tidak ada data.</td>
                </tr>
              ) : processed.map((log: any, idx) => (
                <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-3 py-3 text-center text-xs text-zinc-400">{idx + 1}</td>
                  <td className="px-3 py-3 text-zinc-900 dark:text-white font-medium text-xs whitespace-nowrap">
                    {log.users?.full_name || log.users?.email || '-'}
                  </td>
                  <td className="px-3 py-3 text-zinc-700 dark:text-zinc-300 text-xs whitespace-nowrap">
                    {bulanNames[log.bulan]} {log.tahun}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${
                      log.entry_count === 0
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : log.entry_count < 10
                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        : 'bg-green-500/10 text-green-400 border-green-500/20'
                    }`}>
                      {log.entry_count} kegiatan
                    </span>
                  </td>
                  <td className="px-3 py-3 text-zinc-500 text-xs whitespace-nowrap">
                    {new Date(log.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/review/${log.id}`}
                      className="px-3 py-1 rounded text-xs bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      Lihat
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
