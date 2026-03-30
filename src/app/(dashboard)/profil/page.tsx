import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfilForm from '@/components/profil/profil-form'

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profil } = await supabase
    .from('pegawai_profil')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Profil Saya</h2>
        <p className="text-sm text-zinc-500 mt-1">Kelola informasi profil dan akun kamu</p>
      </div>
      <ProfilForm user={user} profil={profil} userData={userData} />
    </div>
  )
}