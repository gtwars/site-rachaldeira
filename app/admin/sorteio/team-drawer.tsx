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
    level?: number; // 1-5
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
            // Function to normalize position
            const normalizePosition = (pos: string | null): 'DEF' | 'MID' | 'ATT' | 'GK' | 'OTHER' => {
                if (!pos) return 'OTHER';
                const p = pos.toLowerCase();
                if (p.includes('gol') || p.includes('gk')) return 'GK';
                if (p.includes('zag') || p.includes('def') || p.includes('lat') || p.includes('bec')) return 'DEF';
                if (p.includes('mei') || p.includes('vol') || p.includes('arm')) return 'MID';
                if (p.includes('ata') || p.includes('pon') || p.includes('cen')) return 'ATT';
                return 'OTHER';
            };

            // Group members by position
            const positionGroups: Record<string, Member[]> = {
                GK: [],
                DEF: [],
                MID: [],
                ATT: [],
                OTHER: []
            };

            selectedMembers.forEach(m => {
                const role = normalizePosition(m.position);
                positionGroups[role].push(m);
            });

            // Sort each group by level (descending)
            Object.values(positionGroups).forEach(group => {
                group.sort((a, b) => (b.level || 1) - (a.level || 1));
            });

            // Determine number of teams
            const totalPlayers = selectedMembers.length;
            const targetTeamSize = 5; // Preference: 5 per team

            // CHANGED: Use Math.ceil to ensure strict limit of 5 per team (creating overflow team if needed)
            let numTeams = Math.ceil(totalPlayers / targetTeamSize);

            if (numTeams < 2 && totalPlayers >= 4) {
                numTeams = 2; // Min 2 teams for a match
            } else if (numTeams === 0) {
                numTeams = 1; // Fallback
            }

            const newTeams: Member[][] = Array.from({ length: numTeams }, () => []);
            const teamLevelSums = new Array(numTeams).fill(0);

            // Helper to add player to a specific team
            const addPlayerToTeam = (teamIndex: number, player: Member) => {
                newTeams[teamIndex].push(player);
                teamLevelSums[teamIndex] += (player.level || 1);
            };

            // Helper to find the best team for a player (balancing levels)
            const distributePlayers = (players: Member[]) => {
                // Use "Fill Logic" if we have enough players for at least 2 full teams (10+)
                // This creates 5, 5, 3 structure instead of 5, 4, 4.
                const useFillLogic = totalPlayers >= 10;
                const fullTeamCount = Math.floor(totalPlayers / targetTeamSize);

                for (const player of players) {
                    let candidates: { idx: number, len: number, sum: number }[] = [];

                    if (useFillLogic) {
                        // Prioritize creating Full Teams (size 5) before overflow
                        const mainTeamsNotFull: { idx: number, len: number, sum: number }[] = [];
                        const reserveTeams: { idx: number, len: number, sum: number }[] = [];

                        for (let i = 0; i < numTeams; i++) {
                            const team = newTeams[i];
                            const sum = teamLevelSums[i];
                            const stats = { idx: i, len: team.length, sum };

                            // Teams 0 to fullTeamCount-1 are "Main"
                            if (i < fullTeamCount) {
                                if (team.length < targetTeamSize) {
                                    mainTeamsNotFull.push(stats);
                                }
                            } else {
                                reserveTeams.push(stats);
                            }
                        }

                        if (mainTeamsNotFull.length > 0) {
                            candidates = mainTeamsNotFull;
                        } else {
                            candidates = reserveTeams;
                        }
                    } else {
                        // Balanced logic for small numbers (< 10)
                        candidates = newTeams.map((t, idx) => ({ idx, len: t.length, sum: teamLevelSums[idx] }));
                    }

                    // Sort: Fill empty slots first (within candidates), then balance level
                    candidates.sort((a, b) => {
                        if (a.len !== b.len) return a.len - b.len;
                        return a.sum - b.sum;
                    });

                    if (candidates.length > 0) {
                        const chosenIndex = candidates[0].idx;
                        addPlayerToTeam(chosenIndex, player);
                    }
                }
            };

            // Order of injection strictly matters to satisfy "Core Requirement first".
            // 1. Determine GKs first
            distributePlayers(positionGroups.GK);

            // 2. Defenders (Foundation)
            distributePlayers(positionGroups.DEF);

            // 3. Midfielders (Link)
            distributePlayers(positionGroups.MID);

            // 4. Attackers (Finishers)
            distributePlayers(positionGroups.ATT);

            // 5. Others/Wildcards
            distributePlayers(positionGroups.OTHER);

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
