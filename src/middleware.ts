import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })

    // Rotas públicas que não precisam de autenticação
    const publicRoutes = ['/', '/auth/signin', '/auth/callback']
    const isPublicRoute = publicRoutes.some(route => 
      request.nextUrl.pathname === route || 
      request.nextUrl.pathname.startsWith('/auth/')
    )

    // Verifica a sessão
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Erro ao verificar sessão:', error.message)
      if (!isPublicRoute) {
        const url = new URL('/auth/signin', request.url)
        url.searchParams.set('redirectTo', request.nextUrl.pathname)
        return NextResponse.redirect(url)
      }
      return res
    }

    // Se não há sessão e a rota não é pública, redireciona para login
    if (!session && !isPublicRoute) {
      console.log('Usuário não autenticado, redirecionando para login...')
      const url = new URL('/auth/signin', request.url)
      url.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    // Se há sessão e está tentando acessar rotas de auth, redireciona para dashboard
    if (session && isPublicRoute && request.nextUrl.pathname !== '/') {
      console.log('Usuário já autenticado, redirecionando para dashboard...')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return res
  } catch (error) {
    console.error('Erro no middleware:', error)
    if (!request.nextUrl.pathname.startsWith('/auth/')) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     * - api routes
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 