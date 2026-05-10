'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FAQItem {
  q: string
  a: string
}

interface Props {
  items: FAQItem[]
}

export function FaqAccordion({ items }: Props) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="divide-y divide-zinc-800/60 border border-zinc-800/60 rounded-xl overflow-hidden">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={i}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-zinc-900/40 transition-colors focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-medium text-zinc-100">{item.q}</span>
              <ChevronDown
                className={`w-4 h-4 text-zinc-500 transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-6 pb-5">
                <p className="text-sm text-zinc-400 leading-relaxed">{item.a}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
