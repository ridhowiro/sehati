'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function checkin(data: {
  lat: number
  lng: number
  is_wfh?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

  const { data: existing } = await supabase
    .from('absensi')
    .select('id, checkin_time')
    .eq('user_id', user.id)
    .eq('tanggal', today)
    .maybeSingle()

  if (existing?.checkin_time) return { error: 'Sudah melakukan check-in hari ini' }

  const status = data.is_wfh ? 'wfh' : 'hadir'

  if (existing) {
    const { error } = await supabase
      .from('absensi')
      .update({
        checkin_time: new Date().toISOString(),
        checkin_lat: data.lat,
        checkin_lng: data.lng,
        status,
      })
      .eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('absensi')
      .insert({
        user_id: user.id,
        tanggal: today,
        checkin_time: new Date().toISOString(),
        checkin_lat: data.lat,
        checkin_lng: data.lng,
        status,
      })
    if (error) return { error: error.message }
  }

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

  const { error } = await supabase
    .from('kantor_config')
    .update(data)
    .eq('is_active', true)

  if (error) return { error: error.message }

  revalidatePath('/admin/kantor')
  return { success: true }
}
