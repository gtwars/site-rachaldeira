'use client';

import { useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useRouter } from 'next/navigation';
import { signUpAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

import { Label } from '@/components/ui/label';

export default function SignupPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [position, setPosition] = useState('');
    const [age, setAge] = useState('');
    const [phone, setPhone] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const newFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(newFile);
                        } else {
                            reject(new Error('Canvas to Blob failed'));
                        }
                    }, 'image/jpeg', 0.8);
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
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

            if (photo) {
                try {
                    const compressedPhoto = await compressImage(photo);
                    formData.append('photo', compressedPhoto);
                } catch (e) {
                    console.error("Erro ao comprimir imagem, enviando original:", e);
                    formData.append('photo', photo);
                }
            }

            const result = await signUpAction(formData);

            if (result.error) {
                setError(result.error);
            } else {
                router.push('/login');
            }
        } catch (err: any) {
            let errorMsg = err.message || 'Erro ao criar conta';
            // Provide a better UX for common Vercel Payload/Timeout errors returning generic text
            if (errorMsg.includes('unexpected response')) {
                errorMsg = 'Erro de conexão com o servidor. Se estiver enviando uma foto, ela pode ser muito grande ou sua conexão está instável. Tente enviar sem foto.';
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
            <Card className="w-full max-w-md my-8">
                <CardHeader className="text-center flex flex-col items-center pt-4 pb-2">
                    <div className="relative w-[200px] h-[200px] mb-2">
                        <NextImage
                            src="https://pqroxmeyuicutatbessb.supabase.co/storage/v1/object/public/Fotos/logo%20rachaldeira.png"
                            alt="Logo Rachaldeira"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <CardTitle className="text-3xl">Criar Conta</CardTitle>
                    <p className="text-gray-600 mt-2">Junte-se ao Rachaldeira</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="photo">Foto de Perfil</Label>
                            <Input
                                id="photo"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                                className="cursor-pointer"
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo *</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Seu nome"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="position">Posição *</Label>
                            <select
                                id="position"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                required
                                disabled={loading}
                            >
                                <option value="" disabled>Selecione uma posição</option>
                                <option value="Goleiro">Goleiro</option>
                                <option value="Zagueiro">Zagueiro</option>
                                <option value="Lateral">Lateral</option>
                                <option value="Meia">Meia</option>
                                <option value="Atacante">Atacante</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="age">Idade *</Label>
                            <Input
                                id="age"
                                type="number"
                                placeholder="Sua idade"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                required
                                min="1"
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone *</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="(00) 00000-0000"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Senha *</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                                {error}
                                {error.includes('conexão') && (
                                    <p className="mt-2 text-xs font-semibold">Dica: Tente carregar novamente. Se o erro persistir, verifique se seu e-mail já não foi ativado.</p>
                                )}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
                            disabled={loading}
                        >
                            {loading ? 'Criando conta...' : 'Criar Conta'}
                        </Button>
                        
                        {loading && (
                            <p className="text-center text-xs text-gray-500 animate-pulse">
                                Isso pode levar alguns segundos dependendo da sua conexão...
                            </p>
                        )}

                        <div className="text-center text-sm text-gray-600 pt-2">
                            Já tem uma conta?{' '}
                            <Link href="/login" className="text-green-600 hover:underline font-medium">
                                Faça login
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
