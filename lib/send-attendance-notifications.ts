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
    first_error?: string;
};

export async function sendAttendanceNotifications(rachaId?: string): Promise<NotificationResult> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const resend = new Resend(process.env.RESEND_API_KEY);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://site-rachaldeira.vercel.app';
    const fromEmail = process.env.NOTIFICATION_FROM_EMAIL || 'onboarding@resend.dev';

    let rachaQuery = supabase
        .from('rachas')
        .select('id, date_time, location')
        .eq('status', 'open');

    if (rachaId) {
        rachaQuery = rachaQuery.eq('id', rachaId);
    } else {
        rachaQuery = rachaQuery.eq('is_next', true);
    }

    const { data: racha } = await rachaQuery.single();

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

    const rachaDate = new Date(racha.date_time);
    const subject = `⚽ Confirme sua presença – Racha ${rachaDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: 'America/Sao_Paulo',
    })}`;

    let sent = 0;
    let failed = 0;
    let firstError: string | undefined;

    for (const member of pending) {
        const { data, error } = await resend.emails.send({
            from: `Rachaldeira <${fromEmail}>`,
            to: member.email!,
            subject,
            html: attendanceEmailTemplate(member.name, { date: racha.date_time, location: racha.location }, siteUrl),
        });

        if (error || !data) {
            failed++;
            if (!firstError) firstError = error?.message ?? 'Erro desconhecido';
        } else {
            sent++;
        }
    }

    return {
        success: true,
        racha_id: racha.id,
        total_members: allMembers.length,
        already_confirmed: allMembers.length - pending.length,
        emails_sent: sent,
        emails_failed: failed,
        first_error: firstError,
    };
}
