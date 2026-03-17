/**
 * civic.js — CIVIC Public Discourse Network
 * Core logic for the social feed on the Nationhood Events tab.
 *
 * Pull model: reads from event_log + campaign_actions, transforms
 * into styled CIVIC posts. Player posts persist in civic_posts table.
 */

import { CIVIC_HANDLES } from './civic-handles.js';
import {
    CIVIC_TEMPLATES, CIVIC_TAG_MAP, CIVIC_EVENT_MAP, CIVIC_ACTION_MAP,
    extractEventVars, extractActionVars,
} from './civic-templates.js';
import { tickToDate, escapeHtml } from './utils.js';

// ═══════════════════════════════════════════════════════════
// TAG COLORS — maps tag key to CSS variable
// ═══════════════════════════════════════════════════════════

const TAG_COLORS = {
    ELECTION:  'var(--tag-election)',
    COALITION: 'var(--tag-coalition)',
    CRISIS:    'var(--tag-crisis)',
    COUP:      'var(--tag-coup)',
    BILL:      'var(--tag-bill)',
    CABINET:   'var(--tag-cabinet)',
    DIPLOMACY: 'var(--tag-diplomacy)',
    FACTION:   'var(--tag-faction)',
    PARTY:     'var(--tag-party)',
    ECONOMY:   'var(--tag-economy)',
};

// SVG icons for action buttons
const ICON_COMMENT = '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
const ICON_HEART   = '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
const ICON_SHARE   = '<svg viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>';

// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════

let _supabase = null;
let _nationId = null;
let _factionId = null;
let _currentTick = 0;
let _allPosts = [];
let _activeFilter = null;
let _searchQuery = '';
let _playerLikes = {};   // postId -> bool (in-memory for system posts)
let _playerShares = {};  // postId -> bool
let _openThreads = {};   // postId -> bool
let _replyTexts = {};    // postId -> string
let _factionAbbr = '';   // faction abbreviation for compose avatar
let _visibleCount = 30;  // pagination: how many posts to show
let _realtimeChannel = null;

const POSTS_PER_PAGE = 30;

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

/** Seeded PRNG from a string (for deterministic handle assignment) */
function seededIndex(seed, max) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
        h = ((h << 5) - h) + seed.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h) % max;
}

/** Fisher-Yates shuffle copy, pick n items */
function pickNoReplace(arr, n) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, Math.min(n, a.length));
}

/** Fill {var} placeholders in template text */
function fillTemplate(text, vars) {
    return text.replace(/\{(\w+)\}/g, (_, key) =>
        vars[key] !== undefined && vars[key] !== null && vars[key] !== ''
            ? vars[key] : `{${key}}`
    );
}

/** Render hashtags as clickable buttons (XSS-safe, accessible) */
function renderHashtags(rawText) {
    const safe = escapeHtml(rawText);
    return safe.replace(/(^|\s)#(\w+)/g,
        (_, space, tag) =>
            `${space}<button type="button" class="hashtag" data-tag="${escapeHtml(tag)}" aria-label="Filter by #${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`
    );
}

/** Short date from tick — reuses existing tickToDate but abbreviated */
function shortDate(tick) {
    const full = tickToDate(tick);
    if (!full || full === '\u2014') return full;
    // tickToDate returns "March, 2031" — abbreviate to "Mar 2031"
    const parts = full.split(',');
    if (parts.length === 2) {
        return parts[0].trim().slice(0, 3) + ' ' + parts[1].trim();
    }
    return full;
}

// ═══════════════════════════════════════════════════════════
// DATA LOADING & TRANSFORMATION
// ═══════════════════════════════════════════════════════════

/**
 * Initialize CIVIC feed. Called when the Events tab is activated.
 */
let _nationName = '';
export async function initCivic(supabase, nationId, factionId, currentTick, nationName, factionAbbr) {
    _supabase = supabase;
    _nationId = nationId;
    _factionId = factionId;
    _currentTick = currentTick;
    _visibleCount = POSTS_PER_PAGE;
    if (!nationName) console.warn('initCivic: nationName is empty — hashtags will show blank');
    _nationName = nationName || '';
    _factionAbbr = factionAbbr || '??';

    const root = document.getElementById('civic-root');
    if (!root) return;
    root.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <div>Loading CIVIC...</div>
        </div>`;

    try {
        // Fetch all data sources in parallel
        const [eventRes, actionRes, playerRes] = await Promise.all([
            supabase.from('event_log')
                .select('*, nations(name)')
                .order('fired_at_tick', { ascending: false })
                .limit(200),
            supabase.from('campaign_actions')
                .select('*, factions(faction_name, abbreviation, party_color), nations(name)')
                .order('tick_performed', { ascending: false })
                .limit(120),
            supabase.from('civic_posts')
                .select('*, civic_comments(*), nations(name)')
                .order('created_at', { ascending: false })
                .limit(150),
        ]);

        // Check if ALL queries failed
        const allFailed = eventRes.error && actionRes.error && playerRes.error;
        if (allFailed) {
            console.error('CIVIC: all data queries failed', eventRes.error, actionRes.error, playerRes.error);
            root.innerHTML = `
                <div class="civ-error">
                    <div class="civ-error-msg">Failed to load CIVIC feed.</div>
                    <button class="civ-retry-btn" id="civ-retry-btn">Retry</button>
                </div>`;
            document.getElementById('civ-retry-btn')?.addEventListener('click', () => {
                initCivic(supabase, nationId, factionId, currentTick, nationName, factionAbbr);
            });
            return;
        }

        // Log individual query errors but continue with available data
        if (eventRes.error) console.error('CIVIC event_log query error:', eventRes.error);
        if (actionRes.error) console.error('CIVIC campaign_actions query error:', actionRes.error);
        if (playerRes.error) console.error('CIVIC civic_posts query error:', playerRes.error);

        // Transform system events into CIVIC posts
        const eventPosts = transformEventLog(eventRes.data || [], _nationName);
        const actionPosts = transformCampaignActions(actionRes.data || [], _nationName);
        const playerPosts = transformPlayerPosts(playerRes.data || []);

        // Merge all posts, sort by tick desc
        _allPosts = [...eventPosts, ...actionPosts, ...playerPosts]
            .sort((a, b) => b.tick - a.tick || b.sortOrder - a.sortOrder);

        // Mark civic as seen
        localStorage.setItem('civic_last_seen_tick_' + nationId, String(currentTick));

        renderAll();
        subscribeRealtime();
    } catch (err) {
        console.error('CIVIC init error:', err);
        root.innerHTML = `
            <div class="civ-error">
                <div class="civ-error-msg">Failed to load CIVIC feed.</div>
                <button class="civ-retry-btn" id="civ-retry-btn">Retry</button>
            </div>`;
        document.getElementById('civ-retry-btn')?.addEventListener('click', () => {
            initCivic(supabase, nationId, factionId, currentTick, nationName, factionAbbr);
        });
    }
}

/** Subscribe to realtime updates for civic_posts */
function subscribeRealtime() {
    // Clean up previous subscription
    if (_realtimeChannel) {
        _supabase.removeChannel(_realtimeChannel);
        _realtimeChannel = null;
    }

    _realtimeChannel = _supabase
        .channel('civic_realtime_all')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'civic_posts',
        }, (payload) => {
            const row = payload.new;
            // Skip if we already have this post (e.g. our own)
            if (_allPosts.some(p => p.dbId === row.id)) return;

            const post = {
                id: 'player_' + row.id,
                type: 'user',
                name: row.display_name,
                initials: row.initials,
                handle: row.handle_key,
                body: row.body,
                tick: row.game_tick || 0,
                date: shortDate(row.game_tick),
                eventTag: null,
                templateKey: null,
                likes: row.likes || 0,
                shares: row.shares || 0,
                likedByPlayer: false,
                sharedByPlayer: false,
                _rawLikedBy: row.liked_by || [],
                _rawSharedBy: row.shared_by || [],
                comments: [],
                sortOrder: 0,
                isPlayer: true,
                dbId: row.id,
            };
            _allPosts.unshift(post);
            renderFeed();
            renderTrending();
            renderMobileTrending();
        })
        .subscribe();
}

/** Transform event_log rows into CIVIC post objects */
function transformEventLog(rows, nationName) {
    const posts = [];
    for (const row of rows) {
        const triggerKey = detectTriggerKey(row);
        const templateKey = CIVIC_EVENT_MAP[triggerKey];
        if (!templateKey) continue;

        const templates = CIVIC_TEMPLATES[templateKey];
        if (!templates?.length) continue;

        const vars = extractEventVars(templateKey, row);
        vars.nation = row.nations?.name || nationName;
        // Pick 2 templates deterministically based on row ID
        const idx1 = seededIndex(row.id || String(row.fired_at_tick), templates.length);
        const idx2 = (idx1 + 1 + seededIndex((row.id || '') + '_2', Math.max(templates.length - 1, 1))) % templates.length;
        const picked = [templates[idx1]];
        if (idx2 !== idx1) picked.push(templates[idx2]);

        for (let i = 0; i < picked.length; i++) {
            const tmpl = picked[i];
            const body = fillTemplate(tmpl.text, vars);
            if (/\{\w+\}/.test(body)) continue;  // skip if variables unfilled

            const handleIdx = seededIndex((row.id || '') + '_h' + i, CIVIC_HANDLES.length);
            const handle = CIVIC_HANDLES[handleIdx];
            const tag = CIVIC_TAG_MAP[templateKey] || null;

            posts.push({
                id: 'sys_evt_' + (row.id || row.fired_at_tick) + '_' + i,
                type: 'system',
                name: handle.name,
                initials: handle.initials,
                handle: handle.handle,
                body,
                tick: row.fired_at_tick || 0,
                date: shortDate(row.fired_at_tick),
                eventTag: tag,
                templateKey,
                likes: seededIndex((row.id || '') + '_l', 37) + 3,
                shares: seededIndex((row.id || '') + '_s', 15),
                likedByPlayer: false,
                sharedByPlayer: false,
                comments: [],
                sortOrder: i,
                isPlayer: false,
                dbId: null,
            });
        }
    }
    return posts;
}

/** Detect trigger key from event_log row (may be stored in various places) */
function detectTriggerKey(row) {
    // Check description_chosen or event_name for patterns
    const name = (row.event_name || '').toLowerCase();

    // Direct trigger keys stored in the event
    if (row.trigger_key) return row.trigger_key;

    // Pattern matching on event_name
    if (name.includes('bill passed') || name.includes('enacted') || name.includes('signed into law'))
        return 'bill_passed';
    if (name.includes('bill failed') || name.includes('defeated') || name.includes('vetoed'))
        return 'bill_failed';
    if (name.includes('quorum'))
        return 'quorum_failed';
    if (name.includes('presidential election') || name.includes('president elected') || name.includes('inaugurated'))
        return 'presidential_election';
    if (name.includes('snap election'))
        return 'formation_snap_election';
    if (name.includes('minority government') || name.includes('emergency government'))
        return 'emergency_minority_government';
    if (name.includes('prime minister') || name.includes('pm appointed'))
        return 'pm_appointed';
    if (name.includes('trade') && name.includes('expired'))
        return 'trade_agreement_expired';
    if (name.includes('aid') && name.includes('terminated'))
        return 'aid_terminated';
    if (name.includes('aid') && name.includes('suspended'))
        return 'aid_suspended';
    if (name.includes('aid') && name.includes('resumed'))
        return 'aid_resumed';
    if (name.startsWith('crisis:') || name.includes('crisis declared') || name.includes('crisis erupted'))
        return 'crisis_started';
    if (name.startsWith('crisis_resolved') || name.includes('crisis resolved') || name.includes('crisis ended'))
        return 'crisis_resolved';
    if (name.includes('ratified') && name.includes('initiative'))
        return 'major_initiative_ratified';
    if (name.includes('ratification failed'))
        return 'major_initiative_ratification_failed';

    // Parliamentary / general elections
    if (name.includes('parliamentary election') || name.includes('election results') || name.includes('general election'))
        return 'parliamentary_election';

    // Ministers
    if (name.includes('minister appointed') || name.includes('cabinet appointed'))
        return 'minister_appointed';
    if (name.includes('minister resigned') || name.includes('minister removed'))
        return 'minister_resigned';
    if (name.includes('nomination rejected'))
        return 'minister_nomination_rejected';

    // Bills
    if (name.includes('bill proposed') || name.includes('bill introduced'))
        return 'bill_proposed';
    if (name.includes('bill amended') || name.includes('amendment'))
        return 'bill_amended';
    if (name.includes('filibuster'))
        return 'filibuster_called';

    // Diplomacy
    if (name.includes('state visit') && name.includes('proposed'))
        return 'state_visit_proposed';
    if (name.includes('state visit') && (name.includes('accepted') || name.includes('confirmed')))
        return 'state_visit_accepted';
    if (name.includes('state visit') && name.includes('rejected'))
        return 'state_visit_rejected';
    if (name.includes('state visit'))
        return 'state_visit_happened';
    if (name.includes('trade') && name.includes('proposed'))
        return 'trade_agreement_proposed';
    if (name.includes('trade') && name.includes('accepted'))
        return 'trade_agreement_accepted';
    if (name.includes('trade') && name.includes('rejected'))
        return 'trade_agreement_rejected';

    // International organizations
    if (name.includes('joins') && (name.includes('org') || name.includes('organization')))
        return 'nation_joins_org';
    if (name.includes('leaves') && (name.includes('org') || name.includes('organization')))
        return 'nation_leaves_org';

    // Executive orders
    if (name.includes('executive order') && name.includes('issued'))
        return 'executive_order_issued';
    if (name.includes('executive order') && name.includes('expired'))
        return 'executive_order_expired';

    // Parties
    if (name.includes('party founded') || name.includes('new party'))
        return 'party_founded';
    if (name.includes('endorsement') || name.includes('endorses'))
        return 'presidential_endorsement';

    // Coups
    if (name.includes('coup') && !name.includes('success') && !name.includes('fail'))
        return 'coup_attempted';

    return name.replace(/[^a-z_]/g, '_').replace(/_+/g, '_').slice(0, 40);
}

/** Transform campaign_actions rows into CIVIC post objects */
function transformCampaignActions(rows, nationName) {
    const posts = [];
    for (const row of rows) {
        const templateKey = CIVIC_ACTION_MAP[row.action_type];
        if (!templateKey) continue;

        const templates = CIVIC_TEMPLATES[templateKey];
        if (!templates?.length) continue;

        const vars = extractActionVars(templateKey, row);
        vars.nation = row.nations?.name || nationName;
        // Pick 1 template for campaign actions (less noisy than events)
        const idx = seededIndex(row.id || String(row.tick_performed) + row.action_type, templates.length);
        const tmpl = templates[idx];
        const body = fillTemplate(tmpl.text, vars);
        if (/\{\w+\}/.test(body)) continue;

        const handleIdx = seededIndex((row.id || '') + '_ah', CIVIC_HANDLES.length);
        const handle = CIVIC_HANDLES[handleIdx];
        const tag = CIVIC_TAG_MAP[templateKey] || null;

        posts.push({
            id: 'sys_act_' + (row.id || row.tick_performed + '_' + row.action_type),
            type: 'system',
            name: handle.name,
            initials: handle.initials,
            handle: handle.handle,
            body,
            tick: row.tick_performed || 0,
            date: shortDate(row.tick_performed),
            eventTag: tag,
            templateKey,
            likes: seededIndex((row.id || '') + '_al', 25) + 1,
            shares: seededIndex((row.id || '') + '_as', 10),
            likedByPlayer: false,
            sharedByPlayer: false,
            comments: [],
            sortOrder: 0,
            isPlayer: false,
            dbId: null,
        });
    }
    return posts;
}

/** Transform civic_posts DB rows into CIVIC post objects */
function transformPlayerPosts(rows) {
    return (rows || []).map(row => ({
        id: 'player_' + row.id,
        type: 'user',
        name: row.display_name,
        initials: row.initials,
        handle: row.handle_key,
        body: row.body,
        tick: row.game_tick || 0,
        date: shortDate(row.game_tick),
        eventTag: null,
        templateKey: null,
        likes: row.likes || 0,
        shares: row.shares || 0,
        likedByPlayer: (row.liked_by || []).includes(_factionId),
        sharedByPlayer: (row.shared_by || []).includes(_factionId),
        _rawLikedBy: row.liked_by || [],
        _rawSharedBy: row.shared_by || [],
        comments: (row.civic_comments || []).map(c => ({
            id: c.id,
            postId: row.id,
            name: c.display_name,
            initials: c.initials,
            handle: c.handle_key,
            body: c.body,
            date: shortDate(c.game_tick),
        })),
        sortOrder: 0,
        isPlayer: true,
        dbId: row.id,
    }));
}

// ═══════════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════════

function renderAll() {
    const root = document.getElementById('civic-root');
    if (!root) return;

    root.innerHTML = `
        <div class="civ-page-header">
            <div class="civ-page-title">CIVIC</div>
            <div class="civ-page-subtitle">Public Discourse Network &mdash; All Nations</div>
        </div>
        <div class="civ-layout">
            <div class="civ-sidebar" role="navigation" aria-label="CIVIC navigation">
                <div class="civ-header">CIVIC</div>
                <div class="civ-nav-item active">Home Feed</div>
                <div class="civ-nav-item">Discover</div>
                <div class="civ-nav-item">Notifications</div>
                <div class="civ-nav-item">Messages</div>
            </div>
            <div class="civ-main">
                <div class="civ-mobile-trending" id="civ-mobile-trending"></div>
                <div class="civ-compose" id="civ-compose"></div>
                <div class="civ-filter-bar" id="civ-filter-bar" style="display:none"></div>
                <div class="civ-feed-area">
                    <div class="civ-feed" id="civ-feed" role="feed" aria-label="CIVIC posts"></div>
                    <div class="civ-trending" id="civ-trending"></div>
                </div>
            </div>
        </div>
    `;

    renderCompose();
    renderFilterBar();
    renderFeed();
    renderTrending();
    renderMobileTrending();
}

function renderCompose() {
    const el = document.getElementById('civ-compose');
    if (!el) return;

    el.innerHTML = `
        <div class="civ-compose-row">
            <div class="civ-compose-avatar" title="Your faction">${escapeHtml(_factionAbbr)}</div>
            <div class="civ-compose-body">
                <label for="civ-textarea" class="sr-only">Write a post</label>
                <textarea id="civ-textarea" maxlength="280" placeholder="What is happening in the republic?" aria-label="Write a post" aria-describedby="civ-char-count"></textarea>
                <div class="civ-compose-footer">
                    <span class="civ-char-count" id="civ-char-count" aria-live="polite">280</span>
                    <button class="civ-post-btn" id="civ-post-btn" disabled aria-label="Post to CIVIC">POST</button>
                </div>
                <div class="civ-posted-as" id="civ-posted-as" aria-live="polite"></div>
            </div>
        </div>
    `;

    const textarea = document.getElementById('civ-textarea');
    const counter = document.getElementById('civ-char-count');
    const btn = document.getElementById('civ-post-btn');
    if (!textarea || !counter || !btn) return;

    textarea.addEventListener('input', () => {
        const len = textarea.value.length;
        const remaining = 280 - len;
        counter.textContent = remaining;
        counter.classList.toggle('warn', remaining < 30);
        btn.disabled = textarea.value.trim().length === 0;
    });

    btn.addEventListener('click', async () => {
        const body = textarea.value.trim();
        if (!body) return;
        btn.disabled = true;
        btn.textContent = 'POSTING...';
        const ok = await submitPost(body);
        if (ok) {
            textarea.value = '';
            counter.textContent = '280';
            counter.classList.remove('warn');
        }
        btn.textContent = 'POST';
        btn.disabled = !textarea.value.trim();
    });
}

async function submitPost(body) {
    const handle = pickNoReplace(CIVIC_HANDLES, 1)[0];

    const { error } = await _supabase.from('civic_posts').insert({
        nation_id: _nationId,
        faction_id: _factionId,
        handle_key: handle.handle,
        display_name: handle.name,
        initials: handle.initials,
        body,
        game_tick: _currentTick,
    });

    const postedAs = document.getElementById('civ-posted-as');
    if (error) {
        console.error('CIVIC post error:', error);
        if (postedAs) {
            postedAs.textContent = 'Post failed. Try again.';
            postedAs.style.color = 'var(--civ-danger)';
            setTimeout(() => { postedAs.textContent = ''; postedAs.style.color = ''; }, 4000);
        }
        return false;
    }

    // Show posted-as message
    if (postedAs) {
        postedAs.textContent = `Posted as ${handle.handle}`;
        postedAs.style.color = '';
        setTimeout(() => { postedAs.textContent = ''; }, 4000);
    }

    // Add to local feed immediately
    _allPosts.unshift({
        id: 'player_temp_' + Date.now(),
        type: 'user',
        name: handle.name,
        initials: handle.initials,
        handle: handle.handle,
        body,
        tick: _currentTick,
        date: shortDate(_currentTick),
        eventTag: null,
        templateKey: null,
        likes: 0,
        shares: 0,
        likedByPlayer: false,
        sharedByPlayer: false,
        comments: [],
        sortOrder: 0,
        isPlayer: true,
        dbId: null,
    });

    renderFeed();
    renderTrending();
    renderMobileTrending();
    return true;
}

function renderFilterBar() {
    const bar = document.getElementById('civ-filter-bar');
    if (!bar) return;

    if (!_activeFilter && !_searchQuery) {
        bar.style.display = 'none';
        return;
    }

    bar.style.display = 'flex';
    let html = '<span class="civ-filter-label">FILTER:</span>';
    if (_activeFilter) {
        html += `<span class="civ-filter-tag">#${escapeHtml(_activeFilter)}</span>`;
    }
    if (_searchQuery) {
        html += `<span class="civ-filter-tag">"${escapeHtml(_searchQuery)}"</span>`;
    }
    html += '<span class="civ-filter-clear" id="civ-clear-filter">[X]</span>';
    bar.innerHTML = html;

    document.getElementById('civ-clear-filter')?.addEventListener('click', () => {
        _activeFilter = null;
        _searchQuery = '';
        renderFilterBar();
        renderFeed();
    });
}

function getFilteredPosts() {
    let posts = _allPosts;
    if (_activeFilter) {
        const tag = _activeFilter.toLowerCase();
        posts = posts.filter(p => p.body.toLowerCase().includes('#' + tag));
    }
    if (_searchQuery) {
        const q = _searchQuery.toLowerCase();
        posts = posts.filter(p =>
            p.body.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q) ||
            p.handle.toLowerCase().includes(q)
        );
    }
    return posts;
}

function renderFeed() {
    const feedEl = document.getElementById('civ-feed');
    if (!feedEl) return;

    const allFiltered = getFilteredPosts();

    if (allFiltered.length === 0) {
        feedEl.innerHTML = '<div class="civ-empty">No posts yet. Be the first to speak.</div>';
        return;
    }

    const visible = allFiltered.slice(0, _visibleCount);
    const hasMore = allFiltered.length > _visibleCount;

    let html = visible.map(post => renderPost(post)).join('');
    if (hasMore) {
        const remaining = allFiltered.length - _visibleCount;
        html += `<div class="civ-load-more">
            <button class="civ-load-more-btn" id="civ-load-more" aria-label="Load more posts">
                Load ${Math.min(remaining, POSTS_PER_PAGE)} more posts
            </button>
        </div>`;
    }

    feedEl.innerHTML = html;

    // Wire load-more button
    document.getElementById('civ-load-more')?.addEventListener('click', () => {
        _visibleCount += POSTS_PER_PAGE;
        renderFeed();
    });

    // Restore reply text from module state
    feedEl.querySelectorAll('.civ-post').forEach(el => {
        const id = el.dataset.postId;
        if (!id) return;
        if (_replyTexts[id]) {
            const ta = el.querySelector('.cmt-textarea');
            if (ta) ta.value = _replyTexts[id];
        }
        wirePostListeners(el, id);
    });
}

function renderPost(post) {
    const isSystem = post.type === 'system';
    const cls = isSystem ? 'civ-post system' : 'civ-post';

    const tagHtml = post.eventTag
        ? `<span class="civ-tag" style="background:${TAG_COLORS[post.eventTag] || 'var(--civ-accent-dim)'}">${escapeHtml(post.eventTag)}</span>`
        : '';

    const bodyHtml = renderHashtags(post.body);

    const liked = post.likedByPlayer || _playerLikes[post.id];
    const shared = post.sharedByPlayer || _playerShares[post.id];
    const likeCount = post.likes + ((_playerLikes[post.id] && !post.likedByPlayer) ? 1 : 0);
    const shareCount = post.shares + ((_playerShares[post.id] && !post.sharedByPlayer) ? 1 : 0);

    const commentsHtml = post.comments.length > 0
        ? post.comments.map(c => `
            <div class="civ-comment">
                <div class="civ-comment-header">
                    <span class="civ-comment-name">${escapeHtml(c.name)}</span>
                    <span class="civ-comment-handle">${escapeHtml(c.handle)}</span>
                    <span class="civ-comment-date">${escapeHtml(c.date)}</span>
                </div>
                <div class="civ-comment-body">${renderHashtags(c.body)}</div>
            </div>
        `).join('')
        : '<div class="civ-no-comments">NO COMMENTS YET</div>';

    // Only show reply compose for player posts (v1)
    const replyComposeHtml = post.isPlayer ? `
        <div class="civ-reply-compose">
            <textarea class="cmt-textarea" maxlength="280" placeholder="Reply..." aria-label="Reply to ${escapeHtml(post.handle)}"></textarea>
            <button type="button" class="civ-reply-btn civ-reply-submit" aria-label="Submit reply">REPLY</button>
        </div>
    ` : '';

    return `
        <article class="${cls}" data-post-id="${escapeHtml(post.id)}" aria-label="Post by ${escapeHtml(post.handle)}">
            <div class="civ-avatar">${escapeHtml(post.initials)}</div>
            <div class="civ-post-content">
                <div class="civ-post-header">
                    <span class="civ-post-name">${escapeHtml(post.name)}</span>
                    <span class="civ-post-handle">${escapeHtml(post.handle)}</span>
                    <span class="civ-post-date">${escapeHtml(post.date)}</span>
                    ${tagHtml}
                </div>
                <div class="civ-post-body">${bodyHtml}</div>
                <div class="civ-actions">
                    <button type="button" class="civ-action-btn civ-comment-btn" aria-label="Comments${post.comments.length ? ' (' + post.comments.length + ')' : ''}" aria-expanded="${!!_openThreads[post.id]}">
                        ${ICON_COMMENT}
                        <span>${post.comments.length || ''}</span>
                    </button>
                    <button type="button" class="civ-action-btn civ-like-btn ${liked ? 'active' : ''}" aria-label="${liked ? 'Unlike' : 'Like'} post by ${escapeHtml(post.handle)}${likeCount ? ' (' + likeCount + ')' : ''}" aria-pressed="${!!liked}">
                        ${ICON_HEART}
                        <span>${likeCount || ''}</span>
                    </button>
                    <button type="button" class="civ-action-btn civ-share-btn ${shared ? 'active' : ''}" aria-label="${shared ? 'Unshare' : 'Share'} post by ${escapeHtml(post.handle)}${shareCount ? ' (' + shareCount + ')' : ''}" aria-pressed="${!!shared}">
                        ${ICON_SHARE}
                        <span>${shareCount || ''}</span>
                    </button>
                </div>
                <div class="civ-comments-section ${_openThreads[post.id] ? 'open' : ''}">
                    ${commentsHtml}
                    ${replyComposeHtml}
                </div>
            </div>
        </article>
    `;
}

// ═══════════════════════════════════════════════════════════
// ACTIONS: Like, Share, Comment
// ═══════════════════════════════════════════════════════════

let _likeLock = {};
let _shareLock = {};

function toggleLike(postId) {
    if (_likeLock[postId]) return;
    _likeLock[postId] = true;
    setTimeout(() => { _likeLock[postId] = false; }, 500);

    const post = _allPosts.find(p => p.id === postId);
    if (!post) return;

    if (post.isPlayer && post.dbId) {
        // Persist to Supabase via direct update on liked_by array + likes counter
        const nowLiked = !post.likedByPlayer;
        post.likedByPlayer = nowLiked;
        post.likes += nowLiked ? 1 : -1;

        const newLikedBy = nowLiked
            ? [...new Set([...(post._rawLikedBy || []), _factionId])]
            : (post._rawLikedBy || []).filter(id => id !== _factionId);
        _supabase.from('civic_posts')
            .update({ liked_by: newLikedBy, likes: Math.max(0, post.likes) })
            .eq('id', post.dbId)
            .then(({ error }) => { if (error) console.error('CIVIC like update error:', error); });
        post._rawLikedBy = newLikedBy;
    } else {
        // In-memory toggle for system posts
        _playerLikes[postId] = !_playerLikes[postId];
    }

    // Re-render just the affected post
    const el = document.querySelector(`[data-post-id="${postId}"]`);
    if (el) {
        el.outerHTML = renderPost(post);
        // Re-wire the replaced element
        rewirePost(postId);
    }
}

function toggleShare(postId) {
    if (_shareLock[postId]) return;
    _shareLock[postId] = true;
    setTimeout(() => { _shareLock[postId] = false; }, 500);

    const post = _allPosts.find(p => p.id === postId);
    if (!post) return;

    if (post.isPlayer && post.dbId) {
        const nowShared = !post.sharedByPlayer;
        post.sharedByPlayer = nowShared;
        post.shares += nowShared ? 1 : -1;

        const newSharedBy = nowShared
            ? [...new Set([...(post._rawSharedBy || []), _factionId])]
            : (post._rawSharedBy || []).filter(id => id !== _factionId);
        _supabase.from('civic_posts')
            .update({ shared_by: newSharedBy, shares: Math.max(0, post.shares) })
            .eq('id', post.dbId)
            .then(({ error }) => { if (error) console.error('CIVIC share update error:', error); });
        post._rawSharedBy = newSharedBy;
    } else {
        _playerShares[postId] = !_playerShares[postId];
    }

    const el = document.querySelector(`[data-post-id="${postId}"]`);
    if (el) {
        el.outerHTML = renderPost(post);
        rewirePost(postId);
    }
}

/** Wire all event listeners on a single post element */
function wirePostListeners(el, postId) {
    // Post row click toggles thread
    el.addEventListener('click', () => {
        _openThreads[postId] = !_openThreads[postId];
        const section = el.querySelector('.civ-comments-section');
        if (section) section.classList.toggle('open');
    });

    // Like button — MUST stopPropagation
    el.querySelector('.civ-like-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLike(postId);
    });

    // Share button — MUST stopPropagation
    el.querySelector('.civ-share-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleShare(postId);
    });

    // Comment button — MUST stopPropagation
    el.querySelector('.civ-comment-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        _openThreads[postId] = !_openThreads[postId];
        const section = el.querySelector('.civ-comments-section');
        if (section) section.classList.toggle('open');
    });

    // Reply button
    el.querySelector('.civ-reply-submit')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const replyBtn = e.currentTarget;
        const ta = el.querySelector('.cmt-textarea');
        if (ta && ta.value.trim()) {
            replyBtn.disabled = true;
            submitComment(postId, ta.value.trim()).finally(() => { replyBtn.disabled = false; });
            ta.value = '';
            _replyTexts[postId] = '';
        }
    });

    // Track reply text changes
    el.querySelector('.cmt-textarea')?.addEventListener('input', (e) => {
        e.stopPropagation();
        _replyTexts[postId] = e.target.value;
    });

    // Prevent textarea clicks from toggling thread
    el.querySelector('.cmt-textarea')?.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Wire hashtag clicks inside this post
    el.querySelectorAll('.hashtag').forEach(span => {
        span.addEventListener('click', (e) => {
            e.stopPropagation();
            const tag = span.dataset.tag;
            if (tag) filterByTag(tag);
        });
    });
}

/** Re-wire event listeners on a single post element after outerHTML replacement */
function rewirePost(postId) {
    const el = document.querySelector(`[data-post-id="${postId}"]`);
    if (!el) return;
    wirePostListeners(el, postId);
}

let _commentLock = {};
async function submitComment(postId, body) {
    if (_commentLock[postId]) return;
    const post = _allPosts.find(p => p.id === postId);
    if (!post || !post.isPlayer || !post.dbId) return;

    _commentLock[postId] = true;
    const handle = pickNoReplace(CIVIC_HANDLES, 1)[0];

    try {
        const { error } = await _supabase.from('civic_comments').insert({
            post_id: post.dbId,
            nation_id: _nationId,
            faction_id: _factionId,
            handle_key: handle.handle,
            display_name: handle.name,
            initials: handle.initials,
            body,
            game_tick: _currentTick,
        });

        if (error) {
            console.error('CIVIC comment error:', error);
            return;
        }

        // Add to local state
        post.comments.push({
            id: 'temp_' + Date.now(),
            postId: post.dbId,
            name: handle.name,
            initials: handle.initials,
            handle: handle.handle,
            body,
            date: shortDate(_currentTick),
        });

        // Keep thread open
        _openThreads[postId] = true;

        // Re-render post
        const el = document.querySelector(`[data-post-id="${postId}"]`);
        if (el) {
            el.outerHTML = renderPost(post);
            rewirePost(postId);
        }
    } finally {
        _commentLock[postId] = false;
    }
}

// ═══════════════════════════════════════════════════════════
// HASHTAG FILTERING
// ═══════════════════════════════════════════════════════════

function filterByTag(tag) {
    _activeFilter = tag;
    _searchQuery = '';
    renderFilterBar();
    renderFeed();
}

// ═══════════════════════════════════════════════════════════
// TRENDING SIDEBAR
// ═══════════════════════════════════════════════════════════

function renderTrending() {
    const el = document.getElementById('civ-trending');
    if (!el) return;

    const counts = {};
    _allPosts.forEach(p => {
        const matches = p.body.match(/#(\w+)/g) || [];
        matches.forEach(t => {
            const key = t.toLowerCase();
            counts[key] = (counts[key] || 0) + 1;
        });
    });

    const trending = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7);

    let html = '<div class="civ-trending-header">Trending</div>';

    if (trending.length === 0) {
        html += '<div class="civ-empty" style="padding:12px 0;text-align:left;">No trending tags yet.</div>';
    } else {
        html += trending.map(([tag, count]) => `
            <div class="civ-trending-item" data-trending-tag="${escapeHtml(tag.replace('#', ''))}">
                <div class="civ-trending-tag">${escapeHtml(tag)}</div>
                <div class="civ-trending-count">${count} posts</div>
            </div>
        `).join('');
    }

    // Search box
    html += `
        <div class="civ-search" style="padding:12px 0 0;border:none;">
            <input type="text" id="civ-search-input" placeholder="Search posts..." value="${escapeHtml(_searchQuery)}">
        </div>
    `;

    el.innerHTML = html;

    // Wire trending clicks
    el.querySelectorAll('.civ-trending-item').forEach(item => {
        item.addEventListener('click', () => {
            const tag = item.dataset.trendingTag;
            if (tag) filterByTag(tag);
        });
    });

    // Wire search
    const searchInput = document.getElementById('civ-search-input');
    let searchTimeout = null;
    searchInput?.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            _searchQuery = searchInput.value.trim();
            _activeFilter = null;
            renderFilterBar();
            renderFeed();
        }, 300);
    });
}

/** Render top-3 trending tags inline for mobile (shown when sidebar trending is hidden) */
function renderMobileTrending() {
    const el = document.getElementById('civ-mobile-trending');
    if (!el) return;

    const counts = {};
    _allPosts.forEach(p => {
        const matches = p.body.match(/#(\w+)/g) || [];
        matches.forEach(t => {
            const key = t.toLowerCase();
            counts[key] = (counts[key] || 0) + 1;
        });
    });

    const top3 = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    if (top3.length === 0) {
        el.innerHTML = '';
        return;
    }

    el.innerHTML = `
        <span class="civ-mobile-trending-label">Trending:</span>
        ${top3.map(([tag]) =>
            `<button type="button" class="civ-mobile-trending-tag" data-trending-tag="${escapeHtml(tag.replace('#', ''))}" aria-label="Filter by ${escapeHtml(tag)}">${escapeHtml(tag)}</button>`
        ).join('')}
    `;

    el.querySelectorAll('.civ-mobile-trending-tag').forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.dataset.trendingTag;
            if (tag) filterByTag(tag);
        });
    });
}
