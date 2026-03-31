'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import WelcomeModal from '@/components/onboarding/welcome-modal'

export default function TutorialButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Lihat tutorial"
        className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
      >
        <HelpCircle size={18} />
      </button>
      <WelcomeModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
