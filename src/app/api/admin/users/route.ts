import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verifica se o usuário está autenticado
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verifica se o usuário é admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Busca os usuários
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, created_at, is_admin')
      .order('created_at', { ascending: false });

    if (usersError) {
      return NextResponse.json(
        { error: usersError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ users });
    
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 