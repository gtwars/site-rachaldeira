'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/countdown-timer';
import Link from 'next/link';
import NextImage from 'next/image';
import { CalendarDays, MapPin, Clock, Users, AlertCircle, Check, X, Play, Activity } from 'lucide-react';

interface ScoutData {
    id?: string;
    racha_id: string;
    member_id: string;
    goals: number;
    assists: number;
    difficult_saves: number;
    warnings: number;
    members?: { name: string };
}

export default function ProximoRachaClient({ racha, initialAttendance, initialScouts, userMemberId, isAdmin }: any) {
    const router = useRouter();
    const [attendance, setAttendance] = useState(initialAttendance);
    const [scouts, setScouts] = useState<ScoutData[]>(initialScouts || []);
    const [loading, setLoading] = useState(false);
    const [closing, setClosing] = useState(false);
    const [error, setError] = useState('');
    const [rachaStatus, setRachaStatus] = useState(racha.status);

    const myAttendance = attendance.find((a: any) => a.member_id === userMemberId);
    const confirmedIn = attendance.filter((a: any) => a.status === 'in');
    const confirmedOut = attendance.filter((a: any) => a.status === 'out');

    const isLocked = rachaStatus === 'locked' || rachaStatus === 'in_progress' || rachaStatus === 'closed';

    const handleConfirmation = async (status: 'in' | 'out') => {
        if (isLocked) return;

        setLoading(true);
        setError('');

        try {
            const supabase = createClient();

            if (myAttendance) {
                const { error: updateError } = await supabase
                    .from('racha_attendance')
                    .update({ status, confirmed_at: new Date().toISOString() })
                    .eq('id', myAttendance.id);

                if (updateError) throw updateError;

                setAttendance((prev: any[]) =>
                    prev.map((a: any) =>
                        a.id === myAttendance.id
                            ? { ...a, status, confirmed_at: new Date().toISOString() }
                            : a
                    )
                );
            } else {
                const { data: newRecord, error: insertError } = await supabase
                    .from('racha_attendance')
                    .insert({
                        racha_id: racha.id,
                        member_id: userMemberId,
                        status,
                    })
                    .select('*, members(name)')
                    .single();

                if (insertError) throw insertError;
                setAttendance((prev: any[]) => [...prev, newRecord]);
            }

            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Erro ao confirmar presença');
        } finally {
            setLoading(false);
        }
    };

    // Initialize scouts for all confirmed players
    const handleStartRacha = async () => {
        if (!isAdmin) return;
        setLoading(true);
        try {
            const supabase = createClient();

            // Update racha status to in_progress
            await supabase.from('rachas').update({ status: 'in_progress' }).eq('id', racha.id);

            // Create scout records for all confirmed "in" players
            const newScouts: ScoutData[] = [];
            for (const att of confirmedIn) {
                const existing = scouts.find((s: ScoutData) => s.member_id === att.member_id);
                if (!existing) {
                    const { data, error } = await supabase
                        .from('racha_scouts')
                        .upsert({
                            racha_id: racha.id,
                            member_id: att.member_id,
                            goals: 0,
                            assists: 0,
                            difficult_saves: 0,
                            warnings: 0,
                        }, { onConflict: 'racha_id,member_id' })
                        .select('*, members(name)')
                        .single();

                    if (data) newScouts.push(data);
                }
            }

            setScouts(prev => [...prev, ...newScouts]);
            setRachaStatus('in_progress');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Erro ao iniciar rachaldeira');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <NextImage
                            src="/logo-new.png"
                            alt="Rachaldeira Logo"
                            width={120}
                            height={120}
                            className="object-contain"
                        />
                    </div>
                    <h1 className="text-5xl font-bold text-[#093a9f] mb-2">
                        Próximo Rachaldeira
                    </h1>
                    <p className="text-xl text-gray-700">{racha.location}</p>
                    {rachaStatus === 'in_progress' && (
                        <div className="mt-3 flex flex-col items-center gap-2">
                            <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full animate-pulse shadow-lg">
                                <span className="w-2 h-2 bg-white rounded-full"></span>
                                AO VIVO
                            </div>
                            {isAdmin && (
                                <Link href={`/admin/rachas/${racha.id}/scouts`}>
                                    <Button className="mt-2 gap-2 bg-green-600 hover:bg-green-700 text-white shadow-sm border-none">
                                        <Activity size={16} />
                                        Ir para os Scouts Ao vivo
                                    </Button>
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Contagem Regressiva - só se aberto */}
                {(rachaStatus === 'open' || rachaStatus === 'locked') && (
                    <Card className="mb-6 border-none shadow-md">
                        <CardContent className="py-8">
                            <p className="text-center text-[#093a9f] mb-4 font-medium uppercase tracking-widest text-sm">Faltam:</p>
                            <CountdownTimer targetDate={racha.date_time} />
                        </CardContent>
                    </Card>
                )}

                {/* Detalhes do Racha */}
                <Card className="mb-6 border-none shadow-md">
                    <CardHeader>
                        <CardTitle>Informações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-3 text-gray-700">
                            <CalendarDays className="text-[#093a9f]" size={20} />
                            <span className="font-semibold">Data:</span>
                            <span>{new Date(racha.date_time).toLocaleDateString('pt-BR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <Clock className="text-[#093a9f]" size={20} />
                            <span className="font-semibold">Horário:</span>
                            <span>{new Date(racha.date_time).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <MapPin className="text-[#093a9f]" size={20} />
                            <span className="font-semibold">Local:</span>
                            <span>{racha.location}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Confirmação de Presença */}
                <Card className="mb-6 border-none shadow-md">
                    <CardHeader>
                        <CardTitle>Confirmação de Presença</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLocked ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                                <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
                                <div>
                                    <p className="font-semibold text-yellow-800 mb-1">
                                        Confirmações Encerradas
                                    </p>
                                    <p className="text-sm text-yellow-700">
                                        {rachaStatus === 'locked' && 'Inscrições encerradas (30min antes).'}
                                        {rachaStatus === 'in_progress' && 'Rachaldeira em andamento.'}
                                        {rachaStatus === 'closed' && 'Rachaldeira encerrada.'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-4">
                                <p className="text-gray-600 mb-4">
                                    {myAttendance
                                        ? `Você confirmou: ${myAttendance.status === 'in' ? 'Estou dentro' : 'Estou fora'}`
                                        : 'Você ainda não confirmou sua presença.'
                                    }
                                </p>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <Button
                                onClick={() => handleConfirmation('in')}
                                disabled={loading || isLocked || myAttendance?.status === 'in'}
                                className={`flex-1 font-semibold text-lg py-6 transition-all ${myAttendance?.status === 'in'
                                    ? 'bg-green-700 hover:bg-green-800 text-white shadow-lg scale-[1.02] ring-2 ring-green-500 ring-offset-2'
                                    : 'bg-green-500 hover:bg-green-600 text-white opacity-90 hover:opacity-100'
                                    }`}
                            >
                                <Check size={20} className="mr-2" />
                                Estou Dentro
                            </Button>
                            <Button
                                onClick={() => handleConfirmation('out')}
                                disabled={loading || isLocked || myAttendance?.status === 'out'}
                                className={`flex-1 font-semibold text-lg py-6 transition-all ${myAttendance?.status === 'out'
                                    ? 'bg-red-700 hover:bg-red-800 text-white shadow-lg scale-[1.02] ring-2 ring-red-500 ring-offset-2'
                                    : 'bg-red-500 hover:bg-red-600 text-white opacity-90 hover:opacity-100'
                                    }`}
                            >
                                <X size={20} className="mr-2" />
                                Estou Fora
                            </Button>
                        </div>

                        {/* Admin: Iniciar Racha */}
                        {isAdmin && rachaStatus !== 'in_progress' && rachaStatus !== 'closed' && (
                            <div className="mt-4 pt-4 border-t">
                                <Button
                                    onClick={handleStartRacha}
                                    disabled={loading || confirmedIn.length === 0}
                                    className="w-full bg-[#093a9f] hover:bg-blue-900 text-white font-semibold py-6 text-lg shadow-lg transition-all hover:scale-[1.01]"
                                >
                                    <Play className="mr-2 fill-current" size={24} />
                                    Iniciar Rachaldeira
                                    <span className="ml-2 text-sm font-normal opacity-80">({confirmedIn.length} confirmados)</span>
                                </Button>
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Lista de Confirmados */}
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Dentro */}
                    <Card className="border-none shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between text-base">
                                <div className="flex items-center gap-2 text-green-700">
                                    <Check size={20} />
                                    <span>Confirmados (Dentro)</span>
                                </div>
                                <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">{confirmedIn.length}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {confirmedIn.length > 0 ? (
                                <ul className="space-y-2">
                                    {confirmedIn.map((att: any) => (
                                        <li key={att.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#093a9f]">
                                                <Users size={16} />
                                            </div>
                                            <span className="font-medium text-gray-700">{att.members?.name || 'Jogador'}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-400 text-sm italic py-2">Nenhum confirmado ainda</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Fora */}
                    <Card className="border-none shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between text-base">
                                <div className="flex items-center gap-2 text-red-700">
                                    <X size={20} />
                                    <span>Confirmados (Fora)</span>
                                </div>
                                <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">{confirmedOut.length}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {confirmedOut.length > 0 ? (
                                <ul className="space-y-2">
                                    {confirmedOut.map((att: any) => (
                                        <li key={att.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 opacity-75">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                <Users size={16} />
                                            </div>
                                            <span className="font-medium text-gray-600 line-through">{att.members?.name || 'Jogador'}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-400 text-sm italic py-2">Ninguém confirmou fora ainda</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
