'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Trash2, Users, Play, CheckCircle, Trophy, Upload } from 'lucide-react';

export default function GerenciarCampeonatoPage({ params }: { params: Promise<{ campId: string }> }) {
    const { campId } = use(params);
    const router = useRouter();
    const [championship, setChampionship] = useState<any>(null);
    const [teams, setTeams] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<any>(null);

    // Forms
    const [teamForm, setTeamForm] = useState({ name: '', logo_url: '' });
    const [playerForm, setPlayerForm] = useState({ member_id: '' });
    const [isBracketModalOpen, setIsBracketModalOpen] = useState(false);
    const [selectedQualifiers, setSelectedQualifiers] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [teamPhotoFile, setTeamPhotoFile] = useState<File | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const supabase = createClient();

        // Buscar campeonato
        const { data: champData } = await supabase
            .from('championships')
            .select('*')
            .eq('id', campId)
            .single();

        setChampionship(champData);

        // Buscar times com jogadores
        const { data: teamsData } = await supabase
            .from('teams')
            .select(`
        *,
        team_members (
          members (
            id,
            name,
            position
          )
        )
      `)
            .eq('championship_id', campId);

        setTeams(teamsData || []);

        // Buscar todos os membros
        const { data: membersData } = await supabase
            .from('members')
            .select('*')
            .order('name');

        setMembers(membersData || []);
        setLoading(false);
    };

    const handleAddTeam = async () => {
        setSaving(true);
        setError('');

        try {
            const supabase = createClient();

            let logoUrl = teamForm.logo_url;
            if (teamPhotoFile) {
                const fileExt = teamPhotoFile.name.split('.').pop();
                const fileName = `team_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('Fotos camp-times')
                    .upload(fileName, teamPhotoFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('Fotos camp-times')
                    .getPublicUrl(fileName);

                logoUrl = publicUrl;
            }

            const { error: insertError } = await supabase
                .from('teams')
                .insert({
                    championship_id: campId,
                    name: teamForm.name,
                    logo_url: logoUrl,
                });

            if (insertError) throw insertError;

            setIsTeamModalOpen(false);
            setIsTeamModalOpen(false);
            setTeamForm({ name: '', logo_url: '' });
            setTeamPhotoFile(null);
            loadData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTeam = async (teamId: string) => {
        if (!confirm('Tem certeza que deseja excluir este time?')) return;

        const supabase = createClient();
        await supabase.from('teams').delete().eq('id', teamId);
        loadData();
    };

    const handleAddPlayer = async () => {
        setSaving(true);
        setError('');

        try {
            const supabase = createClient();
            const { error: insertError } = await supabase
                .from('team_members')
                .insert({
                    team_id: selectedTeam.id,
                    member_id: playerForm.member_id,
                });

            if (insertError) throw insertError;

            setIsPlayerModalOpen(false);
            setPlayerForm({ member_id: '' });
            loadData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleRemovePlayer = async (teamId: string, memberId: string) => {
        if (!confirm('Remover jogador do time?')) return;

        const supabase = createClient();
        await supabase
            .from('team_members')
            .delete()
            .eq('team_id', teamId)
            .eq('member_id', memberId);
        loadData();
    };

    const handleGenerateKnockout = async () => {
        setSaving(true);
        setError('');

        const count = selectedQualifiers.length;
        if (count !== 8) {
            setError(`Selecione exatamente 8 times classificados. Você selecionou ${count}.`);
            setSaving(false);
            return;
        }

        try {
            const supabase = createClient();
            const matches: any[] = [];
            const qualifiers = [...selectedQualifiers];

            // QUARTAS DE FINAL (4 jogos) — 1º x 8º, 2º x 7º, 3º x 6º, 4º x 5º
            for (let i = 0; i < 4; i++) {
                matches.push({
                    championship_id: campId,
                    bracket_position: `qf-${i + 1}`,
                    team_a_id: qualifiers[i],
                    team_b_id: qualifiers[7 - i],
                    status: 'scheduled',
                });
            }

            // SEMIFINAIS (2 jogos vazios — preenchidos conforme vencedores das quartas)
            matches.push(
                { championship_id: campId, bracket_position: 'semi-1', status: 'scheduled' },
                { championship_id: campId, bracket_position: 'semi-2', status: 'scheduled' }
            );

            // FINAL (1 jogo vazio — preenchido com vencedores das semis)
            matches.push(
                { championship_id: campId, bracket_position: 'final-1', status: 'scheduled' }
            );

            const { error: insertError } = await supabase
                .from('championship_matches')
                .insert(matches);

            if (insertError) throw insertError;

            setIsBracketModalOpen(false);
            setSelectedQualifiers([]);
            alert('Chaveamento completo gerado!\n\nQuartas de Final: 4 jogos com confrontos definidos.\nSemifinais: 2 jogos aguardando vencedores.\nFinal: aguardando vencedores das semis.');
            loadData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateMatches = async () => {
        if (teams.length < 2) {
            alert('É necessário pelo menos 2 times para gerar partidas.');
            return;
        }

        if (championship.format === 'bracket' && teams.length % 2 !== 0) {
            alert('Para chaveamento com fase de grupos, é recomendável um número par de times (idealmente múltiplos de 4).');
            // Allow proceed but warn
        }

        if (!confirm(`Gerar partidas para este campeonato? A Fase de Grupos será gerada inicialmente.`)) return;

        setSaving(true);

        try {
            const supabase = createClient();
            let matches = [];

            if (championship.format === 'bracket') {
                // Lógica Híbrida: Fase de Grupos (3 Rodadas)
                // Divisão em grupos virtuais de 4 times
                const shuffledTeams = [...teams].sort(() => 0.5 - Math.random());
                const chunkSize = 4;

                // Se tiver menos de 6 times, faz um grupão só
                const effectiveChunkSize = teams.length < 6 ? teams.length : chunkSize;

                for (let i = 0; i < shuffledTeams.length; i += effectiveChunkSize) {
                    const group = shuffledTeams.slice(i, i + effectiveChunkSize);

                    if (group.length < 2) continue;

                    // Round Robin para o grupo
                    const rounds = group.length - 1 + (group.length % 2); // Rodadas necessárias
                    const half = group.length / 2;

                    // Algoritmo simples de rodízio
                    const groupIds = group.map(t => t.id);
                    // Se impar, adicionar dummy
                    if (groupIds.length % 2 !== 0) groupIds.push(null);

                    const totalRounds = groupIds.length - 1;
                    const numMatchesPerRound = groupIds.length / 2;

                    for (let r = 0; r < totalRounds; r++) {
                        for (let m = 0; m < numMatchesPerRound; m++) {
                            const t1 = groupIds[m];
                            const t2 = groupIds[groupIds.length - 1 - m];

                            if (t1 && t2) {
                                matches.push({
                                    championship_id: campId,
                                    round: r + 1, // Rodadas 1, 2, 3...
                                    team_a_id: t1,
                                    team_b_id: t2,
                                    status: 'scheduled',
                                });
                            }
                        }
                        // Rotacionar array (mantendo o primeiro fixo)
                        groupIds.splice(1, 0, groupIds.pop()!);
                    }
                }

                // Limitar a 3 rodadas como pedido, se tiver gerado mais (ex: grupão de 6 gera 5 rodadas)
                // O usuário pediu "São 3 rodadas".
                matches = matches.filter(m => m.round <= 3);

            } else {
                // Pontos Corridos Puro (Lógica existente melhorada)
                const rounds = championship.rounds || 1;
                const teamIds = teams.map(t => t.id);
                if (teamIds.length % 2 !== 0) teamIds.push(null);

                const numRounds = teamIds.length - 1;
                const matchesPerRound = teamIds.length / 2;

                for (let turn = 1; turn <= rounds; turn++) {
                    for (let r = 0; r < numRounds; r++) {
                        for (let m = 0; m < matchesPerRound; m++) {
                            const t1 = teamIds[m];
                            const t2 = teamIds[teamIds.length - 1 - m];

                            if (t1 && t2) {
                                // Inverter mando no segundo turno
                                const isReturn = turn % 2 === 0;
                                matches.push({
                                    championship_id: campId,
                                    round: (turn - 1) * numRounds + (r + 1),
                                    team_a_id: isReturn ? t2 : t1,
                                    team_b_id: isReturn ? t1 : t2,
                                    status: 'scheduled',
                                });
                            }
                        }
                        teamIds.splice(1, 0, teamIds.pop()!);
                    }
                }
            }

            const { error } = await supabase
                .from('championship_matches')
                .insert(matches);

            if (error) throw error;

            // Atualizar status para in_progress
            await supabase
                .from('championships')
                .update({ status: 'in_progress' })
                .eq('id', campId);

            alert('Fase de Grupos gerada com sucesso! As próximas fases (Mata-mata) deverão ser criadas manualmente após a conclusão desta fase.');
            router.push(`/campeonatos/${campId}`);
        } catch (err: any) {
            alert('Erro ao gerar partidas: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleFinishChampionship = async () => {
        if (!confirm('Finalizar campeonato? Não será possível adicionar mais partidas.')) return;

        const supabase = createClient();
        await supabase
            .from('championships')
            .update({ status: 'completed' })
            .eq('id', campId);

        alert('Campeonato finalizado!');
        router.push('/admin/campeonatos');
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
    }

    if (!championship) {
        return <div className="min-h-screen flex items-center justify-center">Campeonato não encontrado</div>;
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            {championship.name}
                        </h1>
                        <p className="text-gray-600">
                            {new Date(championship.start_date).toLocaleDateString('pt-BR')} - {championship.location}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            Status: <span className="font-semibold">{championship.status}</span>
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {championship.status === 'not_started' && teams.length >= 2 && (
                            <Button onClick={handleGenerateMatches} disabled={saving}>
                                <Play size={16} className="mr-2" />
                                Gerar Partidas
                            </Button>
                        )}
                        {championship.status === 'in_progress' && (
                            <>
                                <Button onClick={() => setIsBracketModalOpen(true)}>
                                    <Trophy size={16} className="mr-2" />
                                    Gerar Mata-Mata (Classificados)
                                </Button>
                                <Button variant="secondary" onClick={handleFinishChampionship}>
                                    <CheckCircle size={16} className="mr-2" />
                                    Finalizar Campeonato
                                </Button>
                            </>
                        )}
                        <Button variant="secondary" onClick={() => router.push('/admin/campeonatos')}>
                            Voltar
                        </Button>
                    </div>
                </div>

                {/* Times */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Times ({teams.length})</CardTitle>
                            {championship.status === 'not_started' && (
                                <Button size="sm" onClick={() => setIsTeamModalOpen(true)}>
                                    <Plus size={16} className="mr-2" />
                                    Adicionar Time
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {teams.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Nenhum time cadastrado ainda</p>
                        ) : (
                            <div className="space-y-4">
                                {teams.map(team => (
                                    <Card key={team.id} className="bg-gray-50">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                                        {team.logo_url && (
                                                            <img src={team.logo_url} className="w-6 h-6 object-contain rounded-full border border-gray-200" alt={team.name} />
                                                        )}
                                                        {team.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {team.team_members?.length || 0} jogador(es)
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {championship.status === 'not_started' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                onClick={() => {
                                                                    setSelectedTeam(team);
                                                                    setIsPlayerModalOpen(true);
                                                                }}
                                                            >
                                                                <Users size={14} className="mr-1" />
                                                                Adicionar Jogador
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDeleteTeam(team.id)}
                                                            >
                                                                <Trash2 size={14} className="text-red-600" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {team.team_members && team.team_members.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {team.team_members.map((tm: any) => (
                                                        <div
                                                            key={tm.members.id}
                                                            className="flex items-center gap-2 bg-white px-3 py-1 rounded-full text-sm"
                                                        >
                                                            <span>{tm.members.name}</span>
                                                            {tm.members.position && (
                                                                <span className="text-xs text-gray-500">({tm.members.position})</span>
                                                            )}
                                                            {championship.status === 'not_started' && (
                                                                <button
                                                                    onClick={() => handleRemovePlayer(team.id, tm.members.id)}
                                                                    className="text-red-600 hover:text-red-800"
                                                                >
                                                                    ×
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Modal - Adicionar Time */}
                <Modal
                    isOpen={isTeamModalOpen}
                    onClose={() => setIsTeamModalOpen(false)}
                    title="Adicionar Time"
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => setIsTeamModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleAddTeam} disabled={saving}>
                                {saving ? 'Salvando...' : 'Adicionar'}
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Nome do Time *
                            </label>
                            <Input
                                value={teamForm.name}
                                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                                placeholder="Ex: Time A"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Logo do Time
                            </label>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById('team-logo-upload')?.click()}
                                    className="w-full"
                                >
                                    <Upload size={16} className="mr-2" />
                                    {teamPhotoFile ? teamPhotoFile.name : 'Upload Logo'}
                                </Button>
                                <input
                                    id="team-logo-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => setTeamPhotoFile(e.target.files?.[0] || null)}
                                />
                            </div>
                        </div>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                                {error}
                            </div>
                        )}
                    </div>
                </Modal>

                {/* Modal - Adicionar Jogador */}
                <Modal
                    isOpen={isPlayerModalOpen}
                    onClose={() => setIsPlayerModalOpen(false)}
                    title={`Adicionar Jogador ao ${selectedTeam?.name}`}
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => setIsPlayerModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleAddPlayer} disabled={saving}>
                                {saving ? 'Adicionando...' : 'Adicionar'}
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Jogador *
                            </label>
                            <Select
                                value={playerForm.member_id}
                                onValueChange={(value) => setPlayerForm({ member_id: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um jogador" />
                                </SelectTrigger>
                                <SelectContent>
                                    {members
                                        .filter(m => !selectedTeam?.team_members?.some((tm: any) => tm.members.id === m.id))
                                        .map((m) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.name}{m.position ? ` (${m.position})` : ''}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                                {error}
                            </div>
                        )}
                    </div>
                </Modal>

                {/* Modal - Gerar Mata-Mata */}
                <Modal
                    isOpen={isBracketModalOpen}
                    onClose={() => setIsBracketModalOpen(false)}
                    title="Selecionar Classificados para o Mata-Mata"
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => setIsBracketModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleGenerateKnockout} disabled={saving}>
                                {saving ? 'Gerando...' : 'Gerar Chaveamento'}
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-4">
                            <strong>Selecione exatamente 8 times</strong> em ordem de classificação (1º, 2º... até 8º).<br />
                            O sistema gerará automaticamente o chaveamento completo:<br />
                            <div className="mt-2 ml-2 font-medium">
                                🏟️ Quartas de Final (1º x 8º, 2º x 7º, 3º x 6º, 4º x 5º)<br />
                                ⚔️ Semifinais (vencedores das quartas)<br />
                                🏆 Grande Final
                            </div>
                        </div>

                        <div className="p-2 border rounded max-h-60 overflow-y-auto space-y-2">
                            {teams.map(team => (
                                <label key={team.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedQualifiers.includes(team.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedQualifiers([...selectedQualifiers, team.id]);
                                            } else {
                                                setSelectedQualifiers(selectedQualifiers.filter(id => id !== team.id));
                                            }
                                        }}
                                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-900 font-medium">{team.name}</span>
                                    {selectedQualifiers.includes(team.id) && (
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full ml-auto">
                                            #{selectedQualifiers.indexOf(team.id) + 1}
                                        </span>
                                    )}
                                </label>
                            ))}
                        </div>

                        <div className="text-right text-sm text-gray-500">
                            Selecionados: <strong>{selectedQualifiers.length}</strong>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                                {error}
                            </div>
                        )}
                    </div>
                </Modal>
            </div>
        </main>
    );
}

// Helper to add logo_url to teamForm handled in separate chunks due to spread

