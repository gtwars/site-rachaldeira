import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProximoRachaClient from './proximo-racha-client';

export default async function ProximoRachaPage() {
    const supabase = await createClient();

    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Get user profile with member_id and role
    const { data: profile } = await supabase
        .from('profiles')
        .select('member_id, role')
        .eq('id', user.id)
        .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'director';

    // Resolve member_id: from profile link or fallback by email
    let resolvedMemberId: string | null = profile?.member_id ?? null;
    if (!resolvedMemberId && user.email) {
        const { data: memberByEmail } = await supabase
            .from('members')
            .select('id')
            .eq('email', user.email)
            .maybeSingle();
        resolvedMemberId = memberByEmail?.id ?? null;
    }

    // Get next racha
    const { data: racha } = await supabase
        .from('rachas')
        .select('*')
        .eq('is_next', true)
        .single();

    if (!racha) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">😕</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Nenhum racha agendado
                    </h1>
                    <p className="text-gray-600">
                        O próximo racha ainda não foi criado. Aguarde o admin agendar!
                    </p>
                </div>
            </main>
        );
    }

    // Get attendance with member names
    const { data: attendance } = await supabase
        .from('racha_attendance')
        .select(`
      *,
      members:member_id (
        name
      )
    `)
        .eq('racha_id', racha.id);

    // Get existing scouts
    const { data: scouts } = await supabase
        .from('racha_scouts')
        .select(`
      *,
      members:member_id (
        name
      )
    `)
        .eq('racha_id', racha.id);

    return (
        <ProximoRachaClient
            racha={racha}
            initialAttendance={attendance || []}
            initialScouts={scouts || []}
            userMemberId={resolvedMemberId}
            isAdmin={isAdmin}
        />
    );
}
