import { Clock, CheckCircle2, XCircle, AlertCircle, Home } from 'lucide-react'

interface AbsensiRow {
  id: string
  tanggal: string
  checkin_time: string | null
  checkout_time: string | null
  status: string
  is_late: boolean
  menit_terlambat: number | null
}

interface HistoryTableProps {
  data: AbsensiRow[]
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
  })
}

function fmtTanggal(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

const statusIcon = {
  hadir: <CheckCircle2 size={14} className="text-green-500" />,
  wfh: <Home size={14} className="text-blue-500" />,
  terlambat: <AlertCircle size={14} className="text-yellow-500" />,
  tidak_hadir: <XCircle size={14} className="text-zinc-400" />,
}

const statusLabel = {
  hadir: 'Hadir',
  wfh: 'WFH',
  terlambat: 'Terlambat',
  tidak_hadir: 'Tidak Hadir',
}

export default function HistoryTable({ data }: HistoryTableProps) {
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
        <Clock size={16} className="text-zinc-400" />
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Riwayat Bulan Ini</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <th className="text-left px-4 py-2.5 font-medium text-zinc-500 text-xs">Tanggal</th>
            <th className="text-left px-4 py-2.5 font-medium text-zinc-500 text-xs">Status</th>
            <th className="text-left px-4 py-2.5 font-medium text-zinc-500 text-xs">Check-in</th>
            <th className="text-left px-4 py-2.5 font-medium text-zinc-500 text-xs">Check-out</th>
            <th className="text-left px-4 py-2.5 font-medium text-zinc-500 text-xs">Durasi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {data.map((row) => {
            let durasi = '—'
            if (row.checkin_time && row.checkout_time) {
              const menit = Math.round(
                (new Date(row.checkout_time).getTime() - new Date(row.checkin_time).getTime()) / 60000
              )
              durasi = `${Math.floor(menit / 60)}j ${menit % 60}m`
            }

            return (
              <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  {fmtTanggal(row.tanggal)}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                    {statusIcon[row.status as keyof typeof statusIcon] ?? statusIcon.tidak_hadir}
                    {statusLabel[row.status as keyof typeof statusLabel] ?? row.status}
                    {row.is_late && row.menit_terlambat && (
                      <span className="text-xs text-yellow-500">({row.menit_terlambat}m)</span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{fmt(row.checkin_time)}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{fmt(row.checkout_time)}</td>
                <td className="px-4 py-3 text-zinc-500">{durasi}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
