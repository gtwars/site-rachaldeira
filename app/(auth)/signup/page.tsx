'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useRouter } from 'next/navigation';
import { signUpAction } from './actions';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageCropper } from '@/components/ui/image-cropper';
import { Eye, EyeOff, Mail, Lock, User, Phone, Camera, ChevronDown } from 'lucide-react';

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

function FacebookIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2" aria-hidden="true">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    );
}

export default function SignupPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [position, setPosition] = useState('');
    const [age, setAge] = useState('');
    const [phone, setPhone] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setRawImageSrc(reader.result as string);
            setShowCropper(true);
        };
        reader.readAsDataURL(file);
        // Reset input so same file can be selected again
        e.target.value = '';
    };

    const handleCropComplete = (croppedFile: File) => {
        setPhoto(croppedFile);
        setPhotoPreview(URL.createObjectURL(croppedFile));
        setShowCropper(false);
        setRawImageSrc(null);
    };

    const handleCropCancel = () => {
        setShowCropper(false);
        setRawImageSrc(null);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }
        if (!position) {
            setError('Selecione uma posição');
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('password', password);
            formData.append('position', position);
            formData.append('age', age);
            formData.append('phone', phone);
            if (photo) formData.append('photo', photo);

            const result = await signUpAction(formData);

            if (result.error) {
                setError(result.error);
            } else {
                router.push('/login');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao criar conta');
        } finally {
            setLoading(false);
        }
    };

    const handleOAuth = async (provider: 'google' | 'facebook') => {
        setOauthLoading(provider);
        setError('');
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || `Erro ao entrar com ${provider}`);
            setOauthLoading(null);
        }
    };

    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 11);
        if (digits.length <= 2) return digits;
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    };

    return (
        <>
            {showCropper && rawImageSrc && (
                <ImageCropper
                    imageSrc={rawImageSrc}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
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

                {/* Right panel - form */}
                <div className="flex-1 flex items-start justify-center p-6 overflow-y-auto">
                    <div className="w-full max-w-md py-8 space-y-6">
                        {/* Mobile logo */}
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
                            <h2 className="text-2xl font-bold text-white">Criar conta</h2>
                            <p className="text-gray-400 mt-1">Preencha seus dados para se cadastrar</p>
                        </div>

                        {/* OAuth */}
                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => handleOAuth('google')}
                                disabled={!!oauthLoading || loading}
                                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-medium py-2.5 px-4 rounded-xl transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {oauthLoading === 'google' ? (
                                    <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
                                ) : <GoogleIcon />}
                                Cadastrar com Google
                            </button>

                            <button
                                type="button"
                                onClick={() => handleOAuth('facebook')}
                                disabled={!!oauthLoading || loading}
                                className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166fe5] text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {oauthLoading === 'facebook' ? (
                                    <span className="w-5 h-5 border-2 border-blue-300 border-t-white rounded-full animate-spin" />
                                ) : <FacebookIcon />}
                                Cadastrar com Facebook
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-gray-700" />
                            <span className="text-gray-500 text-sm">ou preencha o formulário</span>
                            <div className="flex-1 h-px bg-gray-700" />
                        </div>

                        <form onSubmit={handleSignup} className="space-y-5">
                            {/* Photo upload */}
                            <div className="flex flex-col items-center gap-3">
                                <div
                                    className="relative w-24 h-24 rounded-full bg-gray-800 border-2 border-dashed border-gray-600 hover:border-green-500 cursor-pointer transition-colors overflow-hidden group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {photoPreview ? (
                                        <>
                                            <NextImage
                                                src={photoPreview}
                                                alt="Foto de perfil"
                                                fill
                                                className="object-cover"
                                            />
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

                            {/* Email */}
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-gray-300 text-sm">E-mail *</Label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
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
                                            {['Goleiro', 'Zagueiro', 'Lateral', 'Meia', 'Atacante'].map(p => (
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

                            {/* Password */}
                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-gray-300 text-sm">Senha *</Label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Mínimo 6 caracteres"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="pl-9 pr-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus:border-green-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm password */}
                            <div className="space-y-1.5">
                                <Label htmlFor="confirmPassword" className="text-gray-300 text-sm">Confirmar senha *</Label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="pl-9 pr-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus:border-green-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
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
                                disabled={loading || !!oauthLoading}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-green-300 border-t-white rounded-full animate-spin" />
                                        Criando conta...
                                    </span>
                                ) : 'Criar Conta'}
                            </Button>
                        </form>

                        <p className="text-center text-gray-500 text-sm pb-4">
                            Já tem uma conta?{' '}
                            <Link href="/login" className="text-green-400 hover:text-green-300 font-medium transition-colors">
                                Faça login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
