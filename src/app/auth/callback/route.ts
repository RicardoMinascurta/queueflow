import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    if (!code) {
      console.error('Código de autenticação não encontrado')
      return NextResponse.redirect('/auth/signin')
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Troca o código por uma sessão
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Erro ao trocar código por sessão:', error.message)
      return NextResponse.redirect('/auth/signin')
    }

    return NextResponse.redirect('/dashboard')
  } catch (error) {
    console.error('Erro no callback:', error)
    return NextResponse.redirect('/auth/signin')
  }
} 