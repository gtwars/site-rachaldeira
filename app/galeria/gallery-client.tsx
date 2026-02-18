'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Image as ImageIcon, Video, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import NextImage from 'next/image';

interface MediaItem {
    id: string;
    type: 'photo' | 'video';
    url: string;
    thumbnail_url: string | null;
    caption: string | null;
    uploaded_at: string;
    uploaded_by: string;
}

interface UploaderInfo {
    name: string;
    photo_url: string | null;
}

export function GalleryClient({ media }: { media: MediaItem[] }) {
    const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
    const [filter, setFilter] = useState<'all' | 'photo' | 'video'>('all');
    const [uploaders, setUploaders] = useState<Record<string, UploaderInfo>>({});

    // Fetch uploader info for all media
    useEffect(() => {
        const fetchUploaders = async () => {
            const supabase = createClient();
            const uploaderIds = [...new Set(media.map(m => m.uploaded_by))];

            const uploaderData: Record<string, UploaderInfo> = {};

            for (const uploaderId of uploaderIds) {
                const { data } = await supabase
                    .from('profiles')
                    .select('member_id')
                    .eq('id', uploaderId)
                    .single();

                if (data?.member_id) {
                    const { data: memberData } = await supabase
                        .from('members')
                        .select('name, photo_url')
                        .eq('id', data.member_id)
                        .single();

                    if (memberData) {
                        uploaderData[uploaderId] = memberData;
                    }
                }
            }

            setUploaders(uploaderData);
        };

        if (media.length > 0) {
            fetchUploaders();
        }
    }, [media]);

    const filteredMedia = filter === 'all'
        ? media
        : media.filter(item => item.type === filter);

    const currentIndex = selectedMedia
        ? filteredMedia.findIndex(item => item.id === selectedMedia.id)
        : -1;

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setSelectedMedia(filteredMedia[currentIndex - 1]);
        }
    };

    const handleNext = () => {
        if (currentIndex < filteredMedia.length - 1) {
            setSelectedMedia(filteredMedia[currentIndex + 1]);
        }
    };

    return (
        <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex gap-2 justify-center">
                <Button
                    variant={filter === 'all' ? 'primary' : 'outline'}
                    onClick={() => setFilter('all')}
                    size="sm"
                >
                    Todos ({media.length})
                </Button>
                <Button
                    variant={filter === 'photo' ? 'primary' : 'outline'}
                    onClick={() => setFilter('photo')}
                    size="sm"
                >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Fotos ({media.filter(m => m.type === 'photo').length})
                </Button>
                <Button
                    variant={filter === 'video' ? 'primary' : 'outline'}
                    onClick={() => setFilter('video')}
                    size="sm"
                >
                    <Video className="mr-2 h-4 w-4" />
                    Vídeos ({media.filter(m => m.type === 'video').length})
                </Button>
            </div>

            {/* Gallery Grid */}
            {filteredMedia.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                        <ImageIcon className="mx-auto h-12 w-12 mb-4 opacity-20" />
                        <p>Nenhuma mídia encontrada</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {filteredMedia.map((item) => {
                        const uploader = uploaders[item.uploaded_by];
                        return (
                            <div key={item.id} className="group rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 bg-white">
                                <div
                                    className="cursor-pointer aspect-square bg-gray-100"
                                    onClick={() => setSelectedMedia(item)}
                                >
                                    {item.type === 'photo' ? (
                                        <img
                                            src={item.url}
                                            alt={item.caption || 'Photo'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="relative w-full h-full">
                                            <video
                                                src={item.url}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
                                                <Play className="text-white w-12 h-12 drop-shadow-lg" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* Uploader info */}
                                {uploader && (
                                    <div className="p-2 flex items-center gap-2 border-t">
                                        <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                            {uploader.photo_url ? (
                                                <img
                                                    src={uploader.photo_url}
                                                    alt={uploader.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                                                    {uploader.name.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-600 truncate flex-1">
                                            {uploader.name}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Lightbox Modal */}
            {selectedMedia && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                    <Button
                        variant="ghost"
                        size="lg"
                        className="absolute top-4 right-4 text-white hover:bg-white/20"
                        onClick={() => setSelectedMedia(null)}
                    >
                        <X className="h-6 w-6" />
                    </Button>

                    {currentIndex > 0 && (
                        <Button
                            variant="ghost"
                            size="lg"
                            className="absolute left-4 text-white hover:bg-white/20"
                            onClick={handlePrevious}
                        >
                            <ChevronLeft className="h-8 w-8" />
                        </Button>
                    )}

                    {currentIndex < filteredMedia.length - 1 && (
                        <Button
                            variant="ghost"
                            size="lg"
                            className="absolute right-4 text-white hover:bg-white/20"
                            onClick={handleNext}
                        >
                            <ChevronRight className="h-8 w-8" />
                        </Button>
                    )}

                    <div className="max-w-4xl w-full">
                        {selectedMedia.type === 'photo' ? (
                            <NextImage
                                src={selectedMedia.url}
                                alt={selectedMedia.caption || 'Photo'}
                                width={1200}
                                height={800}
                                className="w-full h-auto max-h-[80vh] object-contain"
                            />
                        ) : (
                            <video
                                src={selectedMedia.url}
                                controls
                                autoPlay
                                className="w-full h-auto max-h-[80vh]"
                            />
                        )}
                        {selectedMedia.caption && (
                            <p className="text-white text-center mt-4">{selectedMedia.caption}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
