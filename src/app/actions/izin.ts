'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotifikasi, getUsersByRole, getPicByBidang } from '@/lib/notifikasi'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/get-user-role'

const jenisLabel: Record<string, string> = {
  izin: 'Izin',
  cuti: 'Cuti',
  sakit: 'Sakit',
  surat_tugas: 'Surat Tugas',
}

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

  // Notif ke PIC bidang & admin jika bukan surat tugas (ST langsung disetujui)
  if (data.jenis !== 'surat_tugas') {
    const adminSupabase = createAdminClient()
    const { data: userData } = await adminSupabase
      .from('users')
      .select('full_name, email, bidang_id')
      .eq('id', user.id)
      .single()
    const nama = userData?.full_name || userData?.email || 'Karyawan'

    // Kumpulkan penerima: PIC bidang + admin (deduplicate)
    const picIds = userData?.bidang_id ? await getPicByBidang(userData.bidang_id) : []
    const adminIds = await getUsersByRole('admin')
    const penerimIds = [...new Set([...picIds, ...adminIds])]

    const pesan = `${nama} mengajukan ${jenisLabel[data.jenis] ?? data.jenis} pada ${data.tanggal_mulai}${data.tanggal_mulai !== data.tanggal_selesai ? ` s/d ${data.tanggal_selesai}` : ''}.`

    await createNotifikasi(penerimIds.map(id => ({
      user_id: id,
      judul: `Pengajuan ${jenisLabel[data.jenis] ?? data.jenis}`,
      pesan,
      tipe: 'izin_diajukan' as const,
      link: '/admin/izin',
    })))
  }

  revalidatePath('/absensi')
  revalidatePath('/admin/izin')
  return { success: true }
}

export async function prosesIzin(
  izinId: string,
  action: 'disetujui' | 'ditolak',
  catatan?: string
) {
  await requireRole(['admin', 'pic', 'kepala_sekretariat', 'kasubdit'])
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

  // Notif ke pengaju izin
  const adminSupabase = createAdminClient()
  const { data: izin } = await adminSupabase
    .from('izin_karyawan')
    .select('user_id, jenis, tanggal_mulai, tanggal_selesai')
    .eq('id', izinId)
    .single()

  if (izin) {
    await createNotifikasi({
      user_id: izin.user_id,
      judul: action === 'disetujui' ? `${jenisLabel[izin.jenis] ?? izin.jenis} Disetujui` : `${jenisLabel[izin.jenis] ?? izin.jenis} Ditolak`,
      pesan: action === 'disetujui'
        ? `Pengajuan ${jenisLabel[izin.jenis] ?? izin.jenis} kamu pada ${izin.tanggal_mulai}${izin.tanggal_mulai !== izin.tanggal_selesai ? ` s/d ${izin.tanggal_selesai}` : ''} telah disetujui.`
        : `Pengajuan ${jenisLabel[izin.jenis] ?? izin.jenis} kamu pada ${izin.tanggal_mulai}${izin.tanggal_mulai !== izin.tanggal_selesai ? ` s/d ${izin.tanggal_selesai}` : ''} ditolak.${catatan ? ` Catatan: ${catatan}` : ''}`,
      tipe: action === 'disetujui' ? 'izin_diproses' : 'izin_diproses',
      link: '/absensi',
    })
  }

  revalidatePath('/admin/izin')
  revalidatePath('/absensi')
  return { success: true }
}

export async function hapusIzin(izinId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }
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
  await requireRole(['admin'])
  const supabase = await createClient()
  const { error } = await supabase.from('hari_libur').insert(data)
  if (error) return { error: error.message }
  revalidatePath('/admin/hari-libur')
  return { success: true }
}

export async function importHariLiburFromApi(year: number) {
  await requireRole(['admin'])
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
  await requireRole(['admin'])
  const supabase = await createClient()
  const { error } = await supabase.from('hari_libur').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/hari-libur')
  return { success: true }
}
