'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Shuffle, AlertCircle, UserPlus, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface Member {
    id: string;
    name: string;
    photo_url: string | null;
    position: string | null;
    level?: number;
}

interface TeamDrawerProps {
    confirmedMembers: Member[];
    nonConfirmedMembers: Member[];
    rachaLocation: string;
    rachaDate: string;
}

const TEAM_SIZE = 5;

function buildSnakeSlots(numTeams: number, teamCapacities: number[]): number[] {
    const slots: number[] = [];
    const fills = new Array(numTeams).fill(0);
    const total = teamCapacities.reduce((a, b) => a + b, 0);
    let round = 0;
    while (slots.length < total) {
        const isForward = round % 2 === 0;
        for (let i = 0; i < numTeams; i++) {
            const t = isForward ? i : numTeams - 1 - i;
            if (fills[t] < teamCapacities[t] && slots.length < total) {
                slots.push(t);
                fills[t]++;
            }
        }
        round++;
    }
    return slots;
}

function sortByLevel(arr: Member[]): Member[] {
    return [...arr].sort((a, b) => {
        const diff = (b.level || 1) - (a.level || 1);
        return diff !== 0 ? diff : Math.random() - 0.5;
    });
}

function isGK(pos: string | null) {
    if (!pos) return false;
    const p = pos.toLowerCase();
    return p.includes('gol') || p.includes('gk');
}

function isDEF(pos: string | null) {
    if (!pos) return false;
    const p = pos.toLowerCase();
    return p.includes('zag') || p.includes('bec');
}

function drawTeams(selectedMembers: Member[]): Member[][] {
    const totalPlayers = selectedMembers.length;
    if (totalPlayers === 0) return [];

    const numTeams = Math.max(2, Math.ceil(totalPlayers / TEAM_SIZE));
    const remainder = totalPlayers % TEAM_SIZE;

    // First (numTeams-1) teams get 5, last gets remainder (unless divisible by 5)
    const teamCapacities = Array.from({ length: numTeams }, (_, i) =>
        remainder === 0 || i < numTeams - 1 ? TEAM_SIZE : remainder
    );

    const newTeams: Member[][] = Array.from({ length: numTeams }, () => []);

    // Snake slots only for the 2 main teams (T0 and T1), capped at 5 each
    const numMainTeams = Math.min(2, numTeams);
    const mainCapacity = numMainTeams * TEAM_SIZE;
    const mainSlots = buildSnakeSlots(numMainTeams, new Array(numMainTeams).fill(TEAM_SIZE));

    const gks = selectedMembers.filter(m => isGK(m.position));
    const defs = selectedMembers.filter(m => !isGK(m.position) && isDEF(m.position));
    const others = selectedMembers.filter(m => !isGK(m.position) && !isDEF(m.position));

    let mIdx = 0;
    const assignMain = (players: Member[]) => {
        for (const p of sortByLevel(players)) {
            if (mIdx < mainSlots.length) {
                newTeams[mainSlots[mIdx]].push(p);
                mIdx++;
            }
        }
    };

    // 1 GK per main team (up to numMainTeams GKs)
    assignMain(gks.slice(0, numMainTeams));
    // 2 DEFs per main team
    assignMain(defs.slice(0, numMainTeams * 2));
    // Fill remaining main team slots with leftover players sorted by level
    const extraPool = sortByLevel([
        ...gks.slice(numMainTeams),
        ...defs.slice(numMainTeams * 2),
        ...others,
    ]);
    const slotsLeftInMain = mainCapacity - mIdx;
    assignMain(extraPool.slice(0, slotsLeftInMain));

    // Overflow players → additional teams (T2, T3, ...)
    if (numTeams > 2) {
        const overflowPlayers = extraPool.slice(slotsLeftInMain);
        const overflowCapacities = teamCapacities.slice(2);
        const overflowSlots = buildSnakeSlots(numTeams - 2, overflowCapacities).map(t => t + 2);
        overflowPlayers.forEach((p, i) => {
            if (i < overflowSlots.length) {
                newTeams[overflowSlots[i]].push(p);
            }
        });
    }

    return newTeams;
}

const TEAM_COLORS = [
    'border-t-blue-600',
    'border-t-red-500',
    'border-t-green-500',
    'border-t-yellow-500',
    'border-t-purple-500',
];

const TEAM_LABELS = ['Time 1', 'Time 2', 'Time 3', 'Time 4', 'Time 5'];

export function TeamDrawer({ confirmedMembers, nonConfirmedMembers, rachaLocation, rachaDate }: TeamDrawerProps) {
    const [extraMembers, setExtraMembers] = useState<Member[]>([]);
    const [teams, setTeams] = useState<Member[][]>([]);
    const [isShuffling, setIsShuffling] = useState(false);
    const [addDialogOpen, setAddDialogOpen] = useState(false);

    const allMembers = [...confirmedMembers, ...extraMembers];

    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
        new Set(confirmedMembers.map(m => m.id))
    );

    const handleToggleMember = (memberId: string) => {
        setSelectedMemberIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(memberId)) newSet.delete(memberId);
            else newSet.add(memberId);
            return newSet;
        });
    };

    const handleAddExtra = (member: Member) => {
        setExtraMembers(prev => [...prev, member]);
        setSelectedMemberIds(prev => new Set([...prev, member.id]));
    };

    const handleRemoveExtra = (memberId: string) => {
        setExtraMembers(prev => prev.filter(m => m.id !== memberId));
        setSelectedMemberIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(memberId);
            return newSet;
        });
    };

    const availableToAdd = nonConfirmedMembers.filter(
        m => !extraMembers.some(e => e.id === m.id)
    );

    const handleDrawTeams = () => {
        const selected = allMembers.filter(m => selectedMemberIds.has(m.id));
        if (selected.length === 0) return;
        setIsShuffling(true);
        setTimeout(() => {
            setTeams(drawTeams(selected));
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
                        {selectedMemberIds.size} / {allMembers.length} Selecionados
                    </span>
                    <Button onClick={handleDrawTeams} disabled={isShuffling || selectedMemberIds.size === 0}>
                        <Shuffle className={`mr-2 h-4 w-4 ${isShuffling ? 'animate-spin' : ''}`} />
                        {isShuffling ? 'Sorteando...' : teams.length > 0 ? 'Sortear Novamente' : 'Sortear Times'}
                    </Button>
                </div>
            </div>

            {allMembers.length === 0 && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Nenhum confirmado</AlertTitle>
                    <AlertDescription>
                        Ninguém confirmou presença neste racha ainda.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lista de Confirmados */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <span>Lista de Jogadores</span>
                                </div>
                            </CardTitle>
                            <div className="flex gap-2 mt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedMemberIds(new Set(allMembers.map(m => m.id)))}
                                    className="flex-1 text-xs"
                                >
                                    Todos
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedMemberIds(new Set())}
                                    className="flex-1 text-xs"
                                >
                                    Nenhum
                                </Button>
                                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs"
                                            disabled={availableToAdd.length === 0}
                                        >
                                            <UserPlus className="h-3 w-3 mr-1" />
                                            Adicionar
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-sm">
                                        <DialogHeader>
                                            <DialogTitle>Adicionar Jogador</DialogTitle>
                                        </DialogHeader>
                                        <p className="text-sm text-gray-500 mb-3">
                                            Jogadores ativos que não confirmaram presença:
                                        </p>
                                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                            {availableToAdd.length === 0 ? (
                                                <p className="text-sm text-gray-400 text-center py-4">
                                                    Todos os membros ativos já estão na lista.
                                                </p>
                                            ) : (
                                                availableToAdd.map(member => (
                                                    <div
                                                        key={member.id}
                                                        className="flex items-center gap-3 p-2 rounded-lg border bg-gray-50 hover:bg-gray-100 cursor-pointer"
                                                        onClick={() => {
                                                            handleAddExtra(member);
                                                            setAddDialogOpen(false);
                                                        }}
                                                    >
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={member.photo_url || ''} />
                                                            <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                                                            <p className="text-xs text-gray-500">{member.position || 'Sem posição'}</p>
                                                        </div>
                                                        <UserPlus className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                                {allMembers.map((member) => {
                                    const isExtra = extraMembers.some(e => e.id === member.id);
                                    return (
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
                                            {isExtra && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); handleRemoveExtra(member.id); }}
                                                    className="text-gray-400 hover:text-red-500 flex-shrink-0"
                                                    title="Remover"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Times Gerados */}
                <div className="lg:col-span-2">
                    {teams.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {teams.map((team, index) => (
                                <Card key={index} className={`border-t-4 ${TEAM_COLORS[index] || 'border-t-gray-400'} shadow-sm hover:shadow-md transition-shadow`}>
                                    <CardHeader className="pb-3 border-b bg-gray-50/50">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-lg">{TEAM_LABELS[index] || `Time ${index + 1}`}</CardTitle>
                                            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                {team.length} Jogadores
                                            </span>
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
                                                        <p className="text-xs text-gray-500">{member.position || 'Sem posição'}</p>
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
                                Clique em "Sortear Times" para gerar as equipes com base nos jogadores selecionados.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
