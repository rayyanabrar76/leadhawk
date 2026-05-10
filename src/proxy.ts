import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const MOBILE_UA = /iPhone|iPod|Android.+Mobile|Mobile.+Firefox|Opera Mobi|BlackBerry|webOS/i

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const { pathname } = request.nextUrl

  // Legacy redirects: /login and /signup pages no longer exist
  if (pathname === '/login' || pathname === '/login/') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('auth', 'login')
    return NextResponse.redirect(url)
  }
  if (pathname === '/signup' || pathname === '/signup/') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('auth', 'signup')
    return NextResponse.redirect(url)
  }

  const userAgent = request.headers.get('user-agent') ?? ''
  const isMobileUA = MOBILE_UA.test(userAgent)

  // Mobile users never see the marketing landing — straight to native shell
  if (isMobileUA && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/app'
    return NextResponse.redirect(url)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_project_url') {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/onboarding') ||
    (pathname.startsWith('/app/') && pathname !== '/app')
  const isMarketing =
    pathname === '/' ||
    pathname === '/pricing' ||
    pathname === '/privacy' ||
    pathname === '/terms'

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = isMobileUA ? '/app' : '/'
    if (!isMobileUA) url.searchParams.set('auth', 'signup')
    return NextResponse.redirect(url)
  }

  // Logged-in users: bounce away from desktop marketing back to the dashboard.
  // Mobile is already handled by the mobile UA redirect above + /app/page.tsx auth check.
  if (user && isMarketing && pathname === '/' && !isMobileUA) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
