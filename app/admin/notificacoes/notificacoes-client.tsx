'use client';

import { useState } from 'react';
import { Bell, Send, Users, CheckCircle, Clock, AlertTriangle, Mail } from 'lucide-react';
import { triggerAttendanceNotifications } from './actions';

interface RachaWithStats {
    id: string;
    date_time: string;
    location: string;
    status: string;
    confirmedCount: number;
}

interface Props {
    rachas: RachaWithStats[];
    totalMembers: number;
    membersWithEmail: number;
    membersWithoutEmail: number;
}

type SendResult = {
    success?: boolean;
    error?: string;
    message?: string;
    already_confirmed?: number;
    emails_sent?: number;
    emails_failed?: number;
    first_error?: string;
};

function formatDateBR(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo',
    });
}

function formatTimeBR(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
    });
}

export default function NotificacoesClient({ rachas, totalMembers, membersWithEmail, membersWithoutEmail }: Props) {
    const [selectedId, setSelectedId] = useState<string>(rachas[0]?.id ?? '');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SendResult | null>(null);

    const selected = rachas.find(r => r.id === selectedId) ?? null;
    const pendingCount = Math.max(0, membersWithEmail - (selected?.confirmedCount ?? 0));
    const canSend = !!selected && pendingCount > 0;

    async function handleSend() {
        if (!selectedId) return;
        setLoading(true);
        setResult(null);
        const res = await triggerAttendanceNotifications(selectedId);
        setResult(res as SendResult);
        setLoading(false);
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Bell className="text-[#af1c15]" size={26} />
                    Notificações
                </h1>
                <p className="text-gray-500 mt-1">
                    Avise os membros por email para confirmarem presença no racha.
                </p>
            </div>

            {/* Cron info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <Clock size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                    <strong>Envio automático ativo:</strong> toda terça-feira às 10h o sistema manda email sozinho
                    para todos que ainda não confirmaram presença.
                    Você também pode disparar manualmente quando quiser.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Users size={15} /> Membros ativos
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{totalMembers}</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {membersWithEmail} recebem email
                        {membersWithoutEmail > 0 && ` · ${membersWithoutEmail} sem email cadastrado`}
                    </p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <CheckCircle size={15} /> Já responderam
                    </div>
                    <p className="text-3xl font-bold text-green-600">{selected?.confirmedCount ?? 0}</p>
                    <p className="text-xs text-gray-400 mt-1">para o racha selecionado</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Mail size={15} /> Ainda não responderam
                    </div>
                    <p className="text-3xl font-bold text-orange-500">{pendingCount}</p>
                    <p className="text-xs text-gray-400 mt-1">vão receber o email</p>
                </div>
            </div>

            {/* Racha selector */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Clock size={16} /> Rachas abertos
                </h2>

                {rachas.length === 0 ? (
                    <div className="flex items-center gap-2 text-amber-600 text-sm">
                        <AlertTriangle size={16} />
                        Nenhum racha aberto no momento. Crie um racha na seção Rachas e ele aparecerá aqui.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {rachas.map(racha => {
                            const isSelected = racha.id === selectedId;
                            const pending = Math.max(0, membersWithEmail - racha.confirmedCount);
                            return (
                                <button
                                    key={racha.id}
                                    onClick={() => { setSelectedId(racha.id); setResult(null); }}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                                        isSelected
                                            ? 'border-[#af1c15] bg-red-50'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="font-semibold text-gray-900 capitalize">
                                                {formatDateBR(racha.date_time)}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-0.5">
                                                🕐 {formatTimeBR(racha.date_time)} &nbsp;·&nbsp; 📍 {racha.location}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs text-gray-400">{racha.confirmedCount} responderam</p>
                                            {pending > 0 && (
                                                <p className="text-xs text-orange-500 font-medium">{pending} pendentes</p>
                                            )}
                                            {pending === 0 && (
                                                <p className="text-xs text-green-600 font-medium">todos responderam ✓</p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Send */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Send size={16} /> Enviar agora
                </h2>

                {selected && pendingCount === 0 && (
                    <p className="text-sm text-green-600 mb-4 flex items-center gap-2">
                        <CheckCircle size={15} /> Todos os membros já responderam para este racha!
                    </p>
                )}

                <div className="flex items-center gap-4 flex-wrap">
                    <button
                        onClick={handleSend}
                        disabled={loading || !canSend}
                        className="flex items-center gap-2 bg-[#af1c15] hover:bg-[#8f1510] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                Enviar para {pendingCount} {pendingCount === 1 ? 'membro' : 'membros'}
                            </>
                        )}
                    </button>
                    {canSend && (
                        <p className="text-xs text-gray-400">
                            Só quem ainda não respondeu vai receber.
                        </p>
                    )}
                </div>

                {result && (
                    <div className={`mt-4 p-4 rounded-lg text-sm ${result.error ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                        {result.error ? (
                            <p>❌ Erro ao enviar: {result.error}</p>
                        ) : result.message ? (
                            <p>ℹ️ {result.message}</p>
                        ) : (
                            <div className="space-y-1">
                                {(result.emails_sent ?? 0) > 0 ? (
                                    <p className="font-semibold">✅ {result.emails_sent} {result.emails_sent === 1 ? 'email enviado' : 'emails enviados'} com sucesso!</p>
                                ) : (
                                    <p className="font-semibold text-red-700">❌ Nenhum email foi entregue.</p>
                                )}
                                {(result.emails_failed ?? 0) > 0 && (
                                    <p className="text-red-700">⚠️ {result.emails_failed} falharam</p>
                                )}
                                {result.first_error && (
                                    <p className="text-red-600 text-xs mt-1">Motivo: {result.first_error}</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
