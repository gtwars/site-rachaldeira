import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { attendanceEmailTemplate } from './email-templates';

export type NotificationResult = {
    success: boolean;
    message?: string;
    racha_id?: string;
    total_members: number;
    already_confirmed: number;
    emails_sent: number;
    emails_failed: number;
};

export async function sendAttendanceNotifications(): Promise<NotificationResult> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const resend = new Resend(process.env.RESEND_API_KEY);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://site-rachaldeira.vercel.app';
    const fromEmail = process.env.NOTIFICATION_FROM_EMAIL || 'noreply@rachaldeira.com.br';

    const { data: racha } = await supabase
        .from('rachas')
        .select('id, date, location')
        .eq('is_next', true)
        .eq('status', 'open')
        .single();

    if (!racha) {
        return {
            success: false,
            message: 'Nenhum racha aberto encontrado',
            total_members: 0,
            already_confirmed: 0,
            emails_sent: 0,
            emails_failed: 0,
        };
    }

    const { data: members } = await supabase
        .from('members')
        .select('id, name, email')
        .eq('is_active', true)
        .not('email', 'is', null)
        .neq('email', '');

    const allMembers = members || [];

    const { data: confirmed } = await supabase
        .from('racha_attendance')
        .select('member_id')
        .eq('racha_id', racha.id);

    const confirmedIds = new Set((confirmed || []).map((c: { member_id: string }) => c.member_id));
    const pending = allMembers.filter(m => m.email && !confirmedIds.has(m.id));

    if (!pending.length) {
        return {
            success: true,
            message: 'Todos os membros já responderam',
            racha_id: racha.id,
            total_members: allMembers.length,
            already_confirmed: allMembers.length,
            emails_sent: 0,
            emails_failed: 0,
        };
    }

    const rachaDate = new Date(racha.date);
    const subject = `⚽ Confirme sua presença – Racha ${rachaDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: 'America/Sao_Paulo',
    })}`;

    const results = await Promise.allSettled(
        pending.map(member =>
            resend.emails.send({
                from: `Rachaldeira <${fromEmail}>`,
                to: member.email!,
                subject,
                html: attendanceEmailTemplate(member.name, racha, siteUrl),
            })
        )
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return {
        success: true,
        racha_id: racha.id,
        total_members: allMembers.length,
        already_confirmed: allMembers.length - pending.length,
        emails_sent: sent,
        emails_failed: failed,
    };
}
