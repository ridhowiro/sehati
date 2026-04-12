'use client'

import { useState } from 'react'
import { Plus, Trash2, Loader2, CalendarDays, Globe, Download } from 'lucide-react'
import { createHariLibur, deleteHariLibur, importHariLiburFromApi } from '@/app/actions/izin'

interface HariLibur {
  id: string
  tanggal: string
  nama: string
  jenis: 'nasional' | 'cuti_bersama'
}

const jenisConfig = {
  nasional: { label: 'Libur Nasional', color: 'text-red-500 bg-red-500/10 border-red-500/20' },
  cuti_bersama: { label: 'Cuti Bersama', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
}

function formatTanggal(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function HariLiburManager({ hariLibur: initial }: { hariLibur: HariLibur[] }) {
  const [list, setList] = useState(initial)
  const [form, setForm] = useState({ tanggal: '', nama: '', jenis: 'nasional' as 'nasional' | 'cuti_bersama' })
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importYear, setImportYear] = useState(new Date().getFullYear())
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)

  const handleImport = async () => {
    setImporting(true)
    setImportMsg(null)
    setError(null)
    const res = await importHariLiburFromApi(importYear)
    if (res.error) {
      setError(res.error)
    } else {
      setImportMsg(`Berhasil mengimpor ${res.imported} hari libur tahun ${importYear}.`)
      setTimeout(() => window.location.reload(), 1200)
    }
    setImporting(false)
  }

  const handleAdd = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.tanggal || !form.nama) return
    setLoading(true)
    setError(null)
    const res = await createHariLibur(form)
    if (res.error) {
      setAddError(res.error)
    } else {
      // Optimistic: reload page to get fresh data including id
      window.location.reload()
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const res = await deleteHariLibur(id)
    if (res.error) setError(res.error)
    else setList(list.filter(h => h.id !== id))
    setDeletingId(null)
  }

  const grouped = list.reduce((acc, h) => {
    const year = h.tanggal.slice(0, 4)
    if (!acc[year]) acc[year] = []
    acc[year].push(h)
    return acc
  }, {} as Record<string, HariLibur[]>)

  return (
    <div className="space-y-6">
      {/* Import dari API */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
          <Download size={15} /> Import dari API
        </h3>
        <p className="text-xs text-zinc-400 mb-4">
          Import hari libur nasional dari{' '}
          <span className="font-mono">date.nager.at</span>. Cuti bersama tambahkan manual di bawah. Duplikat otomatis dilewati.
        </p>
        <div className="flex gap-2">
          <select
            value={importYear}
            onChange={e => setImportYear(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={handleImport}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors"
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {importing ? 'Mengimpor...' : 'Import'}
          </button>
        </div>
        {importMsg && <p className="text-xs text-green-600 dark:text-green-400 mt-2">{importMsg}</p>}
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>

      {/* Form tambah manual */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <Plus size={15} /> Tambah Manual
        </h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="date"
            value={form.tanggal}
            onChange={e => setForm({ ...form, tanggal: e.target.value })}
            required
            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <input
            type="text"
            placeholder="Nama hari libur"
            value={form.nama}
            onChange={e => setForm({ ...form, nama: e.target.value })}
            required
            className="sm:col-span-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-600 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <div className="flex gap-2">
            <select
              value={form.jenis}
              onChange={e => setForm({ ...form, jenis: e.target.value as 'nasional' | 'cuti_bersama' })}
              className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              <option value="nasional">Libur Nasional</option>
              <option value="cuti_bersama">Cuti Bersama</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            </button>
          </div>
        </form>
        {addError && <p className="text-xs text-red-500 mt-2">{addError}</p>}
      </div>

      {/* Daftar */}
      {Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([year, items]) => (
        <div key={year} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
            <CalendarDays size={15} className="text-zinc-400" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">Tahun {year}</span>
            <span className="text-xs text-zinc-400">({items.length} hari)</span>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {items.map(h => {
              const cfg = jenisConfig[h.jenis]
              return (
                <div key={h.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Globe size={14} className="text-zinc-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{h.nama}</p>
                      <p className="text-xs text-zinc-400">{formatTanggal(h.tanggal)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <button
                      onClick={() => handleDelete(h.id)}
                      disabled={deletingId === h.id}
                      className="text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      {deletingId === h.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {list.length === 0 && (
        <div className="text-center py-12 text-zinc-400 text-sm">
          Belum ada hari libur yang ditambahkan.
        </div>
      )}
    </div>
  )
}
