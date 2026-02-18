'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { CheckCircle } from 'lucide-react';

export default function RegistrarResultadoPage({ params }: { params: Promise<{ campId: string; matchId: string }> }) {
    const { campId, matchId } = use(params);
    const [match, setMatch] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [scoreA, setScoreA] = useState(0);
    const [scoreB, setScoreB] = useState(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadMatch();
    }, []);

    const loadMatch = async () => {
        const supabase = createClient();

        const { data } = await supabase
            .from('championship_matches')
            .select(`
        *,
        team_a:team_a_id (
          id,
          name,
          team_members (
            members (
              id,
              name,
              position
            )
          )
        ),
        team_b:team_b_id (
          id,
          name,
          team_members (
            members (
              id,
              name,
              position
            )
          )
        )
      `)
            .eq('id', matchId)
            .single();

        setMatch(data);
        setScoreA(data?.score_a || 0);
        setScoreB(data?.score_b || 0);
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);

        try {
            const supabase = createClient();

            const { error } = await supabase
                .from('championship_matches')
                .update({
                    score_a: scoreA,
                    score_b: scoreB,
                    status: 'completed',
                })
                .eq('id', matchId);

            if (error) throw error;

            alert('Resultado registrado com sucesso!');
            window.location.href = `/campeonatos/${campId}`;
        } catch (err: any) {
            alert('Erro ao salvar: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
    }

    if (!match) {
        return <div className="min-h-screen flex items-center justify-center">Partida não encontrada</div>;
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                    ⚽ Registrar Resultado
                </h1>

                <Card>
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex-1 text-center">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    {match.team_a?.name}
                                </h2>
                                <p className="text-sm text-gray-600">
                                    {match.team_a?.team_members?.length || 0} jogador(es)
                                </p>
                            </div>

                            <div className="px-8 text-4xl font-bold text-gray-400">
                                vs
                            </div>

                            <div className="flex-1 text-center">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    {match.team_b?.name}
                                </h2>
                                <p className="text-sm text-gray-600">
                                    {match.team_b?.team_members?.length || 0} jogador(es)
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-8 mb-8">
                            <div className="text-center">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Gols {match.team_a?.name}
                                </label>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setScoreA(Math.max(0, scoreA - 1))}
                                    >
                                        -
                                    </Button>
                                    <input
                                        type="number"
                                        value={scoreA}
                                        onChange={(e) => setScoreA(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-20 text-center text-3xl font-bold border border-gray-300 rounded px-3 py-2"
                                        min="0"
                                    />
                                    <Button
                                        variant="secondary"
                                        onClick={() => setScoreA(scoreA + 1)}
                                    >
                                        +
                                    </Button>
                                </div>
                            </div>

                            <div className="text-4xl font-bold text-gray-400">
                                ×
                            </div>

                            <div className="text-center">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Gols {match.team_b?.name}
                                </label>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setScoreB(Math.max(0, scoreB - 1))}
                                    >
                                        -
                                    </Button>
                                    <input
                                        type="number"
                                        value={scoreB}
                                        onChange={(e) => setScoreB(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-20 text-center text-3xl font-bold border border-gray-300 rounded px-3 py-2"
                                        min="0"
                                    />
                                    <Button
                                        variant="secondary"
                                        onClick={() => setScoreB(scoreB + 1)}
                                    >
                                        +
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-center">
                            <Button
                                variant="secondary"
                                onClick={() => window.location.href = `/campeonatos/${campId}`}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                size="lg"
                            >
                                <CheckCircle size={20} className="mr-2" />
                                {saving ? 'Salvando...' : 'Salvar Resultado'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {match.status === 'completed' && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                        ℹ️ Esta partida já foi finalizada. Você pode editar o placar se necessário.
                    </div>
                )}
            </div>
        </main>
    );
}
