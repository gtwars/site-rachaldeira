const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pqroxmeyuicutatbessb.supabase.co';
// Using SERVICE ROLE KEY to bypass RLS
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxcm94bWV5dWljdXRhdGJlc3NiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI2ODUyMSwiZXhwIjoyMDg2ODQ0NTIxfQ.FrSaKlm5tY--l1VSuhhL17VC71-Z7VBQtlUo0KRVMwg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStats() {
    console.log('--- Checking Championship Match Stats (SERVICE ROLE) ---');

    const { data: matches, error: mErr } = await supabase
        .from('championship_matches')
        .select('id, status, round, bracket_position, score_a, score_b');

    if (mErr) console.error('Matches Error:', mErr);
    console.log(`Total Matches: ${matches?.length}`);
    if (matches?.length > 0) {
        console.log('Sample Matches:', matches.slice(0, 3));
        const statusCounts = matches.reduce((acc, m) => ({ ...acc, [m.status]: (acc[m.status] || 0) + 1 }), {});
        console.log('Status breakdown:', statusCounts);
    }

    const { data: stats, error: sErr } = await supabase
        .from('match_player_stats')
        .select('goals, assists, member_id, match_id, members(name)');

    if (sErr) console.error('Stats Error:', sErr);
    console.log(`Total Player Stats entries: ${stats?.length}`);

    const goalsPerPlayer = {};
    stats?.forEach(s => {
        const name = s.members?.name || 'Unknown';
        goalsPerPlayer[name] = (goalsPerPlayer[name] || 0) + (s.goals || 0);
    });
    console.log('Goals per player (Top 5):', Object.entries(goalsPerPlayer).sort((a, b) => b[1] - a[1]).slice(0, 5));

    const { data: joined, error: jErr } = await supabase
        .from('match_player_stats')
        .select('goals, championship_matches!inner(status)')
        .limit(5);

    if (jErr) console.error('Join Error:', jErr);
    else console.log('Join Sample:', joined);
}

checkStats();
