import { BottomNav } from '@/components/mobile/bottom-nav'
import { createClient } from '@/lib/supabase/server'

export default async function MobileAppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const showShell = Boolean(user)

  return (
    <div className="lh-mobile-app-shell flex flex-col bg-zinc-950 text-zinc-100">
      <main
        className={`flex-1 w-full ${showShell ? 'max-w-xl mx-auto' : ''}`}
        style={
          showShell
            ? {
                paddingTop: 'calc(env(safe-area-inset-top) + 3.5rem)',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)',
              }
            : undefined
        }
      >
        {children}
      </main>
      {showShell && <BottomNav />}
    </div>
  )
}
