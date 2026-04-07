'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type JenisIzin = 'izin' | 'cuti' | 'sakit' | 'surat_tugas'

export async function ajukanIzin(data: {
  tanggal_mulai: string
  tanggal_selesai: string
  jenis: JenisIzin
  keterangan?: string
  gdrive_link?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  // ST langsung dikonfirmasi — verifikasi di aplikasi lain
  const status = data.jenis === 'surat_tugas' ? 'disetujui' : 'pending'

  const { error } = await supabase.from('izin_karyawan').insert({
    user_id: user.id,
    tanggal_mulai: data.tanggal_mulai,
    tanggal_selesai: data.tanggal_selesai,
    jenis: data.jenis,
    keterangan: data.keterangan || null,
    gdrive_link: data.gdrive_link || null,
    status,
  })

  if (error) return { error: error.message }
  revalidatePath('/absensi')
  revalidatePath('/admin/izin')
  return { success: true }
}

export async function prosesIzin(
  izinId: string,
  action: 'disetujui' | 'ditolak',
  catatan?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { error } = await supabase
    .from('izin_karyawan')
    .update({
      status: action,
      disetujui_oleh: user.id,
      catatan_prosesor: catatan || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', izinId)

  if (error) return { error: error.message }
  revalidatePath('/admin/izin')
  revalidatePath('/absensi')
  return { success: true }
}

export async function hapusIzin(izinId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('izin_karyawan')
    .delete()
    .eq('id', izinId)

  if (error) return { error: error.message }
  revalidatePath('/absensi')
  revalidatePath('/admin/izin')
  return { success: true }
}

export async function createHariLibur(data: {
  tanggal: string
  nama: string
  jenis: 'nasional' | 'cuti_bersama'
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('hari_libur').insert(data)
  if (error) return { error: error.message }
  revalidatePath('/admin/hari-libur')
  return { success: true }
}

export async function importHariLiburFromApi(year: number) {
  const supabase = await createClient()

  let apiData: { date: string; localName: string }[]
  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/ID`, {
      next: { revalidate: 86400 },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    apiData = await res.json()
  } catch (e) {
    return { error: `Gagal mengambil data dari API: ${(e as Error).message}` }
  }

  if (!Array.isArray(apiData) || apiData.length === 0) {
    return { error: 'Data dari API kosong atau format tidak dikenali.' }
  }

  const rows = apiData.map(item => ({
    tanggal: item.date,
    nama: item.localName,
    jenis: 'nasional' as const,
  }))

  const { error, count } = await supabase
    .from('hari_libur')
    .upsert(rows, { onConflict: 'tanggal', ignoreDuplicates: true })
    .select()

  if (error) return { error: error.message }

  revalidatePath('/admin/hari-libur')
  return { success: true, imported: count ?? rows.length }
}

export async function deleteHariLibur(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('hari_libur').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/hari-libur')
  return { success: true }
}
