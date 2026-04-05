'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createUser(formData: {
  email: string
  password: string
  full_name: string
  role: string
  bidang_id: string
}) {
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

  revalidatePath('/admin/users')
  return { success: true }
}

export async function resetPassword(userId: string, newPassword: string) {
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

  revalidatePath('/review')
  return { success: true }
}