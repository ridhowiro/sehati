'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2, MapPin, Navigation } from 'lucide-react'
import { updateKantorConfig } from '@/app/actions/absensi'

const MapPicker = dynamic(() => import('./map-picker'), { ssr: false, loading: () => (
  <div className="rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" style={{ height: 320 }} />
)})

interface KantorConfig {
  nama: string
  lat: number
  lng: number
  radius_meter: number
  jam_masuk: string
  toleransi_menit: number
  jam_pulang_senin_kamis: string
  jam_pulang_jumat: string
}

interface KantorConfigFormProps {
  kantor: KantorConfig | null
}

export default function KantorConfigForm({ kantor }: KantorConfigFormProps) {
  const [form, setForm] = useState<KantorConfig>({
    nama: kantor?.nama ?? 'Kantor PMU HETI',
    lat: kantor?.lat ?? -6.2088,
    lng: kantor?.lng ?? 106.8456,
    radius_meter: kantor?.radius_meter ?? 100,
    jam_masuk: kantor?.jam_masuk?.slice(0, 5) ?? '07:30',
    toleransi_menit: kantor?.toleransi_menit ?? 30,
    jam_pulang_senin_kamis: kantor?.jam_pulang_senin_kamis?.slice(0, 5) ?? '16:00',
    jam_pulang_jumat: kantor?.jam_pulang_jumat?.slice(0, 5) ?? '15:30',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchingGps, setFetchingGps] = useState(false)

  const set = (key: keyof KantorConfig, val: string | number) =>
    setForm(prev => ({ ...prev, [key]: val }))

  const ambilLokasiSekarang = () => {
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung GPS.')
      return
    }
    setFetchingGps(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('lat', pos.coords.latitude)
        set('lng', pos.coords.longitude)
        setFetchingGps(false)
      },
      () => {
        setError('Tidak dapat mengambil lokasi GPS.')
        setFetchingGps(false)
      },
      { enableHighAccuracy: true }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const res = await updateKantorConfig({
      ...form,
      lat: Number(form.lat),
      lng: Number(form.lng),
      radius_meter: Number(form.radius_meter),
      toleransi_menit: Number(form.toleransi_menit),
      jam_masuk: form.jam_masuk + ':00',
      jam_pulang_senin_kamis: form.jam_pulang_senin_kamis + ':00',
      jam_pulang_jumat: form.jam_pulang_jumat + ':00',
    })

    if (res.error) setError(res.error)
    else setSuccess(true)
    setLoading(false)
  }

  const inputClass = 'w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400'
  const labelClass = 'block text-xs text-zinc-500 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Nama */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Informasi Kantor</h3>
        <div>
          <label className={labelClass}>Nama Kantor</label>
          <input
            type="text"
            value={form.nama}
            onChange={(e) => set('nama', e.target.value)}
            required
            className={inputClass}
          />
        </div>
      </div>

      {/* Peta + koordinat */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Lokasi Kantor</h3>
          <button
            type="button"
            onClick={ambilLokasiSekarang}
            disabled={fetchingGps}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-lg"
          >
            {fetchingGps ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
            Gunakan lokasi saya
          </button>
        </div>

        {/* Peta interaktif */}
        <MapPicker
          lat={Number(form.lat)}
          lng={Number(form.lng)}
          radiusMeter={Number(form.radius_meter)}
          onChange={(lat, lng) => { set('lat', lat); set('lng', lng) }}
        />

        {/* Koordinat manual */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Latitude</label>
            <input
              type="number"
              step="any"
              value={form.lat}
              onChange={(e) => set('lat', e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Longitude</label>
            <input
              type="number"
              step="any"
              value={form.lng}
              onChange={(e) => set('lng', e.target.value)}
              required
              className={inputClass}
            />
          </div>
        </div>

        {/* Radius */}
        <div>
          <label className={labelClass}>Radius Geofencing (meter)</label>
          <input
            type="number"
            min={10}
            max={5000}
            value={form.radius_meter}
            onChange={(e) => set('radius_meter', e.target.value)}
            required
            className={inputClass}
          />
          <p className="text-xs text-zinc-400 mt-1">
            Karyawan harus berada dalam radius ini untuk bisa check-in
          </p>
        </div>
      </div>

      {/* Jam kerja */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Jam Kerja</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Jam Masuk</label>
            <input type="time" value={form.jam_masuk} onChange={(e) => set('jam_masuk', e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Toleransi Keterlambatan (menit)</label>
            <input type="number" min={0} max={120} value={form.toleransi_menit} onChange={(e) => set('toleransi_menit', e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Jam Pulang Senin–Kamis</label>
            <input type="time" value={form.jam_pulang_senin_kamis} onChange={(e) => set('jam_pulang_senin_kamis', e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Jam Pulang Jumat</label>
            <input type="time" value={form.jam_pulang_jumat} onChange={(e) => set('jam_pulang_jumat', e.target.value)} required className={inputClass} />
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
      {success && <p className="text-xs text-green-500 bg-green-500/10 px-3 py-2 rounded-lg">Konfigurasi berhasil disimpan</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors disabled:opacity-40"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        Simpan Konfigurasi
      </button>
    </form>
  )
}
