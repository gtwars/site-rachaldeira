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

    const CARD_H = 76;
    const VERTICAL_GAP = 32;

    // Filter rounds
    const qfMatches = matches.filter(m => m.bracket_position?.startsWith('qf')).sort((a, b) => a.bracket_position.localeCompare(b.bracket_position));
    const displayQfMatches = qfMatches.length === 2 ? [qfMatches[1], qfMatches[0]] : qfMatches;
    const semiMatches = [getMatch('semi-1'), getMatch('semi-2')].filter(Boolean) as Match[];
    const hasFinal = !!getMatch('final-1');

    return (
        <div className="bg-gradient-to-br from-slate-50 to-white border border-gray-200 rounded-xl p-8 overflow-x-auto">
            <div className="flex items-center min-w-max justify-center gap-0">

                {/* ═══ QUARTAS ═══ */}
                {qfMatches.length > 0 && (
                    <>
                        <div className="flex flex-col items-center">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 bg-gray-100/80 px-4 py-1.5 rounded-full border border-gray-200">
                                Quartas de Final
                            </div>
                            <div className="flex flex-col justify-around h-full" style={{ gap: qfMatches.length === 2 ? CARD_H + VERTICAL_GAP : VERTICAL_GAP }}>
                                {displayQfMatches.map((m, idx) => (
                                    <div key={m.id}>
                                        {renderMatchCard(m, `Quartas ${idx + 1}`)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Lines QF -> Semi */}
                        <div className="flex flex-col justify-center" style={{ width: 64, marginTop: 40 }}>
                            <div className="relative w-full" style={{ height: (CARD_H * 2) + VERTICAL_GAP }}>
                                {qfMatches.length === 2 ? (
                                    <>
                                        <div className="absolute bg-gray-200" style={{ top: '25%', left: 0, width: '100%', height: 2 }} />
                                        <div className="absolute bg-gray-200" style={{ top: '75%', left: 0, width: '100%', height: 2 }} />
                                    </>
                                ) : (
                                    // Case 8 teams or others - simplified for consistency
                                    <>
                                        <div className="absolute bg-gray-200" style={{ top: '12.5%', left: 0, width: '100%', height: 2 }} />
                                        <div className="absolute bg-gray-200" style={{ top: '37.5%', left: 0, width: '100%', height: 2 }} />
                                        <div className="absolute bg-gray-200" style={{ top: '62.5%', left: 0, width: '100%', height: 2 }} />
                                        <div className="absolute bg-gray-200" style={{ top: '87.5%', left: 0, width: '100%', height: 2 }} />
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ═══ SEMIFINAIS ═══ */}
                <div className="flex flex-col items-center">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 bg-gray-100/80 px-4 py-1.5 rounded-full border border-gray-200">
                        Semifinais
                    </div>
                    <div
                        className="flex flex-col justify-around h-full"
                        style={{ gap: VERTICAL_GAP + CARD_H }}
                    >
                        {[1, 2].map((n) => (
                            <div key={n}>
                                {renderMatchCard(getMatch(`semi-${n}`), `Semi ${n}`)}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Connector Semi -> Final */}
                <div className="flex flex-col justify-center" style={{ width: 64, marginTop: 40 }}>
                    <div className="relative w-full" style={{ height: (CARD_H * 2) + VERTICAL_GAP }}>
                        {/* horizontal top */}
                        <div className="absolute bg-gray-200" style={{ top: '25%', left: 0, width: '50%', height: 2 }} />
                        {/* horizontal bottom */}
                        <div className="absolute bg-gray-200" style={{ top: '75%', left: 0, width: '50%', height: 2 }} />
                        {/* vertical connecting them */}
                        <div className="absolute bg-gray-200" style={{ top: '25%', left: '50%', width: 2, height: '50%' }} />
                        {/* horizontal to mid */}
                        <div className="absolute bg-gray-200" style={{ top: '50%', left: '50%', width: '50%', height: 2 }} />
                    </div>
                </div>

                {/* ═══ FINAL ═══ */}
                <div className="flex flex-col items-center">
                    <div className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-8 bg-amber-50 px-4 py-1.5 rounded-full border border-amber-200 shadow-sm">
                        🏆 Grande Final
                    </div>
                    <div className="flex flex-col justify-center h-full">
                        {renderMatchCard(getMatch('final-1'), 'Final')}
                    </div>
                </div>
            </div>
        </div>
    );
}
