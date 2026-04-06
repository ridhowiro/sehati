import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/get-user-role'
import AgendaCalendar from '@/components/agenda/agenda-calendar'

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { user } = await getUserRole()
  const supabase = await createClient()
  const params = await searchParams

  // Parse bulan dari query param, default bulan ini
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  let year = now.getFullYear()
  let month = now.getMonth() + 1 // 1-based

  if (params.month && /^\d{4}-\d{2}$/.test(params.month)) {
    const [y, m] = params.month.split('-').map(Number)
    year = y
    month = m
  }

  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).toLocaleDateString('en-CA')

  const [
    { data: hariLibur },
    { data: agendaList },
    { data: izinSaya },
    { data: logBulanan },
  ] = await Promise.all([
    supabase
      .from('hari_libur')
      .select('tanggal, nama, jenis')
      .gte('tanggal', firstDay)
      .lte('tanggal', lastDay),
    supabase
      .from('agenda')
      .select('id, judul, tanggal, waktu_mulai, waktu_selesai, lokasi, deskripsi, creator_id, users(full_name)')
      .gte('tanggal', firstDay)
      .lte('tanggal', lastDay)
      .order('tanggal', { ascending: true })
      .order('waktu_mulai', { ascending: true }),
    supabase
      .from('izin_karyawan')
      .select('tanggal_mulai, tanggal_selesai, jenis, status')
      .eq('user_id', user.id)
      .eq('status', 'disetujui')
      .lte('tanggal_mulai', lastDay)
      .gte('tanggal_selesai', firstDay),
    supabase
      .from('log_bulanan')
      .select('id')
      .eq('user_id', user.id)
      .eq('bulan', month)
      .eq('tahun', year),
  ])

  const logBulananIds = (logBulanan ?? []).map(l => l.id)
  let logEntries: { tanggal: string; kegiatan: string; output: string | null; status_kegiatan: string }[] = []
  if (logBulananIds.length > 0) {
    const { data } = await supabase
      .from('log_entry')
      .select('tanggal, kegiatan, output, status_kegiatan')
      .in('log_bulanan_id', logBulananIds)
      .order('tanggal', { ascending: true })
    logEntries = data ?? []
  }
  const logDates = [...new Set(logEntries.map(l => l.tanggal))]

  const todayWib = now.toLocaleDateString('en-CA')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Agenda</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Kalender kegiatan, libur, dan izin</p>
        </div>
      </div>

      <AgendaCalendar
        year={year}
        month={month}
        today={todayWib}
        hariLibur={hariLibur ?? []}
        agendaList={(agendaList ?? []) as any}
        izinSaya={izinSaya ?? []}
        logDates={logDates}
        logEntries={logEntries}
        userId={user.id}
      />
    </div>
  )
}
