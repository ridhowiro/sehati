'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus, X, Clock, MapPin, User, CalendarDays, BookOpen, BookMarked } from 'lucide-react'
import { cn } from '@/lib/utils'
import AgendaForm from './agenda-form'
import LogEntryForm from './log-entry-form'
import { deleteAgenda } from '@/app/actions/agenda'

type HariLibur = { tanggal: string; nama: string; jenis: string }
type AgendaItem = {
  id: string
  judul: string
  tanggal: string
  tanggal_selesai: string | null
  waktu_mulai: string | null
  waktu_selesai: string | null
  lokasi: string | null
  deskripsi: string | null
  creator_id: string
  users: { full_name: string } | null
}
type IzinItem = { tanggal_mulai: string; tanggal_selesai: string; jenis: string; status: string }

type LogEntry = {
  tanggal: string
  kegiatan: string
  output: string | null
  status_kegiatan: string
}

interface Props {
  year: number
  month: number
  today: string
  hariLibur: HariLibur[]
  agendaList: AgendaItem[]
  izinSaya: IzinItem[]
  logDates: string[]
  logEntries: LogEntry[]
  userId: string
  isKaryawan?: boolean
}

const BULAN_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const HARI_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

const jenisIzinLabel: Record<string, string> = {
  surat_tugas: 'Surat Tugas', cuti: 'Cuti', sakit: 'Sakit', izin: 'Izin',
}

function formatTime(t: string | null) {
  if (!t) return ''
  return t.slice(0, 5)
}

const statusKegiatanConfig: Record<string, { label: string; color: string }> = {
  selesai:  { label: 'Selesai',  color: 'text-green-600 dark:text-green-400 bg-green-500/10' },
  proses:   { label: 'Proses',   color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10' },
  ditunda:  { label: 'Ditunda',  color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10' },
}

export default function AgendaCalendar({
  year, month, today, hariLibur, agendaList, izinSaya, logDates, logEntries = [], userId, isKaryawan = false,
}: Props) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [prefilledDate, setPrefilledDate] = useState<string>('')
  const [showLogForm, setShowLogForm] = useState(false)
  const [logPrefill, setLogPrefill] = useState<{ kegiatan?: string; tag_kategori?: string; dariAgenda?: boolean } | undefined>()
  const [localLogEntries, setLocalLogEntries] = useState<LogEntry[]>(logEntries)

  // Build lookup maps
  const liburMap = new Map(hariLibur.map(h => [h.tanggal, h]))
  const logByDate = new Map<string, LogEntry[]>()
  for (const l of localLogEntries) {
    if (!logByDate.has(l.tanggal)) logByDate.set(l.tanggal, [])
    logByDate.get(l.tanggal)!.push(l)
  }
  const agendaByDate = new Map<string, AgendaItem[]>()
  for (const a of agendaList) {
    const end = a.tanggal_selesai ?? a.tanggal
    const cur = new Date(a.tanggal + 'T00:00:00')
    const endDate = new Date(end + 'T00:00:00')
    while (cur <= endDate) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
      if (!agendaByDate.has(key)) agendaByDate.set(key, [])
      agendaByDate.get(key)!.push(a)
      cur.setDate(cur.getDate() + 1)
    }
  }
  const logSet = new Set([...logDates, ...localLogEntries.map(l => l.tanggal)])

  // Check if a date falls within an izin range
  function getIzinForDate(dateStr: string): IzinItem | null {
    return izinSaya.find(i => i.tanggal_mulai <= dateStr && i.tanggal_selesai >= dateStr) ?? null
  }

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null)

  function navMonth(delta: number) {
    let m = month + delta
    let y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    router.push(`/agenda?month=${y}-${String(m).padStart(2, '0')}`)
  }

  function toDateStr(day: number) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const selectedAgenda = selectedDate ? (agendaByDate.get(selectedDate) ?? []) : []
  const selectedLibur = selectedDate ? liburMap.get(selectedDate) : null
  const selectedIzin = selectedDate ? getIzinForDate(selectedDate) : null
  const selectedHasLog = selectedDate ? logSet.has(selectedDate) : false
  const selectedLogEntries = selectedDate ? (logByDate.get(selectedDate) ?? []) : []

  async function handleDelete(id: string) {
    setDeletingId(id)
    await deleteAgenda(id)
    setDeletingId(null)
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Kalender */}
      <div className="xl:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Nav header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <button
            onClick={() => navMonth(-1)}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            {BULAN_ID[month - 1]} {year}
          </h3>
          <button
            onClick={() => navMonth(1)}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800">
          {HARI_ID.map(h => (
            <div key={h} className={cn(
              'py-2 text-center text-xs font-medium',
              h === 'Min' ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'
            )}>{h}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day) return (
              <div key={`empty-${i}`} className="h-20 sm:h-24 border-b border-r border-zinc-100 dark:border-zinc-800 last:border-r-0" />
            )

            const dateStr = toDateStr(day)
            const isToday = dateStr === today
            const isSelected = dateStr === selectedDate
            const libur = liburMap.get(dateStr)
            const agenda = agendaByDate.get(dateStr) ?? []
            const izin = getIzinForDate(dateStr)
            const hasLog = logSet.has(dateStr)
            const isSunday = (firstDayOfMonth + day - 1) % 7 === 0

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={cn(
                  'relative h-20 sm:h-24 border-b border-r border-zinc-100 dark:border-zinc-800 p-1.5 text-left',
                  'transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                  (i + 1) % 7 === 0 && 'border-r-0',
                  isSelected && 'bg-blue-50 dark:bg-blue-950/30',
                  libur && !isSelected && 'bg-red-50/60 dark:bg-red-950/20',
                )}
              >
                {/* Day number */}
                <div className={cn(
                  'w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1',
                  isToday ? 'bg-blue-600 text-white' : (
                    libur || isSunday ? 'text-red-500' : 'text-zinc-700 dark:text-zinc-300'
                  )
                )}>
                  {day}
                </div>

                {/* Indicators */}
                <div className="space-y-0.5">
                  {agenda.slice(0, 2).map(a => (
                    <div key={a.id} className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded px-1 truncate leading-tight py-0.5">
                      {a.judul}
                    </div>
                  ))}
                  {agenda.length > 2 && (
                    <div className="text-[10px] text-zinc-400">+{agenda.length - 2} lagi</div>
                  )}
                  {izin && (
                    <div className="text-[10px] bg-orange-500/10 text-orange-700 dark:text-orange-400 rounded px-1 truncate leading-tight py-0.5">
                      {jenisIzinLabel[izin.jenis] ?? izin.jenis}
                    </div>
                  )}
                </div>

                {/* Log dot */}
                {hasLog && (
                  <div className="absolute bottom-1 right-1.5 w-1.5 h-1.5 bg-green-500 rounded-full" />
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <div className="w-3 h-3 bg-blue-600 rounded-full" />
            <span>Hari ini</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <div className="w-3 h-2 bg-blue-500/20 rounded" />
            <span>Agenda</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <div className="w-3 h-2 bg-red-50 border border-red-200 rounded" />
            <span>Libur</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <div className="w-3 h-2 bg-orange-500/20 rounded" />
            <span>Izin/Cuti</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span>Ada log</span>
          </div>
        </div>
      </div>

      {/* Panel kanan: detail + tambah */}
      <div className="space-y-3">
        {/* Tambah agenda */}
        <button
          onClick={() => {
            setPrefilledDate(selectedDate ?? today)
            setShowForm(true)
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus size={16} />
          Tambah Agenda
        </button>

        {/* Detail tanggal terpilih */}
        {selectedDate ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">Detail tanggal</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Libur */}
              {selectedLibur && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg px-3 py-2">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400">
                    {selectedLibur.jenis === 'nasional' ? 'Hari Libur Nasional' : 'Cuti Bersama'}
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-300 font-semibold">{selectedLibur.nama}</p>
                </div>
              )}

              {/* Izin kamu */}
              {selectedIzin && (
                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 rounded-lg px-3 py-2">
                  <p className="text-xs font-medium text-orange-700 dark:text-orange-400">Status kamu</p>
                  <p className="text-sm text-orange-800 dark:text-orange-300 font-semibold">
                    {jenisIzinLabel[selectedIzin.jenis] ?? selectedIzin.jenis}
                  </p>
                </div>
              )}

              {/* Log entries */}
              {(selectedHasLog || selectedLogEntries.length > 0) && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <BookOpen size={13} className="text-green-600 dark:text-green-400 shrink-0" />
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                        Log Harian ({selectedLogEntries.length})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isKaryawan && (
                        <>
                          <button
                            onClick={() => { setLogPrefill(undefined); setShowLogForm(true) }}
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                          >
                            + Tambah log
                          </button>
                          <span className="text-zinc-300 dark:text-zinc-700">|</span>
                        </>
                      )}
                      <Link
                        href="/log"
                        className="text-[11px] text-zinc-500 dark:text-zinc-400 hover:underline whitespace-nowrap"
                        onClick={e => e.stopPropagation()}
                      >
                        Buka log →
                      </Link>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {selectedLogEntries.map((l, i) => {
                      const st = statusKegiatanConfig[l.status_kegiatan] ?? statusKegiatanConfig.selesai
                      return (
                        <div key={i} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-snug flex-1">{l.kegiatan}</p>
                            <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0', st.color)}>
                              {st.label}
                            </span>
                          </div>
                          {l.output && (
                            <p className="text-[11px] text-zinc-400 leading-snug">{l.output}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Agenda */}
              {selectedAgenda.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Agenda</p>
                  {selectedAgenda.map(a => (
                    <div key={a.id} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 space-y-2">
                      {/* Header: judul + hapus */}
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-snug">{a.judul}</p>
                        {a.creator_id === userId && (
                          <button
                            onClick={() => handleDelete(a.id)}
                            disabled={deletingId === a.id}
                            className="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="space-y-1">
                        {a.tanggal_selesai && a.tanggal_selesai !== a.tanggal && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <CalendarDays size={12} />
                            {new Date(a.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            {' – '}
                            {new Date(a.tanggal_selesai + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                        {(a.waktu_mulai || a.waktu_selesai) && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <Clock size={12} />
                            {formatTime(a.waktu_mulai)}{a.waktu_selesai ? ` – ${formatTime(a.waktu_selesai)}` : ''}
                          </div>
                        )}
                        {a.lokasi && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <MapPin size={12} />
                            {a.lokasi}
                          </div>
                        )}
                        {a.deskripsi && (
                          <p className="text-xs text-zinc-500 leading-relaxed">{a.deskripsi}</p>
                        )}
                        {a.users && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <User size={12} />
                            {a.users.full_name}
                          </div>
                        )}
                      </div>

                      {/* Aksi: Jadikan Log — hanya karyawan */}
                      {isKaryawan && (
                        <div className="pt-1 border-t border-zinc-200 dark:border-zinc-700">
                          <button
                            onClick={() => {
                              setLogPrefill({ kegiatan: a.judul, tag_kategori: 'Rapat', dariAgenda: true })
                              setShowLogForm(true)
                            }}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                          >
                            <BookMarked size={12} />
                            Jadikan log harian saya
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                !selectedLibur && !selectedIzin && !selectedHasLog && (
                  <div className="text-center py-6">
                    <CalendarDays size={28} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                    <p className="text-xs text-zinc-400">Tidak ada agenda di tanggal ini</p>
                    <button
                      onClick={() => {
                        setPrefilledDate(selectedDate)
                        setShowForm(true)
                      }}
                      className="mt-2 text-xs text-blue-600 hover:underline"
                    >
                      Tambah agenda
                    </button>
                  </div>
                )
              )}

              {/* Belum ada log — hanya karyawan */}
              {isKaryawan && !selectedHasLog && selectedLogEntries.length === 0 && (
                <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={13} className="text-zinc-400 shrink-0" />
                    <span className="text-xs text-zinc-400">Belum ada log harian</span>
                  </div>
                  <button
                    onClick={() => { setLogPrefill(undefined); setShowLogForm(true) }}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                  >
                    + Tambah log
                  </button>
                </div>
              )}

              {/* Tampil kalau tidak ada agenda */}
              {selectedAgenda.length === 0 && (
                <div className="pt-1 text-center">
                  <p className="text-xs text-zinc-400">Belum ada agenda di tanggal ini</p>
                  <button
                    onClick={() => {
                      setPrefilledDate(selectedDate!)
                      setShowForm(true)
                    }}
                    className="mt-1 text-xs text-blue-600 hover:underline"
                  >
                    + Tambah agenda
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 text-center">
            <CalendarDays size={32} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="text-sm text-zinc-500">Pilih tanggal untuk melihat detail</p>
          </div>
        )}

        {/* Agenda bulan ini */}
        {agendaList.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Semua agenda bulan ini
              </p>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-64 overflow-y-auto">
              {agendaList.map(a => (
                <button
                  key={a.id}
                  onClick={() => setSelectedDate(a.tanggal)}
                  className="w-full px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 text-center shrink-0">
                      <p className="text-xs text-zinc-400">{new Date(a.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { month: 'short' })}</p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white leading-none">
                        {new Date(a.tanggal + 'T00:00:00').getDate()}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-800 dark:text-zinc-200 truncate font-medium">{a.judul}</p>
                      {a.tanggal_selesai && a.tanggal_selesai !== a.tanggal ? (
                        <p className="text-xs text-zinc-400">
                          s.d. {new Date(a.tanggal_selesai + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </p>
                      ) : a.waktu_mulai ? (
                        <p className="text-xs text-zinc-400">{formatTime(a.waktu_mulai)}{a.waktu_selesai ? ` – ${formatTime(a.waktu_selesai)}` : ''}</p>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Agenda form modal */}
      {showForm && (
        <AgendaForm
          prefilledDate={prefilledDate}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Log entry form modal */}
      {showLogForm && selectedDate && (
        <LogEntryForm
          tanggal={selectedDate}
          year={year}
          month={month}
          userId={userId}
          prefill={logPrefill}
          onClose={() => { setShowLogForm(false); setLogPrefill(undefined) }}
          onSaved={(entry) => setLocalLogEntries(prev => [...prev, entry])}
        />
      )}
    </div>
  )
}
