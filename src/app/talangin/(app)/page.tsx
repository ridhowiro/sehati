import { getBills } from '@/app/actions/talangin'
import { getUserRole } from '@/lib/get-user-role'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import TalanginTabs from '@/components/talangin/talangin-tabs'

export default async function TalanginPage() {
  const { user } = await getUserRole()
  const result = await getBills()

  if ('error' in result) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-zinc-500">{result.error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Talangin Dulu</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Bagi tagihan bareng, beres tanpa drama</p>
        </div>
        <Link
          href="/talangin/buat"
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-colors"
        >
          <Plus size={16} />
          <span>Buat Bill</span>
        </Link>
      </div>

      <TalanginTabs created={result.created as any} memberOf={result.memberOf as any} userId={user.id} />
    </div>
  )
}
