import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminClientLayout from './admin-client-layout';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const role = profile?.role || 'user';

    return (
        <AdminClientLayout role={role}>
            {children}
        </AdminClientLayout>
    );
}
