'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Trophy, Shield, Activity, Plus, Minus, User, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Player {
    id: string;
    name: string;
    position: string;
}

interface Team {
    id: string;
    name: string;
    logo_url?: string;
    players: Player[];
}

interface MatchStats {
    member_id: string;
    goals: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
}

interface MatchClientProps {
    matchId: string;
    campId: string;
    initialMatch: any;
    teamA: Team;
    teamB: Team;
    initialStats: MatchStats[];
    isAdmin: boolean;
}

// Mapping: from bracket_position → which next match and which slot (team_a or team_b)
function getNextBracketInfo(bracketPosition: string): { nextPosition: string; slot: 'team_a_id' | 'team_b_id' } | null {
    // Quartas → Semifinais
    // qf-1 winner → semi-1 team_a
    // qf-2 winner → semi-1 team_b
    // qf-3 winner → semi-2 team_a
    // qf-4 winner → semi-2 team_b
    if (bracketPosition === 'qf-1') return { nextPosition: 'semi-1', slot: 'team_a_id' };
    if (bracketPosition === 'qf-2') return { nextPosition: 'semi-1', slot: 'team_b_id' };
    if (bracketPosition === 'qf-3') return { nextPosition: 'semi-2', slot: 'team_a_id' };
    if (bracketPosition === 'qf-4') return { nextPosition: 'semi-2', slot: 'team_b_id' };

    // Semifinais → Final
    // semi-1 winner → final-1 team_a
    // semi-2 winner → final-1 team_b
    if (bracketPosition === 'semi-1') return { nextPosition: 'final-1', slot: 'team_a_id' };
    if (bracketPosition === 'semi-2') return { nextPosition: 'final-1', slot: 'team_b_id' };

    // Final → nenhum próximo
    return null;
}

function getBracketLabel(pos: string): string {
    if (pos?.startsWith('qf-')) return `Quartas de Final ${pos.split('-')[1]}`;
    if (pos?.startsWith('semi-')) return `Semifinal ${pos.split('-')[1]}`;
    if (pos === 'final-1') return 'Grande Final';
    return '';
}

export default function MatchClient({ matchId, campId, initialMatch, teamA, teamB, initialStats, isAdmin }: MatchClientProps) {
    const [match, setMatch] = useState(initialMatch);
    const [stats, setStats] = useState<MatchStats[]>(initialStats);
    const [loading, setLoading] = useState(false);
    const [advancingTeam, setAdvancingTeam] = useState<string | null>(null);
    const supabase = createClient();

    const isBracketMatch = !!match.bracket_position;
    const bracketLabel = getBracketLabel(match.bracket_position);

    useEffect(() => {
        // Realtime para estatísticas dos jogadores
        const statsChannel = supabase
            .channel('match-stats')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'match_player_stats',
                    filter: `match_id=eq.${matchId}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setStats(prev => [...prev, payload.new as MatchStats]);
                    } else if (payload.eventType === 'UPDATE') {
                        setStats(prev => prev.map(s => s.member_id === payload.new.member_id ? payload.new as MatchStats : s));
                    }
                }
            )
            .subscribe();

        // Realtime para o placar da partida
        const matchChannel = supabase
            .channel('match-score')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'championship_matches',
                    filter: `id=eq.${matchId}`
                },
                (payload) => {
                    setMatch(payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(statsChannel);
            supabase.removeChannel(matchChannel);
        };
    }, [matchId]);

    const getPlayerStats = (memberId: string) => {
        return stats.find(s => s.member_id === memberId) || {
            member_id: memberId,
            goals: 0,
            assists: 0,
            yellow_cards: 0,
            red_cards: 0
        };
    };

    const handleStatUpdate = async (memberId: string, teamId: string, field: keyof MatchStats, delta: number) => {
        if (!isAdmin) return;

        const { data: existing } = await supabase
            .from('match_player_stats')
            .select('*')
            .eq('match_id', matchId)
            .eq('member_id', memberId)
            .single();

        const currentVal = existing ? existing[field] : 0;
        const newVal = currentVal + delta;

        if (newVal < 0) return;

        const payload = {
            match_id: matchId,
            member_id: memberId,
            team_id: teamId,
            [field]: newVal
        };

        if (existing) {
            await supabase.from('match_player_stats').update({ [field]: newVal }).eq('id', existing.id);
        } else {
            await supabase.from('match_player_stats').insert(payload);
        }

        if (field === 'goals') {
            const isTeamA = teamId === teamA.id;
            const scoreField = isTeamA ? 'score_a' : 'score_b';
            const newMatchScore = (match[scoreField] || 0) + delta;
            await supabase.from('championship_matches').update({ [scoreField]: newMatchScore }).eq('id', matchId);
        }
    };

    // Classificar time vencedor e avançar para a próxima fase
    const handleAdvanceTeam = async (winnerTeamId: string) => {
        if (!isAdmin || !isBracketMatch) return;

        const bracketPos = match.bracket_position;
        const nextInfo = getNextBracketInfo(bracketPos);

        if (!nextInfo) {
            // É a final - apenas encerrar o jogo
            // Marcar como completed
            await supabase
                .from('championship_matches')
                .update({ status: 'completed' })
                .eq('id', matchId);

            alert('🏆 Campeonato finalizado! O campeão foi definido!');
            return;
        }

        setAdvancingTeam(winnerTeamId);

        try {
            // 1. Marcar partida atual como completed
            await supabase
                .from('championship_matches')
                .update({ status: 'completed' })
                .eq('id', matchId);

            // 2. Encontrar a próxima partida pelo bracket_position
            const { data: nextMatch } = await supabase
                .from('championship_matches')
                .select('*')
                .eq('championship_id', match.championship_id)
                .eq('bracket_position', nextInfo.nextPosition)
                .single();

            if (nextMatch) {
                // 3. Atualizar a próxima partida com o time classificado
                await supabase
                    .from('championship_matches')
                    .update({ [nextInfo.slot]: winnerTeamId })
                    .eq('id', nextMatch.id);
            }

            const winnerName = winnerTeamId === teamA.id ? teamA.name : teamB.name;
            const nextLabel = getBracketLabel(nextInfo.nextPosition);
            alert(`✅ ${winnerName} classificado para ${nextLabel}!`);

        } catch (err: any) {
            alert('Erro ao classificar time: ' + err.message);
        } finally {
            setAdvancingTeam(null);
        }
    };

    // Encerrar partida (não-bracket)
    const handleFinishMatch = async () => {
        if (!isAdmin) return;
        if (!confirm('Encerrar esta partida?')) return;

        await supabase
            .from('championship_matches')
            .update({ status: 'completed' })
            .eq('id', matchId);
    };

    const renderTeamStats = (team: Team) => (
        <Card className="flex-1">
            <CardHeader className="bg-gray-50 border-b pb-4">
                <div className="flex items-center gap-4">
                    {team.logo_url ? (
                        <img src={team.logo_url} className="w-12 h-12 object-contain" />
                    ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <Shield className="text-gray-400" />
                        </div>
                    )}
                    <div>
                        <CardTitle className="text-xl">{team.name}</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Jogador</TableHead>
                            <TableHead className="text-center w-24">Gols</TableHead>
                            <TableHead className="text-center w-24">Assis.</TableHead>
                            <TableHead className="text-center w-20">Cartões</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {team.players.map(player => {
                            const pStats = getPlayerStats(player.id);
                            return (
                                <TableRow key={player.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <User size={14} className="text-gray-400" />
                                        {player.name}
                                        <span className="text-xs text-gray-500 font-normal">{player.position}</span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {isAdmin && match.status !== 'completed' && (
                                                <button onClick={() => handleStatUpdate(player.id, team.id, 'goals', -1)} className="text-gray-300 hover:text-red-500 disabled:opacity-50" disabled={pStats.goals <= 0}><Minus size={14} /></button>
                                            )}
                                            <span className={`font-bold ${pStats.goals > 0 ? 'text-gray-900' : 'text-gray-300'}`}>{pStats.goals}</span>
                                            {isAdmin && match.status !== 'completed' && (
                                                <button onClick={() => handleStatUpdate(player.id, team.id, 'goals', 1)} className="text-gray-300 hover:text-green-500"><Plus size={14} /></button>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {isAdmin && match.status !== 'completed' && (
                                                <button onClick={() => handleStatUpdate(player.id, team.id, 'assists', -1)} className="text-gray-300 hover:text-red-500 disabled:opacity-50" disabled={pStats.assists <= 0}><Minus size={14} /></button>
                                            )}
                                            <span className={`font-bold ${pStats.assists > 0 ? 'text-gray-900' : 'text-gray-300'}`}>{pStats.assists}</span>
                                            {isAdmin && match.status !== 'completed' && (
                                                <button onClick={() => handleStatUpdate(player.id, team.id, 'assists', 1)} className="text-gray-300 hover:text-green-500"><Plus size={14} /></button>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {isAdmin && match.status !== 'completed' ? (
                                                <>
                                                    <button onClick={() => handleStatUpdate(player.id, team.id, 'yellow_cards', 1)} className={`w-4 h-6 rounded-sm border ${pStats.yellow_cards > 0 ? 'bg-yellow-400 border-yellow-500' : 'bg-transparent border-gray-300 hover:border-yellow-400'}`} title="Cartão Amarelo" />
                                                    <button onClick={() => handleStatUpdate(player.id, team.id, 'red_cards', 1)} className={`w-4 h-6 rounded-sm border ${pStats.red_cards > 0 ? 'bg-red-500 border-red-600' : 'bg-transparent border-gray-300 hover:border-red-500'}`} title="Cartão Vermelho" />
                                                </>
                                            ) : (
                                                <>
                                                    {pStats.yellow_cards > 0 && <div className="w-3 h-4 bg-yellow-400 rounded-sm" title="Amarelo" />}
                                                    {pStats.red_cards > 0 && <div className="w-3 h-4 bg-red-500 rounded-sm" title="Vermelho" />}
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-8">
            {/* Voltar */}
            <div>
                <Link href={`/campeonatos/${campId}`} className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1">
                    ← Voltar ao Campeonato
                </Link>
            </div>

            {/* Badge de Fase (Bracket) */}
            {isBracketMatch && (
                <div className="text-center">
                    <span className="inline-block bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-300 text-amber-800 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider">
                        🏅 {bracketLabel}
                    </span>
                </div>
            )}

            {/* Placar */}
            <Card className="bg-gradient-to-br from-[#093a9f] to-blue-900 text-white border-none shadow-lg">
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        {/* Time A */}
                        <div className="flex flex-col items-center flex-1">
                            <h2 className="text-2xl font-bold text-center mb-2">{teamA.name}</h2>
                            {teamA.logo_url && <img src={teamA.logo_url} className="w-20 h-20 object-contain bg-white rounded-full p-2" />}
                        </div>

                        {/* Placar Central */}
                        <div className="flex items-center gap-6">
                            <span className="text-6xl md:text-8xl font-bold font-mono">{match.score_a || 0}</span>
                            <span className="text-4xl text-blue-300">X</span>
                            <span className="text-6xl md:text-8xl font-bold font-mono">{match.score_b || 0}</span>
                        </div>

                        {/* Time B */}
                        <div className="flex flex-col items-center flex-1">
                            <h2 className="text-2xl font-bold text-center mb-2">{teamB.name}</h2>
                            {teamB.logo_url && <img src={teamB.logo_url} className="w-20 h-20 object-contain bg-white rounded-full p-2" />}
                        </div>
                    </div>

                    <div className="text-center mt-6">
                        <span className={`px-4 py-1 rounded-full text-sm font-semibold uppercase tracking-wider ${match.status === 'in_progress' ? 'bg-green-500 text-white animate-pulse' :
                            match.status === 'completed' ? 'bg-gray-600 text-gray-200' : 'bg-blue-800 text-blue-200'
                            }`}>
                            {match.status === 'in_progress' ? '● Ao Vivo' :
                                match.status === 'completed' ? 'Fim de Jogo' : 'Agendado'}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Botões de Classificação para Mata-Mata */}
            {isAdmin && isBracketMatch && match.status !== 'completed' && (
                <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50">
                    <CardContent className="p-6">
                        <div className="text-center mb-4">
                            <h3 className="text-lg font-bold text-amber-800 flex items-center justify-center gap-2">
                                <Trophy size={20} className="text-amber-600" />
                                Quem passa para a próxima fase?
                            </h3>
                            <p className="text-sm text-amber-600 mt-1">
                                {match.bracket_position === 'final-1'
                                    ? 'Selecione o campeão!'
                                    : `Clique no time vencedor para avançar para ${getBracketLabel(getNextBracketInfo(match.bracket_position)?.nextPosition || '')}`
                                }
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button
                                onClick={() => handleAdvanceTeam(teamA.id)}
                                disabled={!!advancingTeam}
                                className="group relative w-full sm:w-auto flex items-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                            >
                                {teamA.logo_url ? (
                                    <img src={teamA.logo_url} className="w-10 h-10 object-contain rounded-full border" />
                                ) : (
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                        <Shield size={18} className="text-gray-400" />
                                    </div>
                                )}
                                <div className="text-left">
                                    <p className="font-bold text-gray-900 group-hover:text-green-700">{teamA.name}</p>
                                    <p className="text-xs text-gray-500">Classificar →</p>
                                </div>
                                <ArrowRight size={20} className="text-gray-300 group-hover:text-green-500 ml-2 transition-colors" />
                                {advancingTeam === teamA.id && (
                                    <div className="absolute inset-0 bg-green-100/80 rounded-xl flex items-center justify-center">
                                        <span className="text-green-700 font-semibold animate-pulse">Classificando...</span>
                                    </div>
                                )}
                            </button>

                            <span className="text-gray-400 font-bold text-lg">ou</span>

                            <button
                                onClick={() => handleAdvanceTeam(teamB.id)}
                                disabled={!!advancingTeam}
                                className="group relative w-full sm:w-auto flex items-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                            >
                                {teamB.logo_url ? (
                                    <img src={teamB.logo_url} className="w-10 h-10 object-contain rounded-full border" />
                                ) : (
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                        <Shield size={18} className="text-gray-400" />
                                    </div>
                                )}
                                <div className="text-left">
                                    <p className="font-bold text-gray-900 group-hover:text-green-700">{teamB.name}</p>
                                    <p className="text-xs text-gray-500">Classificar →</p>
                                </div>
                                <ArrowRight size={20} className="text-gray-300 group-hover:text-green-500 ml-2 transition-colors" />
                                {advancingTeam === teamB.id && (
                                    <div className="absolute inset-0 bg-green-100/80 rounded-xl flex items-center justify-center">
                                        <span className="text-green-700 font-semibold animate-pulse">Classificando...</span>
                                    </div>
                                )}
                            </button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Resultado da classificação se completado */}
            {isBracketMatch && match.status === 'completed' && (
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-5 py-2 rounded-full text-sm font-semibold border border-green-200">
                        <CheckCircle size={18} />
                        Partida encerrada — Time classificado avançou para a próxima fase
                    </div>
                </div>
            )}

            {/* Botão Encerrar Partida (não-bracket) */}
            {isAdmin && !isBracketMatch && match.status !== 'completed' && (
                <div className="text-center">
                    <Button
                        onClick={handleFinishMatch}
                        size="lg"
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        <CheckCircle size={20} className="mr-2" />
                        Encerrar Partida
                    </Button>
                </div>
            )}

            {/* Scouts */}
            <div className="flex flex-col lg:flex-row gap-6">
                {renderTeamStats(teamA)}
                {renderTeamStats(teamB)}
            </div>

            {isAdmin && match.status !== 'completed' && (
                <div className="text-center text-sm text-gray-500 mt-8">
                    <p>Modo Administrador: Clique nos botões + e - para atualizar as estatísticas em tempo real.</p>
                </div>
            )}
        </div>
    );
}
