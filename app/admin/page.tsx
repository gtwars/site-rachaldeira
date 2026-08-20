import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CalendarDays, Trophy } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function AdminDashboardPage() {
    const supabase = await createClient();

    const { data: nextRacha } = await supabase
        .from('rachas')
        .select('*')
        .eq('status', 'open')
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })
        .limit(1)
        .single();

    const { count: membersCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="pl-12 lg:pl-0">
                    <h1 className="text-3xl font-bold text-gray-900 leading-tight">Painel Administrativo</h1>
                    <p className="text-gray-500">Visão geral do sistema Rachaldeira</p>
                </div>
                <div className="text-sm text-gray-400 bg-white/50 backdrop-blur-sm p-2 rounded-lg border border-gray-100 md:bg-transparent md:border-0 md:p-0">
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Sao_Paulo' })}
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Próximo Racha</CardTitle>
                        <CalendarDays className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        {nextRacha ? (
                            <>
                                <div className="text-2xl font-bold">
                                    {new Date(nextRacha.date_time).toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'America/Sao_Paulo' })}
                                </div>
                                <p className="text-xs text-muted-foreground capitalize">
                                    {new Date(nextRacha.date_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })} • {nextRacha.location}
                                </p>
                            </>
                        ) : (
                            <div className="text-lg font-medium text-gray-500">Nenhum racha agendado</div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Integrantes Ativos</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{membersCount || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Total cadastrado
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Link href="/admin/rachas" className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center transition-colors">
                        <CalendarDays className="w-6 h-6 mx-auto mb-2 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">Novo Racha</span>
                    </Link>
                    <Link href="/admin/integrantes" className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center transition-colors">
                        <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Novo Integrante</span>
                    </Link>
                    <Link href="/admin/campeonatos" className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center transition-colors">
                        <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                        <span className="text-sm font-medium text-gray-700">Gerenciar Torneio</span>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
