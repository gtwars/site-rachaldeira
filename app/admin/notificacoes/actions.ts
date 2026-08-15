'use server';

import { createClient } from '@/lib/supabase/server';
import { sendAttendanceNotifications } from '@/lib/send-attendance-notifications';

export async function triggerAttendanceNotifications(rachaId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Não autenticado' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!['admin', 'director'].includes(profile?.role)) {
        return { error: 'Sem permissão' };
    }

    try {
        return await sendAttendanceNotifications(rachaId);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        return { error: message, total_members: 0, already_confirmed: 0, emails_sent: 0, emails_failed: 0 };
    }
}
