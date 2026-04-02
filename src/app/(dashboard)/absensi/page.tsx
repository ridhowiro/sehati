import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/get-user-role'
import CheckinCard from '@/components/absensi/checkin-card'
import HistoryTable from '@/components/absensi/history-table'
import KoreksiForm from '@/components/absensi/koreksi-form'
import { CalendarDays, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default async function AbsensiPage() {
  const { user } = await getUserRole()
  const supabase = await createClient()

  // Ambil kantor config aktif
  const { data: kantor } = await supabase
    .from('kantor_config')
    .select('*')
    .eq('is_active', true)
    .single()

  if (!kantor) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 text-center">
        <p className="text-yellow-600 dark:text-yellow-400 text-sm">
          Konfigurasi kantor belum diatur. Hubungi admin untuk mengatur lokasi kantor.
        </p>
      </div>
    )
  }

  const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

  // Absensi hari ini
  const { data: absensiHariIni } = await supabase
    .from('absensi')
    .select('id, checkin_time, checkout_time, status, is_late, menit_terlambat, wajib_checkout')
    .eq('user_id', user.id)
    .eq('tanggal', todayWib)
    .maybeSingle()

  // Riwayat bulan ini
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toLocaleDateString('en-CA')

  const { data: riwayat } = await supabase
    .from('absensi')
    .select('id, tanggal, checkin_time, checkout_time, status, is_late, menit_terlambat')
    .eq('user_id', user.id)
    .gte('tanggal', startOfMonth)
    .order('tanggal', { ascending: false })

  const riwayatList = riwayat ?? []

  // Statistik bulan ini
  const totalHadir = riwayatList.filter(r => ['hadir', 'terlambat'].includes(r.status)).length
  const totalWfh = riwayatList.filter(r => r.status === 'wfh').length
  const totalTerlambat = riwayatList.filter(r => r.status === 'terlambat').length
  const totalHariKerja = riwayatList.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Absensi</h2>
        <p className="text-sm text-zinc-500 mt-1">Rekam kehadiran harianmu dengan GPS</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays size={15} className="text-zinc-400" />
            <span className="text-xs text-zinc-500">Hari Kerja</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{totalHariKerja}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={15} className="text-green-500" />
            <span className="text-xs text-zinc-500">Hadir</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{totalHadir + totalWfh}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={15} className="text-blue-500" />
            <span className="text-xs text-zinc-500">WFH</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{totalWfh}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={15} className="text-yellow-500" />
            <span className="text-xs text-zinc-500">Terlambat</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{totalTerlambat}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Check-in card */}
        <div className="lg:col-span-1 space-y-4">
          <CheckinCard kantor={kantor} absensiHariIni={absensiHariIni} />
          <KoreksiForm absensiList={riwayatList} />
        </div>

        {/* Riwayat */}
        <div className="lg:col-span-2">
          <HistoryTable data={riwayatList} />
        </div>
      </div>
    </div>
  )
}
