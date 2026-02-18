import { createClient } from '@/lib/supabase/server';
import { GalleryClient } from './gallery-client';

export const dynamic = 'force-dynamic';

export default async function GaleriaPage() {
    const supabase = await createClient();

    const { data: media, error } = await supabase
        .from('gallery_media')
        .select('*')
        .order('uploaded_at', { ascending: false });

    if (error) {
        console.error('Error fetching gallery:', error);
    }

    return (
        <main className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Galeria</h1>
                    <p className="text-gray-600">Fotos e vídeos dos nossos rachas</p>
                </div>

                <GalleryClient media={media || []} />
            </div>
        </main>
    );
}
