'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pencil, Trash2, Plus, Trophy, Upload } from 'lucide-react';

export default function AdminCampeonatosPage() {
    const router = useRouter();
    const [championships, setChampionships] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingChampionship, setEditingChampionship] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        start_date: '',
        location: '',
        format: 'round_robin',
        rounds: 1,
    });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    useEffect(() => {
        loadChampionships();
    }, []);

    const loadChampionships = async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from('championships')
            .select('*')
            .order('start_date', { ascending: false });

        setChampionships(data || []);
        setLoading(false);
    };

    const handleOpenModal = (championship?: any) => {
        if (championship) {
            setEditingChampionship(championship);
            setFormData({
                name: championship.name,
                start_date: championship.start_date,
                location: championship.location,
                format: championship.format,
                rounds: championship.rounds || 1,
            });
        } else {
            setEditingChampionship(null);
            setFormData({
                name: '',
                start_date: '',
                location: '',
                format: 'round_robin',
                rounds: 1,
            });
        }
        setPhotoFile(null);
        setError('');
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setError('');
        setSaving(true);

        try {
            const supabase = createClient();

            const championshipData = {
                name: formData.name,
                start_date: formData.start_date,
                location: formData.location,
                format: formData.format,
                bracket_type: formData.format === 'bracket' ? 'auto' : null,
                status: 'not_started',
                logo_url: null as string | null,
            };

            // Upload logo if selected
            let logoUrl = editingChampionship?.logo_url;
            if (photoFile) {
                const fileExt = photoFile.name.split('.').pop();
                const fileName = `championship_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('Fotos camp-times')
                    .upload(fileName, photoFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('Fotos camp-times')
                    .getPublicUrl(fileName);

                logoUrl = publicUrl;
            }
            championshipData.logo_url = logoUrl;

            if (editingChampionship) {
                // Update
                const { error: updateError } = await supabase
                    .from('championships')
                    .update(championshipData)
                    .eq('id', editingChampionship.id);

                if (updateError) throw updateError;
            } else {
                // Insert
                const { error: insertError } = await supabase
                    .from('championships')
                    .insert(championshipData);

                if (insertError) throw insertError;
            }

            setIsModalOpen(false);
            loadChampionships();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este campeonato?')) return;

        const supabase = createClient();
        const { error } = await supabase
            .from('championships')
            .delete()
            .eq('id', id);

        if (!error) {
            loadChampionships();
        }
    };

    const handleManage = (id: string) => {
        router.push(`/admin/campeonatos/${id}`);
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                        <Trophy className="text-yellow-600" />
                        Gerenciar Campeonatos
                    </h1>
                    <Button onClick={() => handleOpenModal()}>
                        <Plus size={20} className="mr-2" />
                        Novo Campeonato
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Data de Início</TableHead>
                                    <TableHead>Local</TableHead>
                                    <TableHead>Formato</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {championships.map((championship) => (
                                    <TableRow key={championship.id}>
                                        <TableCell className="font-medium">{championship.name}</TableCell>
                                        <TableCell>{new Date(championship.start_date).toLocaleDateString('pt-BR')}</TableCell>
                                        <TableCell>{championship.location}</TableCell>
                                        <TableCell>
                                            {championship.format === 'round_robin' ? '🔄 Pontos Corridos' : '🏅 Chaveamento'}
                                            {championship.format === 'round_robin' && (
                                                <span className="text-xs text-gray-500 ml-2">({championship.rounds} turno{championship.rounds > 1 ? 's' : ''})</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 text-xs rounded ${championship.status === 'not_started' ? 'bg-blue-100 text-blue-800' :
                                                championship.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {championship.status === 'not_started' ? 'Não Iniciado' :
                                                    championship.status === 'in_progress' ? 'Em Andamento' : 'Finalizado'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleManage(championship.id)}
                                            >
                                                Gerenciar
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenModal(championship)}
                                            >
                                                <Pencil size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(championship.id)}
                                            >
                                                <Trash2 size={16} className="text-red-600" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingChampionship ? 'Editar Campeonato' : 'Novo Campeonato'}
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Nome do Campeonato *
                            </label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Copa Rachaldeira 2026"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Data de Início *
                                </label>
                                <Input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Local *
                                </label>
                                <Input
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Ex: Arena Rachaldeira"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Formato *
                            </label>
                            <Select
                                value={formData.format}
                                onValueChange={(value) => setFormData({ ...formData, format: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o formato" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="round_robin">Pontos Corridos</SelectItem>
                                    <SelectItem value="bracket">Chaveamento</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.format === 'round_robin' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Número de Turnos
                                </label>
                                <Select
                                    value={formData.rounds.toString()}
                                    onValueChange={(value) => setFormData({ ...formData, rounds: parseInt(value) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Turno Único</SelectItem>
                                        <SelectItem value="2">Ida e Volta</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {formData.format === 'bracket' && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                                ℹ️ O chaveamento será gerado automaticamente baseado nos times cadastrados. Certifique-se de ter um número par de times.
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Logo do Campeonato
                            </label>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById('logo-upload')?.click()}
                                    className="w-full"
                                >
                                    <Upload size={16} className="mr-2" />
                                    {photoFile ? photoFile.name : (editingChampionship?.logo_url ? 'Alterar Logo' : 'Upload Logo')}
                                </Button>
                                <input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}
                    </div>
                </Modal>
            </div>
        </main>
    );
}
