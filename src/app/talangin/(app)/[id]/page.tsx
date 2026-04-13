import { getBillDetail } from '@/app/actions/talangin'
import { getUserRole } from '@/lib/get-user-role'
import { notFound } from 'next/navigation'
import BillDetail from '@/components/talangin/bill-detail'

export default async function TalanginDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { user } = await getUserRole()
  const result = await getBillDetail(id)

  if ('error' in result) {
    if (result.error === 'Bill tidak ditemukan' || result.error === 'Akses ditolak') {
      notFound()
    }
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-zinc-500">{result.error}</p>
      </div>
    )
  }

  return <BillDetail bill={result.bill as any} isCreator={result.isCreator!} currentUserId={user.id} />
}
