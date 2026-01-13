import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error('Missing Supabase configuration');
    }

    return createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

export async function POST(req: Request) {
    try {
        const { role } = await req.json(); // 'pro' or 'enterprise'
        const supabase = getSupabase();

        const code = "INVITE-" + Math.random().toString(36).substring(2, 10).toUpperCase();

        const { error } = await supabase.from('invites').insert({
            code,
            plan_type: role || 'pro',
        });

        if (error) throw error;

        return NextResponse.json({ success: true, code });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
