const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const sql = fs.readFileSync('migration_new_tournament_format.sql', 'utf8');

    // Split SQL by semicolon but be careful with functions/triggers if any
    // For this migration, simple split is fine as there are no complex structures
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    console.log(`Running ${statements.length} statements...`);

    for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error) {
            // Some might fail if they already exist (like ADD COLUMN IF NOT EXISTS which is fine)
            // But 'rpc exec_sql' might not exist. Let's check if there is an alternative.
            console.error(`Error executing statement:`, error);
        } else {
            console.log('Success');
        }
    }
}

runMigration();
