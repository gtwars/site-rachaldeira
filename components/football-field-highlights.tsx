import React from 'react';
import { User } from 'lucide-react';

interface Player {
    name: string;
    photo_url?: string;
    position?: string;
}

interface HighlightsData {
    rachaLabel: string;
    top1?: Player;
    top1_extra?: Player;
    top1_extra2?: Player;
    top2?: Player;
    top2_extra?: Player;
    top2_extra2?: Player;
    top3?: Player;
    top3_extra?: Player;
    top3_extra2?: Player;
    sheriff?: Player;
    sheriff_extra?: Player;
    sheriff_extra2?: Player;
}

const PlayerNode = ({ player, extras, label }: { player?: Player, extras: (Player | undefined)[], label: string }) => {
    const allPlayers = [player, ...extras].filter(Boolean) as Player[];

    if (allPlayers.length === 0) {
        return (
            <div className="flex flex-col items-center z-10 transition-transform hover:scale-110">
                <div className="text-white font-bold text-[10px] md:text-sm drop-shadow-md mb-1 bg-black/40 px-3 py-1 rounded-full whitespace-nowrap border border-white/10 uppercase tracking-wider">
                    {label}
                </div>
                <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-slate-800/80 border-[3px] border-slate-600 flex items-center justify-center shadow-[0_10px_15px_-3px_rgba(0,0,0,0.5)] backdrop-blur-sm">
                    <User size={28} className="text-slate-400" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center z-10 transition-transform hover:scale-105">
            <div className="text-white font-bold text-[10px] md:text-sm drop-shadow-md mb-1 bg-black/40 px-3 py-1 rounded-full whitespace-nowrap border border-white/10 uppercase tracking-wider">
                {label}
            </div>
            <div className="flex justify-center -space-x-3 md:-space-x-4">
                {allPlayers.map((p, idx) => (
                    <div key={idx} className="relative z-10 hover:z-20 transition-all">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-[3px] border-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.5)] overflow-hidden bg-slate-800 flex items-center justify-center relative">
                            {p.photo_url ? (
                                <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                                <User size={28} className="text-slate-400" />
                            )}
                            <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-2 flex flex-col items-center max-w-[120px]">
                {allPlayers.map((p, idx) => {
                    const firstName = p.name ? p.name.split(' ')[0] : '-';
                    return (
                        <div key={idx} className="text-white font-black text-sm md:text-base drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-center leading-tight truncate w-full shadow-black">
                            {firstName}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function FootballFieldHighlights({ highlights }: { highlights: HighlightsData }) {
    if (!highlights) return null;

    return (
        <div className="relative w-full max-w-lg md:max-w-xl mx-auto md:aspect-[4/4.5] aspect-[3/4.2] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-[6px] md:border-8 border-slate-950">
            {/* Grass Pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at center, white 2px, transparent 2px)', backgroundSize: '16px 16px' }} />

            {/* Field Stripes */}
            <div className="absolute inset-0 flex flex-col opacity-5">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-white' : 'bg-transparent'}`} />
                ))}
            </div>

            {/* Outer Pitch markings */}
            <div className="absolute inset-0 border-2 md:border-4 border-white/20 m-3 md:m-5 pointer-events-none" />

            {/* Penalty Box (Top) */}
            <div className="absolute top-3 md:top-5 left-1/2 -translate-x-1/2 w-[60%] h-[20%] border-x-2 md:border-x-4 border-b-2 md:border-b-4 border-white/20 pointer-events-none" />

            {/* Goal Area (Top) */}
            <div className="absolute top-3 md:top-5 left-1/2 -translate-x-1/2 w-[25%] h-[8%] border-x-2 md:border-x-4 border-b-2 md:border-b-4 border-white/20 pointer-events-none" />

            {/* Penalty Arc */}
            <div className="absolute top-[23%] left-1/2 -translate-x-1/2 w-[20%] aspect-square border-2 md:border-4 border-white/20 rounded-full border-t-transparent border-l-transparent border-r-transparent -rotate-45 pointer-events-none" />

            {/* Halfway Line (Bottom) */}
            <div className="absolute bottom-3 md:bottom-5 left-3 md:left-5 right-3 md:right-5 h-[2px] md:h-[4px] bg-white/20 pointer-events-none" />

            {/* Center Circle */}
            <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 w-[35%] aspect-square border-2 md:border-4 border-white/20 rounded-full translate-y-1/2 pointer-events-none" />

            {/* Center Spot */}
            <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 w-2 h-2 md:w-3 md:h-3 bg-white/20 rounded-full translate-y-1/2 pointer-events-none" />

            {/* Header / Logo */}
            <div className="absolute top-6 left-6 flex items-center gap-3 z-20">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-full p-1 shadow-2xl border-2 border-slate-200 flex items-center justify-center">
                    <img src="https://pqroxmeyuicutatbessb.supabase.co/storage/v1/object/public/Fotos/logo%20premiacao%20rachaldeira.png" alt="Rachaldeira" className="w-full h-full object-contain" />
                </div>
                <div className="text-white drop-shadow-md">
                    <h3 className="font-black text-lg md:text-2xl leading-none font-sans tracking-wide drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">RACHALDEIRA</h3>
                    <p className="text-xs md:text-sm text-blue-300 font-semibold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">{highlights.rachaLabel}</p>
                </div>
            </div>

            {/* Players Positions */}

            {/* Top 1 (Attack) */}
            <div className="absolute top-[26%] md:top-[22%] left-1/2 -translate-x-1/2 flex justify-center w-[120px]">
                <PlayerNode player={highlights.top1} extras={[highlights.top1_extra, highlights.top1_extra2]} label="👑 TOP 1" />
            </div>

            {/* Top 2 & Top 3 (Midfield) */}
            <div className="absolute top-[52%] md:top-[48%] left-4 md:left-[12%] flex justify-center w-[100px] md:w-[120px]">
                <PlayerNode player={highlights.top2} extras={[highlights.top2_extra, highlights.top2_extra2]} label="🥈 TOP 2" />
            </div>

            <div className="absolute top-[52%] md:top-[48%] right-4 md:right-[12%] flex justify-center w-[100px] md:w-[120px]">
                <PlayerNode player={highlights.top3} extras={[highlights.top3_extra, highlights.top3_extra2]} label="🥉 TOP 3" />
            </div>

            {/* Xerife (Defense) */}
            <div className="absolute bottom-[10%] md:bottom-[7%] left-1/2 -translate-x-1/2 flex justify-center w-[120px]">
                <PlayerNode player={highlights.sheriff} extras={[highlights.sheriff_extra, highlights.sheriff_extra2]} label="👮 XERIFE" />
            </div>
        </div>
    );
}
