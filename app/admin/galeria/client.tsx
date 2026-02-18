'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Trash2, Image as ImageIcon, Video } from 'lucide-react';
import NextImage from 'next/image';
import { useRouter } from 'next/navigation';

interface MediaItem {
    id: string;
    type: 'photo' | 'video';
    url: string;
    caption: string | null;
    uploaded_at: string;
}

export default function AdminGaleriaClient({ initialMedia }: { initialMedia: MediaItem[] }) {
    const router = useRouter();
    const [media, setMedia] = useState(initialMedia);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
    const [caption, setCaption] = useState('');
    const [preview, setPreview] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            const previewUrl = URL.createObjectURL(selectedFile);
            setPreview(previewUrl);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        try {
            const supabase = createClient();

            // Upload file to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('Fotos')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('Fotos')
                .getPublicUrl(fileName);

            // Insert record into database (uploaded_by will auto-populate from auth.uid)
            const { data: newMedia, error: insertError } = await supabase
                .from('gallery_media')
                .insert({
                    type: mediaType,
                    url: publicUrl,
                    caption: caption || null,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            alert('✅ Mídia enviada com sucesso!');
            setMedia([newMedia, ...media]);
            setFile(null);
            setPreview(null);
            setCaption('');
            router.refresh();
        } catch (error: any) {
            alert('Erro ao fazer upload: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string, url: string) => {
        if (!confirm('Tem certeza que deseja excluir esta mídia?')) return;

        try {
            const supabase = createClient();

            // Delete from database
            const { error } = await supabase
                .from('gallery_media')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Delete from storage (extract filename from URL)
            const fileName = url.split('/').pop();
            if (fileName) {
                await supabase.storage.from('Fotos').remove([fileName]);
            }

            setMedia(media.filter(m => m.id !== id));
            router.refresh();
        } catch (error: any) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Gerenciar Galeria</h1>
                <p className="text-gray-500">Upload de fotos e vídeos</p>
            </div>

            {/* Upload Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Nova Mídia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo de Mídia</Label>
                            <Select value={mediaType} onValueChange={(value: any) => setMediaType(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="photo">Foto</SelectItem>
                                    <SelectItem value="video">Vídeo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Legenda (opcional)</Label>
                            <Input
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Descrição da mídia"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Arquivo</Label>
                        <Input
                            type="file"
                            accept={mediaType === 'photo' ? 'image/*' : 'video/*'}
                            onChange={handleFileChange}
                            className="cursor-pointer"
                        />
                    </div>

                    {preview && (
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <p className="text-sm font-medium mb-2">Preview:</p>
                            {mediaType === 'photo' ? (
                                <div className="relative w-full h-48">
                                    <NextImage
                                        src={preview}
                                        alt="Preview"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            ) : (
                                <video src={preview} controls className="w-full max-h-48" />
                            )}
                        </div>
                    )}

                    <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        {uploading ? 'Enviando...' : 'Fazer Upload'}
                    </Button>
                </CardContent>
            </Card>

            {/* Media List */}
            <Card>
                <CardHeader>
                    <CardTitle>Mídia Existente ({media.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {media.map((item) => (
                            <div key={item.id} className="relative group">
                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                    {item.type === 'photo' ? (
                                        <NextImage
                                            src={item.url}
                                            alt={item.caption || 'Photo'}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="relative w-full h-full">
                                            <video src={item.url} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                <Video className="h-8 w-8 text-white" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="danger"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0"
                                    onClick={() => handleDelete(item.id, item.url)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                {item.caption && (
                                    <p className="text-xs text-gray-600 mt-1 truncate">{item.caption}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
