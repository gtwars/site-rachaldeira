import { createClient } from '@/lib/supabase/server';
import AdminGaleriaClient from './client';

export const dynamic = 'force-dynamic';

export default async function AdminGaleriaPage() {
    const supabase = await createClient();

    const { data: media } = await supabase
        .from('gallery_media')
        .select('*')
        .order('uploaded_at', { ascending: false });

    return <AdminGaleriaClient initialMedia={media || []} />;
}
