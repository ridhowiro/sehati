'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { createNotifikasi, getUsersByRole } from '@/lib/notifikasi'
import { requireRole } from '@/lib/get-user-role'

const bulanNames = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export async function createUser(formData: {
  email: string
  password: string
  full_name: string
  role: string
  bidang_id: string
  tanggal_lahir?: string
}) {
  await requireRole(['admin'])
  const supabase = createAdminClient()

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
  })

  if (authError) {
    return { error: authError.message }
  }

  const { error: userError } = await supabase
    .from('users')
    .update({
      full_name: formData.full_name,
      role: formData.role as any,
      bidang_id: formData.bidang_id || null,
    })
    .eq('id', authUser.user.id)

  if (userError) {
    return { error: userError.message }
  }

  if (formData.tanggal_lahir) {
    await supabase
      .from('pegawai_profil')
      .upsert({
        user_id: authUser.user.id,
        tanggal_lahir: formData.tanggal_lahir,
      })
  }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function resetPassword(userId: string, newPassword: string) {
  await requireRole(['admin'])
  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateLogStatus(logId: string, status: string, approvalData: {
  reviewer_id: string
  role_reviewer: string
  komentar: string | null
  urutan: number
}) {
  await requireRole(['admin', 'kasubdit', 'kepala_sekretariat', 'pic'])
  const supabase = createAdminClient()

  const { error: approvalError } = await supabase
    .from('log_approval')
    .insert({
      log_bulanan_id: logId,
      reviewer_id: approvalData.reviewer_id,
      role_reviewer: approvalData.role_reviewer,
      status: status === 'revision' ? 'revision' : 'approved',
      komentar: approvalData.komentar,
      urutan: approvalData.urutan,
      reviewed_at: new Date().toISOString(),
    })

  if (approvalError) return { error: approvalError.message }

  const { error: updateError } = await supabase
    .from('log_bulanan')
    .update({ status })
    .eq('id', logId)

  if (updateError) return { error: updateError.message }

  // Ambil data log untuk pesan notifikasi
  const { data: log } = await supabase
    .from('log_bulanan')
    .select('user_id, bulan, tahun, users!log_bulanan_user_id_fkey(full_name, email)')
    .eq('id', logId)
    .single()

  if (log) {
    const nama = (log.users as any)?.full_name || (log.users as any)?.email || 'Karyawan'
    const periode = `${bulanNames[log.bulan]} ${log.tahun}`
    const link = `/review/${logId}`
    const linkLog = `/log/${logId}`

    if (status === 'revision') {
      // Notif ke pemilik log: diminta revisi
      await createNotifikasi({
        user_id: log.user_id,
        judul: 'Log Perlu Direvisi',
        pesan: `Log ${periode} kamu diminta revisi. ${approvalData.komentar ? `Catatan: ${approvalData.komentar}` : ''}`,
        tipe: 'log_revision',
        link: linkLog,
      })
    } else if (status === 'reviewed_pic') {
      // PIC selesai review → notif ke Kasek
      const kasekIds = await getUsersByRole('kepala_sekretariat')
      await createNotifikasi(kasekIds.map(id => ({
        user_id: id,
        judul: 'Log Menunggu Verifikasi',
        pesan: `Log ${periode} dari ${nama} telah disetujui PIC dan menunggu verifikasi kamu.`,
        tipe: 'log_reviewed_pic' as const,
        link,
      })))
    } else if (status === 'verified_kasek') {
      // Kasek selesai → notif ke Kasubdit
      const kasubditIds = await getUsersByRole('kasubdit')
      await createNotifikasi(kasubditIds.map(id => ({
        user_id: id,
        judul: 'Log Menunggu Persetujuan',
        pesan: `Log ${periode} dari ${nama} telah diverifikasi Kasek dan menunggu persetujuan kamu.`,
        tipe: 'log_verified_kasek' as const,
        link,
      })))
    } else if (status === 'approved') {
      // Final approved → notif ke pemilik log
      await createNotifikasi({
        user_id: log.user_id,
        judul: 'Log Disetujui',
        pesan: `Log ${periode} kamu telah disetujui.`,
        tipe: 'log_approved',
        link: linkLog,
      })
    }
  }

  revalidatePath('/review')
  return { success: true }
}