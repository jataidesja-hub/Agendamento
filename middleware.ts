import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase-middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Painel Superadmin: protege com secret em cookie/header ────────────────
  if (pathname.startsWith('/admin')) {
    const adminSecret = request.cookies.get('admin_secret')?.value
    const envSecret = process.env.ADMIN_SECRET

    if (!envSecret || adminSecret !== envSecret) {
      if (pathname === '/admin/login') return NextResponse.next()
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // ── Painel do Dono: protege via Supabase Auth ─────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const { user, response } = await updateSession(request)

    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return response
  }

  // ── Rota /login: redireciona para dashboard se já autenticado ─────────────
  if (pathname === '/login') {
    const { user, response } = await updateSession(request)
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/login',
  ],
}
