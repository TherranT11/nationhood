#!/usr/bin/env node

/**
 * seed-work.js
 *
 * Populates the Work Supabase project with controlled test data
 * mirroring the live nations. Reads credentials from .env.work.
 *
 * Usage: npm run seed:work
 *
 * What it does:
 *   1. Calls admin_reset_tables() to clear all game state
 *   2. Upserts a shard record at tick 100
 *   3. Inserts 6 seed nations with known stats
 *   4. Inserts 3-4 factions per nation with seats, ideology, AP
 *   5. Creates a test user for login
 *
 * Requires: @supabase/supabase-js (install as devDep if missing)
 */

const fs = require('fs');
const path = require('path');

// Load .env.work
const envPath = path.resolve(__dirname, '..', '.env.work');
if (!fs.existsSync(envPath)) {
    console.error('ERROR: .env.work not found. Create it first with your Work Supabase credentials.');
    process.exit(1);
}
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
        env[trimmed.substring(0, eqIdx)] = trimmed.substring(eqIdx + 1);
    }
}

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.VITE_WORK_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || SUPABASE_URL.startsWith('<')) {
    console.error('ERROR: VITE_SUPABASE_URL not set in .env.work. Fill in your Work Supabase project URL.');
    process.exit(1);
}
if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith('<')) {
    console.error('ERROR: VITE_WORK_SERVICE_ROLE_KEY not set in .env.work. Fill in your service role key.');
    process.exit(1);
}

// Dynamically import supabase-js
async function main() {
    let createClient;
    try {
        ({ createClient } = require('@supabase/supabase-js'));
    } catch {
        console.error('ERROR: @supabase/supabase-js not found. Run: npm install @supabase/supabase-js');
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    console.log('Connecting to Work Supabase:', SUPABASE_URL);

    // Step 1: Reset all game state
    console.log('\n[1/5] Resetting game state...');
    const { data: resetResult, error: resetErr } = await supabase.rpc('admin_reset_tables');
    if (resetErr) {
        console.error('Reset failed:', resetErr.message);
        console.log('Note: Make sure admin_reset_tables() RPC exists in your Work DB.');
        console.log('Run the SQL from sql/create_admin_reset_tables.sql in the Work SQL Editor.');
        process.exit(1);
    }
    console.log('Tables reset:', JSON.stringify(resetResult, null, 2));

    // Step 2: Upsert shard at tick 100
    console.log('\n[2/5] Setting up shard...');
    const { error: shardErr } = await supabase.from('shard').upsert({
        name: 'Alpha Shard',
        current_tick: 100,
        current_date: 'March 15, 2026',
        next_tick_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Far future — manual ticks only
        tick_interval_hours: 1
    }, { onConflict: 'name' });
    if (shardErr) {
        console.error('Shard setup failed:', shardErr.message);
        process.exit(1);
    }
    console.log('Shard set to tick 100');

    // Get shard ID for FK references
    const { data: shard } = await supabase.from('shard').select('id').eq('name', 'Alpha Shard').single();
    const shardId = shard.id;

    // Step 3: Insert seed nations
    console.log('\n[3/5] Inserting seed nations...');
    const nations = [
        {
            name: 'Valdoria', government_type: 'Parliamentary', total_seats: 120, max_parties: 8,
            capital: 'Valdoris', shard_id: shardId, population: 8200000, eligible_voters: 5330000,
            gdp: 485000000000, debt: 25000000000, stability: 72, legitimacy: 78, corruption: 15,
            gdp_growth: 52, inflation: 32, unemployment: 22, happiness: 65, civil_unrest: 12,
            press_freedom: 88, freedom_index: 85, efficiency: 62, polarization: 35,
            healthcare_quality: 72, literacy: 90, crime_rate: 18, income_tax: 45,
            corporate_tax: 35, sales_tax: 38, national_approval: 55, gov_approval: 58,
            gov_approval_institutional: 55, gov_approval_outcomes: 52, gov_approval_events: 0
        },
        {
            name: 'Sangreza', government_type: 'Presidential', total_seats: 120, max_parties: 8,
            capital: 'San Marcos', shard_id: shardId, population: 12500000, eligible_voters: 8125000,
            gdp: 528000000000, debt: 40000000000, stability: 65, legitimacy: 70, corruption: 25,
            gdp_growth: 48, inflation: 38, unemployment: 32, happiness: 55, civil_unrest: 22,
            press_freedom: 72, freedom_index: 70, efficiency: 55, polarization: 48,
            healthcare_quality: 58, literacy: 82, crime_rate: 32, income_tax: 52,
            corporate_tax: 42, sales_tax: 40, national_approval: 48, gov_approval: 45,
            gov_approval_institutional: 48, gov_approval_outcomes: 42, gov_approval_events: 0
        },
        {
            name: 'Melizea', government_type: 'Autocracy', total_seats: 120, max_parties: 8,
            capital: 'Melisar', shard_id: shardId, population: 5800000, eligible_voters: 3770000,
            gdp: 95000000000, debt: 95000000000, stability: 58, legitimacy: 42, corruption: 55,
            gdp_growth: 28, inflation: 52, unemployment: 48, happiness: 35, civil_unrest: 38,
            press_freedom: 22, freedom_index: 28, efficiency: 40, polarization: 62,
            healthcare_quality: 42, literacy: 68, crime_rate: 42, income_tax: 62,
            corporate_tax: 55, sales_tax: 48, national_approval: 38, gov_approval: 35,
            gov_approval_institutional: 38, gov_approval_outcomes: 32, gov_approval_events: 0
        },
        {
            name: 'Palvera', government_type: 'Presidential', total_seats: 120, max_parties: 8,
            capital: 'Valcosta', shard_id: shardId, population: 6650000, eligible_voters: 4322500,
            gdp: 106000000000, debt: 48000000000, stability: 68, legitimacy: 72, corruption: 20,
            gdp_growth: 40, inflation: 28, unemployment: 48, happiness: 58, civil_unrest: 22,
            press_freedom: 85, freedom_index: 82, efficiency: 48, polarization: 42,
            healthcare_quality: 62, literacy: 82, crime_rate: 28, income_tax: 58,
            corporate_tax: 48, sales_tax: 42, national_approval: 50, gov_approval: 50,
            gov_approval_institutional: 50, gov_approval_outcomes: 50, gov_approval_events: 0
        },
        {
            name: 'Avelia', government_type: 'Parliamentary', total_seats: 120, max_parties: 8,
            capital: 'Avelon', shard_id: shardId, population: 9500000, eligible_voters: 6175000,
            gdp: 358000000000, debt: 10000000000, stability: 75, legitimacy: 80, corruption: 10,
            gdp_growth: 55, inflation: 25, unemployment: 18, happiness: 72, civil_unrest: 8,
            press_freedom: 92, freedom_index: 90, efficiency: 70, polarization: 25,
            healthcare_quality: 78, literacy: 95, crime_rate: 12, income_tax: 40,
            corporate_tax: 30, sales_tax: 35, national_approval: 65, gov_approval: 62,
            gov_approval_institutional: 60, gov_approval_outcomes: 58, gov_approval_events: 0
        },
        {
            name: 'Montequilla', government_type: 'Parliamentary', total_seats: 120, max_parties: 8,
            capital: 'Montecara', shard_id: shardId, population: 4200000, eligible_voters: 2730000,
            gdp: 109000000000, debt: 55000000000, stability: 32, legitimacy: 35, corruption: 45,
            gdp_growth: 18, inflation: 58, unemployment: 55, happiness: 28, civil_unrest: 62,
            press_freedom: 55, freedom_index: 52, efficiency: 28, polarization: 72,
            healthcare_quality: 38, literacy: 72, crime_rate: 52, income_tax: 65,
            corporate_tax: 58, sales_tax: 52, national_approval: 25, gov_approval: 22,
            gov_approval_institutional: 25, gov_approval_outcomes: 20, gov_approval_events: 0
        }
    ];

    for (const nation of nations) {
        const { error } = await supabase.from('nations').insert(nation);
        if (error) {
            console.error(`Failed to insert ${nation.name}:`, error.message);
        } else {
            console.log(`  Inserted: ${nation.name} (${nation.government_type})`);
        }
    }

    // Fetch inserted nation IDs
    const { data: insertedNations } = await supabase.from('nations').select('id, name, government_type').order('name');
    const nationMap = {};
    for (const n of insertedNations || []) {
        nationMap[n.name] = n;
    }

    // Step 4: Insert factions for each nation
    console.log('\n[4/5] Inserting factions...');
    const factionDefs = {
        'Valdoria': [
            { faction_name: 'Progressive Alliance', seats: 42, approval_rating: 58, action_points: 5, color: '#2196F3' },
            { faction_name: 'National Unity Party', seats: 35, approval_rating: 52, action_points: 5, color: '#F44336' },
            { faction_name: 'Green Future Coalition', seats: 25, approval_rating: 48, action_points: 5, color: '#4CAF50' },
            { faction_name: 'Conservative Bloc', seats: 18, approval_rating: 42, action_points: 5, color: '#FF9800' }
        ],
        'Sangreza': [
            { faction_name: 'Democratic Front', seats: 45, approval_rating: 52, action_points: 5, color: '#1565C0' },
            { faction_name: 'Peoples Republic Movement', seats: 38, approval_rating: 48, action_points: 5, color: '#C62828' },
            { faction_name: 'Liberty Party', seats: 22, approval_rating: 45, action_points: 5, color: '#F9A825' },
            { faction_name: 'Workers Coalition', seats: 15, approval_rating: 40, action_points: 5, color: '#6A1B9A' }
        ],
        'Melizea': [
            { faction_name: 'Ruling Junta', seats: 72, approval_rating: 38, action_points: 5, color: '#424242' },
            { faction_name: 'Reform Movement', seats: 28, approval_rating: 55, action_points: 5, color: '#0097A7' },
            { faction_name: 'Traditionalist Guard', seats: 20, approval_rating: 35, action_points: 5, color: '#5D4037' }
        ],
        'Palvera': [
            { faction_name: 'Centro Democratico', seats: 40, approval_rating: 50, action_points: 5, color: '#1976D2' },
            { faction_name: 'Partido Popular', seats: 35, approval_rating: 48, action_points: 5, color: '#D32F2F' },
            { faction_name: 'Union Verde', seats: 25, approval_rating: 45, action_points: 5, color: '#388E3C' },
            { faction_name: 'Frente Obrero', seats: 20, approval_rating: 42, action_points: 5, color: '#7B1FA2' }
        ],
        'Avelia': [
            { faction_name: 'New Dawn Party', seats: 50, approval_rating: 65, action_points: 5, color: '#00BCD4' },
            { faction_name: 'Heritage Alliance', seats: 38, approval_rating: 55, action_points: 5, color: '#795548' },
            { faction_name: 'Social Democrats', seats: 32, approval_rating: 58, action_points: 5, color: '#E91E63' }
        ],
        'Montequilla': [
            { faction_name: 'Solidarity Front', seats: 35, approval_rating: 28, action_points: 5, color: '#FF5722' },
            { faction_name: 'Order & Progress', seats: 32, approval_rating: 25, action_points: 5, color: '#37474F' },
            { faction_name: 'Peoples Voice', seats: 30, approval_rating: 30, action_points: 5, color: '#8BC34A' },
            { faction_name: 'Independence Movement', seats: 23, approval_rating: 22, action_points: 5, color: '#FFC107' }
        ]
    };

    const factionMap = {}; // nationName -> [{ id, faction_name, ... }]

    for (const [nationName, factions] of Object.entries(factionDefs)) {
        const nation = nationMap[nationName];
        if (!nation) { console.warn(`Nation ${nationName} not found, skipping factions`); continue; }

        factionMap[nationName] = [];
        // Set ruling_faction_id to the first faction (largest party)
        let rulingFactionId = null;

        for (let i = 0; i < factions.length; i++) {
            const f = factions[i];
            const { data: inserted, error } = await supabase.from('factions').insert({
                nation_id: nation.id,
                shard_id: shardId,
                faction_name: f.faction_name,
                faction_type: 'player',
                nation: nationName,
                seats: f.seats,
                approval_rating: f.approval_rating,
                action_points: f.action_points,
                color: f.color
            }).select('id').single();

            if (error) {
                console.error(`  Failed to insert faction ${f.faction_name}:`, error.message);
            } else {
                factionMap[nationName].push({ ...f, id: inserted.id });
                if (i === 0) rulingFactionId = inserted.id;
                console.log(`  ${nationName}: ${f.faction_name} (${f.seats} seats)`);
            }
        }

        // Set ruling faction
        if (rulingFactionId) {
            await supabase.from('nations')
                .update({ ruling_faction_id: rulingFactionId })
                .eq('id', nation.id);
        }
    }

    // Step 5: Create test user
    console.log('\n[5/5] Creating test user...');
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: 'test@nationhood.dev',
        password: 'testpassword123',
        email_confirm: true
    });
    if (authErr) {
        if (authErr.message?.includes('already been registered')) {
            console.log('  Test user already exists (test@nationhood.dev)');
        } else {
            console.warn('  Could not create test user:', authErr.message);
            console.log('  You may need to create one manually in the Supabase Auth dashboard.');
        }
    } else {
        console.log('  Created test user: test@nationhood.dev / testpassword123');

        // Link test user to first faction of Valdoria
        if (authData?.user && factionMap['Valdoria']?.[0]) {
            await supabase.from('factions')
                .update({ user_id: authData.user.id })
                .eq('id', factionMap['Valdoria'][0].id);
            console.log('  Linked test user to Valdoria: Progressive Alliance');
        }
    }

    console.log('\nSeed complete! Work environment is ready.');
    console.log('Login with: test@nationhood.dev / testpassword123');
    console.log('Run "npm run dev:work" to start the Work dev server on port 3001.');
}

main().catch(err => {
    console.error('Seed script failed:', err);
    process.exit(1);
});
