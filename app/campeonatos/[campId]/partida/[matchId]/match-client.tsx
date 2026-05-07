'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trophy, Shield, Plus, Minus, User, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Player { id: string; name: string; position: string; }
interface Team { id: string; name: string; logo_url?: string; players: Player[]; }
interface MatchStats { member_id: string; goals: number; assists: number; yellow_cards: number; red_cards: number; }
interface MatchClientProps {
    matchId: string; campId: string; initialMatch: any;
    teamA: Team; teamB: Team; initialStats: MatchStats[];
    isAdmin: boolean; championshipFormat?: string;
}

function getNextBracketInfo(bracketPosition: string, format?: string): { nextPosition: string; slot: 'team_a_id' | 'team_b_id' } | null {
    const is6Teams = format === 'tournament_6_teams';
    if (bracketPosition === 'qf-1') return { nextPosition: is6Teams ? 'semi-2' : 'semi-1', slot: is6Teams ? 'team_b_id' : 'team_a_id' };
    if (bracketPosition === 'qf-2') return { nextPosition: 'semi-1', slot: 'team_b_id' };
    if (bracketPosition === 'qf-3') return { nextPosition: 'semi-2', slot: 'team_a_id' };
    if (bracketPosition === 'qf-4') return { nextPosition: 'semi-2', slot: 'team_b_id' };
    if (bracketPosition === 'semi-1') return { nextPosition: 'final-1', slot: 'team_a_id' };
    if (bracketPosition === 'semi-2') return { nextPosition: 'final-1', slot: 'team_b_id' };
    return null;
}

function getBracketLabel(pos: string): string {
    if (pos?.startsWith('qf-')) return `Quartas de Final`;
    if (pos?.startsWith('semi-')) return `Semifinal`;
    if (pos === 'final-1') return 'Grande Final';
    return '';
}

function TeamLogo({ url, name, size = 'md' }: { url?: string; name: string; size?: 'sm' | 'md' | 'lg' }) {
    const sz = size === 'lg' ? 'w-20 h-20' : size === 'md' ? 'w-12 h-12' : 'w-8 h-8';
    return url ? (
        <img src={url} alt={name} className={`${sz} object-contain`} />
    ) : (
        <div className={`${sz} rounded-full bg-gray-100 flex items-center justify-center`}>
            <Shield size={size === 'lg' ? 28 : size === 'md' ? 18 : 14} className="text-gray-300" />
        </div>
    );
}

export default function MatchClient({ matchId, campId, initialMatch, teamA, teamB, initialStats, isAdmin, championshipFormat }: MatchClientProps) {
    const [match, setMatch] = useState(initialMatch);
    const [stats, setStats] = useState<MatchStats[]>(initialStats);
    const [advancingTeam, setAdvancingTeam] = useState<string | null>(null);
    const supabase = createClient();

    const isBracketMatch = !!match.bracket_position;
    const bracketLabel = getBracketLabel(match.bracket_position);
    const isCompleted = match.status === 'completed';
    const isLive = match.status === 'in_progress';

    const scoreA = match.score_a || 0;
    const scoreB = match.score_b || 0;
    const winnerA = isCompleted && (scoreA > scoreB || (scoreA === scoreB && match.penalty_winner_id === teamA.id));
    const winnerB = isCompleted && (scoreB > scoreA || (scoreA === scoreB && match.penalty_winner_id === teamB.id));
    const hasPenalties = scoreA === scoreB && (match.penalties_score_a > 0 || match.penalties_score_b > 0);

    useEffect(() => {
        const statsChannel = supabase.channel('match-stats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'match_player_stats', filter: `match_id=eq.${matchId}` }, (payload) => {
                if (payload.eventType === 'INSERT') setStats(prev => [...prev, payload.new as MatchStats]);
                else if (payload.eventType === 'UPDATE') setStats(prev => prev.map(s => s.member_id === payload.new.member_id ? payload.new as MatchStats : s));
            }).subscribe();

        const matchChannel = supabase.channel('match-score')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'championship_matches', filter: `id=eq.${matchId}` }, (payload) => {
                setMatch(payload.new);
            }).subscribe();

        return () => { supabase.removeChannel(statsChannel); supabase.removeChannel(matchChannel); };
    }, [matchId]);

    const getPlayerStats = (memberId: string) =>
        stats.find(s => s.member_id === memberId) || { member_id: memberId, goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 };

    const handleStatUpdate = async (memberId: string, teamId: string, field: keyof MatchStats, delta: number) => {
        if (!isAdmin) return;
        const { data: existing } = await supabase.from('match_player_stats').select('*').eq('match_id', matchId).eq('member_id', memberId).single();
        const currentVal = existing ? existing[field] : 0;
        const newVal = currentVal + delta;
        if (newVal < 0) return;
        const payload = { match_id: matchId, member_id: memberId, team_id: teamId, [field]: newVal };
        if (existing) await supabase.from('match_player_stats').update({ [field]: newVal }).eq('id', existing.id);
        else await supabase.from('match_player_stats').insert(payload);
        if (field === 'goals') {
            const scoreField = teamId === teamA.id ? 'score_a' : 'score_b';
            await supabase.from('championship_matches').update({ [scoreField]: (match[scoreField] || 0) + delta }).eq('id', matchId);
        }
    };

    const handleAdvanceTeam = async (winnerTeamId: string) => {
        if (!isAdmin || !isBracketMatch) return;
        const nextInfo = getNextBracketInfo(match.bracket_position, championshipFormat);
        if (!nextInfo) {
            await supabase.from('championship_matches').update({ status: 'completed' }).eq('id', matchId);
            alert('Campeonato finalizado! O campeão foi definido!');
            return;
        }
        setAdvancingTeam(winnerTeamId);
        try {
            await supabase.from('championship_matches').update({ status: 'completed' }).eq('id', matchId);
            const { data: nextMatch } = await supabase.from('championship_matches').select('*').eq('championship_id', match.championship_id).eq('bracket_position', nextInfo.nextPosition).single();
            if (nextMatch) await supabase.from('championship_matches').update({ [nextInfo.slot]: winnerTeamId }).eq('id', nextMatch.id);
            const winnerName = winnerTeamId === teamA.id ? teamA.name : teamB.name;
            alert(`${winnerName} classificado para ${getBracketLabel(nextInfo.nextPosition)}!`);
        } catch (err: any) {
            alert('Erro ao classificar time: ' + err.message);
        } finally { setAdvancingTeam(null); }
    };

    const handleFinishMatch = async () => {
        if (!isAdmin) return;
        if (!confirm('Encerrar esta partida?')) return;
        await supabase.from('championship_matches').update({ status: 'completed' }).eq('id', matchId);
    };

    const renderTeamTable = (team: Team) => (
        <div className="flex-1 min-w-0 rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
            {/* Header do time */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
                <TeamLogo url={team.logo_url} name={team.name} size="sm" />
                <span className="font-black text-gray-900 text-base tracking-tight">{team.name}</span>
            </div>

            {/* Cabeçalho da tabela */}
            <div className="grid px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400" style={{ gridTemplateColumns: '1fr 52px 52px 60px' }}>
                <span>Jogador</span>
                <span className="text-center">Gols</span>
                <span className="text-center">Assis.</span>
                <span className="text-center">Cartões</span>
            </div>

            {/* Linhas */}
            <div className="divide-y divide-gray-50">
                {team.players.map(player => {
                    const ps = getPlayerStats(player.id);
                    const hasActivity = ps.goals > 0 || ps.assists > 0 || ps.yellow_cards > 0 || ps.red_cards > 0;
                    return (
                        <div
                            key={player.id}
                            className={`grid px-5 py-3 items-center ${hasActivity ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`}
                            style={{ gridTemplateColumns: '1fr 52px 52px 60px' }}
                        >
                            {/* Nome */}
                            <div className="flex items-center gap-2 min-w-0">
                                <User size={12} className="text-gray-300 flex-shrink-0" />
                                <span className="text-sm font-semibold text-gray-900 truncate">{player.name}</span>
                                {player.position && <span className="text-[10px] text-gray-400 uppercase hidden sm:inline">{player.position}</span>}
                            </div>

                            {/* Gols */}
                            <div className="flex items-center justify-center gap-1">
                                {false && (
                                    <button onClick={() => handleStatUpdate(player.id, team.id, 'goals', -1)} disabled={ps.goals <= 0} className="text-gray-300 hover:text-red-400 disabled:opacity-20 transition-colors">
                                        <Minus size={11} />
                                    </button>
                                )}
                                <span className={`text-sm font-black w-5 text-center ${ps.goals > 0 ? 'text-gray-900' : 'text-gray-300'}`}>{ps.goals}</span>
                                {false && (
                                    <button onClick={() => handleStatUpdate(player.id, team.id, 'goals', 1)} className="text-gray-300 hover:text-green-500 transition-colors">
                                        <Plus size={11} />
                                    </button>
                                )}
                            </div>

                            {/* Assistências */}
                            <div className="flex items-center justify-center gap-1">
                                {false && (
                                    <button onClick={() => handleStatUpdate(player.id, team.id, 'assists', -1)} disabled={ps.assists <= 0} className="text-gray-300 hover:text-red-400 disabled:opacity-20 transition-colors">
                                        <Minus size={11} />
                                    </button>
                                )}
                                <span className={`text-sm font-black w-5 text-center ${ps.assists > 0 ? 'text-gray-900' : 'text-gray-300'}`}>{ps.assists}</span>
                                {false && (
                                    <button onClick={() => handleStatUpdate(player.id, team.id, 'assists', 1)} className="text-gray-300 hover:text-green-500 transition-colors">
                                        <Plus size={11} />
                                    </button>
                                )}
                            </div>

                            {/* Cartões */}
                            <div className="flex items-center justify-center gap-1.5">
                                {false ? (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-0.5">
                                            <button onClick={() => handleStatUpdate(player.id, team.id, 'yellow_cards', -1)} disabled={ps.yellow_cards <= 0} className="text-gray-300 hover:text-red-400 disabled:opacity-20"><Minus size={9} /></button>
                                            <div className={`w-3 h-4 rounded-sm mx-0.5 ${ps.yellow_cards > 0 ? 'bg-yellow-400' : 'bg-gray-200'}`} />
                                            <button onClick={() => handleStatUpdate(player.id, team.id, 'yellow_cards', 1)} className="text-gray-300 hover:text-yellow-500"><Plus size={9} /></button>
                                            {ps.yellow_cards > 0 && <span className="text-[9px] font-black text-yellow-600 ml-0.5">{ps.yellow_cards}</span>}
                                        </div>
                                        <div className="flex items-center gap-0.5">
                                            <button onClick={() => handleStatUpdate(player.id, team.id, 'red_cards', -1)} disabled={ps.red_cards <= 0} className="text-gray-300 hover:text-red-400 disabled:opacity-20"><Minus size={9} /></button>
                                            <div className={`w-3 h-4 rounded-sm mx-0.5 ${ps.red_cards > 0 ? 'bg-red-500' : 'bg-gray-200'}`} />
                                            <button onClick={() => handleStatUpdate(player.id, team.id, 'red_cards', 1)} className="text-gray-300 hover:text-red-500"><Plus size={9} /></button>
                                            {ps.red_cards > 0 && <span className="text-[9px] font-black text-red-500 ml-0.5">{ps.red_cards}</span>}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-1">
                                        {ps.yellow_cards > 0 && (
                                            <div className="flex items-center gap-0.5">
                                                <div className="w-2.5 h-3.5 bg-yellow-400 rounded-sm" />
                                                <span className="text-[9px] font-black text-yellow-600">{ps.yellow_cards}</span>
                                            </div>
                                        )}
                                        {ps.red_cards > 0 && (
                                            <div className="flex items-center gap-0.5">
                                                <div className="w-2.5 h-3.5 bg-red-500 rounded-sm" />
                                                <span className="text-[9px] font-black text-red-500">{ps.red_cards}</span>
                                            </div>
                                        )}
                                        {ps.yellow_cards === 0 && ps.red_cards === 0 && (
                                            <span className="text-gray-300 text-xs">—</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Voltar */}
                <Link href={`/campeonatos/${campId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={14} /> Voltar ao Campeonato
                </Link>

                {/* Badge de fase */}
                {isBracketMatch && (
                    <div className="text-center">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-yellow-400 border border-yellow-400/30 bg-yellow-400/10">
                            <Trophy size={12} /> {bracketLabel}
                        </span>
                    </div>
                )}

                {/* ── PLACAR ── */}
                <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d1f40 50%, #0a1628 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="px-6 py-8">
                        <div className="grid grid-cols-3 items-center gap-4">
                            {/* Time A */}
                            <div className={`flex flex-col items-center gap-3 transition-opacity ${isCompleted && !winnerA ? 'opacity-40' : 'opacity-100'}`}>
                                <TeamLogo url={teamA.logo_url} name={teamA.name} size="lg" />
                                <p className="font-black text-white text-center text-sm sm:text-base leading-tight">{teamA.name}</p>
                                {winnerA && (
                                    <span className="text-[10px] font-black text-green-400 bg-green-400/10 border border-green-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Vencedor
                                    </span>
                                )}
                            </div>

                            {/* Placar central */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="flex items-center gap-3 sm:gap-5">
                                    <span className={`text-5xl sm:text-7xl font-black tabular-nums ${winnerA ? 'text-white' : isCompleted ? 'text-gray-500' : 'text-white'}`}>{scoreA}</span>
                                    <span className="text-xl font-bold text-gray-600">×</span>
                                    <span className={`text-5xl sm:text-7xl font-black tabular-nums ${winnerB ? 'text-white' : isCompleted ? 'text-gray-500' : 'text-white'}`}>{scoreB}</span>
                                </div>

                                {hasPenalties && (
                                    <div className="text-xs font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-3 py-1 rounded-full">
                                        Pênaltis: {match.penalties_score_a} – {match.penalties_score_b}
                                    </div>
                                )}

                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                    isLive ? 'bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse' :
                                    isCompleted ? 'bg-white/5 text-gray-400 border border-white/10' :
                                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}>
                                    {isLive ? '● Ao Vivo' : isCompleted ? 'Fim de Jogo' : 'Agendado'}
                                </span>
                            </div>

                            {/* Time B */}
                            <div className={`flex flex-col items-center gap-3 transition-opacity ${isCompleted && !winnerB ? 'opacity-40' : 'opacity-100'}`}>
                                <TeamLogo url={teamB.logo_url} name={teamB.name} size="lg" />
                                <p className="font-black text-white text-center text-sm sm:text-base leading-tight">{teamB.name}</p>
                                {winnerB && (
                                    <span className="text-[10px] font-black text-green-400 bg-green-400/10 border border-green-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Vencedor
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── CLASSIFICAR (Mata-mata) ── */}
                {isAdmin && isBracketMatch && !isCompleted && (
                    <div className="rounded-2xl p-5" style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)' }}>
                        <p className="text-center text-xs font-black uppercase tracking-widest text-yellow-400 mb-4">
                            {match.bracket_position === 'final-1' ? 'Selecione o Campeão' : `Quem avança para ${getBracketLabel(getNextBracketInfo(match.bracket_position)?.nextPosition || '')}?`}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            {[teamA, teamB].map(team => (
                                <button
                                    key={team.id}
                                    onClick={() => handleAdvanceTeam(team.id)}
                                    disabled={!!advancingTeam}
                                    className="relative flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all disabled:opacity-50 group"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(234,179,8,0.5)')}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                                >
                                    <TeamLogo url={team.logo_url} name={team.name} size="sm" />
                                    <div className="text-left">
                                        <p className="font-black text-white text-sm">{team.name}</p>
                                        <p className="text-[10px] text-gray-500">Classificar →</p>
                                    </div>
                                    <ArrowRight size={16} className="text-gray-600 ml-auto" />
                                    {advancingTeam === team.id && (
                                        <div className="absolute inset-0 rounded-xl bg-yellow-400/10 flex items-center justify-center">
                                            <span className="text-yellow-400 text-xs font-bold animate-pulse">Classificando...</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Partida bracket encerrada */}
                {isBracketMatch && isCompleted && (
                    <div className="text-center">
                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-green-400 bg-green-400/10 border border-green-400/20 px-4 py-2 rounded-full">
                            <CheckCircle size={14} /> Partida encerrada
                        </span>
                    </div>
                )}

                {/* Encerrar partida não-bracket */}
                {isAdmin && !isBracketMatch && !isCompleted && (
                    <div className="text-center">
                        <button
                            onClick={handleFinishMatch}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
                            style={{ background: '#dc2626' }}
                        >
                            <CheckCircle size={16} /> Encerrar Partida
                        </button>
                    </div>
                )}

                {/* ── TABELAS DE SCOUTS ── */}
                <div className="flex flex-col lg:flex-row gap-4">
                    {renderTeamTable(teamA)}
                    {renderTeamTable(teamB)}
                </div>
            </div>
        </div>
    );
}
