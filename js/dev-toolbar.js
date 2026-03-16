/**
 * Dev Toolbar — Work Environment Only
 * Provides manual tick control, seed reset, and nation switching.
 * Only loaded when IS_WORK_ENV === true (see common.js).
 */

import { _supabase } from './supabase-client.js';
import { runManualElectionByGovernmentType } from './game/elections.js';

const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const SERVICE_ROLE_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WORK_SERVICE_ROLE_KEY) || '';

let toolbarExpanded = false;

export async function renderDevToolbar() {
    if (document.getElementById('dev-toolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.id = 'dev-toolbar';
    toolbar.innerHTML = buildToolbarHTML();
    applyToolbarStyles(toolbar);
    document.body.appendChild(toolbar);

    // Load initial state
    await refreshToolbarState();

    // Wire up event handlers
    document.getElementById('dev-toolbar-toggle').addEventListener('click', toggleToolbar);
    document.getElementById('dev-advance-tick').addEventListener('click', () => advanceTicks(1));
    document.getElementById('dev-advance-n').addEventListener('click', advanceNTicks);
    document.getElementById('dev-run-election').addEventListener('click', runElection);
    document.getElementById('dev-reset-seed').addEventListener('click', resetToSeed);
    document.getElementById('dev-nation-select').addEventListener('change', switchNation);
}

function buildToolbarHTML() {
    return `
        <button id="dev-toolbar-toggle" title="Dev Toolbar">DEV</button>
        <div id="dev-toolbar-panel" style="display:none;">
            <div class="dev-toolbar-section">
                <div class="dev-toolbar-label">Current Tick</div>
                <div id="dev-current-tick" class="dev-toolbar-value">--</div>
            </div>
            <div class="dev-toolbar-section">
                <button id="dev-advance-tick" class="dev-btn">Advance 1 Tick</button>
            </div>
            <div class="dev-toolbar-section">
                <div class="dev-toolbar-row">
                    <input id="dev-tick-count" type="number" min="1" max="100" value="5" class="dev-input">
                    <button id="dev-advance-n" class="dev-btn">Advance N</button>
                </div>
            </div>
            <div class="dev-toolbar-section">
                <button id="dev-run-election" class="dev-btn dev-btn-election">Run Election</button>
            </div>
            <div class="dev-toolbar-section">
                <button id="dev-reset-seed" class="dev-btn dev-btn-danger">Reset to Seed</button>
            </div>
            <div class="dev-toolbar-section">
                <div class="dev-toolbar-label">Switch Nation</div>
                <select id="dev-nation-select" class="dev-select">
                    <option value="">Loading...</option>
                </select>
            </div>
            <div id="dev-toolbar-status" class="dev-toolbar-status"></div>
        </div>
    `;
}

function applyToolbarStyles(toolbar) {
    toolbar.style.cssText = `
        position: fixed;
        bottom: 16px;
        right: 16px;
        z-index: 99999;
        font-family: monospace;
        font-size: 12px;
    `;

    const style = document.createElement('style');
    style.textContent = `
        #dev-toolbar-toggle {
            background: #1a6b1a;
            color: #fff;
            border: 2px solid #2d9b2d;
            padding: 6px 12px;
            font-weight: 700;
            font-size: 11px;
            letter-spacing: 1px;
            cursor: pointer;
            font-family: monospace;
            border-radius: 4px;
        }
        #dev-toolbar-toggle:hover { background: #2d9b2d; }
        #dev-toolbar-panel {
            background: #1a1a2e;
            border: 2px solid #2d9b2d;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 8px;
            min-width: 220px;
            color: #e0e0e0;
        }
        .dev-toolbar-section {
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #333;
        }
        .dev-toolbar-section:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .dev-toolbar-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #888;
            margin-bottom: 4px;
        }
        .dev-toolbar-value {
            font-size: 16px;
            font-weight: 700;
            color: #2d9b2d;
        }
        .dev-toolbar-row {
            display: flex;
            gap: 6px;
            align-items: center;
        }
        .dev-btn {
            background: #2d9b2d;
            color: #fff;
            border: none;
            padding: 6px 12px;
            cursor: pointer;
            font-family: monospace;
            font-size: 11px;
            font-weight: 600;
            border-radius: 4px;
            width: 100%;
        }
        .dev-btn:hover { background: #3db83d; }
        .dev-btn:disabled { background: #555; cursor: not-allowed; }
        .dev-btn-election { background: #b8860b; }
        .dev-btn-election:hover { background: #daa520; }
        .dev-btn-danger { background: #8B0000; }
        .dev-btn-danger:hover { background: #cc3300; }
        .dev-input {
            background: #111;
            color: #fff;
            border: 1px solid #444;
            padding: 4px 6px;
            font-family: monospace;
            font-size: 12px;
            width: 50px;
            border-radius: 4px;
            text-align: center;
        }
        .dev-select {
            background: #111;
            color: #fff;
            border: 1px solid #444;
            padding: 4px 6px;
            font-family: monospace;
            font-size: 11px;
            width: 100%;
            border-radius: 4px;
        }
        .dev-toolbar-status {
            font-size: 10px;
            color: #888;
            margin-top: 6px;
            min-height: 14px;
        }
    `;
    document.head.appendChild(style);
}

function toggleToolbar() {
    toolbarExpanded = !toolbarExpanded;
    const panel = document.getElementById('dev-toolbar-panel');
    panel.style.display = toolbarExpanded ? 'block' : 'none';
}

function setStatus(msg) {
    const el = document.getElementById('dev-toolbar-status');
    if (el) el.textContent = msg;
}

function setButtonsDisabled(disabled) {
    const btns = document.querySelectorAll('#dev-toolbar-panel button, #dev-toolbar-panel select, #dev-toolbar-panel input');
    btns.forEach(b => b.disabled = disabled);
}

async function refreshToolbarState() {
    // Load current tick
    const { data: shard } = await _supabase
        .from('shard')
        .select('current_tick')
        .limit(1)
        .maybeSingle();
    const tickEl = document.getElementById('dev-current-tick');
    if (tickEl && shard) tickEl.textContent = shard.current_tick;

    // Load nations for dropdown
    const { data: nations } = await _supabase
        .from('nations')
        .select('id, name')
        .order('name');

    const select = document.getElementById('dev-nation-select');
    if (select && nations) {
        // Get current nation override from URL
        const params = new URLSearchParams(window.location.search);
        const currentNationId = params.get('nation_id') || '';

        select.innerHTML = '<option value="">-- Select Nation --</option>' +
            nations.map(n =>
                `<option value="${n.id}" ${n.id === currentNationId ? 'selected' : ''}>${n.name}</option>`
            ).join('');
    }
}

async function advanceTicks(count) {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        setStatus('Missing VITE_WORK_SERVICE_ROLE_KEY in .env.work');
        return;
    }

    setButtonsDisabled(true);
    const url = SUPABASE_URL + '/functions/v1/advance-tick';

    for (let i = 0; i < count; i++) {
        setStatus(`Advancing tick ${i + 1} of ${count}...`);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) {
                setStatus(`Tick ${i + 1} failed: ${res.status} ${res.statusText}`);
                setButtonsDisabled(false);
                return;
            }
        } catch (err) {
            setStatus(`Tick ${i + 1} error: ${err.message}`);
            setButtonsDisabled(false);
            return;
        }
    }

    setStatus(`${count} tick(s) advanced. Reloading...`);
    setTimeout(() => location.reload(), 500);
}

async function advanceNTicks() {
    const input = document.getElementById('dev-tick-count');
    const n = parseInt(input?.value, 10) || 1;
    await advanceTicks(Math.min(n, 100));
}

async function runElection() {
    // Get nation ID from dropdown or URL param
    const select = document.getElementById('dev-nation-select');
    const nationId = select?.value || new URLSearchParams(window.location.search).get('nation_id');
    if (!nationId) {
        setStatus('Select a nation first');
        return;
    }

    if (!confirm('Run a full election for this nation? This will update seats, dissolve government, etc.')) return;

    setButtonsDisabled(true);
    setStatus('Running election...');

    try {
        const { data: nation, error: nationErr } = await _supabase
            .from('nations')
            .select('*')
            .eq('id', nationId)
            .single();
        if (nationErr || !nation) {
            setStatus('Failed to load nation: ' + (nationErr?.message || 'not found'));
            setButtonsDisabled(false);
            return;
        }

        const result = await runManualElectionByGovernmentType(_supabase, nation);
        const seatSummary = (result.seatResults || [])
            .sort((a, b) => b.seats - a.seats)
            .slice(0, 3)
            .map(r => `${r.party_name}: ${r.seats}`)
            .join(', ');
        setStatus(`Election done! ${seatSummary || result.electionType}`);
        setTimeout(() => location.reload(), 1500);
    } catch (err) {
        setStatus('Election error: ' + err.message);
        setButtonsDisabled(false);
    }
}

async function resetToSeed() {
    if (!confirm('Reset Work DB to seed state? This will delete all game data.')) return;

    setButtonsDisabled(true);
    setStatus('Resetting tables...');

    try {
        // Step 1: Clear all game state using existing RPC
        const { error: resetErr } = await _supabase.rpc('admin_reset_tables');
        if (resetErr) {
            setStatus('Reset failed: ' + resetErr.message);
            setButtonsDisabled(false);
            return;
        }

        // Step 2: Re-seed with test data
        setStatus('Seeding test data...');
        const { error: seedErr } = await _supabase.rpc('seed_work_data');
        if (seedErr) {
            setStatus('Seed failed: ' + seedErr.message);
            setButtonsDisabled(false);
            return;
        }

        setStatus('Reset complete. Reloading...');
        setTimeout(() => location.reload(), 500);
    } catch (err) {
        setStatus('Reset error: ' + err.message);
        setButtonsDisabled(false);
    }
}

function switchNation() {
    const select = document.getElementById('dev-nation-select');
    const nationId = select?.value;
    if (!nationId) return;

    // Set URL param to switch nation context (uses same admin override mechanism)
    const url = new URL(window.location.href);
    url.searchParams.set('nation_id', nationId);
    // Remove faction_id so loadGameState picks the first faction for this nation
    url.searchParams.delete('faction_id');
    window.location.href = url.toString();
}
