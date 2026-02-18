import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Trophy, Medal, Star, Shield, Users } from 'lucide-react';

export default async function ChampionshipRankingPage() {
    const supabase = await createClient();

    // Buscar membros
    const { data: members } = await supabase
        .from('members')
        .select('id, name, position')
        .order('name');

    // Buscar stats de partidas de campeonato
    // Usamos o join com matches para filtrar apenas as que têm camp_id
    const { data: championshipStats } = await supabase
        .from('match_player_stats')
        .select(`
            member_id,
            goals,
            assists,
            difficult_saves,
            yellow_cards,
            red_cards,
            match_id,
            matches!inner (
                camp_id
            )
        `);

    // Processar dados
    const rankings = members?.map(member => {
        const stats = championshipStats?.filter((s: any) => s.member_id === member.id) || [];

        const goals = stats.reduce((sum: number, s: any) => sum + (s.goals || 0), 0);
        const assists = stats.reduce((sum: number, s: any) => sum + (s.assists || 0), 0);

        // Calcular participações em campeonatos distintos
        const uniqueCamps = new Set(stats.map((s: any) => s.matches?.camp_id).filter(Boolean));
        const participations = uniqueCamps.size;

        // Dados Mockados/Futuros (precisariam ser persistidos em tabela de histórico)
        const titles = 0;
        const finals = 0;
        const craqueTitles = 0; // Craque do Campeonato
        const artilheiroTitles = 0; // Artilheiro do Campeonato
        const xerifeTitles = 0; // Xerife do Campeonato
        const garcomTitles = 0; // Garçom do Campeonato
        const paredaoTitles = 0; // Paredão do Campeonato

        return {
            ...member,
            goals,
            assists,
            participations,
            titles,
            finals,
            craqueTitles,
            artilheiroTitles,
            xerifeTitles,
            garcomTitles,
            paredaoTitles,
        };
    }) || [];

    // Ordenar (por Títulos, depois Finais, depois Gols - critério arbitrário inicial)
    const sortedRankings = rankings.sort((a, b) =>
        b.titles - a.titles ||
        b.finals - a.finals ||
        b.goals - a.goals ||
        b.participations - a.participations
    );

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-4 shadow-sm">
                        <Trophy size={32} />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-800 mb-2">Hall da Fama - Campeonatos</h1>
                    <p className="text-lg text-slate-600">Histórico de conquistas e estatísticas em campeonatos oficiais</p>
                </div>

                <Card className="shadow-lg border-none">
                    <CardHeader className="bg-white border-b">
                        <CardTitle>Ranking Histórico</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                                        <TableHead className="w-16 text-center">Pos</TableHead>
                                        <TableHead>Jogador</TableHead>
                                        <TableHead className="text-center" title="Títulos de Campeão">
                                            <span className="flex items-center justify-center gap-1 font-bold text-yellow-600">
                                                <Trophy size={16} /> Títulos
                                            </span>
                                        </TableHead>
                                        <TableHead className="text-center" title="Participações em Campeonatos">
                                            Part
                                        </TableHead>
                                        <TableHead className="text-center" title="Finais Disputadas">
                                            Finais
                                        </TableHead>
                                        <TableHead className="text-center font-semibold text-green-700">Gols</TableHead>
                                        <TableHead className="text-center font-semibold text-blue-700">Assist</TableHead>

                                        {/* Prêmios Individuais */}
                                        <TableHead className="text-center bg-yellow-50/50" title="Vezes Craque do Campeonato">
                                            Craque
                                        </TableHead>
                                        <TableHead className="text-center bg-green-50/50" title="Vezes Artilheiro do Campeonato">
                                            Artilheiro
                                        </TableHead>
                                        <TableHead className="text-center bg-blue-50/50" title="Vezes Xerife do Campeonato">
                                            Xerife
                                        </TableHead>
                                        <TableHead className="text-center bg-indigo-50/50" title="Vezes Garçom do Campeonato">
                                            Garçom
                                        </TableHead>
                                        <TableHead className="text-center bg-red-50/50" title="Vezes Paredão do Campeonato">
                                            Paredão
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedRankings.map((player, idx) => (
                                        <TableRow key={player.id} className="hover:bg-slate-50 transition-colors">
                                            <TableCell className="text-center font-medium text-slate-500">
                                                {idx + 1}º
                                            </TableCell>
                                            <TableCell className="font-semibold text-slate-700">
                                                {player.name}
                                                {player.position && (
                                                    <span className="block text-xs font-normal text-slate-400">{player.position}</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-lg text-yellow-600">
                                                {player.titles > 0 ? player.titles : '-'}
                                            </TableCell>
                                            <TableCell className="text-center text-slate-600">
                                                {player.participations}
                                            </TableCell>
                                            <TableCell className="text-center text-slate-600">
                                                {player.finals > 0 ? player.finals : '-'}
                                            </TableCell>
                                            <TableCell className="text-center font-medium text-green-700">
                                                {player.goals}
                                            </TableCell>
                                            <TableCell className="text-center font-medium text-blue-700">
                                                {player.assists}
                                            </TableCell>

                                            {/* Prêmios */}
                                            <TableCell className="text-center bg-yellow-50/30 font-medium text-yellow-700">
                                                {player.craqueTitles > 0 ? player.craqueTitles : '-'}
                                            </TableCell>
                                            <TableCell className="text-center bg-green-50/30 font-medium text-green-700">
                                                {player.artilheiroTitles > 0 ? player.artilheiroTitles : '-'}
                                            </TableCell>
                                            <TableCell className="text-center bg-blue-50/30 font-medium text-blue-800">
                                                {player.xerifeTitles > 0 ? player.xerifeTitles : '-'}
                                            </TableCell>
                                            <TableCell className="text-center bg-indigo-50/30 font-medium text-indigo-700">
                                                {player.garcomTitles > 0 ? player.garcomTitles : '-'}
                                            </TableCell>
                                            <TableCell className="text-center bg-red-50/30 font-medium text-red-700">
                                                {player.paredaoTitles > 0 ? player.paredaoTitles : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {sortedRankings.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={12} className="text-center py-8 text-slate-400 italic">
                                                Nenhum dado histórico encontrado.
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
