import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Check if user has a profile (member record) linked
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const adminClient = createAdminClient();
                const { data: profile } = await adminClient
                    .from('profiles')
                    .select('member_id')
                    .eq('id', user.id)
                    .maybeSingle();

                // If no profile or no member linked, redirect to complete registration
                if (!profile?.member_id) {
                    return NextResponse.redirect(`${origin}/completar-cadastro`);
                }
            }

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
