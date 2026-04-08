'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/get-user-role'
import { revalidatePath } from 'next/cache'

export async function getMaintenanceMode(): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'maintenance_mode')
    .single()

  return data?.value === 'true'
}

export async function setMaintenanceMode(enabled: boolean) {
  const { user } = await requireRole(['admin'])
  const supabase = await createClient()

  const { error } = await supabase
    .from('app_settings')
    .update({ value: String(enabled), updated_at: new Date().toISOString(), updated_by: user.id })
    .eq('key', 'maintenance_mode')

  if (error) throw new Error('Gagal mengubah status maintenance')

  revalidatePath('/admin/pengaturan')
}
