'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle, Plus, Minus, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const STATS = [
    { field: 'goals',          emoji: '⚽', label: 'Gol',  color: 'text-blue-600',   bg: 'bg-blue-50',   ring: 'ring-blue-200' },
    { field: 'assists',        emoji: '🎯', label: 'Ast',  color: 'text-green-600',  bg: 'bg-green-50',  ring: 'ring-green-200' },
    { field: 'difficult_saves',emoji: '🧤', label: 'Def',  color: 'text-orange-600', bg: 'bg-orange-50', ring: 'ring-orange-200' },
    { field: 'yellow_cards',   emoji: '🟨', label: 'AMA',  color: 'text-yellow-600', bg: 'bg-yellow-50', ring: 'ring-yellow-200' },
    { field: 'red_cards',      emoji: '🟥', label: 'VER',  color: 'text-red-600',    bg: 'bg-red-50',    ring: 'ring-red-200' },
];

export default function RegistrarResultadoPage({ params }: { params: Promise<{ campId: string; matchId: string }> }) {
    const { campId, matchId } = use(params);
    const router = useRouter();
    const [match, setMatch] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [scoreA, setScoreA] = useState(0);
    const [scoreB, setScoreB] = useState(0);
    const [playerStats, setPlayerStats] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [penaltiesScoreA, setPenaltiesScoreA] = useState(0);
    const [penaltiesScoreB, setPenaltiesScoreB] = useState(0);
    const [penaltyWinnerId, setPenaltyWinnerId] = useState<string | null>(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const supabase = createClient();
        const { data: matchData } = await supabase
            .from('championship_matches')
            .select(`*, team_a:team_a_id(id, name, logo_url, team_members(members(id, name, position))), team_b:team_b_id(id, name, logo_url, team_members(members(id, name, position))), championship:championship_id(id, name, format)`)
            .eq('id', matchId).single();

        setMatch(matchData);
        setScoreA(matchData?.score_a || 0);
        setScoreB(matchData?.score_b || 0);
        setPenaltiesScoreA(matchData?.penalties_score_a || 0);
        setPenaltiesScoreB(matchData?.penalties_score_b || 0);
        setPenaltyWinnerId(matchData?.penalty_winner_id || null);

        const { data: statsData } = await supabase.from('match_player_stats').select('*').eq('match_id', matchId);
        const statsMap = new Map(statsData?.map(s => [s.member_id, s]) || []);
        const initialStats: any[] = [];

        const processTeam = (team: any) => {
            if (!team?.team_members) return;
            team.team_members.forEach((tm: any) => {
                const memberId = tm.members.id;
                const existing = statsMap.get(memberId);
                initialStats.push(existing || {
                    id: null, match_id: matchId, member_id: memberId, team_id: team.id,
                    goals: 0, assists: 0, difficult_saves: 0, warnings: 0, yellow_cards: 0, red_cards: 0,
                    name: tm.members.name, position: tm.members.position
                });
            });
        };

        processTeam(matchData.team_a);
        processTeam(matchData.team_b);
        setPlayerStats([...initialStats].sort((a, b) => (a.name || '').localeCompare(b.name || '')));
        setLoading(false);
    };

    const updateStat = (memberId: string, field: string, delta: number) => {
        const stat = playerStats.find(s => s.member_id === memberId);
        if (!stat) return;

        if (field === 'goals') {
            if (stat.team_id === match.team_a_id) setScoreA(p => Math.max(0, p + delta));
            if (stat.team_id === match.team_b_id) setScoreB(p => Math.max(0, p + delta));
        }

        setPlayerStats(prev => prev.map(s => {
            if (s.member_id !== memberId) return s;
            return { ...s, [field]: Math.max(0, (s[field] || 0) + delta) };
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const supabase = createClient();
            const { error: matchError } = await supabase.from('championship_matches').update({
                score_a: scoreA, score_b: scoreB,
                penalties_score_a: penaltiesScoreA, penalties_score_b: penaltiesScoreB,
                penalty_winner_id: penaltyWinnerId,
                status: 'completed', played_at: new Date().toISOString()
            }).eq('id', matchId);
            if (matchError) throw matchError;

            for (const stat of playerStats) {
                const hasData = stat.goals > 0 || stat.assists > 0 || stat.difficult_saves > 0 || stat.warnings > 0 || stat.yellow_cards > 0 || stat.red_cards > 0;
                const payload = { goals: stat.goals, assists: stat.assists, difficult_saves: stat.difficult_saves, warnings: stat.warnings, yellow_cards: stat.yellow_cards || 0, red_cards: stat.red_cards || 0 };
                if (stat.id) {
                    await supabase.from('match_player_stats').update(payload).eq('id', stat.id);
                } else if (hasData) {
                    await supabase.from('match_player_stats').insert({ match_id: matchId, member_id: stat.member_id, team_id: stat.team_id, ...payload });
                }
            }

            if (match.bracket_position) {
                let winnerId: string | null = null;
                if (scoreA > scoreB) winnerId = match.team_a_id;
                else if (scoreB > scoreA) winnerId = match.team_b_id;
                else if (match.has_draw_advantage) winnerId = match.team_a_id;
                else winnerId = penaltyWinnerId;

                const nextMap: Record<string, { pos: string; slot: string }> = {
                    'qf-1': { pos: 'semi-2', slot: 'team_b_id' },
                    'qf-2': { pos: 'semi-1', slot: 'team_b_id' },
                    'semi-1': { pos: 'final-1', slot: 'team_a_id' },
                    'semi-2': { pos: 'final-1', slot: 'team_b_id' },
                };
                const next = nextMap[match.bracket_position];
                if (next && winnerId) {
                    await supabase.from('championship_matches').update({ [next.slot]: winnerId }).eq('championship_id', campId).eq('bracket_position', next.pos);
                }
            }

            alert('Salvo com sucesso!');
            router.push(`/admin/campeonatos/${campId}`);
        } catch (err: any) {
            alert('Erro ao salvar: ' + err.message);
        } finally { setSaving(false); }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Carregando...</div>;
    if (!match) return <div className="min-h-screen flex items-center justify-center">Partida não encontrada</div>;

    const teamAPlayers = playerStats.filter(s => s.team_id === match.team_a_id);
    const teamBPlayers = playerStats.filter(s => s.team_id === match.team_b_id);
    const isDraw = scoreA === scoreB;
    const showPenalties = isDraw && !match.has_draw_advantage;

    const winnerA = scoreA > scoreB || (isDraw && match.has_draw_advantage) || (showPenalties && penaltyWinnerId === match.team_a_id);
    const winnerB = scoreB > scoreA || (showPenalties && penaltyWinnerId === match.team_b_id);

    return (
        <main className="min-h-screen bg-gray-100 pb-28">
            {/* Header */}
            <div className="bg-[#093a9f] text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-30 shadow-lg">
                <button onClick={() => router.push(`/admin/campeonatos/${campId}`)} className="text-white/70 hover:text-white p-1">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <p className="text-xs text-blue-200">{match.championship?.name}</p>
                    <h1 className="font-black text-base leading-tight">
                        {match.team_a?.name} vs {match.team_b?.name}
                    </h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

                {/* Placar */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="grid grid-cols-3 items-center p-6 gap-4">
                        {/* Time A */}
                        <div className={`text-center ${winnerA ? 'opacity-100' : isDraw ? 'opacity-80' : 'opacity-40'}`}>
                            {match.team_a?.logo_url && <img src={match.team_a.logo_url} className="w-12 h-12 object-contain mx-auto mb-2" alt="" />}
                            <p className="font-black text-gray-900 text-sm leading-tight">{match.team_a?.name}</p>
                            {winnerA && !isDraw && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1 inline-block">VENCEDOR</span>}
                        </div>

                        {/* Placar central */}
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-3">
                                <div className="flex flex-col items-center gap-2">
                                    <button onClick={() => setScoreA(p => Math.max(0, p - 1))} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 flex items-center justify-center touch-manipulation transition">
                                        <Minus size={16} />
                                    </button>
                                    <span className="text-5xl font-black text-gray-900 w-12 text-center tabular-nums">{scoreA}</span>
                                    <button onClick={() => setScoreA(p => p + 1)} className="w-10 h-10 rounded-full bg-[#093a9f] hover:bg-blue-800 active:scale-95 flex items-center justify-center text-white touch-manipulation transition">
                                        <Plus size={16} />
                                    </button>
                                </div>

                                <span className="text-2xl font-black text-gray-200 mb-1">—</span>

                                <div className="flex flex-col items-center gap-2">
                                    <button onClick={() => setScoreB(p => Math.max(0, p - 1))} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 flex items-center justify-center touch-manipulation transition">
                                        <Minus size={16} />
                                    </button>
                                    <span className="text-5xl font-black text-gray-900 w-12 text-center tabular-nums">{scoreB}</span>
                                    <button onClick={() => setScoreB(p => p + 1)} className="w-10 h-10 rounded-full bg-[#093a9f] hover:bg-blue-800 active:scale-95 flex items-center justify-center text-white touch-manipulation transition">
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Time B */}
                        <div className={`text-center ${winnerB ? 'opacity-100' : isDraw ? 'opacity-80' : 'opacity-40'}`}>
                            {match.team_b?.logo_url && <img src={match.team_b.logo_url} className="w-12 h-12 object-contain mx-auto mb-2" alt="" />}
                            <p className="font-black text-gray-900 text-sm leading-tight">{match.team_b?.name}</p>
                            {winnerB && !isDraw && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1 inline-block">VENCEDOR</span>}
                        </div>
                    </div>

                    {/* Vantagem do empate */}
                    {match.has_draw_advantage && isDraw && (
                        <div className="bg-blue-50 border-t border-blue-100 px-4 py-3 text-center text-sm text-blue-700">
                            <strong>{match.team_a?.name}</strong> avança pelo empate nesta fase.
                        </div>
                    )}

                    {/* Pênaltis */}
                    {showPenalties && (
                        <div className="border-t border-dashed border-gray-200 px-6 py-4">
                            <p className="text-center text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Disputa de Pênaltis</p>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { team: match.team_a, score: penaltiesScoreA, setScore: setPenaltiesScoreA, id: match.team_a_id },
                                    { team: match.team_b, score: penaltiesScoreB, setScore: setPenaltiesScoreB, id: match.team_b_id },
                                ].map(({ team, score, setScore, id }) => (
                                    <div key={id} className="text-center space-y-2">
                                        <p className="text-xs font-bold text-gray-600">{team?.name}</p>
                                        <div className="flex items-center justify-center gap-3">
                                            <button onClick={() => setScore((p: number) => Math.max(0, p - 1))} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center touch-manipulation">
                                                <Minus size={14} />
                                            </button>
                                            <span className="text-3xl font-black text-blue-700 w-8 text-center">{score}</span>
                                            <button onClick={() => setScore((p: number) => p + 1)} className="w-9 h-9 rounded-full bg-[#093a9f] text-white hover:bg-blue-800 flex items-center justify-center touch-manipulation">
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => setPenaltyWinnerId(id)}
                                            className={`w-full py-2 text-xs font-bold rounded-lg border transition-all touch-manipulation ${penaltyWinnerId === id ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'}`}
                                        >
                                            {penaltyWinnerId === id ? '✓ Vencedor' : 'Marcar Vencedor'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Scouts */}
                <div className="space-y-4">
                    <TeamScouts
                        teamName={match.team_a?.name}
                        logoUrl={match.team_a?.logo_url}
                        players={teamAPlayers}
                        onUpdate={updateStat}
                    />
                    <TeamScouts
                        teamName={match.team_b?.name}
                        logoUrl={match.team_b?.logo_url}
                        players={teamBPlayers}
                        onUpdate={updateStat}
                    />
                </div>
            </div>

            {/* Barra de salvar fixa */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-2xl z-20">
                <div className="max-w-3xl mx-auto flex gap-3">
                    <Button variant="outline" onClick={() => router.push(`/admin/campeonatos/${campId}`)} className="flex-shrink-0">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={saving} size="lg" className="flex-1 bg-green-600 hover:bg-green-700 font-bold text-base gap-2">
                        <CheckCircle size={20} />
                        {saving ? 'Salvando...' : 'Finalizar e Salvar'}
                    </Button>
                </div>
            </div>
        </main>
    );
}

const COL = '140px repeat(5, 60px)';

function TeamScouts({ teamName, logoUrl, players, onUpdate }: { teamName: string; logoUrl?: string; players: any[]; onUpdate: any }) {
    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            {/* Header do time */}
            <div className="bg-gray-900 text-white px-4 py-3 flex items-center gap-3">
                {logoUrl && <img src={logoUrl} className="w-7 h-7 object-contain" alt="" />}
                <h3 className="font-black text-base">{teamName}</h3>
                <span className="text-gray-400 text-xs ml-auto">{players.length} jog.</span>
            </div>

            {/* Scroll horizontal — garante que os nomes e colunas não torçam */}
            <div className="overflow-x-auto">
                <div style={{ minWidth: 440 }}>
                    {/* Legenda */}
                    <div className="grid px-4 py-2 bg-gray-50 border-b border-gray-100" style={{ gridTemplateColumns: COL }}>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Jogador</span>
                        {STATS.map(s => (
                            <div key={s.field} className="text-center">
                                <span className="text-base leading-none">{s.emoji}</span>
                                <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {players.length === 0 && (
                        <p className="text-center text-sm text-gray-400 py-8">Nenhum jogador neste time</p>
                    )}

                    <div className="divide-y divide-gray-50">
                        {players.map(stat => {
                            const hasActivity = STATS.some(s => (stat[s.field] || 0) > 0);
                            return (
                                <div
                                    key={stat.member_id}
                                    className={`grid px-4 py-3 items-center transition-colors ${hasActivity ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}
                                    style={{ gridTemplateColumns: COL }}
                                >
                                    <div className="pr-2 min-w-0">
                                        <p className="font-semibold text-sm text-gray-900 leading-tight truncate">{stat.name}</p>
                                        {stat.position && <p className="text-[10px] text-gray-400 uppercase tracking-wide">{stat.position}</p>}
                                    </div>
                                    {STATS.map(s => {
                                        const val = stat[s.field] || 0;
                                        return (
                                            <div key={s.field} className="flex flex-col items-center gap-1">
                                                <button
                                                    onClick={() => onUpdate(stat.member_id, s.field, 1)}
                                                    className={`w-10 h-10 rounded-xl font-black text-base flex items-center justify-center touch-manipulation transition-all active:scale-95 ${val > 0 ? `${s.bg} ${s.color} ring-1 ${s.ring}` : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                                >
                                                    {val > 0 ? val : '+'}
                                                </button>
                                                <button
                                                    onClick={() => onUpdate(stat.member_id, s.field, -1)}
                                                    className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center touch-manipulation transition-all active:scale-95 ${val > 0 ? 'bg-red-50 text-red-400 hover:bg-red-100' : 'invisible'}`}
                                                >
                                                    −
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
