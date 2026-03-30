import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Dashboard</h2>
        <p className="text-sm text-zinc-500 mt-1">Selamat datang di SEHATI</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <p className="text-sm text-zinc-500">Log Bulanan</p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-white mt-1">0</p>
          <p className="text-xs text-zinc-400 mt-1">Belum ada log</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <p className="text-sm text-zinc-500">Agenda Bulan Ini</p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-white mt-1">0</p>
          <p className="text-xs text-zinc-400 mt-1">Belum ada agenda</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <p className="text-sm text-zinc-500">Notifikasi</p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-white mt-1">0</p>
          <p className="text-xs text-zinc-400 mt-1">Semua sudah dibaca</p>
        </div>
      </div>
    </div>
  )
}