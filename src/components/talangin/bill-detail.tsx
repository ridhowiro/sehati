'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, CheckCircle2, Clock, Copy, Share2, Loader2,
  AlertTriangle, Users, Receipt, ChevronDown, ChevronUp, Trash2,
} from 'lucide-react'
import { formatRupiah, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  claimPaid, confirmPayment, forceSettle, deleteBill,
} from '@/app/actions/talangin'

type Member = {
  id: string
  user_id: string | null
  external_name: string | null
  amount: number
  is_paid: boolean
  paid_at: string | null
  confirmed_by_creator: boolean
  confirmed_at: string | null
  users: { full_name: string; avatar_url: string | null } | null
}

type Charge = {
  id: string
  label: string
  amount: number
  split_type: string
  split_bill_charge_members: { id: string; member_id: string; amount: number }[]
}

type Bill = {
  id: string
  title: string
  total_amount: number
  notes: string | null
  status: string
  share_token: string
  created_at: string
  created_by: string
  users: { full_name: string; avatar_url: string | null } | null
  split_bill_members: Member[]
  split_bill_charges: Charge[]
}

interface Props {
  bill: Bill
  isCreator: boolean
  currentUserId: string
}

function MemberRow({
  member,
  isCreator,
  currentUserId,
  billId,
}: {
  member: Member
  isCreator: boolean
  currentUserId: string
  billId: string
}) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  const name = member.users?.full_name ?? member.external_name ?? 'External'
  const isMe = member.user_id === currentUserId
  const isExternal = !member.user_id
  const confirmed = member.confirmed_by_creator
  const claimed = member.is_paid

  const handleClaim = () => {
    startTransition(async () => {
      await claimPaid(member.id)
      setDone(true)
    })
  }

  const handleConfirm = () => {
    startTransition(async () => {
      await confirmPayment(member.id)
    })
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <div className="w-8 h-8 rounded-full bg-zinc-600 flex items-center justify-center text-xs text-white shrink-0">
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{name}</p>
          {isExternal && (
            <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">External</span>
          )}
          {isMe && (
            <span className="text-xs text-blue-400 bg-blue-900/20 px-1.5 py-0.5 rounded">Kamu</span>
          )}
        </div>
        <p className="text-sm text-zinc-500">{formatRupiah(member.amount)}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {confirmed ? (
          <span className="inline-flex items-center gap-1 text-xs text-green-400">
            <CheckCircle2 size={13} /> Lunas
          </span>
        ) : claimed ? (
          <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
            <Clock size={13} /> Menunggu konfirmasi
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
            <Clock size={13} /> Belum bayar
          </span>
        )}

        {/* Member bisa klaim udah bayar */}
        {isMe && !claimed && !confirmed && (
          <button
            onClick={handleClaim}
            disabled={isPending}
            className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition-colors flex items-center gap-1"
          >
            {isPending ? <Loader2 size={12} className="animate-spin" /> : null}
            Udah Bayar
          </button>
        )}

        {/* Creator bisa confirm atau mark paid (untuk external/klaim) */}
        {isCreator && !confirmed && (
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="px-3 py-1 rounded-lg bg-green-800 hover:bg-green-700 text-white text-xs font-medium transition-colors flex items-center gap-1"
          >
            {isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            Konfirmasi
          </button>
        )}
      </div>
    </div>
  )
}

export default function BillDetail({ bill, isCreator, currentUserId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [showCharges, setShowCharges] = useState(false)
  const [showSettle, setShowSettle] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/talangin/s/${bill.share_token}`

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleForceSettle = () => {
    startTransition(async () => {
      await forceSettle(bill.id)
      setShowSettle(false)
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      await deleteBill(bill.id)
      router.push('/talangin')
    })
  }

  const members = bill.split_bill_members ?? []
  const confirmedCount = members.filter((m) => m.confirmed_by_creator).length
  const totalCount = members.length
  const isSettled = bill.status === 'settled'

  const myMember = members.find((m) => m.user_id === currentUserId)

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link href="/talangin" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        <ArrowLeft size={14} /> Kembali
      </Link>

      {/* Header card */}
      <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isSettled ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-900/30 text-green-400 border border-green-800">
                  <CheckCircle2 size={11} /> Settled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-800">
                  <Clock size={11} /> Open
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{bill.title}</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              Dibuat oleh <span className="text-zinc-400">{bill.users?.full_name ?? 'Seseorang'}</span> · {formatDate(bill.created_at)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{formatRupiah(bill.total_amount)}</p>
            <p className="text-xs text-zinc-500">{confirmedCount}/{totalCount} lunas</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: totalCount > 0 ? `${(confirmedCount / totalCount) * 100}%` : '0%' }}
          />
        </div>

        {bill.notes && (
          <p className="text-sm text-zinc-500 mb-4 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">{bill.notes}</p>
        )}

        {/* Share link */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
          <Share2 size={14} className="text-zinc-400 shrink-0" />
          <span className="flex-1 text-xs text-zinc-500 truncate">Link buat external member</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-700 hover:bg-zinc-600 text-white text-xs transition-colors shrink-0"
          >
            <Copy size={11} />
            {copied ? 'Tersalin!' : 'Salin'}
          </button>
        </div>
      </div>

      {/* Members */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <h3 className="font-medium text-zinc-900 dark:text-white flex items-center gap-2 mb-3">
          <Users size={16} /> Member
        </h3>
        <div>
          {members.map((m) => (
            <MemberRow
              key={m.id}
              member={m}
              isCreator={isCreator}
              currentUserId={currentUserId}
              billId={bill.id}
            />
          ))}
        </div>
      </div>

      {/* Charges / Item breakdown */}
      {(bill.split_bill_charges ?? []).length > 0 && (() => {
        // Deteksi apakah ini per_item bill (semua charges custom) atau biaya tambahan biasa
        const allCustom = bill.split_bill_charges.every((c) => c.split_type === 'custom')
        const isItemMode = allCustom

        if (isItemMode) {
          // Tampilkan sebagai detail pesanan per member
          const memberMap = Object.fromEntries(
            members.map((m) => [m.id, m.users?.full_name ?? m.external_name ?? 'External'])
          )
          return (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
              <button
                onClick={() => setShowCharges(!showCharges)}
                className="w-full flex items-center justify-between p-4 text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Receipt size={16} /> Detail Pesanan ({bill.split_bill_charges.length} item)
                </span>
                {showCharges ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showCharges && (
                <div className="border-t border-zinc-100 dark:border-zinc-800">
                  {bill.split_bill_charges.map((c) => {
                    const assignees = c.split_bill_charge_members ?? []
                    return (
                      <div key={c.id} className="flex items-start justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                        <div>
                          <p className="text-sm text-zinc-900 dark:text-white">{c.label}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {assignees.map((a) => memberMap[a.member_id] ?? '?').join(', ')}
                            {assignees.length > 1 && <span className="ml-1 text-zinc-600">({formatRupiah(c.amount / assignees.length)}/orang)</span>}
                          </p>
                        </div>
                        <span className="text-sm text-zinc-300 shrink-0 ml-3">{formatRupiah(c.amount)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        }

        // Biaya tambahan biasa (tax, ongkir, dll)
        return (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            <button
              onClick={() => setShowCharges(!showCharges)}
              className="w-full flex items-center justify-between p-4 text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Receipt size={16} /> Biaya Tambahan ({bill.split_bill_charges.length})
              </span>
              {showCharges ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showCharges && (
              <div className="px-4 pb-4 space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                {bill.split_bill_charges.map((c) => (
                  <div key={c.id} className="flex justify-between text-sm">
                    <span className="text-zinc-500">{c.label}</span>
                    <span className="text-zinc-300">{formatRupiah(c.amount)} ({c.split_type === 'equal' ? 'dibagi rata' : 'custom'})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {/* My tagihan summary (if member, not creator) */}
      {!isCreator && myMember && (
        <div className={cn(
          'p-4 rounded-xl border',
          myMember.confirmed_by_creator
            ? 'border-green-800 bg-green-900/10'
            : myMember.is_paid
              ? 'border-yellow-800 bg-yellow-900/10'
              : 'border-zinc-700 bg-zinc-900'
        )}>
          <p className="text-sm font-medium text-zinc-300 mb-1">Tagihan kamu</p>
          <p className="text-2xl font-bold text-white">{formatRupiah(myMember.amount)}</p>
          <p className="text-xs text-zinc-500 mt-1">
            {myMember.confirmed_by_creator
              ? '✅ Sudah dikonfirmasi lunas'
              : myMember.is_paid
                ? '⏳ Klaim sudah bayar, menunggu konfirmasi creator'
                : 'Belum bayar'}
          </p>
        </div>
      )}

      {/* Creator actions */}
      {isCreator && !isSettled && (
        <div className="flex gap-3">
          <button
            onClick={() => setShowSettle(true)}
            className="flex-1 py-2.5 rounded-lg border border-green-800 text-green-400 hover:bg-green-900/20 text-sm font-medium transition-colors"
          >
            Force Settle
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="py-2.5 px-4 rounded-lg border border-red-800 text-red-400 hover:bg-red-900/20 text-sm font-medium transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {/* Confirm force settle dialog */}
      {showSettle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="text-yellow-400" />
              <h3 className="font-semibold text-white">Force Settle?</h3>
            </div>
            <p className="text-sm text-zinc-400">
              Bill akan ditutup meskipun ada member yang belum bayar. Member yang belum konfirmasi tidak akan dapat klaim lagi.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowSettle(false)} className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm">Batal</button>
              <button
                onClick={handleForceSettle}
                disabled={isPending}
                className="flex-1 py-2 rounded-lg bg-green-800 hover:bg-green-700 text-white text-sm font-medium flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 size={14} className="animate-spin" />}
                Settle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete dialog */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Trash2 size={20} className="text-red-400" />
              <h3 className="font-semibold text-white">Hapus Bill?</h3>
            </div>
            <p className="text-sm text-zinc-400">Bill ini akan dihapus permanen beserta semua data member dan charges-nya.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm">Batal</button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-white text-sm font-medium flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 size={14} className="animate-spin" />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
