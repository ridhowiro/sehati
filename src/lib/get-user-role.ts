import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type UserRole = 'admin' | 'kasubdit' | 'kepala_sekretariat' | 'pic' | 'karyawan'

export async function getUserRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return {
    user,
    userData: data,
    role: data?.role as UserRole,
    isAdmin: data?.role === 'admin',
    isKasubdit: data?.role === 'kasubdit',
    isKasek: data?.role === 'kepala_sekretariat',
    isPic: data?.role === 'pic',
    isKaryawan: data?.role === 'karyawan',
    canApprove: ['admin', 'kasubdit', 'kepala_sekretariat', 'pic'].includes(data?.role),
    canManageUsers: data?.role === 'admin',
    canViewAllLogs: ['admin', 'kasubdit', 'kepala_sekretariat'].includes(data?.role),
  }
}

export async function requireRole(allowedRoles: UserRole[]) {
  const roleData = await getUserRole()
  
  if (!allowedRoles.includes(roleData.role)) {
    redirect('/')
  }

  return roleData
}