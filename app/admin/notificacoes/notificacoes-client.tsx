'use client';

import { useState } from 'react';
import { Bell, Send, Users, CheckCircle, Clock, AlertTriangle, Mail, Info } from 'lucide-react';
import { triggerAttendanceNotifications } from './actions';

interface Racha {
    id: string;
    date: string;
    location: string;
    status: string;
}

interface Props {
    racha: Racha | null;
    totalMembers: number;
    membersWithEmail: number;
    membersWithoutEmail: number;
    confirmedCount: number;
}

type SendResult = {
    success?: boolean;
    error?: string;
    message?: string;
    total_members?: number;
    already_confirmed?: number;
    emails_sent?: number;
    emails_failed?: number;
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

export default function NotificacoesClient({ racha, totalMembers, membersWithEmail, membersWithoutEmail, confirmedCount }: Props) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SendResult | null>(null);

    const pendingCount = membersWithEmail - confirmedCount;
    const canSend = racha?.status === 'open' && pendingCount > 0;

    async function handleSend() {
        setLoading(true);
        setResult(null);
        const res = await triggerAttendanceNotifications();
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
                    Envie emails para membros confirmarem presença no próximo racha.
                </p>
            </div>

            {/* Cron info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <Clock size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <strong>Envio automático:</strong> toda terça-feira às 10h (horário de Brasília).<br />
                    Configure o agendamento via <code className="bg-blue-100 px-1 rounded">vercel.json</code> e a variável <code className="bg-blue-100 px-1 rounded">CRON_SECRET</code> no painel da Vercel.
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Users size={15} /> Total de membros
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{totalMembers}</p>
                    <p className="text-xs text-gray-400 mt-1">{membersWithEmail} com email · {membersWithoutEmail} sem email</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <CheckCircle size={15} /> Já confirmaram
                    </div>
                    <p className="text-3xl font-bold text-green-600">{confirmedCount}</p>
                    <p className="text-xs text-gray-400 mt-1">para o próximo racha</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Mail size={15} /> Pendentes de confirmação
                    </div>
                    <p className="text-3xl font-bold text-orange-500">{Math.max(0, pendingCount)}</p>
                    <p className="text-xs text-gray-400 mt-1">membros com email sem resposta</p>
                </div>
            </div>

            {/* Next Racha */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Clock size={16} /> Próximo Racha
                </h2>

                {racha ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                            <p className="text-lg font-bold text-gray-900 capitalize">{formatDateBR(racha.date)}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                🕐 {formatTimeBR(racha.date)} &nbsp;·&nbsp; 📍 {racha.location}
                            </p>
                            <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${racha.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {racha.status === 'open' ? '✅ Aberto para confirmações' : `Status: ${racha.status}`}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-amber-600 text-sm">
                        <AlertTriangle size={16} />
                        Nenhum racha marcado como próximo. Defina um racha como <strong>"is_next"</strong> para habilitar os envios.
                    </div>
                )}
            </div>

            {/* Send button + result */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Send size={16} /> Enviar Agora
                </h2>

                {!racha && (
                    <p className="text-sm text-gray-500 mb-4">Nenhum racha aberto encontrado.</p>
                )}

                {racha && pendingCount <= 0 && (
                    <p className="text-sm text-green-600 mb-4 flex items-center gap-2">
                        <CheckCircle size={15} /> Todos os membros com email já responderam!
                    </p>
                )}

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSend}
                        disabled={loading || !canSend}
                        className="flex items-center gap-2 bg-[#af1c15] hover:bg-[#8f1510] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                Enviar Notificações
                            </>
                        )}
                    </button>
                    <p className="text-xs text-gray-400">
                        Envia apenas para membros que ainda não responderam.
                    </p>
                </div>

                {result && (
                    <div className={`mt-4 p-4 rounded-lg text-sm ${result.error ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                        {result.error ? (
                            <p>❌ Erro: {result.error}</p>
                        ) : result.message ? (
                            <p>ℹ️ {result.message}</p>
                        ) : (
                            <div className="space-y-1">
                                <p className="font-semibold">✅ Notificações enviadas com sucesso!</p>
                                <p>📧 Enviados: <strong>{result.emails_sent}</strong></p>
                                {(result.emails_failed ?? 0) > 0 && (
                                    <p>⚠️ Falhas: <strong>{result.emails_failed}</strong></p>
                                )}
                                <p>✓ Já haviam confirmado: <strong>{result.already_confirmed}</strong></p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Setup instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <Info size={15} /> Configuração necessária
                </h3>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                    <li>Crie uma conta em <strong>resend.com</strong> e obtenha sua API key.</li>
                    <li>Adicione <code className="bg-gray-100 px-1 rounded text-xs">RESEND_API_KEY=re_...</code> nas variáveis de ambiente da Vercel.</li>
                    <li>Verifique seu domínio no Resend (ou use <code className="bg-gray-100 px-1 rounded text-xs">onboarding@resend.dev</code> para testes).</li>
                    <li>Adicione <code className="bg-gray-100 px-1 rounded text-xs">NOTIFICATION_FROM_EMAIL=noreply@seudominio.com</code> nas variáveis.</li>
                    <li>Gere um <code className="bg-gray-100 px-1 rounded text-xs">CRON_SECRET</code> aleatório e adicione na Vercel para proteger o endpoint automático.</li>
                </ol>
            </div>
        </div>
    );
}
