'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { FileDown, Sheet } from 'lucide-react'

const statusLabel: Record<string, string> = {
  hadir: 'Hadir', wfh: 'WFH', terlambat: 'Terlambat',
  tidak_hadir: 'Tidak Hadir', izin: 'Izin', sakit: 'Sakit', cuti: 'Cuti', surat_tugas: 'Surat Tugas',
}
const statusColor: Record<string, string> = {
  hadir:        'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-500/10 dark:border-green-500/20',
  wfh:          'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20',
  terlambat:    'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-500/10 dark:border-yellow-500/20',
  tidak_hadir:  'text-zinc-500 bg-zinc-50 border-zinc-200 dark:text-zinc-400 dark:bg-zinc-500/10 dark:border-zinc-500/20',
  izin:         'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-500/10 dark:border-orange-500/20',
  cuti:         'text-blue-500 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-400/10 dark:border-blue-400/20',
  sakit:        'text-red-500 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20',
  surat_tugas:  'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-500/10 dark:border-purple-500/20',
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
}
function fmtTgl(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

interface Period { bulan: number; tahun: number; label: string }
interface UserOpt { id: string; full_name: string; bidang_nama: string | null }
interface AbsensiRow { tanggal: string; status: string; checkin_time: string | null; checkout_time: string | null; is_late: boolean; menit_terlambat: number | null }
interface Rekap { user_id: string; full_name: string; bidang_nama: string | null; absensi: AbsensiRow[] }

interface Props {
  availablePeriods: Period[]
  activePeriod: Period
  userOptions: UserOpt[]
  activeUid: string | null
  rekapList: Rekap[]
  isKaryawan: boolean
}

export default function LaporanShell({ availablePeriods, activePeriod, userOptions, activeUid, rekapList, isKaryawan }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [xlsLoading, setXlsLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  function nav(bulan: number, tahun: number, uid?: string) {
    const p = new URLSearchParams({ bulan: String(bulan), tahun: String(tahun) })
    if (uid) p.set('uid', uid)
    router.push(`${pathname}?${p}`)
  }

  async function handleExcel() {
    setXlsLoading(true)
    try {
      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()
      for (const rekap of rekapList) {
        const rows = [
          [`REKAP ABSENSI — ${activePeriod.label}`],
          [`Nama: ${rekap.full_name}`],
          [`Bidang: ${rekap.bidang_nama || '-'}`],
          [],
          ['No', 'Tanggal', 'Status', 'Check-in', 'Check-out', 'Terlambat'],
          ...rekap.absensi.map((a, i) => [
            i + 1, fmtTgl(a.tanggal), statusLabel[a.status] || a.status,
            fmt(a.checkin_time), fmt(a.checkout_time),
            a.is_late ? `${a.menit_terlambat ?? 0} menit` : '-',
          ]),
          [],
          [`Total Hadir: ${rekap.absensi.filter(a => a.status === 'hadir' || a.status === 'terlambat').length} hari`],
          [`WFH: ${rekap.absensi.filter(a => a.status === 'wfh').length} hari`],
          [`Tidak Hadir: ${rekap.absensi.filter(a => a.status === 'tidak_hadir').length} hari`],
          [`Terlambat: ${rekap.absensi.filter(a => a.is_late).length} kali`],
        ]
        const ws = XLSX.utils.aoa_to_sheet(rows)
        ws['!cols'] = [{ wch: 5 }, { wch: 22 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }]
        XLSX.utils.book_append_sheet(wb, ws, rekap.full_name.slice(0, 28).replace(/[\\/*?:[\]]/g, '_'))
      }
      const label = rekapList.length === 1 ? rekapList[0].full_name : 'Semua'
      XLSX.writeFile(wb, `Absensi_${label}_${activePeriod.label.replace(' ', '_')}.xlsx`)
    } catch { alert('Gagal export Excel') }
    setXlsLoading(false)
  }

  async function handlePDF() {
    setPdfLoading(true)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const { AbsensiPDF } = await import('@/components/pdf/absensi-pdf')
      const React = await import('react')
      const blob = await pdf(
        React.createElement(AbsensiPDF, { rekapList, periode: activePeriod.label })
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const label = rekapList.length === 1 ? rekapList[0].full_name : 'Semua'
      a.download = `Absensi_${label}_${activePeriod.label.replace(' ', '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) { console.error(e); alert('Gagal export PDF') }
    setPdfLoading(false)
  }

  return (
    <div className="space-y-5">
      {/* Filter */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500 font-medium">Periode</label>
            <select
              value={`${activePeriod.tahun}-${activePeriod.bulan}`}
              onChange={e => {
                const [t, b] = e.target.value.split('-').map(Number)
                nav(b, t, activeUid ?? undefined)
              }}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white min-w-[160px]"
            >
              {availablePeriods.map(p => (
                <option key={`${p.tahun}-${p.bulan}`} value={`${p.tahun}-${p.bulan}`}>{p.label}</option>
              ))}
            </select>
          </div>

          {!isKaryawan && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500 font-medium">Karyawan</label>
              <select
                value={activeUid ?? ''}
                onChange={e => nav(activePeriod.bulan, activePeriod.tahun, e.target.value || undefined)}
                className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white min-w-[220px]"
              >
                <option value="">— Semua ({userOptions.length} karyawan) —</option>
                {userOptions.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name}{u.bidang_nama ? ` · ${u.bidang_nama}` : ''}</option>
                ))}
              </select>
            </div>
          )}

          {rekapList.length > 0 && (
            <div className="flex gap-2 ml-auto">
              <button onClick={handlePDF} disabled={pdfLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                <FileDown size={15} />{pdfLoading ? 'Generating...' : 'PDF'}
              </button>
              <button onClick={handleExcel} disabled={xlsLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
                <Sheet size={15} />{xlsLoading ? 'Generating...' : 'Excel'}
              </button>
            </div>
          )}
        </div>

        {/* Chip karyawan */}
        {!isKaryawan && userOptions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => nav(activePeriod.bulan, activePeriod.tahun)}
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs transition-colors border ${
                !activeUid ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}>Semua</button>
            {userOptions.map(u => (
              <button key={u.id} onClick={() => nav(activePeriod.bulan, activePeriod.tahun, u.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors border ${
                  activeUid === u.id ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                {u.full_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {rekapList.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-sm text-zinc-400">
          Tidak ada data absensi untuk periode ini
        </div>
      )}

      {rekapList.map(rekap => {
        const hadir = rekap.absensi.filter(a => a.status === 'hadir' || a.status === 'terlambat').length
        const wfh = rekap.absensi.filter(a => a.status === 'wfh').length
        const tidakHadir = rekap.absensi.filter(a => a.status === 'tidak_hadir').length
        const terlambat = rekap.absensi.filter(a => a.is_late).length

        return (
          <div key={rekap.user_id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <p className="font-semibold text-zinc-900 dark:text-white">{rekap.full_name}</p>
              {rekap.bidang_nama && <p className="text-xs text-zinc-500 mt-0.5">{rekap.bidang_nama}</p>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
              {[
                { label: 'Hadir / WFO', value: hadir, unit: 'hari' },
                { label: 'WFH', value: wfh, unit: 'hari' },
                { label: 'Tidak Hadir', value: tidakHadir, unit: 'hari' },
                { label: 'Terlambat', value: terlambat, unit: 'kali' },
              ].map(s => (
                <div key={s.label} className="bg-white dark:bg-zinc-900 px-4 py-3">
                  <p className="text-xs text-zinc-500">{s.label}</p>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-white mt-0.5">{s.value} <span className="text-sm font-normal text-zinc-400">{s.unit}</span></p>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500">Tanggal</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500">Status</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500">Check-in</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500">Check-out</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500">Terlambat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {rekap.absensi.map(a => (
                    <tr key={a.tanggal} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">{fmtTgl(a.tanggal)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[a.status] ?? statusColor.tidak_hadir}`}>
                          {statusLabel[a.status] || a.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400">{fmt(a.checkin_time)}</td>
                      <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400">{fmt(a.checkout_time)}</td>
                      <td className="px-4 py-2.5">
                        {a.is_late
                          ? <span className="text-yellow-500 text-xs font-medium">{a.menit_terlambat ?? 0} menit</span>
                          : <span className="text-zinc-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
