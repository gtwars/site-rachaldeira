import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Trophy, Activity, AlertCircle, Shield } from 'lucide-react';

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // Buscar dados do membro
    const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single();

    if (memberError || !member) {
        notFound();
    }

    // Buscar estatísticas de scouts (agregado)
    const { data: scouts } = await supabase
        .from('racha_scouts')
        .select('goals, assists, difficult_saves, warnings')
        .eq('member_id', id);

    // Calcular totais
    const stats = scouts?.reduce((acc, curr) => ({
        goals: acc.goals + (curr.goals || 0),
        assists: acc.assists + (curr.assists || 0),
        saves: acc.saves + (curr.difficult_saves || 0),
        warnings: acc.warnings + (curr.warnings || 0),
        matches: acc.matches + 1
    }), { goals: 0, assists: 0, saves: 0, warnings: 0, matches: 0 }) || { goals: 0, assists: 0, saves: 0, warnings: 0, matches: 0 };

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <Link href="/integrantes" className="inline-flex items-center text-gray-500 hover:text-[#093a9f] mb-8 transition-colors group">
                    <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={20} />
                    Voltar para Perebas
                </Link>

                {/* Header do Perfil */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
                    <div className="h-48 bg-gradient-to-r from-[#093a9f] to-blue-600 relative">
                        <div className="absolute -bottom-16 left-8 md:left-12">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-md relative">
                                {member.photo_url ? (
                                    <Image
                                        src={member.photo_url}
                                        alt={member.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                                        <User size={64} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="pt-20 pb-8 px-8 md:px-12">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{member.name}</h1>
                                <div className="flex items-center gap-3 text-gray-600">
                                    {member.position && (
                                        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-semibold uppercase tracking-wide">
                                            {member.position}
                                        </span>
                                    )}
                                    {member.age && (
                                        <span className="text-sm">
                                            {member.age} anos
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Stats Resumo */}
                            <div className="flex gap-6 mt-4 md:mt-0 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.matches}</p>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Jogos</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-green-600">{stats.goals}</p>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Gols</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-blue-600">{stats.assists}</p>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Assist.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Estatísticas Detalhadas */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-gray-800">
                                <Activity className="text-[#093a9f]" />
                                Produção Ofensiva
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600 font-medium">Gols Marcados</span>
                                    <span className="text-2xl font-bold text-green-600">{stats.goals}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600 font-medium">Assistências</span>
                                    <span className="text-2xl font-bold text-blue-600">{stats.assists}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
                                    <span className="text-gray-700 font-bold">Média de Gols/Jogo</span>
                                    <span className="text-lg font-bold text-gray-900">
                                        {stats.matches > 0 ? (stats.goals / stats.matches).toFixed(2) : '0.00'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-gray-800">
                                <Shield className="text-gray-600" />
                                Defesa e Disciplina
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600 font-medium">Defesas Difíceis</span>
                                    <span className="text-2xl font-bold text-purple-600">{stats.saves}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600 font-medium">Cartões / Advertências</span>
                                    <span className="text-2xl font-bold text-yellow-600">{stats.warnings}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 border-purple-500">
                                    <span className="text-gray-700 font-bold">Média de Defesas/Jogo</span>
                                    <span className="text-lg font-bold text-gray-900">
                                        {stats.matches > 0 ? (stats.saves / stats.matches).toFixed(2) : '0.00'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
