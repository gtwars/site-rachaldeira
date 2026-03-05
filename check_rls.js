const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pqroxmeyuicutatbessb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxcm94bWV5dWljdXRhdGJlc3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjg1MjEsImV4cCI6MjA4Njg0NDUyMX0.xpBteBo0MBgaZPrZeL669MnFasYH2XYAtsBBgbjzux4';
const supabaseService = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxcm94bWV5dWljdXRhdGJlc3NiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI2ODUyMSwiZXhwIjoyMDg2ODQ0NTIxfQ.FrSaKlm5tY--l1VSuhhL17VC71-Z7VBQtlUo0KRVMwg');

async function checkRLS() {
    console.log('--- Checking RLS for ANON ---');
    const supabaseAnon = createClient(supabaseUrl, supabaseKey);

    const { data: mStatsAnon, error: mErrAnon } = await supabaseAnon
        .from('match_player_stats')
        .select('count');
    console.log('match_player_stats (Anon):', mErrAnon ? `Error: ${mErrAnon.message}` : `Count: ${mStatsAnon[0]?.count || 0}`);

    const { data: cMatchesAnon, error: cErrAnon } = await supabaseAnon
        .from('championship_matches')
        .select('count');
    console.log('championship_matches (Anon):', cErrAnon ? `Error: ${cErrAnon.message}` : `Count: ${cMatchesAnon[0]?.count || 0}`);

    console.log('--- Checking RLS for SERVICE ---');
    const { data: mStatsService, error: mErrService } = await supabaseService
        .from('match_player_stats')
        .select('count', { count: 'exact' });
    console.log('match_player_stats (Service):', mErrService ? `Error: ${mErrService.message}` : `Count: ${mStatsService?.[0]?.count ?? 'n/a'}`);

    // Check RLS settings directly
    const { data: rlsStatus, error: rlsErr } = await supabaseService.rpc('check_rls', { table_name: 'match_player_stats' });
    if (rlsErr) {
        // Fallback: check if row level security is enabled
        const { data: tables, error: tErr } = await supabaseService
            .rpc('get_tables_rls');
        if (tErr) {
            console.log('Could not check RLS via RPC. Manual check suggested.');
        } else {
            console.log('RLS on tables:', tables);
        }
    }
}

checkRLS();
