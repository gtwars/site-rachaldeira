'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { completarCadastroAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, ChevronDown, User, Phone } from 'lucide-react';
import { ImageCropper } from '@/components/ui/image-cropper';

export default function CompletarCadastroPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState('');
    const [position, setPosition] = useState('');
    const [age, setAge] = useState('');
    const [phone, setPhone] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setRawImageSrc(reader.result as string);
            setShowCropper(true);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleCropComplete = (croppedFile: File) => {
        setPhoto(croppedFile);
        setPhotoPreview(URL.createObjectURL(croppedFile));
        setShowCropper(false);
        setRawImageSrc(null);
    };

    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 11);
        if (digits.length <= 2) return digits;
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!position) {
            setError('Selecione uma posição');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('position', position);
            formData.append('age', age);
            formData.append('phone', phone);
            if (photo) formData.append('photo', photo);

            const result = await completarCadastroAction(formData);

            if (result.error) {
                setError(result.error);
            } else {
                router.push('/integrantes');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao completar cadastro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {showCropper && rawImageSrc && (
                <ImageCropper
                    imageSrc={rawImageSrc}
                    onCropComplete={handleCropComplete}
                    onCancel={() => { setShowCropper(false); setRawImageSrc(null); }}
                />
            )}

            <div className="min-h-screen flex bg-gray-950">
                {/* Left panel */}
                <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-red-700 items-center justify-center p-12">
                    <div className="text-center">
                        <div className="w-64 h-64 mx-auto relative">
                            <NextImage
                                src="https://pqroxmeyuicutatbessb.supabase.co/storage/v1/object/public/Fotos/logo%20rachaldeira.png"
                                alt="Logo Rachaldeira"
                                fill
                                className="object-contain drop-shadow-xl"
                                priority
                            />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-white">Rachaldeira</h1>
                            <p className="text-blue-100 mt-2">O racha de quem ama o jogo</p>
                        </div>
                    </div>
                </div>

                {/* Right panel */}
                <div className="flex-1 flex items-start justify-center p-6 overflow-y-auto">
                    <div className="w-full max-w-md py-8 space-y-6">
                        <div className="lg:hidden text-center">
                            <div className="w-16 h-16 mx-auto relative mb-2">
                                <NextImage
                                    src="https://pqroxmeyuicutatbessb.supabase.co/storage/v1/object/public/Fotos/logo%20rachaldeira.png"
                                    alt="Logo Rachaldeira"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-white">Complete seu cadastro</h2>
                            <p className="text-gray-400 mt-1">Só falta mais um passo para entrar no elenco!</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Photo */}
                            <div className="flex flex-col items-center gap-3">
                                <div
                                    className="relative w-24 h-24 rounded-full bg-gray-800 border-2 border-dashed border-gray-600 hover:border-green-500 cursor-pointer transition-colors overflow-hidden group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {photoPreview ? (
                                        <>
                                            <NextImage src={photoPreview} alt="Foto" fill className="object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Camera size={20} className="text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                                            <Camera size={24} className="text-gray-500 group-hover:text-green-400 transition-colors" />
                                            <span className="text-xs text-gray-500 group-hover:text-green-400 transition-colors text-center leading-tight px-1">Foto</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <p className="text-xs text-gray-500">
                                    {photoPreview ? 'Clique para trocar a foto' : 'Clique para adicionar foto (opcional)'}
                                </p>
                            </div>

                            {/* Name */}
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-gray-300 text-sm">Nome completo *</Label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Seu nome"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus:border-green-500"
                                    />
                                </div>
                            </div>

                            {/* Position + Age */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="position" className="text-gray-300 text-sm">Posição *</Label>
                                    <div className="relative">
                                        <select
                                            id="position"
                                            className="w-full h-10 rounded-md border border-gray-700 bg-gray-800 px-3 pr-8 text-sm text-white appearance-none focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:opacity-50"
                                            value={position}
                                            onChange={(e) => setPosition(e.target.value)}
                                            required
                                            disabled={loading}
                                        >
                                            <option value="" disabled className="bg-gray-800">Selecione</option>
                                            {['Goleiro', 'Zagueiro', 'Meia', 'Atacante'].map(p => (
                                                <option key={p} value={p} className="bg-gray-800">{p}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="age" className="text-gray-300 text-sm">Idade *</Label>
                                    <Input
                                        id="age"
                                        type="number"
                                        placeholder="Ex: 25"
                                        value={age}
                                        onChange={(e) => setAge(e.target.value)}
                                        required
                                        min="1"
                                        max="99"
                                        disabled={loading}
                                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus:border-green-500"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="space-y-1.5">
                                <Label htmlFor="phone" className="text-gray-300 text-sm">Telefone *</Label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="(00) 00000-0000"
                                        value={phone}
                                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                                        required
                                        disabled={loading}
                                        className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus:border-green-500"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 rounded-xl transition-all duration-200"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-green-300 border-t-white rounded-full animate-spin" />
                                        Salvando...
                                    </span>
                                ) : 'Entrar no elenco'}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
