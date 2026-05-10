'use client'

import { useState } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { Button } from '@/components/ui/button'
import { Trash2, LogOut, X, AlertTriangle, Loader2 } from 'lucide-react'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClearLeads: () => Promise<void>
  onSignOut: () => Promise<void> | void
}

export function SettingsDialog({ open, onOpenChange, onClearLeads, onSignOut }: SettingsDialogProps) {
  const [confirming, setConfirming] = useState(false)
  const [clearing, setClearing] = useState(false)

  function handleClose() {
    setConfirming(false)
    onOpenChange(false)
  }

  async function handleConfirmClear() {
    setClearing(true)
    try {
      await onClearLeads()
      setConfirming(false)
      onOpenChange(false)
    } finally {
      setClearing(false)
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) setConfirming(false); onOpenChange(v) }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <DialogPrimitive.Popup
          className="fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100vw-2rem)] sm:max-w-110 -translate-x-1/2 -translate-y-1/2 max-h-[calc(100vh-2rem)] overflow-y-auto gap-5 border border-zinc-800 bg-zinc-900 p-5 sm:p-6 shadow-2xl rounded-2xl ring-1 ring-white/5 duration-200 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          <DialogPrimitive.Close
            className="absolute top-4 right-4 rounded-md p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>

          <DialogPrimitive.Title className="text-lg font-semibold tracking-tight text-zinc-50">
            Settings
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Manage your LeadHawk account
          </DialogPrimitive.Description>

          {/* Sign out */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Account
            </h3>
            <button
              onClick={async () => { handleClose(); await onSignOut() }}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-800 text-sm text-zinc-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-zinc-400" />
                <span>Sign out</span>
              </div>
            </button>
          </div>

          {/* Danger zone */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2">
              Danger zone
            </h3>

            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-red-950/30 hover:bg-red-950/50 border border-red-900/40 text-sm text-red-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  <span>Clear all leads</span>
                </div>
                <span className="text-xs text-red-400/70">Irreversible</span>
              </button>
            ) : (
              <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-zinc-100 mb-1">Delete all leads?</p>
                    <p className="text-xs text-zinc-400">
                      This will permanently delete every lead and pitch from your account. This cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="flex-1 text-zinc-300 hover:bg-zinc-800"
                    onClick={() => setConfirming(false)}
                    disabled={clearing}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white"
                    onClick={handleConfirmClear}
                    disabled={clearing}
                  >
                    {clearing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {clearing ? 'Deleting…' : 'Yes, delete all'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
