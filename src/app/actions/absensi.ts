'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function sudahJamPulang(kantor: { jam_pulang_senin_kamis: string; jam_pulang_jumat: string }) {
  const now = new Date()
  const hari = now.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Jakarta' })
  const jamPulang = hari === 'Fri' ? kantor.jam_pulang_jumat : kantor.jam_pulang_senin_kamis
  const [h, m] = jamPulang.split(':').map(Number)
  const pulangToday = new Date(now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }))
  pulangToday.setHours(h - 7, m, 0, 0) // UTC: WIB - 7
  return now >= pulangToday
}

export async function checkin(data: { lat: number; lng: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

  const { data: kantor } = await supabase
    .from('kantor_config')
    .select('lat, lng, radius_meter, jam_pulang_senin_kamis, jam_pulang_jumat')
    .eq('is_active', true)
    .maybeSingle()

  if (!kantor) return { error: 'Konfigurasi kantor belum diatur' }

  const jarak = haversineMeters(data.lat, data.lng, kantor.lat, kantor.lng)
  const is_wfh = jarak > kantor.radius_meter

  const { data: existing } = await supabase
    .from('absensi')
    .select('id, checkin_time, checkout_time, status')
    .eq('user_id', user.id)
    .eq('tanggal', today)
    .maybeSingle()

  const now = new Date().toISOString()

  // Case 3: Sudah checkin & checkout → perbarui checkout jika sudah jam pulang
  if (existing?.checkin_time && existing?.checkout_time) {
    if (!sudahJamPulang(kantor)) {
      return { error: 'Belum waktunya jam pulang untuk memperbarui absensi' }
    }
    const { error } = await supabase
      .from('absensi')
      .update({ checkout_time: now, checkout_lat: data.lat, checkout_lng: data.lng })
      .eq('id', existing.id)
    if (error) return { error: error.message }
    revalidatePath('/absensi')
    return { success: true, action: 'update_checkout' }
  }

  // Case 2: Sudah checkin, belum checkout → klik lagi = pulang
  if (existing?.checkin_time && !existing?.checkout_time) {
    // Jika checkin di kantor (bukan WFH) tapi sekarang di luar radius → minta konfirmasi
    if (existing.status !== 'wfh' && is_wfh) {
      return { needsWfhConfirm: true }
    }
    const { error } = await supabase
      .from('absensi')
      .update({ checkout_time: now, checkout_lat: data.lat, checkout_lng: data.lng })
      .eq('id', existing.id)
    if (error) return { error: error.message }
    revalidatePath('/absensi')
    return { success: true, action: 'checkout', pulang_cepat: !sudahJamPulang(kantor) }
  }

  // Case 1: Belum checkin → lakukan check-in
  const status = is_wfh ? 'wfh' : 'hadir'

  if (existing) {
    const { error } = await supabase
      .from('absensi')
      .update({ checkin_time: now, checkin_lat: data.lat, checkin_lng: data.lng, status })
      .eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('absensi')
      .insert({
        user_id: user.id,
        tanggal: today,
        checkin_time: now,
        checkin_lat: data.lat,
        checkin_lng: data.lng,
        status,
      })
    if (error) return { error: error.message }
  }

  revalidatePath('/absensi')
  return { success: true, action: 'checkin', is_wfh }
}

/** Dipanggil setelah user konfirmasi: ubah absensi hari ini jadi WFH penuh */
export async function konfirmasiPulangWfh(data: { lat: number; lng: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('absensi')
    .update({
      status: 'wfh',
      checkout_time: now,
      checkout_lat: data.lat,
      checkout_lng: data.lng,
    })
    .eq('user_id', user.id)
    .eq('tanggal', today)
    .not('checkin_time', 'is', null)

  if (error) return { error: error.message }
  revalidatePath('/absensi')
  return { success: true }
}

export async function checkout(data: { lat: number; lng: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

  const { error } = await supabase
    .from('absensi')
    .update({
      checkout_time: new Date().toISOString(),
      checkout_lat: data.lat,
      checkout_lng: data.lng,
    })
    .eq('user_id', user.id)
    .eq('tanggal', today)
    .not('checkin_time', 'is', null)

  if (error) return { error: error.message }

  revalidatePath('/absensi')
  return { success: true }
}

export async function ajukanKoreksi(data: {
  absensi_id: string
  jenis: 'koreksi_checkin' | 'koreksi_checkout' | 'dispensasi'
  alasan: string
  waktu_koreksi?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { error } = await supabase
    .from('absensi_koreksi')
    .insert({
      absensi_id: data.absensi_id,
      user_id: user.id,
      jenis: data.jenis,
      alasan: data.alasan,
      waktu_koreksi: data.waktu_koreksi || null,
    })

  if (error) return { error: error.message }

  revalidatePath('/absensi')
  return { success: true }
}

export async function prosesKoreksi(
  koreksiId: string,
  action: 'disetujui' | 'ditolak',
  catatan?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { error } = await supabase
    .from('absensi_koreksi')
    .update({
      status: action,
      diproses_oleh: user.id,
      catatan_prosesor: catatan || null,
      diproses_at: new Date().toISOString(),
    })
    .eq('id', koreksiId)

  if (error) return { error: error.message }

  revalidatePath('/admin/absensi')
  revalidatePath('/absensi')
  return { success: true }
}

export async function updateKantorConfig(data: {
  nama: string
  lat: number
  lng: number
  radius_meter: number
  jam_masuk: string
  toleransi_menit: number
  jam_pulang_senin_kamis: string
  jam_pulang_jumat: string
}) {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('kantor_config')
    .select('id')
    .eq('is_active', true)
    .maybeSingle()

  let error
  if (existing) {
    ({ error } = await supabase
      .from('kantor_config')
      .update(data)
      .eq('id', existing.id))
  } else {
    ({ error } = await supabase
      .from('kantor_config')
      .insert({ ...data, is_active: true }))
  }

  if (error) return { error: error.message }

  revalidatePath('/admin/kantor')
  revalidatePath('/absensi')
  return { success: true }
}
