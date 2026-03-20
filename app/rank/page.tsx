import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Trophy, Target, Shield, Users, Star, AlertTriangle, Medal } from 'lucide-react';
import VotingForm from '@/components/voting-form';
import { redirect } from 'next/navigation';
import RankingTable from './ranking-table';
import HighlightsGrid from './highlights-grid';
import FootballFieldHighlights from '@/components/football-field-highlights';

export const revalidate = 0;

export default async function RankingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Buscar período de votação ativo
    const { data: activePeriod } = await supabase
        .from('voting_periods')
        .select('*')
        .eq('is_open', true)
        .single();

    // Verificar se usuário já votou neste período
    let userVote: any = null;
    let canVote = false;
    let userMemberId = '';
    if (activePeriod && user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('member_id')
            .eq('id', user.id)
            .single();

        if (profile?.member_id) {
            userMemberId = profile.member_id;

            const { data: existingVote } = await supabase
                .from('votes')
                .select('*')
                .eq('voting_period_id', activePeriod.id)
                .eq('voter_member_id', profile.member_id)
                .single();

            userVote = existingVote;
            canVote = !existingVote;
        }
    }

    // Buscar todos os membros ativos
    const { data: members } = await supabase
        .from('members')
        .select('*')
        .eq('is_active', true)
        .order('name');

    // Buscar TODOS os rachas (para ser em tempo real)
    const { data: allRachas } = await supabase
        .from('rachas')
        .select('*');

    const allRachaIds = allRachas?.map(r => r.id) || [];

    // Buscar scouts de rachas (todos)
    const { data: rachaScouts } = await supabase
        .from('racha_scouts')
        .select('*')
        .in('racha_id', allRachaIds);

    const { data: attendance } = await supabase
        .from('racha_attendance')
        .select('*')
        .eq('status', 'in')
        .in('racha_id', allRachaIds);

    // Buscar último racha fechado REAL (ignorar Sistema/Manual) para destaques semanais
    const { data: lastRacha } = await supabase
        .from('rachas')
        .select('*')
        .eq('status', 'closed')
        .neq('location', 'Sistema (Manual)')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

    let weeklyHighlights = null;
    if (lastRacha) {
        // Buscar scouts deste racha para conferência interna (opcional, já temos no rachaScouts se for o mesmo id)
        const weekScouts = rachaScouts?.filter(s => s.racha_id === lastRacha.id) || [];

        // Buscar nomes dos destaques manuais
        const top1 = members?.find(m => m.id === lastRacha.top1_id);
        const top1_extra = members?.find(m => m.id === lastRacha.top1_extra_id);
        const top1_extra2 = members?.find(m => m.id === lastRacha.top1_extra2_id);
        const top2 = members?.find(m => m.id === lastRacha.top2_id);
        const top2_extra = members?.find(m => m.id === lastRacha.top2_extra_id);
        const top2_extra2 = members?.find(m => m.id === lastRacha.top2_extra2_id);
        const top3 = members?.find(m => m.id === lastRacha.top3_id);
        const top3_extra = members?.find(m => m.id === lastRacha.top3_extra_id);
        const top3_extra2 = members?.find(m => m.id === lastRacha.top3_extra2_id);
        const sheriff = members?.find(m => m.id === lastRacha.sheriff_id);
        const sheriff_extra = members?.find(m => m.id === lastRacha.sheriff_extra_id);
        const sheriff_extra2 = members?.find(m => m.id === lastRacha.sheriff_extra2_id);

        weeklyHighlights = {
            rachaLabel: new Date(lastRacha.date_time).toLocaleDateString('pt-BR'),
            top1,
            top1_extra,
            top1_extra2,
            top2,
            top2_extra,
            top2_extra2,
            top3,
            top3_extra,
            top3_extra2,
            sheriff,
            sheriff_extra,
            sheriff_extra2
        };
    }

    // Buscar votos se houver período ativo
    let votes: any[] = [];
    if (activePeriod) {
        const { data: votesData } = await supabase
            .from('votes')
            .select('*')
            .eq('voting_period_id', activePeriod.id);
        votes = votesData || [];
    }
    // Obter IDs dos rachas de ajustes (pode haver mais de um legado)
    const adjustmentRachaIds = allRachas?.filter(r => r.location === 'Sistema (Manual)' || r.name === 'Ajustes Globais Manuais').map(r => r.id) || [];

    // Calcular rankings para cada membro (APENAS RACHAS ENCERRADOS + AJUSTES)
    const rankings = members?.map(member => {
        const memberRachaScouts = rachaScouts?.filter(s => s.member_id === member.id) || [];

        // Estatísticas Básicas (Apenas Rachas)
        const goalsRacha = memberRachaScouts.reduce((sum, s) => sum + (s.goals || 0), 0);
        const goals = goalsRacha;

        const assistsRacha = memberRachaScouts.reduce((sum, s) => sum + (s.assists || 0), 0);
        const assists = assistsRacha;

        const savesRacha = memberRachaScouts.reduce((sum, s) => sum + (s.difficult_saves || 0), 0);
        const saves = savesRacha;

        // Participações: Apenas Rachas ENCERRADOS (reais) que o jogador tem presença "in" + Soma de Ajustes Manuais
        const closedRealRachaIds = allRachas?.filter(r => r.status === 'closed' && !adjustmentRachaIds.includes(r.id)).map(r => r.id) || [];
        const memberAttendanceCount = attendance?.filter(a => a.member_id === member.id && closedRealRachaIds.includes(a.racha_id)).length || 0;

        // Buscar TODOS os ajustes manuais deste membro em rachas de sistema
        const manualAdjustments = memberRachaScouts.filter(s => adjustmentRachaIds.includes(s.racha_id));
        const manualGames = manualAdjustments.reduce((sum, s) => sum + ((s as any).attendance_count || 0), 0);
        const participations = memberAttendanceCount + manualGames;

        // Calcular Pontos (Highlights) baseados nas marcações em rachas FECHADOS + Ajustes Manuais da Planilha Geral
        const manualTop1 = manualAdjustments.reduce((sum, s) => sum + ((s as any).top1_count || 0), 0);
        const manualTop2 = manualAdjustments.reduce((sum, s) => sum + ((s as any).top2_count || 0), 0);
        const manualTop3 = manualAdjustments.reduce((sum, s) => sum + ((s as any).top3_count || 0), 0);
        const manualSheriff = manualAdjustments.reduce((sum, s) => sum + ((s as any).sheriff_count || 0), 0);

        const top1Count = (allRachas?.filter((r: any) => r.status === 'closed' && !adjustmentRachaIds.includes(r.id) && (r.top1_id === member.id || r.top1_extra_id === member.id || r.top1_extra2_id === member.id)).length || 0) + manualTop1;

        const top2Count = (allRachas?.filter((r: any) => r.status === 'closed' && !adjustmentRachaIds.includes(r.id) && (r.top2_id === member.id || r.top2_extra_id === member.id || r.top2_extra2_id === member.id)).length || 0) + manualTop2;

        const top3Count = (allRachas?.filter((r: any) => r.status === 'closed' && !adjustmentRachaIds.includes(r.id) && (r.top3_id === member.id || r.top3_extra_id === member.id || r.top3_extra2_id === member.id)).length || 0) + manualTop3;

        const sheriffCount = (allRachas?.filter((r: any) => r.status === 'closed' && !adjustmentRachaIds.includes(r.id) && (r.sheriff_id === member.id || r.sheriff_extra_id === member.id || r.sheriff_extra2_id === member.id)).length || 0) + manualSheriff;

        // Adicionar destaques de CAMPEONATOS (Removido a pedido)
        const totalTop1 = top1Count;
        const totalSheriff = sheriffCount;

        const points = (totalTop1 * 3) + (top2Count * 2) + top3Count + totalSheriff;

        const craqueVotes = votes.filter(v => v.craque_member_id === member.id).length;
        const xerifeVotes = votes.filter(v => v.xerife_member_id === member.id).length;

        const totalClosedRachas = allRachas?.filter(r => r.status === 'closed' && !adjustmentRachaIds.includes(r.id)).length || 0;

        return {
            ...member,
            goals,
            assists,
            saves,
            participations,
            fominhaPct: totalClosedRachas > 0 ? Math.round((memberAttendanceCount / totalClosedRachas) * 100) : 0,
            top1Count,
            top2Count,
            top3Count,
            sheriffCount,
            craquePoints: (top1Count * 3) + (top2Count * 2) + top3Count,
            sheriffPoints: sheriffCount * 1,
            craqueVotes,
            xerifeVotes,
            points
        };
    }) || [];


    // Determinar badges (top 1 de cada categoria)
    const maxGoals = Math.max(...rankings.map(r => r.goals), 0);
    const maxAssists = Math.max(...rankings.map(r => r.assists), 0);
    const maxSaves = Math.max(...rankings.map(r => r.saves), 0);
    const maxParticipations = Math.max(...rankings.map(r => r.participations), 0);
    const maxCraqueVotes = Math.max(...rankings.map(r => r.craqueVotes), 0);
    const maxXerifeVotes = Math.max(...rankings.map(r => r.xerifeVotes), 0);

    const rankingsWithBadges = rankings.map(r => ({
        ...r,
        badges: [
            r.goals === maxGoals && maxGoals > 0 ? { icon: '🎯', label: 'Artilheiro' } : null,
            r.assists === maxAssists && maxAssists > 0 ? { icon: '🍽️', label: 'Garçom' } : null,
            r.saves === maxSaves && maxSaves > 0 ? { icon: '🧱', label: 'Paredão' } : null,
            r.participations === maxParticipations && maxParticipations > 0 ? { icon: '🏃', label: 'Fominha' } : null,
            r.craqueVotes === maxCraqueVotes && maxCraqueVotes > 0 ? { icon: '⭐', label: 'Craque' } : null,
            r.xerifeVotes === maxXerifeVotes && maxXerifeVotes > 0 ? { icon: '👮', label: 'Xerife' } : null,
        ].filter(Boolean),
    }));

    return (
        <main className="min-h-screen bg-white">
            <div className="max-w-6xl mx-auto px-4 pt-0 pb-8">
                <div className="text-center mb-6">
                    <img
                        src="https://pqroxmeyuicutatbessb.supabase.co/storage/v1/object/public/Fotos/logo%20premiacao%20rachaldeira.png"
                        alt="Logo Premiação"
                        className="h-[360px] mx-auto -mt-12 -mb-12 object-contain"
                    />
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                        Premiação Anual 2026 - Rachaldeira
                    </h1>
                    <p className="text-xl text-gray-600">
                        Os melhores jogadores do Rachaldeira
                    </p>
                </div>

                {/* Período de Votação */}
                {activePeriod && (
                    <Card className="mb-8 border-2 border-yellow-400 bg-yellow-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="text-yellow-600" />
                                Votação Aberta: {activePeriod.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 mb-3">
                                Período: {new Date(activePeriod.start_date).toLocaleDateString('pt-BR')} até{' '}
                                {new Date(activePeriod.end_date).toLocaleDateString('pt-BR')}
                            </p>
                            {canVote ? (
                                <>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Vote em quem você acha que merece as badges de Craque ⭐ e Xerife 👮 deste período!
                                    </p>
                                    <VotingForm
                                        activePeriod={activePeriod}
                                        members={members || []}
                                        userMemberId={userMemberId}
                                    />
                                </>
                            ) : userVote ? (
                                <div className="bg-green-50 border border-green-200 rounded p-4">
                                    <p className="text-green-800 font-semibold mb-2">✅ Você já votou neste período!</p>
                                    <p className="text-sm text-gray-700">
                                        Seus votos foram registrados com sucesso. Aguarde o resultado final.
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-gray-50 border border-gray-200 rounded p-4">
                                    <p className="text-gray-700 text-sm">
                                        Você precisa estar cadastrado como membro para votar.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Destaques da Semana (Último Racha) */}
                {weeklyHighlights && (
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Star className="text-yellow-400 fill-yellow-400 w-8 h-8" />
                            <h2 className="text-3xl font-bold text-gray-800">
                                Destaques da Semana
                            </h2>
                        </div>
                        <FootballFieldHighlights highlights={weeklyHighlights} />
                    </div>
                )}





                {/* Highlights Grid (Cumulative) */}
                <HighlightsGrid players={rankings} />

                {/* Tabela de Pontuação por Destaques */}
                <Card className="mt-12 border-none shadow-lg overflow-hidden">
                    <CardHeader className="bg-gray-100 border-b">
                        <CardTitle className="flex items-center gap-2 text-gray-800">
                            <Medal className="h-6 w-6 text-blue-600" />
                            Pontuação do Dia - Tabela de Destaques
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Mobile View - Cards List */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {rankingsWithBadges
                                .filter(p => p.points > 0)
                                .sort((a, b) => b.points - a.points)
                                .map((player, idx) => (
                                    <div key={player.id} className="p-4 flex items-center justify-between bg-white">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{player.name}</div>
                                                <div className="text-[10px] text-gray-500 flex gap-2 mt-1">
                                                    {player.top1Count > 0 && <span className="bg-yellow-50 px-1 rounded">Top 1: {player.top1Count}</span>}
                                                    {player.top2Count > 0 && <span className="bg-gray-50 px-1 rounded">Top 2: {player.top2Count}</span>}
                                                    {player.top3Count > 0 && <span className="bg-orange-50 px-1 rounded">Top 3: {player.top3Count}</span>}
                                                    {player.sheriffCount > 0 && <span className="bg-blue-50 px-1 rounded">Xerife: {player.sheriffCount}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-black text-blue-600">{player.points}</div>
                                            <div className="text-[9px] font-bold uppercase text-gray-400">Pontos</div>
                                        </div>
                                    </div>
                                ))}
                            {rankingsWithBadges.filter(p => p.points > 0).length === 0 && (
                                <div className="p-8 text-center text-gray-500 italic">
                                    Nenhum ponto registrado ainda.
                                </div>
                            )}
                        </div>

                        {/* Desktop View - Table */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader className="bg-blue-600">
                                    <TableRow className="border-none">
                                        <TableHead className="font-bold text-white">Nome</TableHead>
                                        <TableHead className="text-center font-bold text-white">Top 1 (3pts)</TableHead>
                                        <TableHead className="text-center font-bold text-white">Top 2 (2pts)</TableHead>
                                        <TableHead className="text-center font-bold text-white">Top 3 (1pt)</TableHead>
                                        <TableHead className="text-center font-bold text-white">Xerife (1pt)</TableHead>
                                        <TableHead className="text-center font-bold text-white bg-blue-700">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rankingsWithBadges
                                        .filter(p => p.points > 0)
                                        .sort((a, b) => b.points - a.points)
                                        .map((player) => (
                                            <TableRow key={player.id} className="border-gray-100">
                                                <TableCell className="font-medium text-gray-900">
                                                    {player.name}
                                                </TableCell>
                                                <TableCell className="text-center font-semibold">
                                                    {player.top1Count > 0 ? player.top1Count : ''}
                                                </TableCell>
                                                <TableCell className="text-center font-semibold">
                                                    {player.top2Count > 0 ? player.top2Count : ''}
                                                </TableCell>
                                                <TableCell className="text-center font-semibold">
                                                    {player.top3Count > 0 ? player.top3Count : ''}
                                                </TableCell>
                                                <TableCell className="text-center font-semibold">
                                                    {player.sheriffCount > 0 ? player.sheriffCount : ''}
                                                </TableCell>
                                                <TableCell className="text-center font-black text-gray-900 bg-gray-50/50">
                                                    {player.points}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    {rankingsWithBadges.filter(p => p.points > 0).length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-gray-500 italic">
                                                Nenhum ponto registrado ainda.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
