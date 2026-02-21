'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function TestDBPage() {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        async function check() {
            const supabase = createClient();
            const { data: members, error: mError } = await supabase.from('members').select('*');
            const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
            const { data: { user } } = await supabase.auth.getUser();

            setData({
                members: members || [],
                profiles: profiles || [],
                currentUser: user,
                mError,
                pError
            });
        }
        check();
    }, []);

    return (
        <div className="p-10 font-mono text-xs whitespace-pre-wrap">
            <h1>Database Test</h1>
            {data && JSON.stringify(data, null, 2)}
            {error && <p style={{ color: 'red' }}>{JSON.stringify(error)}</p>}
        </div>
    );
}
