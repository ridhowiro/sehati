'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatRupiah } from '@/lib/format'
import { ChevronRight, CheckCircle2, Clock } from 'lucide-react'

type Member = {
  id: string
  is_paid: boolean
  confirmed_by_creator: boolean
  user_id: string | null
  external_name: string | null
  amount: number
}

type Bill = {
  id: string
  title: string
  total_amount: number
  status: string
  created_at: string
  updated_at: string
  split_bill_members: Member[]
}

type MemberOf = {
  id: string
  amount: number
  is_paid: boolean
  confirmed_by_creator: boolean
  split_bills: {
    id: string
    title: string
    total_amount: number
    status: string
    created_at: string
    created_by: string
    users: { full_name: string } | null
  } | null
}

interface Props {
  created: Bill[]
  memberOf: MemberOf[]
  userId: string
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'settled') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-900/30 text-green-400 border border-green-800">
        <CheckCircle2 size={11} />
        Settled
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-800">
      <Clock size={11} />
      Open
    </span>
  )
}

function BillCard({ bill, showUnpaid }: { bill: Bill; showUnpaid?: boolean }) {
  const unpaid = bill.split_bill_members.filter((m) => !m.confirmed_by_creator).length
  const total = bill.split_bill_members.length

  return (
    <Link
      href={`/talangin/${bill.id}`}
      className="block p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={bill.status} />
            {showUnpaid && unpaid > 0 && bill.status === 'open' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-900/30 text-red-400 border border-red-800">
                {unpaid} belum lunas
              </span>
            )}
          </div>
          <p className="font-medium text-zinc-900 dark:text-white truncate">{bill.title}</p>
          <p className="text-sm text-zinc-500 mt-0.5">{formatRupiah(bill.total_amount)}</p>
        </div>
        <div className="flex items-center gap-2 text-zinc-400 shrink-0">
          <span className="text-xs">{total - unpaid}/{total} lunas</span>
          <ChevronRight size={16} />
        </div>
      </div>
    </Link>
  )
}

function MemberOfCard({ item }: { item: MemberOf }) {
  const bill = item.split_bills
  if (!bill) return null

  return (
    <Link
      href={`/talangin/${bill.id}`}
      className="block p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={bill.status} />
            {!item.confirmed_by_creator && bill.status === 'open' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-900/30 text-orange-400 border border-orange-800">
                Belum lunas
              </span>
            )}
            {item.confirmed_by_creator && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-900/30 text-green-400 border border-green-800">
                <CheckCircle2 size={11} /> Lunas
              </span>
            )}
          </div>
          <p className="font-medium text-zinc-900 dark:text-white truncate">{bill.title}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Tagihan dari <span className="text-zinc-400">{bill.users?.full_name ?? 'Seseorang'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-zinc-400 shrink-0">
          <span className="text-sm font-medium text-zinc-300">{formatRupiah(item.amount)}</span>
          <ChevronRight size={16} />
        </div>
      </div>
    </Link>
  )
}

export default function TalanginTabs({ created, memberOf, userId }: Props) {
  const [tab, setTab] = useState<'nagih' | 'ditagih'>('nagih')

  const openNagih = created.filter((b) => b.status === 'open')
  const unpaidNagih = openNagih.reduce(
    (acc, b) => acc + b.split_bill_members.filter((m) => !m.confirmed_by_creator).length,
    0
  )

  const openDitagih = memberOf.filter(
    (m) => m.split_bills?.status === 'open' && !m.confirmed_by_creator
  )

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl mb-4 w-fit">
        <button
          onClick={() => setTab('nagih')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            tab === 'nagih'
              ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          )}
        >
         Penagihanku
          {unpaidNagih > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-xs">
              {unpaidNagih}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('ditagih')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            tab === 'ditagih'
              ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          )}
        >
          Tagihanku
          {openDitagih.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-orange-500 text-white text-xs">
              {openDitagih.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {tab === 'nagih' && (
        <div className="space-y-3">
          {created.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <p className="text-4xl mb-3">💸</p>
              <p className="font-medium">Belum ada tagihan</p>
              <p className="text-sm mt-1">Buat bill baru untuk mulai nagih</p>
            </div>
          ) : (
            created.map((bill) => <BillCard key={bill.id} bill={bill} showUnpaid />)
          )}
        </div>
      )}

      {tab === 'ditagih' && (
        <div className="space-y-3">
          {memberOf.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <p className="text-4xl mb-3">🎉</p>
              <p className="font-medium">Gak ada tagihan</p>
              <p className="text-sm mt-1">Semua sudah beres!</p>
            </div>
          ) : (
            memberOf.map((item) => <MemberOfCard key={item.id} item={item} />)
          )}
        </div>
      )}
    </div>
  )
}
