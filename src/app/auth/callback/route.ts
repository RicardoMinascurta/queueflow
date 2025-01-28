import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const redirectTo = requestUrl.searchParams.get('redirectTo') || '/dashboard'
    
    if (!code) {
      console.error('Código de autenticação não encontrado')
      return NextResponse.redirect('https://queueflow.vercel.app/auth/signin')
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Troca o código por uma sessão
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Erro ao trocar código por sessão:', error.message)
      return NextResponse.redirect('https://queueflow.vercel.app/auth/signin')
    }

    // Se a sessão foi criada com sucesso, criar organização
    if (data.session?.user?.email) {
      try {
        // Criar organização
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert([
            {
              name: data.session.user.email.split('@')[0] || 'Minha Organização',
              owner_email: data.session.user.email
            }
          ])
          .select()
          .single()

        if (orgError && !orgError.message.includes('duplicate key')) {
          console.error('Erro ao criar organização:', orgError)
        } else if (orgData) {
          // Criar gabinete padrão para a nova organização
          const { error: counterError } = await supabase
            .from('counters')
            .insert([
              {
                name: 'Gabinete 1',
                organization_id: orgData.id,
                created_at: new Date().toISOString()
              }
            ])

          if (counterError) {
            console.error('Erro ao criar gabinete padrão:', counterError)
          }
        }
      } catch (err) {
        console.error('Erro ao tentar criar organização ou gabinete:', err)
      }
    }

    console.log('Sessão criada com sucesso:', data.session?.user?.email)
    console.log('Redirecionando para:', redirectTo)

    return NextResponse.redirect('https://queueflow.vercel.app' + redirectTo)
  } catch (error) {
    console.error('Erro no callback:', error)
    return NextResponse.redirect('https://queueflow.vercel.app/auth/signin')
  }
} 