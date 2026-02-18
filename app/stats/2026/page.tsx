import { createClient } from '@/lib/supabase/server';
import StatsTable from './stats-table';

export default async function Stats2026Page() {
    const supabase = await createClient();

    const year = 2026;

    // Buscar todos os membros
    const { data: members } = await supabase
        .from('members')
        .select('*')
        .order('name');

    // Buscar scouts de rachas de 2026
    const { data: rachaScouts } = await supabase
        .from('racha_scouts')
        .select(`
      *,
      rachas!inner(date_time)
    `)
        .gte('rachas.date_time', `${year}-01-01`)
        .lt('rachas.date_time', `${year + 1}-01-01`);

    // Buscar scouts de partidas de campeonatos de 2026
    const { data: matchScouts } = await supabase
        .from('match_player_stats')
        .select(`
      *,
      championship_matches!inner(
        championships!inner(start_date)
      )
    `)
        .gte('championship_matches.championships.start_date', `${year}-01-01`)
        .lt('championship_matches.championships.start_date', `${year + 1}-01-01`);

    // Buscar confirmações de presença
    const { data: attendance } = await supabase
        .from('racha_attendance')
        .select(`
      member_id,
      status,
      rachas!inner(date_time)
    `)
        .eq('status', 'in')
        .gte('rachas.date_time', `${year}-01-01`)
        .lt('rachas.date_time', `${year + 1}-01-01`);

    // Agregar estatísticas
    const stats = members?.map(member => {
        const memberRachaScouts = rachaScouts?.filter(s => s.member_id === member.id) || [];
        const memberMatchScouts = matchScouts?.filter(s => s.member_id === member.id) || [];
        const memberAttendance = attendance?.filter(a => a.member_id === member.id) || [];

        const goals = memberRachaScouts.reduce((sum, s) => sum + (s.goals || 0), 0) +
            memberMatchScouts.reduce((sum, s) => sum + (s.goals || 0), 0);

        const assists = memberRachaScouts.reduce((sum, s) => sum + (s.assists || 0), 0) +
            memberMatchScouts.reduce((sum, s) => sum + (s.assists || 0), 0);

        const saves = memberRachaScouts.reduce((sum, s) => sum + (s.difficult_saves || 0), 0) +
            memberMatchScouts.reduce((sum, s) => sum + (s.difficult_saves || 0), 0);

        const warnings = memberRachaScouts.reduce((sum, s) => sum + (s.warnings || 0), 0) +
            memberMatchScouts.reduce((sum, s) => sum + (s.warnings || 0), 0);

        const participations = memberAttendance.length;

        return {
            ...member,
            goals,
            assists,
            saves,
            warnings,
            participations,
        };
    }) || [];

    // Top 3 por categoria
    const topScorers = [...stats].sort((a, b) => b.goals - a.goals).slice(0, 3);
    const topAssisters = [...stats].sort((a, b) => b.assists - a.assists).slice(0, 3);
    const topSavers = [...stats].sort((a, b) => b.saves - a.saves).slice(0, 3);
    const topParticipants = [...stats].sort((a, b) => b.participations - a.participations).slice(0, 3);

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    📊 Estatísticas {year}
                </h1>
                <p className="text-gray-600 mb-8">
                    Desempenho de todos os jogadores durante o ano
                </p>

                {/* Tabela Interativa */}
                <StatsTable stats={stats} year={year} />
            </div>
        </main>
    );
}
