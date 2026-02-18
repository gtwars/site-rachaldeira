'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Shuffle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Member {
    id: string;
    name: string;
    photo_url: string | null;
    position: string | null;
}

interface TeamDrawerProps {
    confirmedMembers: Member[];
    rachaLocation: string;
    rachaDate: string;
}

export function TeamDrawer({ confirmedMembers, rachaLocation, rachaDate }: TeamDrawerProps) {
    const [teams, setTeams] = useState<Member[][]>([]);
    const [isShuffling, setIsShuffling] = useState(false);
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
        new Set(confirmedMembers.map(m => m.id))
    );

    const handleToggleMember = (memberId: string) => {
        setSelectedMemberIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(memberId)) {
                newSet.delete(memberId);
            } else {
                newSet.add(memberId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        setSelectedMemberIds(new Set(confirmedMembers.map(m => m.id)));
    };

    const handleDeselectAll = () => {
        setSelectedMemberIds(new Set());
    };

    const handleDrawTeams = () => {
        const selectedMembers = confirmedMembers.filter(m => selectedMemberIds.has(m.id));

        if (selectedMembers.length === 0) return;

        setIsShuffling(true);
        setTimeout(() => {
            const shuffled = [...selectedMembers].sort(() => Math.random() - 0.5);
            const newTeams: Member[][] = [];
            const teamSize = 5;

            for (let i = 0; i < shuffled.length; i += teamSize) {
                newTeams.push(shuffled.slice(i, i + teamSize));
            }

            setTeams(newTeams);
            setIsShuffling(false);
        }, 800);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Sorteio de Times</h2>
                    <p className="text-gray-500">
                        Racha: {rachaDate} • {rachaLocation}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 bg-white px-3 py-1 rounded-full border">
                        {selectedMemberIds.size} / {confirmedMembers.length} Selecionados
                    </span>
                    <Button onClick={handleDrawTeams} disabled={isShuffling || selectedMemberIds.size === 0}>
                        <Shuffle className={`mr-2 h-4 w-4 ${isShuffling ? 'animate-spin' : ''}`} />
                        {isShuffling ? 'Sorteando...' : 'Sortear Times'}
                    </Button>
                </div>
            </div>

            {confirmedMembers.length === 0 && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Nenhum confirmado</AlertTitle>
                    <AlertDescription>
                        Ninguém confirmou presença neste racha ainda.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lista de Confirmados (Sidebar/Column) */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <span>Lista de Confirmados</span>
                                </div>
                            </CardTitle>
                            <div className="flex gap-2 mt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSelectAll}
                                    className="flex-1 text-xs"
                                >
                                    Todos
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDeselectAll}
                                    className="flex-1 text-xs"
                                >
                                    Nenhum
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                                {confirmedMembers.map((member) => (
                                    <div
                                        key={member.id}
                                        onClick={() => handleToggleMember(member.id)}
                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${selectedMemberIds.has(member.id)
                                                ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                                                : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedMemberIds.has(member.id)}
                                            onChange={() => { }}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.photo_url || ''} />
                                            <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{member.position || 'Sem posição'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Times Gerados */}
                <div className="lg:col-span-2">
                    {teams.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {teams.map((team, index) => (
                                <Card key={index} className="border-t-4 border-t-blue-600 shadow-sm hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3 border-b bg-gray-50/50">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-lg">Time {index + 1}</CardTitle>
                                            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{team.length} Jogadores</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="space-y-3">
                                            {team.map((member) => (
                                                <div key={member.id} className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 border border-gray-200">
                                                        <AvatarImage src={member.photo_url || ''} />
                                                        <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                                        <p className="text-xs text-gray-500">{member.position}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-400 border-2 border-dashed rounded-lg bg-gray-50">
                            <Shuffle className="h-12 w-12 mb-4 opacity-20" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">Pronto para sortear</h3>
                            <p className="text-sm max-w-sm">
                                Clique no botão "Sortear Times" para gerar as equipes aleatoriamente com base nos confirmados.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
