import { createClient } from '@/lib/supabase/server';
import NotificacoesClient from './notificacoes-client';

export default async function NotificacoesPage() {
    const supabase = await createClient();

    const { data: racha } = await supabase
        .from('rachas')
        .select('id, date, location, status')
        .eq('is_next', true)
        .single();

    const { data: members } = await supabase
        .from('members')
        .select('id, email')
        .eq('is_active', true);

    const allMembers = members || [];
    const membersWithEmail = allMembers.filter(m => m.email && m.email !== '').length;
    const membersWithoutEmail = allMembers.length - membersWithEmail;

    let confirmedCount = 0;
    if (racha) {
        const { count } = await supabase
            .from('racha_attendance')
            .select('*', { count: 'exact', head: true })
            .eq('racha_id', racha.id);
        confirmedCount = count || 0;
    }

    return (
        <NotificacoesClient
            racha={racha ?? null}
            totalMembers={allMembers.length}
            membersWithEmail={membersWithEmail}
            membersWithoutEmail={membersWithoutEmail}
            confirmedCount={confirmedCount}
        />
    );
}
