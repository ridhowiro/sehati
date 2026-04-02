'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { prosesKoreksi } from '@/app/actions/absensi'

interface ProsesKoreksiButtonProps {
  koreksiId: string
}

export default function ProsesKoreksiButton({ koreksiId }: ProsesKoreksiButtonProps) {
  const [loading, setLoading] = useState<'disetujui' | 'ditolak' | null>(null)
  const [catatan, setCatatan] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (done) {
    return <span className="text-xs text-zinc-400">Diproses</span>
  }

  const handle = async (action: 'disetujui' | 'ditolak') => {
    setLoading(action)
    setError(null)
    const res = await prosesKoreksi(koreksiId, action, catatan || undefined)
    if (res.error) setError(res.error)
    else setDone(true)
    setLoading(null)
  }

  return (
    <div className="flex flex-col gap-2 shrink-0">
      <input
        type="text"
        placeholder="Catatan (opsional)"
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
        className="w-44 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
      />
      <div className="flex gap-2">
        <button
          onClick={() => handle('disetujui')}
          disabled={!!loading}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
        >
          {loading === 'disetujui' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
          Setuju
        </button>
        <button
          onClick={() => handle('ditolak')}
          disabled={!!loading}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
        >
          {loading === 'ditolak' ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
          Tolak
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
