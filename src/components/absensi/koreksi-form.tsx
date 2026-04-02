'use client'

import { useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { ajukanKoreksi } from '@/app/actions/absensi'

interface AbsensiRow {
  id: string
  tanggal: string
  checkin_time: string | null
  checkout_time: string | null
}

interface KoreksiFormProps {
  absensiList: AbsensiRow[]
}

function fmtTanggal(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function KoreksiForm({ absensiList }: KoreksiFormProps) {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [jenis, setJenis] = useState<'koreksi_checkin' | 'koreksi_checkout' | 'dispensasi'>('koreksi_checkin')
  const [alasan, setAlasan] = useState('')
  const [waktuKoreksi, setWaktuKoreksi] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId || !alasan.trim()) return
    setLoading(true)
    setError(null)

    const res = await ajukanKoreksi({
      absensi_id: selectedId,
      jenis,
      alasan: alasan.trim(),
      waktu_koreksi: waktuKoreksi || undefined,
    })

    if (res.error) {
      setError(res.error)
    } else {
      setSuccess(true)
      setOpen(false)
      setSelectedId('')
      setJenis('koreksi_checkin')
      setAlasan('')
      setWaktuKoreksi('')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-sm text-green-600 dark:text-green-400">
        Permohonan koreksi berhasil diajukan. Menunggu persetujuan atasan.
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors rounded-xl"
      >
        <span className="flex items-center gap-2">
          <AlertTriangle size={15} className="text-yellow-500" />
          Ajukan Koreksi Absensi
        </span>
        <span className="text-zinc-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3 border-t border-zinc-100 dark:border-zinc-800 pt-3">
          {/* Pilih tanggal */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Tanggal Absensi</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              <option value="">-- Pilih tanggal --</option>
              {absensiList.map((a) => (
                <option key={a.id} value={a.id}>{fmtTanggal(a.tanggal)}</option>
              ))}
            </select>
          </div>

          {/* Jenis koreksi */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Jenis Koreksi</label>
            <select
              value={jenis}
              onChange={(e) => setJenis(e.target.value as typeof jenis)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              <option value="koreksi_checkin">Koreksi Check-in</option>
              <option value="koreksi_checkout">Koreksi Check-out</option>
              <option value="dispensasi">Dispensasi / Izin</option>
            </select>
          </div>

          {/* Waktu koreksi (opsional) */}
          {jenis !== 'dispensasi' && (
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Waktu Seharusnya (opsional)</label>
              <input
                type="datetime-local"
                value={waktuKoreksi}
                onChange={(e) => setWaktuKoreksi(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
          )}

          {/* Alasan */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Alasan <span className="text-red-400">*</span></label>
            <textarea
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              required
              rows={3}
              placeholder="Jelaskan alasan koreksi..."
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !selectedId || !alasan.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Ajukan Koreksi
          </button>
        </form>
      )}
    </div>
  )
}
