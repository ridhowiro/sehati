'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, Loader2, LogIn, LogOut, RefreshCw, AlertTriangle } from 'lucide-react'
import { checkin, konfirmasiPulangWfh } from '@/app/actions/absensi'

const AbsensiMap = dynamic(() => import('./absensi-map'), { ssr: false, loading: () => (
  <div className="rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" style={{ height: 280 }} />
)})

interface KantorConfig {
  lat: number
  lng: number
  radius_meter: number
  jam_masuk: string
  toleransi_menit: number
  jam_pulang_senin_kamis: string
  jam_pulang_jumat: string
}

interface AbsensiHariIni {
  id: string
  checkin_time: string | null
  checkout_time: string | null
  status: string
  is_late: boolean
  menit_terlambat: number | null
  wajib_checkout: string | null
}

interface CheckinCardProps {
  kantor: KantorConfig
  absensiHariIni: AbsensiHariIni | null
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
  })
}

const statusConfig = {
  hadir: { label: 'Hadir', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  wfh: { label: 'WFH', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  terlambat: { label: 'Terlambat', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  tidak_hadir: { label: 'Belum Absen', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' },
}

export default function CheckinCard({ kantor, absensiHariIni }: CheckinCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lokasi, setLokasi] = useState<{ lat: number; lng: number; jarak: number } | null>(null)
  const [fetchingLokasi, setFetchingLokasi] = useState(false)
  const [gpsBlocked, setGpsBlocked] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [confirmWfh, setConfirmWfh] = useState(false)

  const sudahCheckin = !!absensiHariIni?.checkin_time
  const sudahCheckout = !!absensiHariIni?.checkout_time
  const dalamRadius = lokasi ? lokasi.jarak <= kantor.radius_meter : false

  useEffect(() => {
    ambilLokasi()
  }, [])

  const ambilLokasi = () => {
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung GPS.')
      return
    }
    setFetchingLokasi(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const jarak = haversineDistance(
          pos.coords.latitude, pos.coords.longitude,
          kantor.lat, kantor.lng
        )
        setLokasi({ lat: pos.coords.latitude, lng: pos.coords.longitude, jarak })
        setFetchingLokasi(false)
        setGpsBlocked(false)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsBlocked(true)
          setError('Akses GPS ditolak. Aktifkan izin lokasi di pengaturan browser/HP.')
        } else {
          setError('Tidak dapat mengambil lokasi. Coba lagi.')
        }
        setFetchingLokasi(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // Tombol check-in multi-state:
  // 1. Belum checkin → check-in (auto WFH jika luar radius)
  // 2. Sudah checkin, belum checkout → klik lagi = pulang (cepat/tepat)
  // 3. Sudah checkin + checkout → perbarui waktu pulang (jika sudah jam pulang)
  const checkinLabel = () => {
    if (!sudahCheckin) return dalamRadius ? 'Check-in' : 'Check-in (WFH)'
    if (!sudahCheckout) return 'Tandai Pulang'
    return 'Perbarui Waktu Pulang'
  }

  const checkinIcon = () => {
    if (!sudahCheckin) return <LogIn size={15} />
    return <LogOut size={15} />
  }

  const handleCheckinBtn = async () => {
    if (!lokasi) return
    setLoading(true)
    setError(null)
    setSuccessMsg(null)
    const res = await checkin({ lat: lokasi.lat, lng: lokasi.lng })
    if ('needsWfhConfirm' in res && res.needsWfhConfirm) {
      setConfirmWfh(true)
    } else if (res.error) {
      setError(res.error)
    } else if (res.action === 'checkout' && res.pulang_cepat) {
      setSuccessMsg('Waktu pulang tercatat. Catatan: pulang lebih awal dari jam kerja.')
    } else if (res.action === 'update_checkout') {
      setSuccessMsg('Waktu pulang diperbarui.')
    }
    setLoading(false)
  }

  const handleKonfirmasiWfh = async () => {
    if (!lokasi) return
    setLoading(true)
    setConfirmWfh(false)
    const res = await konfirmasiPulangWfh({ lat: lokasi.lat, lng: lokasi.lng })
    if (res.error) setError(res.error)
    else setSuccessMsg('Absensi diubah menjadi WFH satu hari penuh.')
    setLoading(false)
  }

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })

  const status = absensiHariIni?.status ?? 'tidak_hadir'
  const st = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.tidak_hadir

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-white">Absensi Hari Ini</h3>
          <p className="text-xs text-zinc-500 mt-0.5">{today}</p>
        </div>
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${st.color}`}>
          {st.label}
        </span>
      </div>

      {/* Info checkin/checkout */}
      {sudahCheckin && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-1">Check-in</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              {formatTime(absensiHariIni!.checkin_time!)}
            </p>
            {absensiHariIni?.is_late && (
              <p className="text-xs text-yellow-500 mt-0.5">
                Terlambat {absensiHariIni.menit_terlambat} menit
              </p>
            )}
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-1">Check-out</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              {sudahCheckout ? formatTime(absensiHariIni!.checkout_time!) : '—'}
            </p>
            {absensiHariIni?.wajib_checkout && !sudahCheckout && (
              <p className="text-xs text-zinc-400 mt-0.5">
                Wajib: {formatTime(absensiHariIni.wajib_checkout)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Peta */}
      <div className="space-y-2">
        <AbsensiMap
          officeLat={kantor.lat}
          officeLng={kantor.lng}
          radiusMeter={kantor.radius_meter}
          userLat={lokasi?.lat}
          userLng={lokasi?.lng}
        />

        {fetchingLokasi && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Loader2 size={12} className="animate-spin" />
            Mendeteksi lokasi GPS...
          </div>
        )}

        {lokasi && !fetchingLokasi && (
          <div className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${
            dalamRadius
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
          }`}>
            <span className="flex items-center gap-1.5">
              <MapPin size={11} />
              {Math.round(lokasi.jarak)} m dari kantor
              {dalamRadius ? ' — dalam area ✓' : ' — di luar area (WFH)'}
            </span>
            <button
              onClick={ambilLokasi}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 ml-2"
              title="Refresh lokasi"
            >
              <RefreshCw size={11} />
            </button>
          </div>
        )}

        {gpsBlocked && (
          <p className="text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">
            Izin GPS ditolak. Buka pengaturan browser/HP → izinkan akses lokasi → muat ulang halaman.
          </p>
        )}
      </div>

      {/* Pesan sukses */}
      {successMsg && (
        <div className="flex items-start gap-2 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 px-3 py-2 rounded-lg">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          {successMsg}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Dialog konfirmasi WFH */}
      {confirmWfh && (
        <div className="rounded-lg border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={15} className="text-orange-500 mt-0.5 shrink-0" />
            <p className="text-sm text-orange-800 dark:text-orange-300">
              Anda berada di luar area kantor. Jika lanjut, absensi hari ini akan diubah menjadi <strong>WFH satu hari penuh</strong>.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleKonfirmasiWfh}
              disabled={loading}
              className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
            >
              {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Ya, ubah ke WFH'}
            </button>
            <button
              onClick={() => setConfirmWfh(false)}
              className="flex-1 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Satu tombol absensi */}
      {!confirmWfh && (
        <button
          onClick={handleCheckinBtn}
          disabled={loading || !lokasi || fetchingLokasi}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : checkinIcon()}
          {checkinLabel()}
        </button>
      )}

      {!lokasi && !fetchingLokasi && !gpsBlocked && (
        <button
          onClick={ambilLokasi}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <MapPin size={14} />
          Ambil Lokasi GPS Manual
        </button>
      )}

      {/* Info jam kantor */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-1.5 text-xs text-zinc-400">
        <div>Masuk: <span className="text-zinc-600 dark:text-zinc-300">{kantor.jam_masuk.slice(0, 5)}</span></div>
        <div>Toleransi: <span className="text-zinc-600 dark:text-zinc-300">{kantor.toleransi_menit} menit</span></div>
        <div>Pulang Sen–Kam: <span className="text-zinc-600 dark:text-zinc-300">{kantor.jam_pulang_senin_kamis.slice(0, 5)}</span></div>
        <div>Pulang Jum: <span className="text-zinc-600 dark:text-zinc-300">{kantor.jam_pulang_jumat.slice(0, 5)}</span></div>
      </div>
    </div>
  )
}
