'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { X, ZoomIn, RotateCw, Check } from 'lucide-react';

interface Area {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (croppedFile: File) => void;
    onCancel: () => void;
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<File> {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => { image.onload = resolve; });

    const canvas = document.createElement('canvas');
    const size = Math.min(pixelCrop.width, pixelCrop.height);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        size,
        size
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) { reject(new Error('Canvas is empty')); return; }
            resolve(new File([blob], 'profile.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.85);
    });
}

export function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [processing, setProcessing] = useState(false);

    const onCropChange = useCallback((crop: { x: number; y: number }) => {
        setCrop(crop);
    }, []);

    const onCropCompleteInternal = useCallback((_: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleConfirm = async () => {
        if (!croppedAreaPixels) return;
        setProcessing(true);
        try {
            const file = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropComplete(file);
        } catch (e) {
            console.error(e);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                    <h3 className="text-white font-semibold">Ajustar foto de perfil</h3>
                    <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="relative h-72 bg-gray-800">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteInternal}
                        onZoomChange={setZoom}
                    />
                </div>

                <div className="px-4 py-4 space-y-4">
                    <div className="flex items-center gap-3">
                        <ZoomIn size={16} className="text-gray-400 shrink-0" />
                        <Slider
                            min={1}
                            max={3}
                            step={0.01}
                            value={[zoom]}
                            onValueChange={([v]) => setZoom(v)}
                            className="flex-1"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <RotateCw size={16} className="text-gray-400 shrink-0" />
                        <Slider
                            min={0}
                            max={360}
                            step={1}
                            value={[rotation]}
                            onValueChange={([v]) => setRotation(v)}
                            className="flex-1"
                        />
                    </div>

                    <div className="flex gap-3 pt-1">
                        <Button
                            variant="outline"
                            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                            onClick={onCancel}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white"
                            onClick={handleConfirm}
                            disabled={processing}
                        >
                            <Check size={16} className="mr-1.5" />
                            {processing ? 'Processando...' : 'Confirmar'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
