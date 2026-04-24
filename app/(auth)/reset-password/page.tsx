'use client';

import { useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [hasSession, setHasSession] = useState(false);

    // Verificamos se há uma sessão ativa (vinda do link do e-mail)
    useState(() => {
        const checkSession = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
                setHasSession(true);
            }
            setInitializing(false);
        };
        checkSession();
    });

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Erro ao redefinir a senha');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
            <Card className="w-full max-w-md">
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
                    <CardTitle className="text-3xl">Redefinir Senha</CardTitle>
                    <p className="text-gray-600 mt-2">Digite sua nova senha abaixo</p>
                </CardHeader>
                <CardContent>
                    {initializing ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                            <p className="text-gray-600">Verificando autorização...</p>
                        </div>
                    ) : !hasSession && !success ? (
                        <div className="space-y-4">
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                                Sessão de redefinição expirada ou inválida. Por favor, solicite um novo e-mail.
                            </div>
                            <Link href="/forgot-password">
                                <Button className="w-full bg-green-600 hover:bg-green-700">
                                    Solicitar Novo E-mail
                                </Button>
                            </Link>
                        </div>
                    ) : success ? (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                                Senha redefinida com sucesso! Você será redirecionado para o login em instantes.
                            </div>
                            <Link href="/login">
                                <Button className="w-full bg-green-600 hover:bg-green-700">
                                    Ir para Login
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Nova Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
                                disabled={loading}
                            >
                                {loading ? 'Redefinindo...' : 'Redefinir Senha'}
                            </Button>

                            <div className="text-center text-sm text-gray-600">
                                <Link href="/login" className="text-green-600 hover:underline font-medium">
                                    Voltar para login
                                </Link>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
