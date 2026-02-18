import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Trophy, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { BracketViewer } from '@/components/bracket-viewer';

export default async function CampeonatoDetalhesPage({ params }: { params: Promise<{ campId: string }> }) {
    const { campId } = await params;
    const supabase = await createClient();

    // Buscar campeonato
    const { data: championship } = await supabase
        .from('championships')
        .select('*')
        .eq('id', campId)
        .single();

    if (!championship) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Campeonato não encontrado</h1>
                </div>
            </main>
        );
    }

    // Buscar user para verificar se é admin
    const { data: { user } } = await supabase.auth.getUser();
    let isAdmin = false;
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        isAdmin = profile?.role === 'admin';
    }

    // Buscar times
    const { data: teams } = await supabase
        .from('teams')
        .select(`
      *,
      team_members (
        members (
          name
        )
      )
    `)
        .eq('championship_id', campId);

    // Buscar partidas
    const { data: matches } = await supabase
        .from('championship_matches')
        .select(`
      *,
      team_a:team_a_id (name),
      team_b:team_b_id (name)
    `)
        .eq('championship_id', campId)
        .order('round', { ascending: true });

    // Calcular classificação (para pontos corridos OU fase de grupos no bracket)
    let standings: any[] = [];
    // Partidas de grupo (round != null, bracket_position == null)
    const groupMatches = matches?.filter(m => m.round && !m.bracket_position) || [];
    const showStandings = (championship.format === 'round_robin' || (championship.format === 'bracket' && groupMatches.length > 0));

    if (showStandings && teams) {
        standings = teams.map(team => {
            const teamMatches = groupMatches.filter(m =>
                (m.team_a_id === team.id || m.team_b_id === team.id) && m.status === 'completed'
            );

            let points = 0;
            let wins = 0;
            let draws = 0;
            let losses = 0;
            let goalsFor = 0;
            let goalsAgainst = 0;

            teamMatches.forEach(match => {
                const isTeamA = match.team_a_id === team.id;
                const ownScore = isTeamA ? match.score_a : match.score_b;
                const oppScore = isTeamA ? match.score_b : match.score_a;

                goalsFor += ownScore || 0;
                goalsAgainst += oppScore || 0;

                if (ownScore > oppScore) {
                    points += 3;
                    wins++;
                } else if (ownScore === oppScore) {
                    points += 1;
                    draws++;
                } else {
                    losses++;
                }
            });

            return {
                ...team,
                points,
                played: teamMatches.length,
                wins,
                draws,
                losses,
                goalsFor,
                goalsAgainst,
                goalDiff: goalsFor - goalsAgainst,
            };
        }).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
            return b.goalsFor - a.goalsFor;
        });
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        {championship.logo_url && (
                            <div className="relative w-16 h-16 mr-2">
                                <Image
                                    src={championship.logo_url}
                                    alt={championship.name}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        )}
                        <h1 className="text-4xl font-bold text-gray-900">
                            {championship.name}
                        </h1>
                    </div>
                    <div className="flex gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            {new Date(championship.start_date).toLocaleDateString('pt-BR')}
                        </div>
                        <div>📍 {championship.location}</div>
                        <div>
                            {championship.format === 'round_robin' ? '🔄 Pontos Corridos' : '🏅 Chaveamento'}
                        </div>
                        <span className={`px-3 py-1 rounded ${championship.status === 'not_started' ? 'bg-blue-100 text-blue-800' :
                            championship.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {championship.status === 'not_started' ? 'Não Iniciado' :
                                championship.status === 'in_progress' ? 'Em Andamento' : 'Finalizado'}
                        </span>
                    </div>
                </div>

                {/* Classificação (Pontos Corridos) */}
                {showStandings && standings.length > 0 && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>📊 {championship.format === 'bracket' ? 'Classificação — Fase de Grupos' : 'Classificação'}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pos</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead className="text-center">PJ</TableHead>
                                        <TableHead className="text-center">V</TableHead>
                                        <TableHead className="text-center">E</TableHead>
                                        <TableHead className="text-center">D</TableHead>
                                        <TableHead className="text-center">GP</TableHead>
                                        <TableHead className="text-center">GC</TableHead>
                                        <TableHead className="text-center">SG</TableHead>
                                        <TableHead className="text-center">PTS</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {standings.map((team, idx) => (
                                        <TableRow key={team.id}>
                                            <TableCell className="font-bold">
                                                {idx === 0 && '🥇'}
                                                {idx === 1 && '🥈'}
                                                {idx === 2 && '🥉'}
                                                {idx >= 3 && `${idx + 1}º`}
                                            </TableCell>
                                            <TableCell className="font-semibold">{team.name}</TableCell>
                                            <TableCell className="text-center">{team.played}</TableCell>
                                            <TableCell className="text-center text-green-700">{team.wins}</TableCell>
                                            <TableCell className="text-center text-gray-600">{team.draws}</TableCell>
                                            <TableCell className="text-center text-red-700">{team.losses}</TableCell>
                                            <TableCell className="text-center">{team.goalsFor}</TableCell>
                                            <TableCell className="text-center">{team.goalsAgainst}</TableCell>
                                            <TableCell className="text-center font-semibold">{team.goalDiff}</TableCell>
                                            <TableCell className="text-center font-bold text-blue-700">{team.points}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {championship.format === 'bracket' && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            Fase Mata-Mata
                        </h2>
                        {matches && matches.some(m => m.bracket_position) ? (
                            <BracketViewer matches={matches.filter(m => m.bracket_position)} campId={campId} />
                        ) : (
                            <Card>
                                <CardContent className="p-8 text-center text-gray-500">
                                    A fase de mata-mata ainda não começou. Acompanhe a fase de grupos abaixo!
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Partidas */}
                {matches && matches.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Partidas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {championship.format === 'round_robin' && (
                                <>
                                    {Array.from(new Set(matches.map(m => m.round))).map(round => (
                                        <div key={round}>
                                            <h3 className="font-semibold text-gray-800 mb-2">Rodada {round}</h3>
                                            <div className="space-y-2 ml-4">
                                                {matches.filter(m => m.round === round).map(match => (
                                                    <div
                                                        key={match.id}
                                                        className="flex items-center justify-between bg-gray-50 p-3 rounded"
                                                    >
                                                        <div className="flex-1 text-right font-semibold">
                                                            {match.team_a?.name}
                                                        </div>
                                                        <div className="px-6 flex items-center gap-3">
                                                            {match.status === 'completed' ? (
                                                                <>
                                                                    <span className="text-xl font-bold">{match.score_a}</span>
                                                                    <span className="text-gray-400">×</span>
                                                                    <span className="text-xl font-bold">{match.score_b}</span>
                                                                </>
                                                            ) : (
                                                                <span className="text-gray-400 text-sm">vs</span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 font-semibold">
                                                            {match.team_b?.name}
                                                        </div>
                                                        {match.status === 'scheduled' && (
                                                            <Link href={`/campeonatos/${campId}/partida/${match.id}`} className="ml-4">
                                                                <Button variant="outline" size="sm" className="h-7 text-xs">
                                                                    Ao Vivo
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {match.status === 'completed' && (
                                                            <Link href={`/campeonatos/${campId}/partida/${match.id}`} className="ml-4">
                                                                <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-800">
                                                                    Ver Scouts
                                                                </Button>
                                                            </Link>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}

                            {championship.format === 'bracket' && (
                                <div className="space-y-2">
                                    {matches.filter(m => !m.bracket_position).length > 0 && (
                                        <h3 className="font-semibold text-gray-800 mb-2 mt-4">Fase de Grupos</h3>
                                    )}
                                    {/* Group stage matches (round based) */}
                                    {Array.from(new Set(matches.filter(m => m.round && !m.bracket_position).map(m => m.round))).map(round => (
                                        <div key={round}>
                                            <h4 className="font-medium text-gray-700 mb-2 ml-2">Rodada {round}</h4>
                                            <div className="space-y-2 ml-4">
                                                {matches.filter(m => m.round === round && !m.bracket_position).map(match => (
                                                    <div
                                                        key={match.id}
                                                        className="flex items-center justify-between bg-gray-50 p-3 rounded"
                                                    >
                                                        <div className="flex-1 text-right font-semibold">{match.team_a?.name}</div>
                                                        <div className="px-6 flex items-center gap-3">
                                                            {match.status === 'completed' ? (
                                                                <>
                                                                    <span className="text-xl font-bold">{match.score_a}</span>
                                                                    <span className="text-gray-400">×</span>
                                                                    <span className="text-xl font-bold">{match.score_b}</span>
                                                                </>
                                                            ) : (
                                                                <span className="text-gray-400 text-sm">vs</span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 font-semibold">{match.team_b?.name}</div>
                                                        <Link href={`/campeonatos/${campId}/partida/${match.id}`} className="ml-4">
                                                            <Button variant={match.status === 'completed' ? 'ghost' : 'outline'} size="sm" className="h-7 text-xs">
                                                                {match.status === 'completed' ? 'Ver Scouts' : 'Ao Vivo'}
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {(!matches || matches.length === 0) && (
                    <Card>
                        <CardContent className="p-8 text-center text-gray-500">
                            Nenhuma partida criada ainda
                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    );
}
