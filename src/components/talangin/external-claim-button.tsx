'use client'

import { useState, useTransition } from 'react'
import { claimPaidExternal } from '@/app/actions/talangin'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface Props {
  shareToken: string
  memberId: string
  memberName: string
}

export default function ExternalClaimButton({ shareToken, memberId, memberName }: Props) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleClaim = () => {
    startTransition(async () => {
      const result = await claimPaidExternal(shareToken, memberId)
      if ('error' in result && result.error) {
        setError(result.error)
        return
      }
      setDone(true)
    })
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-yellow-400 font-medium">
        <CheckCircle2 size={13} /> Klaim terkirim, tunggu konfirmasi creator
      </span>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClaim}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-medium transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 size={12} className="animate-spin" /> : null}
        Udah Bayar
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
