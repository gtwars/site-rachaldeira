'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VotingFormProps {
    activePeriod: any;
    members: any[];
    userMemberId: string;
    onVoteSubmitted?: () => void;
}

export default function VotingForm({ activePeriod, members, userMemberId, onVoteSubmitted }: VotingFormProps) {
    const [craqueId, setCraqueId] = useState('');
    const [xerifeId, setXerifeId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setError('');

        if (!craqueId || !xerifeId) {
            setError('Por favor, selecione ambos Craque e Xerife');
            return;
        }

        if (craqueId === xerifeId) {
            setError('Craque e Xerife devem ser jogadores diferentes');
            return;
        }

        setSubmitting(true);

        try {
            const supabase = createClient();

            const { error: insertError } = await supabase
                .from('votes')
                .insert({
                    voting_period_id: activePeriod.id,
                    voter_member_id: userMemberId,
                    craque_member_id: craqueId,
                    xerife_member_id: xerifeId,
                });

            if (insertError) throw insertError;

            alert('Voto registrado com sucesso! ✅');
            if (onVoteSubmitted) {
                onVoteSubmitted();
            } else {
                window.location.reload();
            }
        } catch (err: any) {
            setError('Erro ao registrar voto: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const eligibleMembers = members.filter(m => m.id !== userMemberId);

    return (
        <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        ⭐ Vote no Craque
                    </label>
                    <Select value={craqueId} onValueChange={setCraqueId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o Craque" />
                        </SelectTrigger>
                        <SelectContent>
                            {eligibleMembers.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                    {m.name}{m.position ? ` (${m.position})` : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        👮 Vote no Xerife
                    </label>
                    <Select value={xerifeId} onValueChange={setXerifeId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o Xerife" />
                        </SelectTrigger>
                        <SelectContent>
                            {eligibleMembers.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                    {m.name}{m.position ? ` (${m.position})` : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                    {error}
                </div>
            )}

            <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {submitting ? 'Enviando...' : '🗳️ Confirmar Voto'}
            </Button>
        </div>
    );
}
