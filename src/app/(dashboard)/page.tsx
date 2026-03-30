import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">SEHATI</h1>
            <p className="text-xs text-gray-500">Sekretariat HETI</p>
          </div>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Log Bulanan</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">0</p>
            <p className="text-xs text-gray-400 mt-1">Belum ada log</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Agenda Bulan Ini</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">0</p>
            <p className="text-xs text-gray-400 mt-1">Belum ada agenda</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Notifikasi</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">0</p>
            <p className="text-xs text-gray-400 mt-1">Semua sudah dibaca</p>
          </div>
        </div>
      </div>
    </div>
  )
}