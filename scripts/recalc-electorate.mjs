#!/usr/bin/env node
/**
 * recalc-electorate.mjs
 *
 * One-off script to recalculate electorate standings for all parties in a nation
 * using the real electorate engine (valley penalty, dynamic credibility weights,
 * spatial competition, softmax, turnout).
 *
 * Usage:
 *   node scripts/recalc-electorate.mjs                  # all non-autocracy nations
 *   node scripts/recalc-electorate.mjs "Palvera"        # specific nation by name
 *   node scripts/recalc-electorate.mjs --snap           # bypass drift caps, snap to targets
 *   node scripts/recalc-electorate.mjs --snap "Palvera" # snap a specific nation
 */

import { createClient } from '@supabase/supabase-js';
import { tickElectorate } from '../js/game/electorate.js';

const SUPABASE_URL = 'https://pbumjalxclmegzckhqqr.supabase.co';
// Use service role key to bypass RLS — pass via env: SUPABASE_SERVICE_KEY=... node scripts/recalc-electorate.mjs
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_KEY) {
    console.error('Set SUPABASE_SERVICE_KEY env var (from Supabase dashboard → Settings → API → service_role)');
    console.error('Usage: SUPABASE_SERVICE_KEY=eyJ... node scripts/recalc-electorate.mjs [nation_name]');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const args = process.argv.slice(2);
const snapMode = args.includes('--snap');
const targetName = args.find(a => !a.startsWith('--')) || null;

async function main() {
    // Get current tick
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) { console.error('Could not load shard'); process.exit(1); }
    const currentTick = shard.current_tick;
    console.log(`Current tick: ${currentTick}`);

    // Load nations
    let query = supabase.from('nations').select('*');
    if (targetName) {
        query = query.ilike('name', `%${targetName}%`);
    }
    const { data: nations, error: nErr } = await query;
    if (nErr) { console.error('Failed to load nations:', nErr.message); process.exit(1); }
    if (!nations || nations.length === 0) {
        console.error(targetName ? `No nation found matching "${targetName}"` : 'No nations found');
        process.exit(1);
    }

    console.log(`Processing ${nations.length} nation(s)...\n`);

    for (const nation of nations) {
        console.log(`── ${nation.name} (polarization: ${nation.polarization}, stability: ${nation.stability}) ──`);

        // Snapshot before
        const { data: beforeStandings } = await supabase
            .from('faction_electoral_standing')
            .select('faction_id, ideological_alignment, platform_appeal, party_approval, visibility, raw_appeal, contested_vote_share, realized_vote_share, turnout_rate')
            .eq('nation_id', nation.id);

        const { data: factionNames } = await supabase
            .from('factions')
            .select('id, faction_name')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party');
        const nameMap = {};
        for (const f of (factionNames || [])) nameMap[f.id] = f.faction_name;

        // Run the electorate engine
        try {
            await tickElectorate(supabase, nation, currentTick, { snap: snapMode });
            if (snapMode) console.log('  [SNAP] Bypassed drift caps — pillars set to target values');
        } catch (err) {
            console.error(`  ERROR: ${err.message}`);
            continue;
        }

        // Snapshot after
        const { data: afterStandings } = await supabase
            .from('faction_electoral_standing')
            .select('faction_id, ideological_alignment, platform_appeal, party_approval, visibility, raw_appeal, contested_vote_share, realized_vote_share, turnout_rate')
            .eq('nation_id', nation.id);

        // Show diff
        const afterMap = {};
        for (const s of (afterStandings || [])) afterMap[s.faction_id] = s;
        const beforeMap = {};
        for (const s of (beforeStandings || [])) beforeMap[s.faction_id] = s;

        console.log('');
        console.log('  Party                          | Align  | Appeal | Approval | Vis  | Raw    | Vote%  | Turnout');
        console.log('  ' + '-'.repeat(100));
        for (const fid of Object.keys(afterMap)) {
            const b = beforeMap[fid] || {};
            const a = afterMap[fid];
            const name = (nameMap[fid] || fid).padEnd(30);
            const fmt = (val, old) => {
                const v = Number(val || 0);
                const o = Number(old || 0);
                const diff = v - o;
                const sign = diff >= 0 ? '+' : '';
                return `${v.toFixed(1).padStart(5)} ${diff !== 0 ? `(${sign}${diff.toFixed(1)})` : '      '}`;
            };
            const fmtPct = (val, old) => {
                const v = Number(val || 0) * 100;
                const o = Number(old || 0) * 100;
                const diff = v - o;
                const sign = diff >= 0 ? '+' : '';
                return `${v.toFixed(1).padStart(5)}% ${diff !== 0 ? `(${sign}${diff.toFixed(1)})` : '       '}`;
            };
            console.log(`  ${name} | ${fmt(a.ideological_alignment, b.ideological_alignment)} | ${fmt(a.platform_appeal, b.platform_appeal)} | ${fmt(a.party_approval, b.party_approval)} | ${fmt(a.visibility, b.visibility)} | ${fmt(a.raw_appeal, b.raw_appeal)} | ${fmtPct(a.realized_vote_share, b.realized_vote_share)} | ${fmtPct(a.turnout_rate, b.turnout_rate)}`);
        }
        console.log('');
    }

    console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
