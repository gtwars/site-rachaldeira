'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, User, Trophy, X as Close } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from "sonner";

interface MemberStats {
    goals: number; assists: number; saves: number; warnings: number; rachas: number;
    top1: number; top2: number; top3: number; sheriff: number; championships: number;
}
interface Member { id: string; name: string; photo_url?: string; position?: string; age?: number; level?: number; stats: MemberStats; }

const LEVEL_RATING = [65, 73, 80, 87, 94];
const LEVEL_LABEL  = ['Bronze', 'Prata', 'Ouro', 'Elite', 'Lenda'];
const LEVEL_BORDER = ['#cd7f32', '#a8b8c8', '#ffd700', '#00BFFF', '#ff5500'];

const POS_ALIASES: Record<string, string> = {
    'atacante': 'ATA', 'meia': 'MEI', 'volante': 'VOL',
    'zagueiro': 'ZAG', 'goleiro': 'GOL', 'lateral': 'LAT',
};

// ══ MODAL FULLSCREEN ══
function MemberModal({ member, onClose }: { member: Member; onClose: () => void }) {
    const level  = Math.max(1, Math.min(5, member.level || 1));
    const border = LEVEL_BORDER[level - 1];
    const label  = LEVEL_LABEL[level - 1];
    const rawPos = member.position || 'JOG';
    const pos    = POS_ALIASES[rawPos.toLowerCase()] ?? rawPos.substring(0, 3).toUpperCase();
    const { goals, assists, saves, warnings, rachas, top1, top2, top3, sheriff, championships } = member.stats;
    const points = top1 * 3 + top2 * 2 + top3 + sheriff;
    const goalsPerGame = rachas > 0 ? (goals / rachas).toFixed(2) : '0.00';
    const savesPerGame = rachas > 0 ? (saves / rachas).toFixed(2) : '0.00';

    // Fechar com ESC
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
    }, [onClose]);

    return (
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)', animation: 'fadeIn 0.2s ease' }}
            onClick={onClose}
        >
            <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(28px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
            <div
                style={{ position: 'relative', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', borderRadius: 20, background: '#0d0d1a', border: `2px solid ${border}`, boxShadow: `0 0 48px ${border}44, 0 24px 64px rgba(0,0,0,0.95)`, animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Fechar */}
                <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, zIndex: 10, padding: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex' }}>
                    <Close size={18} />
                </button>

                {/* Header */}
                <div style={{ background: `linear-gradient(135deg, ${border}28 0%, transparent 70%)`, padding: '28px 24px 20px', borderBottom: `1px solid ${border}22` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: `3px solid ${border}`, flexShrink: 0 }}>
                            {member.photo_url
                                ? <img src={member.photo_url} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
                                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e' }}><User size={32} style={{ color: '#374151' }} /></div>
                            }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: 0 }}>{member.name}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                                <span style={{ background: `${border}28`, color: border, fontWeight: 700, fontSize: 11, padding: '2px 10px', borderRadius: 20, border: `1px solid ${border}44` }}>{pos}</span>
                                {member.age && <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{member.age} anos</span>}
                                <span style={{ color: border, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
                            </div>
                        </div>
                    </div>

                    {/* 4 stats em grid inline */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 18 }}>
                        {[
                            { v: rachas, l: 'Jogos', color: '#fff' },
                            { v: goals, l: 'Gols', color: '#4ade80' },
                            { v: assists, l: 'Assist.', color: '#60a5fa' },
                            { v: championships, l: '🏆 Títulos', color: '#ffd700' },
                        ].map((s, i) => (
                            <div key={i} style={{ textAlign: 'center', padding: '10px 4px', borderRadius: 10, background: 'rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.v}</div>
                                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.l}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Corpo */}
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* Produção Ofensiva */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, margin: '0 0 10px 0' }}>⚡ Produção Ofensiva</p>
                        {[
                            { l: 'Gols Marcados', v: goals, color: '#4ade80' },
                            { l: 'Assistências', v: assists, color: '#60a5fa' },
                            { l: 'Média de Gols/Jogo', v: goalsPerGame, color: '#fff', bold: true },
                        ].map((row, i, arr) => (
                            <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: row.bold ? 700 : 400 }}>{row.l}</span>
                                <span style={{ fontSize: 20, fontWeight: 900, color: row.color }}>{row.v}</span>
                            </div>
                        ))}
                    </div>

                    {/* Defesa e Disciplina */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px 0' }}>🛡️ Defesa e Disciplina</p>
                        {[
                            { l: 'Defesas Difíceis', v: saves, color: '#a78bfa' },
                            { l: 'Cartões / Advertências', v: warnings, color: '#fbbf24' },
                            { l: 'Média de Defesas/Jogo', v: savesPerGame, color: '#fff', bold: true },
                        ].map((row, i, arr) => (
                            <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: row.bold ? 700 : 400 }}>{row.l}</span>
                                <span style={{ fontSize: 20, fontWeight: 900, color: row.color }}>{row.v}</span>
                            </div>
                        ))}
                    </div>

                    {/* Destaques */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px 0' }}>🏅 Histórico de Destaques</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                            {[
                                { emoji: '👑', v: top1, l: 'Craque', bg: 'rgba(234,179,8,0.12)', color: '#ca8a04' },
                                { emoji: '🥈', v: top2, l: 'Top 2', bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
                                { emoji: '🥉', v: top3, l: 'Top 3', bg: 'rgba(234,88,12,0.12)', color: '#ea580c' },
                                { emoji: '👮', v: sheriff, l: 'Xerife', bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
                            ].map(d => (
                                <div key={d.l} style={{ textAlign: 'center', padding: '10px 4px', borderRadius: 10, background: d.bg }}>
                                    <div style={{ fontSize: 20 }}>{d.emoji}</div>
                                    <div style={{ fontSize: 20, fontWeight: 900, color: d.color, lineHeight: 1.1 }}>{d.v}</div>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: d.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{d.l}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 10, background: 'linear-gradient(135deg, #1d4ed8, #4f46e5)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 22 }}>🏅</span>
                                <div>
                                    <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Pontuação Total de Destaques</p>
                                    <p style={{ fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1, margin: 0 }}>{points} pts</p>
                                </div>
                            </div>
                            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textAlign: 'right', margin: 0 }}>Craque(3) Top2(2)<br />Top3(1) Xerife(1)</p>
                        </div>
                    </div>

                    {/* Campeonatos */}
                    {championships > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 12, background: 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,215,0,0.04))', border: '1px solid rgba(255,215,0,0.25)' }}>
                            <span style={{ fontSize: 40 }}>🏆</span>
                            <div>
                                <p style={{ fontSize: 22, fontWeight: 900, color: '#ffd700', lineHeight: 1, margin: 0 }}>{championships}x Campeão</p>
                                <p style={{ fontSize: 12, color: 'rgba(255,215,0,0.6)', marginTop: 4 }}>Título{championships > 1 ? 's' : ''} de campeonato</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ══ CARD ══
function FifaCard({ member, canEdit, onLevelChange, onOpen }: { member: Member; canEdit: boolean; onLevelChange: (id: string, level: number) => void; onOpen: () => void }) {
    const [flipped, setFlipped] = useState(false);
    const level  = Math.max(1, Math.min(5, member.level || 1));
    const rating = LEVEL_RATING[level - 1];
    const label  = LEVEL_LABEL[level - 1];
    const border = LEVEL_BORDER[level - 1];
    const rawPos = member.position || 'JOG';
    const pos    = POS_ALIASES[rawPos.toLowerCase()] ?? rawPos.substring(0, 3).toUpperCase();
    const name   = member.name.trim().split(' ').slice(0, 2).join(' ');
    const { goals, saves, rachas, assists, championships, top1, top2, top3, sheriff } = member.stats;

    const cardStyle: React.CSSProperties = {
        position: 'relative', aspectRatio: '2 / 3',
        borderRadius: '16px',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        cursor: 'pointer',
    };

    const faceBase: React.CSSProperties = {
        position: 'absolute', inset: 0, borderRadius: '16px',
        backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
    };

    return (
        <div className="select-none group" style={{ perspective: '1000px' }} onClick={() => setFlipped(f => !f)}>
            <div className="transition-transform duration-300 group-hover:scale-[1.04] group-hover:-translate-y-1" style={cardStyle}>

                {/* ── FRENTE ── */}
                <div style={{ ...faceBase, border: `2px solid ${border}`, boxShadow: `0 0 16px ${border}44, 0 8px 32px rgba(0,0,0,0.85)`, pointerEvents: flipped ? 'none' : 'auto' }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '16px', overflow: 'hidden', background: '#0d0d1a' }}>
                    {/* Foto */}
                    <div style={{ position: 'absolute', top: 0, left: '26%', right: 0, height: '62%', overflow: 'hidden' }}>
                        {member.photo_url
                            ? <img src={member.photo_url} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={36} style={{ color: '#374151' }} /></div>
                        }
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(to bottom, transparent, #0d0d1a)' }} />
                    </div>

                    {/* Faixa lateral esquerda */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '26%', height: '62%',
                        borderRight: `1px solid ${border}30`,
                        background: `linear-gradient(180deg, ${border}18 0%, transparent 100%)`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
                        paddingTop: '14%', zIndex: 2,
                    }}>
                        <span style={{ fontSize: 'clamp(16px, 5.5vw, 24px)', fontWeight: 900, color: border, lineHeight: 1, filter: `drop-shadow(0 0 6px ${border}88)` }}>{rating}</span>
                        <span style={{ fontSize: 'clamp(7px, 2.2vw, 10px)', fontWeight: 800, color: '#fff', letterSpacing: '0.1em', marginTop: '8%' }}>{pos}</span>
                        <span style={{ fontSize: 'clamp(6px, 1.8vw, 9px)', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginTop: '6%' }}>BR</span>
                        {championships > 0 && (
                            <div style={{ marginTop: '10%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <span style={{ fontSize: 'clamp(10px, 3.5vw, 14px)', lineHeight: 1 }}>🏆</span>
                                <span style={{ fontSize: 'clamp(7px, 2.2vw, 10px)', fontWeight: 900, color: '#ffd700', lineHeight: 1 }}>{championships}x</span>
                            </div>
                        )}
                        <span style={{
                            position: 'absolute', bottom: '8%',
                            fontSize: 'clamp(5px, 1.4vw, 7px)', fontWeight: 700,
                            color: 'rgba(255,255,255,0.45)', letterSpacing: '0.15em',
                            textTransform: 'lowercase', writingMode: 'vertical-rl', transform: 'rotate(180deg)', userSelect: 'none',
                        }}>rachaldeira</span>
                    </div>

                    {/* Badge nível */}
                    <div style={{ position: 'absolute', top: '4%', right: '4%', zIndex: 10 }} onClick={e => e.stopPropagation()}>
                        {canEdit ? (
                            <Select value={String(level)} onValueChange={val => onLevelChange(member.id, parseInt(val))}>
                                <SelectTrigger className="h-5 w-14 text-[8px] px-2 border-0" style={{ background: 'rgba(6,6,18,0.9)', color: '#fff', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.12)' }}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LEVEL_LABEL.map((t, i) => (
                                        <SelectItem key={i + 1} value={String(i + 1)} className="text-xs">Nv {i + 1} — {t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <span style={{ display: 'inline-block', background: 'rgba(6,6,18,0.9)', color: '#fff', fontSize: 'clamp(6px, 1.8vw, 8px)', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.12)' }}>
                                Nv {level}
                            </span>
                        )}
                    </div>

                    {/* Separador */}
                    <div style={{ position: 'absolute', top: '62%', left: 0, right: 0, height: '1px', background: `${border}25`, zIndex: 3 }} />

                    {/* Painel info */}
                    <div style={{ position: 'absolute', top: '62%', left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly', padding: '0 8%', zIndex: 3 }}>
                        <p style={{ fontSize: 'clamp(10px, 3.4vw, 13px)', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {name}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', width: '100%', textAlign: 'center' }}>
                            {[{ label: 'GOLS', value: goals }, { label: 'DEF', value: saves }, { label: 'RCH', value: rachas }, { label: 'ASS', value: assists }].map((s, i) => (
                                <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                                    <span style={{ fontSize: 'clamp(11px, 3.8vw, 15px)', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.value}</span>
                                    <span style={{ fontSize: 'clamp(5px, 1.5vw, 7px)', fontWeight: 600, color: '#6b7280', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: 'clamp(6px, 1.6vw, 8px)', fontWeight: 700, color: border, textTransform: 'uppercase', letterSpacing: '0.08em', filter: `drop-shadow(0 0 4px ${border}66)` }}>{label}</span>
                        </div>
                    </div>
                </div>{/* fecha inner overflow wrapper frente */}
                </div>

                {/* ── VERSO ── */}
                <div style={{ ...faceBase, transform: 'rotateY(180deg)', border: `2px solid ${border}`, boxShadow: `0 0 16px ${border}44, 0 8px 32px rgba(0,0,0,0.85)`, pointerEvents: flipped ? 'auto' : 'none' }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '16px', overflow: 'hidden', background: '#0d0d1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, padding: '12% 8%' }}>
                    {/* Foto circular */}
                    <div style={{ width: '40%', aspectRatio: '1', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${border}`, marginBottom: '6%', flexShrink: 0 }}>
                        {member.photo_url
                            ? <img src={member.photo_url} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e' }}><User size={24} style={{ color: '#374151' }} /></div>
                        }
                    </div>

                    {/* Nome */}
                    <p style={{ fontSize: 'clamp(10px, 3.2vw, 14px)', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', margin: 0, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                    <span style={{ fontSize: 'clamp(6px, 1.8vw, 9px)', fontWeight: 700, color: border, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6%' }}>{label}</span>

                    {/* Mini stats grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', gap: 'clamp(4px, 1.5vw, 6px)', marginBottom: '6%' }}>
                        {[
                            { emoji: '⚽', label: 'Gols', value: goals },
                            { emoji: '🎯', label: 'Assist.', value: assists },
                            { emoji: '🧤', label: 'Defesas', value: saves },
                            { emoji: '🏃', label: 'Rachas', value: rachas },
                            { emoji: '👑', label: 'Craque', value: top1 },
                            { emoji: '🏆', label: 'Títulos', value: championships },
                        ].map(s => (
                            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 'clamp(3px, 1vw, 5px)', background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: 'clamp(3px,1vw,5px) clamp(4px,1.2vw,7px)' }}>
                                <span style={{ fontSize: 'clamp(8px, 2.5vw, 11px)' }}>{s.emoji}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 'clamp(5px, 1.4vw, 7px)', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>{s.label}</div>
                                    <div style={{ fontSize: 'clamp(10px, 3.2vw, 13px)', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.value}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Botão */}
                    <button
                        onClick={e => { e.stopPropagation(); onOpen(); }}
                        style={{ width: '100%', padding: 'clamp(6px, 2vw, 10px) 0', borderRadius: 10, border: `1.5px solid ${border}`, background: `${border}22`, color: border, fontWeight: 800, fontSize: 'clamp(8px, 2.4vw, 11px)', textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer', transition: 'background 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = `${border}44`)}
                        onMouseLeave={e => (e.currentTarget.style.background = `${border}22`)}
                    >
                        Abrir perfil completo
                    </button>
                </div>{/* fecha inner overflow wrapper verso */}
                </div>

            </div>
        </div>
    );
}

export default function MembersList({ initialMembers, currentUserRole }: { initialMembers: Member[]; currentUserRole?: string | null }) {
    const [members, setMembers] = useState<Member[]>(initialMembers);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
    const [openMember, setOpenMember] = useState<Member | null>(null);

    const canEdit = currentUserRole === 'admin' || currentUserRole === 'director';

    const handleLevelChange = async (memberId: string, newLevel: number) => {
        const supabase = createClient();
        try {
            const { error } = await supabase.from('members').update({ level: newLevel }).eq('id', memberId);
            if (error) throw error;
            setMembers(prev => prev.map(m => m.id === memberId ? { ...m, level: newLevel } : m));
            toast.success('Nível atualizado!');
        } catch {
            toast.error('Erro ao atualizar nível.');
        }
    };

    // Normaliza variações de nome para uma forma canônica
    const POSITION_ALIASES: Record<string, string> = {
        'atacante': 'ATA', 'ata': 'ATA',
        'meia': 'MEI', 'mei': 'MEI',
        'volante': 'VOL', 'vol': 'VOL',
        'zagueiro': 'ZAG', 'zag': 'ZAG',
        'goleiro': 'GOL', 'gol': 'GOL',
        'lateral': 'LAT', 'lat': 'LAT',
    };
    const normalizePos = (p: string) => POSITION_ALIASES[p.toLowerCase()] ?? p.toUpperCase();

    const positions = useMemo(() => {
        const canonical = new Set(members.map(m => m.position).filter(Boolean).map(p => normalizePos(p!)));
        return Array.from(canonical).sort() as string[];
    }, [members]);

    const filteredMembers = useMemo(() => {
        return members.filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPosition = selectedPosition
                ? normalizePos(m.position || '') === selectedPosition
                : true;
            return matchesSearch && matchesPosition;
        });
    }, [members, searchTerm, selectedPosition]);

    return (
        <div>
            {/* Modal fullscreen */}
            {openMember && <MemberModal member={openMember} onClose={() => setOpenMember(null)} />}

            {/* Filtros */}
            <div className="bg-white/5 backdrop-blur border border-white/10 p-4 rounded-xl mb-10 sticky top-4 z-10">
                <div className="flex flex-col md:flex-row gap-3 items-center">
                    <div className="relative w-full md:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Buscar por nome..."
                            className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <select
                        className="h-10 px-3 rounded-md border border-white/20 bg-white/10 text-white text-sm w-full md:w-48 focus:outline-none"
                        value={selectedPosition || ''}
                        onChange={e => setSelectedPosition(e.target.value || null)}
                    >
                        <option value="" className="bg-gray-900">Todas as posições</option>
                        {positions.map(p => <option key={p} value={p} className="bg-gray-900">{p}</option>)}
                    </select>
                    {(searchTerm || selectedPosition) && (
                        <button onClick={() => { setSearchTerm(''); setSelectedPosition(null); }} className="text-xs text-gray-400 hover:text-white whitespace-nowrap">
                            Limpar filtros
                        </button>
                    )}
                    <span className="text-gray-500 text-xs ml-auto whitespace-nowrap">
                        {filteredMembers.length} jogador{filteredMembers.length !== 1 ? 'es' : ''}
                    </span>
                </div>
            </div>

            {/* Grid de cartas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 pt-4">
                {filteredMembers.map(member => (
                    <FifaCard
                        key={member.id}
                        member={member}
                        canEdit={canEdit}
                        onLevelChange={handleLevelChange}
                        onOpen={() => setOpenMember(member)}
                    />
                ))}
            </div>

            {filteredMembers.length === 0 && (
                <div className="text-center py-20">
                    <Search size={48} className="mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400 text-lg font-semibold">Nenhum jogador encontrado</p>
                    <button onClick={() => { setSearchTerm(''); setSelectedPosition(null); }} className="mt-3 text-sm text-blue-400 hover:underline">
                        Limpar filtros
                    </button>
                </div>
            )}
        </div>
    );
}
