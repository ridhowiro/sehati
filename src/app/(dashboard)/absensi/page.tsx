import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/get-user-role'
import CheckinCard from '@/components/absensi/checkin-card'
import HistoryTable from '@/components/absensi/history-table'
import KoreksiForm from '@/components/absensi/koreksi-form'
import IzinForm from '@/components/absensi/izin-form'
import { CalendarDays, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default async function AbsensiPage() {
  const { user } = await getUserRole()
  const supabase = await createClient()

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
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA')

  const [
    { data: absensiHariIni },
    { data: riwayat },
    { data: izinSaya },
  ] = await Promise.all([
    supabase
      .from('absensi')
      .select('id, checkin_time, checkout_time, status, is_late, menit_terlambat, wajib_checkout')
      .eq('user_id', user.id)
      .eq('tanggal', todayWib)
      .maybeSingle(),
    supabase
      .from('absensi')
      .select('id, tanggal, checkin_time, checkout_time, status, is_late, menit_terlambat')
      .eq('user_id', user.id)
      .gte('tanggal', startOfMonth)
      .order('tanggal', { ascending: false }),
    supabase
      .from('izin_karyawan')
      .select('id, tanggal_mulai, tanggal_selesai, jenis, keterangan, gdrive_link, status')
      .eq('user_id', user.id)
      .order('tanggal_mulai', { ascending: false })
      .limit(20),
  ])

  const izinHariIni = (izinSaya ?? []).find(i =>
    i.status === 'disetujui' &&
    i.tanggal_mulai <= todayWib &&
    i.tanggal_selesai >= todayWib
  )

  const riwayatList = riwayat ?? []
  const totalHadir = riwayatList.filter(r => ['hadir', 'terlambat'].includes(r.status)).length
  const totalWfh = riwayatList.filter(r => r.status === 'wfh').length
  const totalTerlambat = riwayatList.filter(r => r.status === 'terlambat').length
  const totalHariKerja = riwayatList.length

  const jenisIzinLabel: Record<string, string> = {
    surat_tugas: 'Surat Tugas', cuti: 'Cuti', sakit: 'Sakit', izin: 'Izin',
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Absensi</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Rekam kehadiran harianmu dengan GPS</p>
        </div>
      </div>

      {/* Banner izin hari ini */}
      {izinHariIni && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
          Hari ini kamu tercatat <strong>{jenisIzinLabel[izinHariIni.jenis]}</strong>
          {izinHariIni.keterangan ? ` — ${izinHariIni.keterangan}` : ''}.
          Absensi masuk/pulang tidak diwajibkan.
        </div>
      )}

      {/* Stats bulan ini — 4 kolom di semua ukuran, compact */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <CalendarDays size={13} className="text-zinc-400 shrink-0" />
            <span className="text-[10px] sm:text-xs text-zinc-500 leading-tight">Hari Kerja</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">{totalHariKerja}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <CheckCircle size={13} className="text-green-500 shrink-0" />
            <span className="text-[10px] sm:text-xs text-zinc-500 leading-tight">Hadir</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">{totalHadir + totalWfh}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Clock size={13} className="text-blue-500 shrink-0" />
            <span className="text-[10px] sm:text-xs text-zinc-500 leading-tight">WFH</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">{totalWfh}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertCircle size={13} className="text-yellow-500 shrink-0" />
            <span className="text-[10px] sm:text-xs text-zinc-500 leading-tight">Terlambat</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">{totalTerlambat}</p>
        </div>
      </div>

      {/* Main: CheckinCard kiri, riwayat kanan */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {/* Kiri: aksi */}
        <div className="md:col-span-1 xl:col-span-2 space-y-3">
          <CheckinCard kantor={kantor} absensiHariIni={absensiHariIni} />
          <IzinForm izinSaya={izinSaya ?? []} />
          <KoreksiForm absensiList={riwayatList} />
        </div>

        {/* Kanan: riwayat */}
        <div className="md:col-span-1 xl:col-span-3">
          <HistoryTable data={riwayatList} izinList={izinSaya ?? []} />
        </div>
      </div>
    </div>
  )
}
