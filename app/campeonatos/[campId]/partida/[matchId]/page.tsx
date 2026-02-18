import { createClient } from '@/lib/supabase/server';
import MatchClient from './match-client';
import { notFound } from 'next/navigation';

export default async function MatchPage({ params }: { params: Promise<{ campId: string; matchId: string }> }) {
    const { campId, matchId } = await params;
    const supabase = await createClient();

    // Buscar partida
    const { data: match } = await supabase
        .from('championship_matches')
        .select(`
            *,
            team_a:teams!team_a_id(*),
            team_b:teams!team_b_id(*)
        `)
        .eq('id', matchId)
        .single();

    if (!match) {
        notFound();
    }

    // Buscar membros dos times
    // Time A Players
    const { data: teamAMembers } = await supabase
        .from('team_members')
        .select(`
            member_id,
            members (id, name, position)
        `)
        .eq('team_id', match.team_a_id);

    // Time B Players
    const { data: teamBMembers } = await supabase
        .from('team_members')
        .select(`
            member_id,
            members (id, name, position)
        `)
        .eq('team_id', match.team_b_id);

    // Buscar stats atuais
    const { data: stats } = await supabase
        .from('match_player_stats')
        .select('*')
        .eq('match_id', matchId);

    // Verificar se é admin
    const { data: { user } } = await supabase.auth.getUser();
    let isAdmin = false;
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        isAdmin = profile?.role === 'admin';
    }

    // Preparar dados para o Client
    const teamA = {
        id: match.team_a.id,
        name: match.team_a.name,
        logo_url: match.team_a.logo_url,
        players: teamAMembers?.map((tm: any) => tm.members) || []
    };

    const teamB = {
        id: match.team_b.id,
        name: match.team_b.name,
        logo_url: match.team_b.logo_url,
        players: teamBMembers?.map((tm: any) => tm.members) || []
    };

    return (
        <main className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <MatchClient
                    matchId={matchId}
                    campId={campId}
                    initialMatch={match}
                    teamA={teamA}
                    teamB={teamB}
                    initialStats={stats || []}
                    isAdmin={isAdmin}
                />
            </div>
        </main>
    );
}
