import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/get-user-role'
import { redirect } from 'next/navigation'
import KantorConfigForm from '@/components/absensi/kantor-config-form'

export default async function KantorConfigPage() {
  const { userData } = await getUserRole()
  if (userData?.role !== 'admin') redirect('/')

  const supabase = await createClient()
  const { data: kantor } = await supabase
    .from('kantor_config')
    .select('*')
    .eq('is_active', true)
    .single()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Konfigurasi Kantor</h2>
        <p className="text-sm text-zinc-500 mt-1">Atur lokasi dan jam kerja untuk absensi GPS</p>
      </div>
      <KantorConfigForm kantor={kantor} />
    </div>
  )
}
