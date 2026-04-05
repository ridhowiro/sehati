import { Clock, CheckCircle2, XCircle, AlertCircle, Home, LogIn, LogOut } from 'lucide-react'

interface AbsensiRow {
  id: string
  tanggal: string
  checkin_time: string | null
  checkout_time: string | null
  status: string
  is_late: boolean
  menit_terlambat: number | null
}

function fmt(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
  })
}

function fmtTanggal(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function durasiMenit(checkin: string, checkout: string) {
  const m = Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 60000)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}j ${m % 60}m`
}

const statusMap = {
  hadir:       { icon: CheckCircle2, color: 'text-green-500',  bg: 'bg-green-500/10 border-green-500/20',  label: 'Hadir' },
  wfh:         { icon: Home,         color: 'text-blue-500',   bg: 'bg-blue-500/10 border-blue-500/20',   label: 'WFH' },
  terlambat:   { icon: AlertCircle,  color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20', label: 'Terlambat' },
  tidak_hadir: { icon: XCircle,      color: 'text-zinc-400',   bg: 'bg-zinc-500/10 border-zinc-500/20',   label: 'Tidak Hadir' },
}

export default function HistoryTable({ data }: { data: AbsensiRow[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
        <p className="text-zinc-500 text-sm">Belum ada data absensi bulan ini</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
        <Clock size={15} className="text-zinc-400" />
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Riwayat Bulan Ini</h3>
        <span className="ml-auto text-xs text-zinc-400">{data.length} hari</span>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {data.map((row) => {
          const s = statusMap[row.status as keyof typeof statusMap] ?? statusMap.tidak_hadir
          const Icon = s.icon
          const checkin = fmt(row.checkin_time)
          const checkout = fmt(row.checkout_time)
          const durasi = row.checkin_time && row.checkout_time
            ? durasiMenit(row.checkin_time, row.checkout_time)
            : null

          return (
            <div key={row.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
              {/* Status icon */}
              <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${s.bg}`}>
                <Icon size={14} className={s.color} />
              </div>

              {/* Tanggal + status */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {fmtTanggal(row.tanggal)}
                  </span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${s.bg} ${s.color}`}>
                    {s.label}
                    {row.is_late && row.menit_terlambat ? ` +${row.menit_terlambat}m` : ''}
                  </span>
                </div>
                {/* Jam masuk/pulang — tampil di mobile */}
                <div className="flex items-center gap-3 mt-1 sm:hidden">
                  {checkin && (
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      <LogIn size={10} className="text-green-500" /> {checkin}
                    </span>
                  )}
                  {checkout && (
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      <LogOut size={10} className="text-red-400" /> {checkout}
                    </span>
                  )}
                  {durasi && (
                    <span className="text-xs text-zinc-400">{durasi}</span>
                  )}
                </div>
              </div>

              {/* Jam masuk/pulang + durasi — tampil di desktop */}
              <div className="hidden sm:flex items-center gap-4 shrink-0 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <LogIn size={11} className="text-green-500" />
                  {checkin ?? '—'}
                </span>
                <span className="flex items-center gap-1">
                  <LogOut size={11} className="text-red-400" />
                  {checkout ?? '—'}
                </span>
                <span className="w-12 text-right text-zinc-400">{durasi ?? '—'}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
