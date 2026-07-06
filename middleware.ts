// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function clearSupabaseAuthCookies(response: NextResponse, request: NextRequest) {
  const allCookies = request.cookies.getAll()
  for (const cookie of allCookies) {
    const name = cookie.name.toLowerCase()
    if (name.includes('sb-') || name.includes('supabase')) {
      response.cookies.set(cookie.name, '', {
        maxAge: 0,
        expires: new Date(0),
        path: '/',
      })
    }
  }
}

function normalizeRole(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.toLowerCase()
  return normalized === 'admin' || normalized === 'agent' || normalized === 'manager'
    ? normalized
    : null
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 1. Initialize Supabase and refresh the auth cookie
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 2. Fetch the current authenticated user
  const { data: { user } } = await supabase.auth.getUser()

  // 3. Define our route boundaries
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isAgentRoute = request.nextUrl.pathname.startsWith('/agent')
  const hasProfileError = request.nextUrl.searchParams.get('error') === 'profile_not_found'

  // 4. Block unauthenticated users from protected areas
  if (!user && (isAdminRoute || isAgentRoute)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 5. Enforce Role-Based Access Control (RBAC)
  if (user) {
    const { data: profile } = await supabase
      .from('users_profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const profileRole = normalizeRole(profile?.role)
    const metadataRole = normalizeRole(user.user_metadata?.role) ?? normalizeRole(user.app_metadata?.role)
    const role = metadataRole ?? profileRole

    if (!role || (role !== 'admin' && role !== 'agent' && role !== 'manager')) {
      if (isAuthRoute && hasProfileError) {
        clearSupabaseAuthCookies(supabaseResponse, request)
        return supabaseResponse
      }
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'profile_not_found')
      const redirectResponse = NextResponse.redirect(url)
      clearSupabaseAuthCookies(redirectResponse, request)
      return redirectResponse
    }

    // Prevent Agents from accessing Admin pages
    if (isAdminRoute && role !== 'admin' && role !== 'manager') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'agent' ? '/agent/dashboard' : '/login'
      return NextResponse.redirect(url)
    }

    // Prevent Admins from accessing Agent operational pipelines
    if (isAgentRoute && role !== 'agent') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'admin' || role === 'manager' ? '/admin/po' : '/login'
      return NextResponse.redirect(url)
    }

    // Keep /login reachable even for authenticated users to avoid redirect loops
    // when stale or partially invalid sessions exist in the browser.
  }

  return supabaseResponse
}

// Ensure the middleware only runs on actual pages, skipping static files and images
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}