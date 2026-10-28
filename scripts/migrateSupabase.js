const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
    console.log('[Migration] Connecting to Supabase PostgreSQL database...');
    console.log('[Migration] Database URL:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@'));

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('[Migration] Successfully connected to Supabase PostgreSQL!');

        // 1. Run Schema Migration
        const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql'), 'utf8');
        console.log('[Migration] Applying schema DDL (tables, indexes, triggers, RLS policies)...');
        await client.query(schemaSql);
        console.log('[Migration] Schema migration applied successfully.');

        // 2. Run Seed Data
        const seedSql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'seed.sql'), 'utf8');
        console.log('[Migration] Seeding database with baseline academic data...');
        await client.query(seedSql);
        console.log('[Migration] Seed data inserted successfully.');

        // 3. Verify
        const roomsRes = await client.query('SELECT count(*) FROM rooms');
        const sessionsRes = await client.query('SELECT count(*) FROM timetable_sessions');
        console.log(`[Migration] Verified: ${roomsRes.rows[0].count} rooms, ${sessionsRes.rows[0].count} timetable sessions in Supabase.`);

        await client.end();
        console.log('[Migration] All migrations completed cleanly!');
        process.exit(0);
    } catch (err) {
        console.error('[Migration Error]:', err.message);
        if (client) await client.end().catch(() => {});
        process.exit(1);
    }
}

runMigration();
