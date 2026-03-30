'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type UserRole = 'admin' | 'kasubdit' | 'kepala_sekretariat' | 'pic' | 'karyawan'

interface UserData {
  id: string
  email: string
  full_name: string
  role: UserRole
  bidang_id: string | null
  avatar_url: string | null
}

export function useRole() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      setUserData(data)
      setLoading(false)
    }

    fetchUser()
  }, [])

  const isAdmin = userData?.role === 'admin'
  const isKasubdit = userData?.role === 'kasubdit'
  const isKasek = userData?.role === 'kepala_sekretariat'
  const isPic = userData?.role === 'pic'
  const isKaryawan = userData?.role === 'karyawan'

  const canApprove = isAdmin || isKasubdit || isKasek || isPic
  const canManageUsers = isAdmin
  const canViewAllLogs = isAdmin || isKasubdit || isKasek

  return {
    userData,
    loading,
    role: userData?.role,
    isAdmin,
    isKasubdit,
    isKasek,
    isPic,
    isKaryawan,
    canApprove,
    canManageUsers,
    canViewAllLogs,
  }
}