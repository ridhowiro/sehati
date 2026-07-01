'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/get-user-role'

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function hitungKeterlambatan(kantor: { jam_masuk: string; toleransi_menit: number }) {
  const now = new Date()
  const [h, m] = kantor.jam_masuk.split(':').map(Number)
  const batasMasuk = new Date(now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }))
  batasMasuk.setHours(h - 7, m + kantor.toleransi_menit, 0, 0) // UTC: WIB - 7
  const menitTerlambat = Math.round((now.getTime() - batasMasuk.getTime()) / 60000)
  return menitTerlambat > 0 ? menitTerlambat : 0
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
    .select('lat, lng, radius_meter, jam_masuk, toleransi_menit, jam_pulang_senin_kamis, jam_pulang_jumat')
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
  const menitTerlambat = hitungKeterlambatan(kantor)
  const is_late = menitTerlambat > 0

  if (existing) {
    const { error } = await supabase
      .from('absensi')
      .update({ checkin_time: now, checkin_lat: data.lat, checkin_lng: data.lng, status, is_late, menit_terlambat: menitTerlambat })
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
        is_late,
        menit_terlambat: menitTerlambat,
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
  jenis: 'koreksi_checkout' | 'dispensasi'
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
  const { userData, role } = await requireRole(['admin', 'pic', 'kepala_sekretariat', 'kasubdit'])
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { data: koreksi, error: fetchError } = await createAdminClient()
    .from('absensi_koreksi')
    .select('absensi_id, jenis, waktu_koreksi, users!absensi_koreksi_user_id_fkey(bidang_id)')
    .eq('id', koreksiId)
    .single()

  if (fetchError) return { error: fetchError.message }

  if (role === 'pic' && (koreksi.users as unknown as { bidang_id: string | null })?.bidang_id !== userData?.bidang_id) {
    return { error: 'Kamu hanya bisa memproses koreksi anggota timmu' }
  }

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

  if (action === 'disetujui') {
    if (koreksi.jenis === 'koreksi_checkout') {
      const { error: absensiError } = await supabase
        .from('absensi')
        .update({ checkout_time: koreksi.waktu_koreksi || new Date().toISOString() })
        .eq('id', koreksi.absensi_id)
      if (absensiError) return { error: absensiError.message }
    } else if (koreksi.jenis === 'dispensasi') {
      const { error: absensiError } = await supabase
        .from('absensi')
        .update({ status: 'hadir', is_late: false, menit_terlambat: 0 })
        .eq('id', koreksi.absensi_id)
      if (absensiError) return { error: absensiError.message }
    }
  }

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
  await requireRole(['admin'])
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
