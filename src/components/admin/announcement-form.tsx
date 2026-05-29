'use client'

import { useState, useTransition } from 'react'
import { Megaphone, Send } from 'lucide-react'
import { kirimPengumuman } from '@/app/actions/pengumuman'

export default function AnnouncementForm() {
  const [judul, setJudul] = useState('')
  const [pesan, setPesan] = useState('')
  const [result, setResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)
    startTransition(async () => {
      try {
        const { count } = await kirimPengumuman(judul, pesan)
        setResult({ type: 'success', msg: `Pengumuman berhasil dikirim ke ${count} pengguna aktif.` })
        setJudul('')
        setPesan('')
      } catch (err: any) {
        setResult({ type: 'error', msg: err.message ?? 'Gagal mengirim pengumuman' })
      }
    })
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Megaphone size={16} className="text-blue-500" />
        <h3 className="font-medium text-sm text-zinc-900 dark:text-white">Kirim Pengumuman ke Semua Pengguna</h3>
      </div>
      <p className="text-xs text-zinc-500">
        Pengumuman akan muncul sebagai banner di dashboard setiap pengguna aktif dan hilang setelah mereka menutupnya.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Judul</label>
          <input
            type="text"
            value={judul}
            onChange={e => setJudul(e.target.value)}
            placeholder="Contoh: Pengingat Absensi Bulan Juni"
            required
            maxLength={100}
            className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Pesan</label>
          <textarea
            value={pesan}
            onChange={e => setPesan(e.target.value)}
            placeholder="Tulis pesan pengumuman di sini..."
            required
            rows={3}
            maxLength={500}
            className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-[11px] text-zinc-400 mt-1 text-right">{pesan.length}/500</p>
        </div>

        {result && (
          <p className={`text-xs rounded-lg px-3 py-2 ${result.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
            {result.msg}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending || !judul.trim() || !pesan.trim()}
          className="flex items-center gap-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Send size={14} />
          {isPending ? 'Mengirim...' : 'Kirim Pengumuman'}
        </button>
      </form>
    </div>
  )
}
