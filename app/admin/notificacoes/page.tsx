import { createClient } from '@/lib/supabase/server';
import NotificacoesClient from './notificacoes-client';

export default async function NotificacoesPage() {
    const supabase = await createClient();

    const { data: rachas } = await supabase
        .from('rachas')
        .select('id, date_time, location, status')
        .eq('status', 'open')
        .order('date_time', { ascending: true });

    const { data: members } = await supabase
        .from('members')
        .select('id, email')
        .eq('is_active', true);

    const allMembers = members || [];
    const membersWithEmail = allMembers.filter(m => m.email && m.email !== '').length;
    const membersWithoutEmail = allMembers.length - membersWithEmail;

    const rachasWithStats = await Promise.all(
        (rachas || []).map(async (racha) => {
            const { count } = await supabase
                .from('racha_attendance')
                .select('*', { count: 'exact', head: true })
                .eq('racha_id', racha.id);
            return { ...racha, confirmedCount: count || 0 };
        })
    );

    return (
        <NotificacoesClient
            rachas={rachasWithStats}
            totalMembers={allMembers.length}
            membersWithEmail={membersWithEmail}
            membersWithoutEmail={membersWithoutEmail}
        />
    );
}
