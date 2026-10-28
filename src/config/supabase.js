const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const env = require('./env');

let supabase = null;
let isConnected = false;

if (env.SUPABASE_URL && (env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY)) {
    try {
        const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
        supabase = createClient(env.SUPABASE_URL, key, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            },
            realtime: {
                transport: ws
            }
        });
        isConnected = true;
        console.log('[Supabase] Initialized client connected to live Supabase project:', env.SUPABASE_URL);
    } catch (err) {
        console.warn('[Supabase] Error initializing client:', err.message);
        supabase = null;
        isConnected = false;
    }
} else {
    console.log('[Supabase] Credentials not configured in .env. Running with built-in resilient state store.');
}

module.exports = {
    supabase,
    isConnected: () => isConnected,
    getStatus: () => ({
        configured: Boolean(env.SUPABASE_URL && (env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY)),
        url: env.SUPABASE_URL,
        mode: isConnected ? 'SUPABASE_POSTGRESQL' : 'RESILIENT_DEMO_STORE'
    })
};
