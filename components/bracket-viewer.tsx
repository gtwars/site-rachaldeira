'use client';

import Link from 'next/link';

interface Match {
    id: string;
    bracket_position: string;
    championship_id: string;
    team_a: { name: string; logo_url?: string } | null;
    team_b: { name: string; logo_url?: string } | null;
    score_a: number | null;
    score_b: number | null;
    status: string;
}

interface BracketViewerProps {
    matches: Match[];
    campId: string;
}

export function BracketViewer({ matches, campId }: BracketViewerProps) {
    const getMatch = (pos: string) => matches.find((m) => m.bracket_position === pos);

    const renderTeamRow = (
        team: { name: string; logo_url?: string } | null,
        score: number | null,
        isWinner: boolean
    ) => (
        <div
            className={`flex justify-between items-center px-3 py-2 ${isWinner ? 'bg-green-50' : 'bg-white'
                }`}
        >
            <span
                className={`text-xs truncate max-w-[120px] flex items-center gap-1.5 ${isWinner ? 'font-bold text-green-800' : 'text-gray-700'
                    }`}
            >
                {team?.logo_url && (
                    <img
                        src={team.logo_url}
                        className="w-4 h-4 object-contain rounded-full"
                        alt=""
                    />
                )}
                {team?.name || (
                    <span className="italic text-gray-400">A Definir</span>
                )}
            </span>
            <span
                className={`text-sm font-mono px-2 py-0.5 rounded min-w-[28px] text-center ${isWinner
                    ? 'bg-green-200 text-green-900 font-bold'
                    : 'bg-gray-100 text-gray-500'
                    }`}
            >
                {score ?? '-'}
            </span>
        </div>
    );

    const renderMatchCard = (match: Match | undefined, label: string) => {
        if (!match) {
            return (
                <div className="w-[210px] h-[76px] border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/60 flex items-center justify-center text-xs text-gray-400 italic">
                    {label}
                </div>
            );
        }

        const sA = match.score_a;
        const sB = match.score_b;
        const done = sA !== null && sB !== null;
        const aWin = done && sA! > sB!;
        const bWin = done && sB! > sA!;

        const borderColor =
            match.status === 'in_progress'
                ? 'border-green-400 shadow-md shadow-green-100'
                : match.status === 'completed'
                    ? 'border-gray-300'
                    : 'border-gray-200';

        const statusBar =
            match.status === 'in_progress'
                ? 'bg-green-500 text-white'
                : match.status === 'completed'
                    ? 'bg-gray-200 text-gray-500'
                    : 'bg-blue-50 text-blue-400';

        const statusText =
            match.status === 'in_progress'
                ? '● AO VIVO'
                : match.status === 'completed'
                    ? 'ENCERRADO'
                    : 'AGENDADO';

        // Se ambos os times estão definidos, linkar para página da partida
        const hasTeams = match.team_a && match.team_b;

        const cardContent = (
            <div className={`w-[210px] rounded-lg border-2 overflow-hidden ${borderColor} ${hasTeams ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
                {renderTeamRow(match.team_a, sA, aWin)}
                <div className="h-[1px] bg-gray-200" />
                {renderTeamRow(match.team_b, sB, bWin)}
                <div
                    className={`text-[9px] text-center py-[3px] uppercase tracking-widest font-semibold ${statusBar}`}
                >
                    {statusText}
                </div>
            </div>
        );

        if (hasTeams) {
            return (
                <Link href={`/campeonatos/${campId}/partida/${match.id}`}>
                    {cardContent}
                </Link>
            );
        }

        return cardContent;
    };

    /* ─── Connector (pairwise vertical bracket line between rounds) ─── */
    const Connector = ({ height }: { height: number }) => (
        <div className="flex items-center" style={{ width: 48 }}>
            <div className="relative w-full" style={{ height }}>
                {/* horizontal from top match */}
                <div
                    className="absolute bg-gray-300"
                    style={{ top: '25%', left: 0, width: '50%', height: 2 }}
                />
                {/* horizontal from bottom match */}
                <div
                    className="absolute bg-gray-300"
                    style={{ top: '75%', left: 0, width: '50%', height: 2 }}
                />
                {/* vertical bar */}
                <div
                    className="absolute bg-gray-300"
                    style={{ top: '25%', left: '50%', width: 2, height: '50%' }}
                />
                {/* horizontal out to next round */}
                <div
                    className="absolute bg-gray-300"
                    style={{ top: '50%', left: '50%', width: '50%', height: 2 }}
                />
            </div>
        </div>
    );

    // Card height + gap
    const CARD_H = 76; // px
    const GAP_SM = 16; // gap between matches in same round

    return (
        <div className="bg-gradient-to-br from-slate-50 to-white border border-gray-200 rounded-xl p-6 overflow-x-auto">
            {/* Headers */}
            <div className="flex items-start min-w-max justify-center">
                {/* ═══ QUARTAS ═══ */}
                {matches.some(m => m.bracket_position?.startsWith('qf')) && (
                    <>
                        <div className="flex flex-col items-center">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 bg-gray-100 px-4 py-1 rounded-full text-center whitespace-nowrap">
                                Quartas de Final
                            </div>
                            <div className="flex flex-col h-full justify-around" style={{ gap: GAP_SM }}>
                                {matches.filter(m => m.bracket_position?.startsWith('qf')).map((m, idx) => (
                                    <div key={m.id} style={{
                                        marginTop: idx === 1 ? CARD_H / 2 : 0
                                    }}>
                                        {renderMatchCard(m, `Quartas ${idx + 1}`)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ─── Lines QF → Semi ─── */}
                        <div className="flex flex-col justify-center" style={{ width: 48 }}>
                            {/* Simplificando conectores para o formato assimétrico ou dinâmico */}
                            <div className="flex flex-col justify-around h-full py-20">
                                <div className="h-[2px] bg-gray-300 w-full" />
                                <div className="h-[2px] bg-gray-300 w-full" />
                            </div>
                        </div>
                    </>
                )}

                {/* ═══ SEMIFINAIS ═══ */}
                <div className="flex flex-col items-center">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 bg-gray-100 px-4 py-1 rounded-full">
                        Semifinais
                    </div>
                    <div
                        className="flex flex-col justify-around h-full"
                        style={{ gap: CARD_H + GAP_SM }}
                    >
                        {[1, 2].map((n) => (
                            <div key={n}>
                                {renderMatchCard(getMatch(`semi-${n}`), `Semi ${n}`)}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── Lines Semi → Final ─── */}
                <div
                    className="flex flex-col justify-center"
                    style={{ paddingTop: 32 }}
                >
                    <Connector height={CARD_H * 2 + GAP_SM} />
                </div>

                {/* ═══ FINAL ═══ */}
                <div className="flex flex-col items-center">
                    <div className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-4 bg-amber-50 px-4 py-1 rounded-full border border-amber-200">
                        🏆 Grande Final
                    </div>
                    <div
                        className="flex flex-col justify-center h-full"
                    >
                        {renderMatchCard(getMatch('final-1'), 'Final')}
                    </div>
                </div>
            </div>
        </div>
    );
}
