import CreateBillForm from '@/components/talangin/create-bill-form'
import { getUserRole } from '@/lib/get-user-role'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function BuatTalanginPage() {
  const { user } = await getUserRole()
  const admin = createAdminClient()
  const { data: userData } = await admin
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Buat Bill Baru</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Isi detail tagihan dan tambah member yang ikut</p>
      </div>
      <CreateBillForm
        creatorId={user.id}
        creatorName={userData?.full_name ?? 'Kamu'}
      />
    </div>
  )
}
