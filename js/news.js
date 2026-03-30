// js/news.js — The Cruceran & The Continental newspaper pages

import { tickToDate } from './utils.js';
import { nudgeApproval } from './game/electorate.js';

// Module-level references set during init
let _supabase = null;
let _state = null;
let _articles = []; // cached for article reader lookup
let _categoryFilter = 'all'; // current nav filter
let _shardNationIds = null; // cached nation IDs in the same shard
let _articleReaderHandler = null; // stored ref to prevent listener accumulation
let _archiveBackContext = null; // navigation context for article reader back button
let _editingArticleId = null; // null = create mode, UUID string = edit mode
let _removeExistingImage = false; // flag: user wants to drop the current image on edit
let _isAutocracyNation = false; // detected during init for reward display
let _publication = 'cruceran'; // 'cruceran' or 'continental'
let _publicationSetByUser = false; // true when user manually switched via dropdown

// Nation-to-publication mapping (data-driven for future expansion)
const PUBLICATION_CONFIG = {
    cruceran: {
        key: 'cruceran',
        name: 'The Cruceran',
        tagline: 'Truth in the service of the people',
        nations: ['Avelia', 'Palvera', 'San Estrella', 'Montequilla', 'Melizea', 'Sangreza'],
        style: 'cruceran' // CSS class prefix
    },
    continental: {
        key: 'continental',
        name: 'The Continental',
        tagline: 'Where Ideas Converge',
        nations: ['Calveth'],
        style: 'continental'
    }
};

function getPublicationForNation(nationName) {
    for (const [key, cfg] of Object.entries(PUBLICATION_CONFIG)) {
        if (cfg.nations.some(n => n.toLowerCase() === (nationName || '').toLowerCase())) return key;
    }
    return 'cruceran'; // fallback
}

function canWriteToPublication(pubKey, nationName) {
    const cfg = PUBLICATION_CONFIG[pubKey];
    if (!cfg) return false;
    return cfg.nations.some(n => n.toLowerCase() === (nationName || '').toLowerCase());
}

// Season key for quarterly issue grouping
// Spring: Feb(1), Mar(2), Apr(3)  Summer: May(4), Jun(5), Jul(6)
// Fall: Aug(7), Sep(8), Oct(9)    Winter: Nov(10), Dec(11), Jan(0)
const _SEASON_NAMES = ['Winter', 'Spring', 'Spring', 'Spring', 'Summer', 'Summer', 'Summer', 'Fall', 'Fall', 'Fall', 'Winter', 'Winter'];
function _seasonKey(tick) {
    const month = tick % 12;
    const year = 2000 + Math.floor(tick / 12);
    const season = _SEASON_NAMES[month];
    const seasonYear = (month === 0) ? year - 1 : year;
    return `${season} ${seasonYear}`;
}

export async function initNewspaper(supabase, state) {
    _supabase = supabase;
    _state = state;
    _shardNationIds = null; // reset cache on reinit
    _categoryFilter = 'all'; // reset filter on reinit
    _archiveBackContext = null; // reset: article reader "Back" goes to front page

    // Detect autocracy for article reward display
    _isAutocracyNation = false;
    if (state.nation?.id) {
        const { data: admin } = await supabase
            .from('administrations')
            .select('government_type')
            .eq('nation_id', state.nation.id)
            .order('started_at_tick', { ascending: false })
            .limit(1).maybeSingle();
        if (admin?.government_type === 'autocracy') _isAutocracyNation = true;
    }

    const root = document.getElementById('newspaper-root');
    if (!root) return;

    // Set default publication on first load only — on re-init from the
    // publication switcher, _publication is already set to the user's choice.
    if (!_publicationSetByUser) {
        _publication = getPublicationForNation(state.nation?.name);
    }

    const gameDate = state.shard?.current_date || '[Month], [Year]';
    const canWrite = canWriteToPublication(_publication, state.nation?.name);

    // Publication switcher options
    const pubSwitcher = Object.entries(PUBLICATION_CONFIG).map(([key, cfg]) =>
        `<option value="${key}" ${key === _publication ? 'selected' : ''}>${cfg.name}</option>`
    ).join('');

    root.innerHTML = `<div class="newspaper-container nws-pub-${_publication}">

        <!-- TOP RIBBON -->
        <div class="nws-top-ribbon${_publication === 'continental' ? ' nws-top-ribbon--continental' : ''}">
            <div class="nws-top-ribbon-inner">
                <span>${gameDate}</span>
                <select class="nws-pub-switcher" id="nws-pub-switcher">${pubSwitcher}</select>
                ${canWrite ? '<button class="nws-write-btn" id="nws-write-article-btn">Write Article</button>' : '<span></span>'}
            </div>
        </div>

        ${_publication === 'continental' ? `
        <!-- CONTINENTAL MASTHEAD -->
        <div class="nws-continental-masthead">
            <div class="nws-continental-masthead-top">
                <span class="nws-continental-edition">Continental Edition</span>
            </div>
            <div class="nws-continental-masthead-main">
                <h1 class="nws-continental-title">The Continental</h1>
                <span class="nws-continental-subtitle">Independent Journalism for Meridia</span>
            </div>
        </div>` : `
        <!-- CRUCERAN MASTHEAD -->
        <div class="nws-masthead">
            <div class="nws-masthead-top">
                <div class="nws-masthead-meta">
                    Est. Year 1<br>
                    Continental Record
                </div>
                <h1>The Cruceran</h1>
                <div class="nws-masthead-meta nws-masthead-meta-right">
                    Free Press<br>
                    International Wire
                </div>
            </div>
            <hr class="nws-masthead-rule">
            <div class="nws-rule-ornament">&mdash; &#10022; &mdash;</div>
            <div class="nws-masthead-tagline">&ldquo;Truth in the service of the people&rdquo;</div>
        </div>`}

        <!-- NAV -->
        <nav class="nws-nav">
            <div class="nws-nav-inner">
                <div class="nws-nav-item active" data-category="all">Front Page</div>
                <div class="nws-nav-item" data-category="politics">Politics</div>
                <div class="nws-nav-item" data-category="economy">Economy</div>
                <div class="nws-nav-item" data-category="international">International</div>
                <div class="nws-nav-item" data-category="social">Social</div>
                <div class="nws-nav-item" data-category="entertainment">Entertainment</div>
                <div class="nws-nav-item" data-category="opinion">Opinion</div>
                <div class="nws-nav-item" data-category="sports">Sports</div>
                <div class="nws-nav-item nws-nav-archives" id="nws-nav-archives">Older Issues</div>
            </div>
        </nav>

        <!-- BREAKING TICKER -->
        <div class="nws-breaking-bar">
            <div class="nws-breaking-label">Breaking</div>
            <div class="nws-ticker-scroll">
                Markets steady as continental trade talks enter third round &nbsp;<span class="nws-ticker-sep">&#9670;</span>&nbsp;
                Weather advisory issued for eastern coastal regions &nbsp;<span class="nws-ticker-sep">&#9670;</span>&nbsp;
                International athletics federation announces host city for next games &nbsp;<span class="nws-ticker-sep">&#9670;</span>&nbsp;
                Central banking consortium releases quarterly stability report &nbsp;<span class="nws-ticker-sep">&#9670;</span>&nbsp;
                Continental rail expansion project clears environmental review &nbsp;<span class="nws-ticker-sep">&#9670;</span>&nbsp;
                Markets steady as continental trade talks enter third round &nbsp;<span class="nws-ticker-sep">&#9670;</span>&nbsp;
                Weather advisory issued for eastern coastal regions &nbsp;<span class="nws-ticker-sep">&#9670;</span>&nbsp;
                International athletics federation announces host city for next games &nbsp;<span class="nws-ticker-sep">&#9670;</span>&nbsp;
                Central banking consortium releases quarterly stability report &nbsp;<span class="nws-ticker-sep">&#9670;</span>&nbsp;
                Continental rail expansion project clears environmental review
            </div>
        </div>

        <!-- MAIN CONTENT -->
        <div class="nws-main-content" id="nws-main-content">

            <!-- LEAD SECTION (A1) -->
            <div class="nws-lead-section" id="nws-lead-section">
                <div class="nws-lead-main">
                    <span class="nws-section-tag nws-placeholder">[Category]</span>
                    <h2 class="nws-lead-headline nws-placeholder">[Lead Headline]</h2>
                    <p class="nws-lead-deck nws-placeholder">[Article summary will appear here. The longest article by character count is always promoted to the A1 lead position on the front page.]</p>
                    <div class="nws-byline">
                        <span class="nws-author nws-placeholder">[Author]</span>
                        <span class="nws-dot">&middot;</span>
                        <span class="nws-placeholder">[Date]</span>
                    </div>
                    <div class="nws-lead-body">
                        <p class="nws-placeholder">[Article body text will appear here when articles are submitted. Write an article using the button in the top right to get started.]</p>
                    </div>
                </div>
                <div class="nws-lead-sidebar">
                    <div class="nws-lead-image">
                        <div class="nws-img-placeholder">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <rect width="48" height="48" rx="4" fill="rgba(255,255,255,0.05)"/>
                                <circle cx="18" cy="20" r="6" fill="rgba(255,255,255,0.1)"/>
                                <path d="M6 38 L18 26 L26 34 L34 22 L42 38Z" fill="rgba(255,255,255,0.08)"/>
                            </svg>
                            <span style="font-family:'Inter',sans-serif;font-size:9px;color:rgba(255,255,255,0.2);letter-spacing:1px;text-transform:uppercase;">Photo</span>
                        </div>
                    </div>
                    <p class="nws-img-caption nws-placeholder">[Photo caption]</p>

                    <div class="nws-sidebar-story">
                        <span class="nws-section-tag nws-placeholder">[Category]</span>
                        <h3 class="nws-sidebar-headline nws-placeholder">[Sidebar Story Headline]</h3>
                        <p class="nws-sidebar-deck nws-placeholder">[Brief summary of the second-longest article.]</p>
                        <div class="nws-byline"><span class="nws-author nws-placeholder">[Author]</span><span class="nws-dot">&middot;</span><span class="nws-placeholder">[Date]</span></div>
                    </div>

                    <div class="nws-sidebar-story">
                        <span class="nws-section-tag nws-placeholder">[Category]</span>
                        <h3 class="nws-sidebar-headline nws-placeholder">[Sidebar Story Headline]</h3>
                        <p class="nws-sidebar-deck nws-placeholder">[Brief summary of another article.]</p>
                        <div class="nws-byline"><span class="nws-author nws-placeholder">[Author]</span><span class="nws-dot">&middot;</span><span class="nws-placeholder">[Date]</span></div>
                    </div>

                    <div class="nws-sidebar-story">
                        <span class="nws-section-tag nws-placeholder">[Category]</span>
                        <h3 class="nws-sidebar-headline nws-placeholder">[Sidebar Story Headline]</h3>
                        <p class="nws-sidebar-deck nws-placeholder">[Brief summary of another article.]</p>
                        <div class="nws-byline"><span class="nws-author nws-placeholder">[Author]</span><span class="nws-dot">&middot;</span><span class="nws-placeholder">[Date]</span></div>
                    </div>
                </div>
            </div>

            <!-- SECONDARY GRID -->
            <div class="nws-secondary-grid" id="nws-secondary-grid">
                <div class="nws-sec-story">
                    <div class="nws-sec-image">
                        <div class="nws-img-ph" style="background:linear-gradient(135deg,#1a2a1a,#0d1a0d);">Crisis</div>
                    </div>
                    <span class="nws-section-tag nws-placeholder">[Crisis]</span>
                    <h3 class="nws-sec-headline nws-placeholder">[Crisis Section Headline]</h3>
                    <p class="nws-sec-deck nws-placeholder">[Summary of a crisis-related article will appear here.]</p>
                    <div class="nws-byline"><span class="nws-author nws-placeholder">[Author]</span><span class="nws-dot">&middot;</span><span class="nws-placeholder">[Date]</span></div>
                </div>
                <div class="nws-sec-story">
                    <div class="nws-sec-image">
                        <div class="nws-img-ph" style="background:linear-gradient(135deg,#1a1a2a,#0d0d1a);">Election</div>
                    </div>
                    <span class="nws-section-tag nws-placeholder">[Elections]</span>
                    <h3 class="nws-sec-headline nws-placeholder">[Election Section Headline]</h3>
                    <p class="nws-sec-deck nws-placeholder">[Summary of an election-related article will appear here.]</p>
                    <div class="nws-byline"><span class="nws-author nws-placeholder">[Author]</span><span class="nws-dot">&middot;</span><span class="nws-placeholder">[Date]</span></div>
                </div>
                <div class="nws-sec-story">
                    <div class="nws-sec-image">
                        <div class="nws-img-ph" style="background:linear-gradient(135deg,#2a1a0a,#1a0d00);">Economy</div>
                    </div>
                    <span class="nws-section-tag nws-placeholder">[Economy]</span>
                    <h3 class="nws-sec-headline nws-placeholder">[Economy Section Headline]</h3>
                    <p class="nws-sec-deck nws-placeholder">[Summary of an economy-related article will appear here.]</p>
                    <div class="nws-byline"><span class="nws-author nws-placeholder">[Author]</span><span class="nws-dot">&middot;</span><span class="nws-placeholder">[Date]</span></div>
                </div>
            </div>

        </div>

        <!-- OPINION STRIP -->
        <div class="nws-opinion-strip">
            <div class="nws-opinion-inner">
                <div class="nws-opinion-label">&mdash; Opinion &amp; Commentary &mdash;</div>
                <div class="nws-opinion-grid">
                    <div class="nws-op-card">
                        <div class="nws-op-author nws-placeholder">[Columnist] &mdash; [Topic]</div>
                        <div class="nws-op-headline nws-placeholder">&ldquo;[Opinion headline will appear here.]&rdquo;</div>
                    </div>
                    <div class="nws-op-card">
                        <div class="nws-op-author nws-placeholder">[Columnist] &mdash; [Topic]</div>
                        <div class="nws-op-headline nws-placeholder">&ldquo;[Opinion headline will appear here.]&rdquo;</div>
                    </div>
                    <div class="nws-op-card">
                        <div class="nws-op-author nws-placeholder">[Columnist] &mdash; [Topic]</div>
                        <div class="nws-op-headline nws-placeholder">&ldquo;[Opinion headline will appear here.]&rdquo;</div>
                    </div>
                    <div class="nws-op-card">
                        <div class="nws-op-author nws-placeholder">[Columnist] &mdash; [Topic]</div>
                        <div class="nws-op-headline nws-placeholder">&ldquo;[Opinion headline will appear here.]&rdquo;</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- BOTTOM GRID -->
        <div class="nws-main-content">
            <div class="nws-bottom-grid">
                <div class="nws-bottom-left">
                    <div class="nws-col-header">In Brief</div>
                    <div class="nws-brief-row">
                        <div class="nws-brief-num">1</div>
                        <div class="nws-brief-text">
                            <strong class="nws-placeholder">[Brief headline]</strong>
                            <span class="nws-placeholder">[Short summary of a recent story.]</span>
                        </div>
                    </div>
                    <div class="nws-brief-row">
                        <div class="nws-brief-num">2</div>
                        <div class="nws-brief-text">
                            <strong class="nws-placeholder">[Brief headline]</strong>
                            <span class="nws-placeholder">[Short summary of a recent story.]</span>
                        </div>
                    </div>
                    <div class="nws-brief-row">
                        <div class="nws-brief-num">3</div>
                        <div class="nws-brief-text">
                            <strong class="nws-placeholder">[Brief headline]</strong>
                            <span class="nws-placeholder">[Short summary of a recent story.]</span>
                        </div>
                    </div>
                    <div class="nws-brief-row">
                        <div class="nws-brief-num">4</div>
                        <div class="nws-brief-text">
                            <strong class="nws-placeholder">[Brief headline]</strong>
                            <span class="nws-placeholder">[Short summary of a recent story.]</span>
                        </div>
                    </div>
                    <div class="nws-brief-row">
                        <div class="nws-brief-num">5</div>
                        <div class="nws-brief-text">
                            <strong class="nws-placeholder">[Brief headline]</strong>
                            <span class="nws-placeholder">[Short summary of a recent story.]</span>
                        </div>
                    </div>
                </div>
                <div class="nws-bottom-right" id="vln-widget">
                    <div class="nws-col-header">Volbal Ligue Nationale</div>
                    <div class="vln-loading" style="font-family:'Source Serif 4',serif;font-size:12px;font-style:italic;color:var(--nws-ink-4);">Loading standings&hellip;</div>
                </div>
            </div>
        </div>

        <!-- FOOTER -->
        <div class="nws-footer">
            <h2>The Cruceran</h2>
            <p>Continental Edition &nbsp;&middot;&nbsp; Est. Year 1 &nbsp;&middot;&nbsp; All rights reserved &nbsp;&middot;&nbsp; Truth in the service of the people</p>
        </div>

        <!-- WRITE ARTICLE MODAL -->
        <div class="nws-modal-overlay" id="nws-modal-overlay">
            <div class="nws-modal">
                <div class="nws-modal-header">
                    <h3>Write Article</h3>
                    <span class="nws-ap-badge" id="nws-reward-badge">+2 Vis, +1 Approval, +1 Enthusiasm (4000+)</span>
                </div>
                <button class="nws-modal-close" id="nws-modal-close">&times;</button>
                <div class="nws-modal-body">
                    <div class="nws-form-error" id="nws-form-error"></div>
                    <div class="nws-form-success" id="nws-form-success"></div>

                    <div class="nws-form-group">
                        <label for="nws-article-title">Headline</label>
                        <input type="text" id="nws-article-title" placeholder="Enter article headline..." maxlength="200">
                    </div>

                    <div class="nws-form-group">
                        <label for="nws-article-author">Writer Name</label>
                        <input type="text" id="nws-article-author" placeholder="Enter writer name..." maxlength="100">
                    </div>

                    <div class="nws-form-group">
                        <label for="nws-article-category">Category</label>
                        <select id="nws-article-category">
                            <option value="">Select a category...</option>
                            <option value="politics">Politics</option>
                            <option value="economy">Economy</option>
                            <option value="international">International</option>
                            <option value="social">Social</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="sports">Sports</option>
                            <option value="opinion">Opinion</option>
                        </select>
                    </div>

                    <div class="nws-form-group">
                        <label>Image (optional, max 2MB)</label>
                        <label class="nws-file-label" for="nws-article-image">
                            <span id="nws-file-label-text">Click to select an image...</span>
                        </label>
                        <input type="file" id="nws-article-image" accept="image/*">
                        <div class="nws-file-info">Accepted formats: JPG, PNG, GIF, WebP. Maximum file size: 2MB.</div>
                        <div class="nws-image-preview" id="nws-image-preview">
                            <img id="nws-image-preview-img" src="" alt="Preview">
                        </div>
                        <button type="button" class="nws-remove-image-btn" id="nws-remove-image-btn" style="display:none;">Remove image</button>
                    </div>

                    <div class="nws-form-group">
                        <label for="nws-article-body">Article Body</label>
                        <textarea id="nws-article-body" placeholder="Write your article (max 12000 characters). Use blank lines for paragraph breaks. Formatting: *italic*, **bold**, __underline__" maxlength="12000"></textarea>
                        <div class="nws-char-count" id="nws-char-count">0 / 12000</div>
                    </div>

                    <button class="nws-submit-btn" id="nws-submit-btn">Publish Article</button>
                </div>
            </div>
        </div>

    </div>`;

    // === EVENT BINDINGS ===
    // Must rebind every call — innerHTML replaces all DOM nodes,
    // so old listeners are garbage collected with the old elements.
    bindModalEvents();
    bindSubmitHandler();
    bindDeleteHandlers(root);
    bindEditHandlers(root);
    bindArticleReader(root);
    bindArchivesNav(root);
    bindCategoryNav(root);

    // Publication switcher
    const pubSwitcherEl = document.getElementById('nws-pub-switcher');
    if (pubSwitcherEl) {
        pubSwitcherEl.addEventListener('change', async () => {
            const newPub = pubSwitcherEl.value;
            if (newPub === _publication) return;
            _publication = newPub;
            _publicationSetByUser = true;
            try {
                await initNewspaper(_supabase, _state);
            } catch (e) {
                console.error('[News] Publication switch failed:', e);
            }
        });
    }

    // Update reward badge text based on government type
    const rewardBadge = document.getElementById('nws-reward-badge');
    if (rewardBadge) {
        rewardBadge.textContent = _isAutocracyNation
            ? '+1 Backing (4000+)'
            : '+2 Vis, +1 Approval, +1 Enthusiasm (4000+)';
    }

    // === LOAD & DISPLAY ARTICLES ===
    await loadAndDisplayArticles();

    // === VOLBAL LIGUE NATIONALE ===
    loadAndRenderVLN();
}

/** Award +2 visibility to a democratic faction for writing a long article */
async function _applyArticleVisibilityReward(factionId, nationId) {
    const { data: standing } = await _supabase
        .from('faction_electoral_standing')
        .select('visibility')
        .eq('faction_id', factionId)
        .eq('nation_id', nationId)
        .maybeSingle();
    const current = Number(standing?.visibility ?? 0);
    const newVal = Math.min(100, current + 2);
    await _supabase
        .from('faction_electoral_standing')
        .update({ visibility: newVal })
        .eq('faction_id', factionId)
        .eq('nation_id', nationId);
}

/** Award +1 party approval to a democratic faction for writing a long article */
async function _applyArticleApprovalReward(factionId, nationId) {
    await nudgeApproval(_supabase, factionId, nationId, 1, { source: 'article:published' });
}

/** Award +1 enthusiasm to the nation's electorate for a published article */
async function _applyArticleEnthusiasmReward(nationId) {
    const { data: profile } = await _supabase
        .from('electorate_profile')
        .select('id, enthusiasm')
        .eq('nation_id', nationId)
        .maybeSingle();
    if (!profile) return;
    const current = Number(profile.enthusiasm ?? 50);
    const newVal = Math.min(90, current + 1);
    await _supabase
        .from('electorate_profile')
        .update({ enthusiasm: newVal })
        .eq('id', profile.id);
}

/** Award backing to an autocracy faction for writing an article */
async function _applyArticleBackingReward(factionId) {
    const { data: fps } = await _supabase
        .from('faction_pillar_state')
        .select('pillar, backing')
        .eq('faction_id', factionId)
        .maybeSingle();
    if (!fps) return;
    const current = Number(fps.backing ?? 0);
    const newVal = Math.min(20, current + 1);
    await _supabase
        .from('faction_pillar_state')
        .update({ backing: newVal })
        .eq('faction_id', factionId);
}

function bindModalEvents() {
    const overlay = document.getElementById('nws-modal-overlay');
    const openBtn = document.getElementById('nws-write-article-btn');
    const closeBtn = document.getElementById('nws-modal-close');
    const bodyInput = document.getElementById('nws-article-body');
    const charCount = document.getElementById('nws-char-count');
    const fileInput = document.getElementById('nws-article-image');
    const fileLabelText = document.getElementById('nws-file-label-text');
    const previewContainer = document.getElementById('nws-image-preview');
    const previewImg = document.getElementById('nws-image-preview-img');

    // Open modal (always in create mode)
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            resetModalToCreateMode();
            overlay.classList.add('active');
        });
    }

    // Close modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            overlay.classList.remove('active');
            resetModalToCreateMode();
        });
    }

    // Clicking outside the modal no longer closes it — use the X button only
    // (prevents accidental loss of article drafts)

    // Remove image button (visible in edit mode when article has existing image)
    const removeImgBtn = document.getElementById('nws-remove-image-btn');
    if (removeImgBtn) {
        removeImgBtn.addEventListener('click', () => {
            _removeExistingImage = true;
            const preview = document.getElementById('nws-image-preview');
            if (preview) preview.style.display = 'none';
            const label = document.getElementById('nws-file-label-text');
            if (label) label.textContent = 'Click to select an image...';
            removeImgBtn.style.display = 'none';
        });
    }

    // Character counter with reward threshold indicator
    if (bodyInput && charCount) {
        bodyInput.addEventListener('input', () => {
            const len = bodyInput.value.length;
            let tag;
            if (_isAutocracyNation) {
                tag = len >= 4000 ? ' · +1 Backing' : ` · ${4000 - len} more for +1 Backing`;
            } else {
                tag = len >= 4000 ? ' · +2 Visibility' : ` · ${4000 - len} more for +2 Visibility`;
            }
            charCount.textContent = `${len} / 12000${tag}`;
            charCount.classList.toggle('nws-near-limit', len >= 11500);
            charCount.classList.toggle('nws-ap-qualified', len >= 4000 && len < 11500);
        });
    }

    // Image file selection + 2MB validation + preview
    if (fileInput) {
        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (!file) {
                fileLabelText.textContent = 'Click to select an image...';
                previewContainer.style.display = 'none';
                return;
            }
            const maxSize = 2 * 1024 * 1024; // 2MB
            if (file.size > maxSize) {
                showFormError('Image must be under 2MB.');
                fileInput.value = '';
                fileLabelText.textContent = 'Click to select an image...';
                previewContainer.style.display = 'none';
                return;
            }
            fileLabelText.textContent = file.name;
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });
    }
}

function showFormError(msg) {
    const el = document.getElementById('nws-form-error');
    if (el) {
        el.textContent = msg;
        el.style.display = 'block';
        setTimeout(() => { el.style.display = 'none'; }, 5000);
    }
}

function showFormSuccess(msg) {
    const el = document.getElementById('nws-form-success');
    if (el) {
        el.textContent = msg;
        el.style.display = 'block';
        setTimeout(() => { el.style.display = 'none'; }, 5000);
    }
}

// === SUBMIT HANDLER ===

function bindSubmitHandler() {
    const submitBtn = document.getElementById('nws-submit-btn');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', async () => {
        if (submitBtn.disabled) return; // guard against queued double-clicks
        const title = document.getElementById('nws-article-title').value.trim();
        const author = document.getElementById('nws-article-author').value.trim();
        const category = document.getElementById('nws-article-category').value;
        const body = document.getElementById('nws-article-body').value.trim();
        const fileInput = document.getElementById('nws-article-image');
        const file = fileInput.files[0] || null;

        // Validation
        if (!title) return showFormError('Please enter a headline.');
        if (!author) return showFormError('Please enter a writer name.');
        if (!category) return showFormError('Please select a category.');
        if (!body) return showFormError('Please write an article body.');
        if (body.length > 12000) return showFormError('Article body must be 12000 characters or fewer.');

        const isEdit = !!_editingArticleId;
        submitBtn.disabled = true;
        submitBtn.textContent = isEdit ? 'Updating...' : 'Publishing...';

        try {
            const { nation, faction, shard } = _state;

            if (isEdit) {
                // ── EDIT MODE ──
                let imageUrl = undefined; // undefined = keep existing
                if (file) {
                    imageUrl = await uploadArticleImage(nation.id, file);
                } else if (_removeExistingImage) {
                    imageUrl = null; // explicitly remove
                }

                const updates = {
                    headline: title,
                    author_name: author,
                    body: body,
                    category: category,
                };
                if (imageUrl !== undefined) updates.image_url = imageUrl;

                const { error } = await _supabase
                    .from('player_articles')
                    .update(updates)
                    .eq('id', _editingArticleId)
                    .eq('author_faction_id', faction.id);

                if (error) throw error;

                showFormSuccess('Article updated!');
            } else {
                // ── CREATE MODE ──
                let imageUrl = null;
                if (file) {
                    imageUrl = await uploadArticleImage(nation.id, file);
                }

                const { error } = await _supabase
                    .from('player_articles')
                    .insert({
                        nation_id: nation.id,
                        author_faction_id: faction.id,
                        author_name: author,
                        headline: title,
                        body: body,
                        category: category,
                        image_url: imageUrl,
                        status: 'published',
                        published_tick: shard?.current_tick || 0,
                        publication: _publication
                    });

                if (error) throw error;

                let successMsg = 'Article published!';
                if (_isAutocracyNation) {
                    // Autocracy: +1 Backing for any article >= 4000 chars
                    const backingReward = body.length >= 4000 ? 1 : 0;
                    if (backingReward > 0) {
                        _applyArticleBackingReward(faction.id).catch(err => console.error('[News] Backing reward failed:', err));
                        successMsg = `Article published! +${backingReward} Backing.`;
                    } else {
                        successMsg = `Article published! (${body.length}/4000 chars — no backing reward)`;
                    }
                } else {
                    // Democracy: +2 Visibility, +1 Approval, +1 Enthusiasm for any article >= 4000 chars
                    if (body.length >= 4000) {
                        _applyArticleVisibilityReward(faction.id, nation.id).catch(err => console.error('[News] Visibility reward failed:', err));
                        _applyArticleApprovalReward(faction.id, nation.id).catch(err => console.error('[News] Approval reward failed:', err));
                        _applyArticleEnthusiasmReward(nation.id).catch(err => console.error('[News] Enthusiasm reward failed:', err));
                        successMsg = 'Article published! +2 Visibility, +1 Approval, +1 Enthusiasm.';
                    } else {
                        successMsg = `Article published! (${body.length}/4000 chars — no reward)`;
                    }
                }
                showFormSuccess(successMsg);
            }

            resetModalToCreateMode();

            // Close modal after short delay
            setTimeout(() => {
                document.getElementById('nws-modal-overlay').classList.remove('active');
            }, 1500);

            // Refresh articles
            await loadAndDisplayArticles();

        } catch (err) {
            console.error(`[News] Article ${isEdit ? 'update' : 'submission'} failed:`, err);
            showFormError(`Failed to ${isEdit ? 'update' : 'publish'} article. Please try again.`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = _editingArticleId ? 'Update Article' : 'Publish Article';
        }
    });
}

// === IMAGE UPLOAD ===

async function uploadArticleImage(nationId, file) {
    const ext = file.name.split('.').pop() || 'png';
    const filePath = `player-articles/${nationId}/${Date.now()}.${ext}`;

    const { error } = await _supabase.storage
        .from('public-assets')
        .upload(filePath, file, { contentType: file.type, upsert: true });

    if (error) throw error;

    const { data } = _supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath);

    return data?.publicUrl || null;
}

// === DELETE ARTICLE ===

function deleteBtn(article) {
    if (!_state?.faction || article.author_faction_id !== _state.faction.id) return '';
    return `<button class="nws-delete-btn" data-article-id="${article.id}" title="Delete article">&times;</button>`;
}

function editBtn(article) {
    if (!_state?.faction || article.author_faction_id !== _state.faction.id) return '';
    return `<button class="nws-edit-btn" data-edit-id="${article.id}" title="Edit article">&#9998;</button>`;
}

function bindDeleteHandlers(root) {
    root.addEventListener('click', async (e) => {
        const btn = e.target.closest('.nws-delete-btn');
        if (!btn) return;
        const articleId = btn.dataset.articleId;
        if (!articleId || !confirm('Delete this article?')) return;

        btn.disabled = true;
        btn.textContent = '...';
        try {
            const { error } = await _supabase
                .from('player_articles')
                .delete()
                .eq('id', articleId)
                .eq('author_faction_id', _state.faction.id);

            if (error) throw error;
            await loadAndDisplayArticles();
        } catch (err) {
            console.error('[News] Failed to delete article:', err);
            btn.disabled = false;
            btn.textContent = '×';
        }
    });
}

// === EDIT ARTICLE ===

function resetModalToCreateMode() {
    _editingArticleId = null;
    _removeExistingImage = false;
    document.getElementById('nws-article-title').value = '';
    document.getElementById('nws-article-author').value = '';
    document.getElementById('nws-article-category').value = '';
    document.getElementById('nws-article-body').value = '';
    const fileInput = document.getElementById('nws-article-image');
    if (fileInput) fileInput.value = '';
    const fileLabelText = document.getElementById('nws-file-label-text');
    if (fileLabelText) fileLabelText.textContent = 'Click to select an image...';
    const preview = document.getElementById('nws-image-preview');
    if (preview) preview.style.display = 'none';
    const charCount = document.getElementById('nws-char-count');
    if (charCount) {
        charCount.textContent = '0 / 12000';
        charCount.classList.remove('nws-near-limit', 'nws-ap-qualified');
    }
    const removeBtn = document.getElementById('nws-remove-image-btn');
    if (removeBtn) removeBtn.style.display = 'none';
    const header = document.querySelector('.nws-modal-header h3');
    if (header) header.textContent = 'Write Article';
    const submitBtn = document.getElementById('nws-submit-btn');
    if (submitBtn) submitBtn.textContent = 'Publish Article';
}

function openEditModal(article) {
    _editingArticleId = article.id;
    _removeExistingImage = false;

    document.getElementById('nws-article-title').value = article.headline || '';
    document.getElementById('nws-article-author').value = article.author_name || '';
    document.getElementById('nws-article-category').value = article.category || '';
    document.getElementById('nws-article-body').value = article.body || '';

    // Fire char count update
    const bodyLen = (article.body || '').length;
    const charCount = document.getElementById('nws-char-count');
    if (charCount) {
        let tag;
        if (_isAutocracyNation) {
            tag = bodyLen >= 4000 ? ' · +1 Backing' : ` · ${4000 - bodyLen} more for +1 Backing`;
        } else {
            if (bodyLen >= 8000) tag = ' · +2 Enthusiasm';
            else if (bodyLen >= 4000) tag = ` · +1 Enthusiasm · ${8000 - bodyLen} more for +2`;
            else tag = ` · ${4000 - bodyLen} more for enthusiasm`;
        }
        charCount.textContent = `${bodyLen} / 12000${tag}`;
        charCount.classList.toggle('nws-near-limit', bodyLen >= 11500);
        charCount.classList.toggle('nws-ap-qualified', bodyLen >= 4000 && bodyLen < 11500);
    }

    // Image state
    const previewContainer = document.getElementById('nws-image-preview');
    const previewImg = document.getElementById('nws-image-preview-img');
    const fileLabelText = document.getElementById('nws-file-label-text');
    const removeBtn = document.getElementById('nws-remove-image-btn');
    const fileInput = document.getElementById('nws-article-image');
    if (fileInput) fileInput.value = '';

    if (article.image_url) {
        if (previewImg) previewImg.src = article.image_url;
        if (previewContainer) previewContainer.style.display = 'block';
        if (fileLabelText) fileLabelText.textContent = 'Current image (select new to replace)';
        if (removeBtn) removeBtn.style.display = 'inline';
    } else {
        if (previewContainer) previewContainer.style.display = 'none';
        if (fileLabelText) fileLabelText.textContent = 'Click to select an image...';
        if (removeBtn) removeBtn.style.display = 'none';
    }

    // Update modal chrome
    const header = document.querySelector('.nws-modal-header h3');
    if (header) header.textContent = 'Edit Article';
    const submitBtn = document.getElementById('nws-submit-btn');
    if (submitBtn) submitBtn.textContent = 'Update Article';

    document.getElementById('nws-modal-overlay').classList.add('active');
}

function bindEditHandlers(root) {
    root.addEventListener('click', (e) => {
        const btn = e.target.closest('.nws-edit-btn');
        if (!btn) return;
        e.stopPropagation();
        const articleId = btn.dataset.editId;
        const article = _articles.find(a => String(a.id) === String(articleId));
        if (!article) return;
        openEditModal(article);
    });
}

// === ARTICLE READER ===

function bindArticleReader(root) {
    // Remove previous handler to prevent listener accumulation on the persistent root element
    if (_articleReaderHandler) {
        root.removeEventListener('click', _articleReaderHandler);
    }
    _articleReaderHandler = (e) => {
        // Don't open reader when clicking delete buttons or other controls
        if (e.target.closest('.nws-delete-btn, .nws-edit-btn, .nws-write-btn, .nws-modal-overlay, button, a, input, select, textarea')) return;

        // Find the closest clickable article element
        const clickable = e.target.closest('[data-article-id]');
        if (!clickable) return;

        const articleId = clickable.dataset.articleId;
        const article = _articles.find(a => String(a.id) === String(articleId));
        if (!article) return;

        try {
            renderArticleView(root, article);
        } catch (err) {
            console.error('[News] Failed to open article:', err);
        }
    };
    root.addEventListener('click', _articleReaderHandler);
}

function renderArticleView(root, article) {
    const body = article.body || '';
    const articleDate = article.published_tick != null ? tickToDate(article.published_tick) : (_state?.shard?.current_date || '[Month], [Year]');
    const isArchived = !!_archiveBackContext;
    const backLabel = isArchived ? '&larr; Back to Edition' : '&larr; Back to Front Page';

    const bodyHtml = formatBodyHtml(body);

    const imageHtml = article.image_url
        ? `<div class="nws-reader-image">
            <img src="${escapeHtml(article.image_url)}" alt="${escapeHtml(article.headline)}">
            <p class="nws-img-caption">${escapeHtml(article.headline)}</p>
           </div>`
        : '';

    root.innerHTML = `<div class="newspaper-container">
        <!-- TOP RIBBON -->
        <div class="nws-top-ribbon">
            <div class="nws-top-ribbon-inner">
                <span>${escapeHtml(articleDate)}</span>
                <span class="nws-edition">The Cruceran &mdash; Continental Edition</span>
                <button class="nws-write-btn" id="nws-back-btn">${backLabel}</button>
            </div>
        </div>

        <!-- READER CONTENT -->
        <div class="nws-main-content">
            <div class="nws-reader">
                <span class="nws-section-tag">${escapeHtml(categoryLabel(article.category))} &mdash; ${escapeHtml(articleDate)}</span>
                <h1 class="nws-reader-headline">${escapeHtml(article.headline)}</h1>
                <div class="nws-byline">
                    <span class="nws-author">${escapeHtml(article.author_name)}</span>
                    <span class="nws-dot">&middot;</span>
                    <span>${escapeHtml(articleDate)}</span>
                </div>
                <hr class="nws-reader-rule">
                ${imageHtml}
                <div class="nws-reader-body">
                    ${bodyHtml}
                </div>
                <hr class="nws-reader-rule">
                <button class="nws-back-link" id="nws-back-btn-bottom">${backLabel}</button>
            </div>
        </div>

        <!-- FOOTER -->
        <div class="nws-footer">
            <h2>The Cruceran</h2>
            <p>Continental Edition &nbsp;&middot;&nbsp; Est. Year 1 &nbsp;&middot;&nbsp; All rights reserved &nbsp;&middot;&nbsp; Truth in the service of the people</p>
        </div>
    </div>`;

    // Bind back buttons — return to archived edition if opened from one, else front page
    const ctx = _archiveBackContext;
    const goBack = ctx
        ? () => renderArchivedEdition(ctx.root, ctx.articles, ctx.dateLabel)
        : () => initNewspaper(_supabase, _state);
    document.getElementById('nws-back-btn')?.addEventListener('click', goBack);
    document.getElementById('nws-back-btn-bottom')?.addEventListener('click', goBack);

    // Scroll to top
    root.scrollTop = 0;
}

// === LOAD & DISPLAY ARTICLES ===

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatLeadPreview(body, limit = 1200) {
    if (body.length <= limit) return formatBodyHtml(body);

    // Truncate at word boundary near the limit
    let cut = body.lastIndexOf(' ', limit);
    if (cut < limit * 0.5) cut = limit; // fallback if no space found
    const preview = body.substring(0, cut);

    // Render preview paragraphs, then append a Read More prompt
    const paragraphs = preview.split(/\n\n+/).filter(p => p.trim());
    const html = paragraphs.map((p, i) =>
        `<p class="${i === 0 ? 'nws-drop-cap' : ''}">${applyInlineFormatting(escapeHtml(p.trim()))}${i === paragraphs.length - 1 ? '...' : ''}</p>`
    ).join('');

    return html + `<p class="nws-read-more">Read More &rarr;</p>`;
}

// Inline formatting: **bold**, *italic*, __underline__
// Applied after escapeHtml so markers are safe plain-text characters.
function applyInlineFormatting(escaped) {
    return escaped
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/__(.+?)__/g, '<u>$1</u>');
}

function formatBodyHtml(body) {
    const paragraphs = body.split(/\n\n+/).filter(p => p.trim());
    if (paragraphs.length <= 1) {
        return `<p class="nws-drop-cap">${applyInlineFormatting(escapeHtml(body))}</p>`;
    }
    return paragraphs.map((p, i) =>
        `<p class="${i === 0 ? 'nws-drop-cap' : ''}">${applyInlineFormatting(escapeHtml(p.trim()))}</p>`
    ).join('');
}

function categoryLabel(cat) {
    if (cat === 'elections') cat = 'politics'; // legacy: fold elections into politics
    const labels = {
        politics: 'Politics', economy: 'Economy', international: 'International',
        social: 'Social', entertainment: 'Entertainment', sports: 'Sports',
        opinion: 'Opinion'
    };
    return labels[cat] || cat;
}

function categoryGradient(cat) {
    if (cat === 'elections') cat = 'politics'; // legacy: fold elections into politics
    const gradients = {
        politics: 'linear-gradient(135deg,#2a1a2a,#1a0d1a)',
        economy: 'linear-gradient(135deg,#2a1a0a,#1a0d00)',
        international: 'linear-gradient(135deg,#0a1a2a,#001a2a)',
        social: 'linear-gradient(135deg,#1a2a1a,#0d1a0d)',
        entertainment: 'linear-gradient(135deg,#2a2a0a,#1a1a00)',
        sports: 'linear-gradient(135deg,#2a0a0a,#1a0000)',
        opinion: 'linear-gradient(135deg,#2a2a2a,#1a1a1a)'
    };
    return gradients[cat] || 'linear-gradient(135deg,#1a1a1a,#0d0d0d)';
}

function renderImageOrPlaceholder(imageUrl, label) {
    if (imageUrl) {
        return `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(label)}">`;
    }
    return `<div class="nws-img-placeholder">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="4" fill="rgba(255,255,255,0.05)"/>
            <circle cx="18" cy="20" r="6" fill="rgba(255,255,255,0.1)"/>
            <path d="M6 38 L18 26 L26 34 L34 22 L42 38Z" fill="rgba(255,255,255,0.08)"/>
        </svg>
        <span style="font-family:'Inter',sans-serif;font-size:9px;color:rgba(255,255,255,0.2);letter-spacing:1px;text-transform:uppercase;">${escapeHtml(label)}</span>
    </div>`;
}

async function getShardNationIds() {
    if (_shardNationIds) return _shardNationIds;
    const shard = _state?.shard;
    const nation = _state?.nation;
    if (!shard || !nation) return [nation?.id].filter(Boolean);

    const { data: nations, error } = await _supabase
        .from('nations')
        .select('id')
        .eq('shard_id', shard.id);

    if (error) {
        console.error('[News] Failed to fetch shard nations:', error);
    }
    _shardNationIds = (nations && nations.length > 0) ? nations.map(n => n.id) : [nation.id];
    return _shardNationIds;
}

async function loadAndDisplayArticles() {
    if (!_supabase || !_state) return;

    try {
        const nationIds = await getShardNationIds();

        // Filter by publication — articles without the column default to 'cruceran'
        let query = _supabase
            .from('player_articles')
            .select('*')
            .in('nation_id', nationIds)
            .eq('status', 'published')
            .order('created_at', { ascending: false });
        // Once the publication column exists, filter by it
        if (_publication !== 'cruceran') {
            query = query.eq('publication', _publication);
        } else {
            // Include articles with no publication set (legacy) or explicitly 'cruceran'
            query = query.or('publication.eq.cruceran,publication.is.null');
        }
        const { data: articles, error } = await query;

        if (error) {
            console.error('[News] Failed to load articles:', error);
            return;
        }

        if (!articles || articles.length === 0) return;

        // Quarterly issue logic: show all articles from the current season,
        // plus the most recent articles from ANY past season for categories
        // that have no new content yet — articles persist until replaced.
        const currentTick = _state.shard?.current_tick ?? 0;
        const currentSeason = _seasonKey(currentTick);

        const currentSeasonArticles = articles.filter(a =>
            _seasonKey(a.published_tick ?? 0) === currentSeason
        );
        const pastArticles = articles.filter(a =>
            _seasonKey(a.published_tick ?? 0) !== currentSeason
        );

        // Categories that already have articles in the current season
        const currentCategories = new Set(currentSeasonArticles.map(a => a.category));

        // For each category with no current content, pull the most recent
        // past articles (already sorted by created_at DESC from the query)
        const fallbackArticles = [];
        const fallbackCategories = new Set();
        for (const a of pastArticles) {
            if (a.category === 'opinion') continue;
            if (currentCategories.has(a.category)) continue;
            if (!fallbackCategories.has(a.category)) {
                fallbackCategories.add(a.category);
            }
            fallbackArticles.push(a);
        }

        // Opinion articles persist until replaced — take the 4 most recent
        // regardless of season so all slots stay filled
        const opinionArticles = articles
            .filter(a => a.category === 'opinion')
            .slice(0, 4);

        const mergedArticles = [
            ...currentSeasonArticles.filter(a => a.category !== 'opinion'),
            ...fallbackArticles,
            ...opinionArticles
        ];

        if (mergedArticles.length === 0) return;

        // Cache for article reader lookup
        _articles = mergedArticles;

        // Apply category filter if set (elections articles fold into politics)
        const filtered = _categoryFilter && _categoryFilter !== 'all'
            ? mergedArticles.filter(a => {
                const effectiveCat = a.category === 'elections' ? 'politics' : a.category;
                return effectiveCat === _categoryFilter;
            })
            : mergedArticles;

        if (filtered.length === 0 && _categoryFilter !== 'all') {
            const emptyMsg = `<p class="nws-placeholder" style="text-align:center;padding:40px;grid-column:1/-1;">No ${categoryLabel(_categoryFilter)} articles in this edition.</p>`;
            const section = document.getElementById('nws-lead-section');
            if (section) section.innerHTML = emptyMsg;
            const grid = document.getElementById('nws-secondary-grid');
            if (grid) grid.innerHTML = '';
            const opinionGrid = document.querySelector('.nws-opinion-grid');
            if (opinionGrid) opinionGrid.innerHTML = '';
            const briefsContainer = document.querySelector('.nws-bottom-left');
            if (briefsContainer) briefsContainer.innerHTML = '';
            return;
        }

        // Separate news articles (opinions are handled separately via opinionArticles above)
        const newsArticles = filtered.filter(a => a.category !== 'opinion');

        // Sort news by published_tick DESC — most recent gets A1
        const sorted = [...newsArticles].sort((a, b) =>
            (b.published_tick ?? 0) - (a.published_tick ?? 0)
        );

        // A1 lead = most recent article
        const lead = sorted[0];
        // Sidebar stories = next 3
        const sidebar = sorted.slice(1, 4);
        // Secondary grid = next 3 after sidebar
        const secondary = sorted.slice(4, 7);
        // In Brief = 5 most recent articles (all categories, by recency)
        const briefs = [...mergedArticles]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);

        if (_publication === 'continental') {
            renderContinentalLayout(lead, sidebar, secondary, opinionArticles.slice(0, 4), briefs);
        } else {
            // Populate lead section
            if (lead) populateLeadSection(lead, sidebar);
            // Populate secondary grid
            populateSecondaryGrid(secondary);
            // Populate opinion strip (up to 4 opinion articles)
            populateOpinionStrip(opinionArticles.slice(0, 4));
            // Populate briefs
            populateBriefs(briefs);
        }
    } catch (err) {
        console.error('[News] Error loading articles:', err);
    }
}

function populateLeadSection(lead, sidebar) {
    const section = document.getElementById('nws-lead-section');
    if (!section || !lead) return;

    const sidebarHtml = sidebar.length > 0
        ? sidebar.map(a => `
            <div class="nws-sidebar-story" data-article-id="${a.id}">
                ${editBtn(a)}${deleteBtn(a)}
                <span class="nws-section-tag">${escapeHtml(categoryLabel(a.category))}</span>
                <h3 class="nws-sidebar-headline">${escapeHtml(a.headline)}</h3>
                <p class="nws-sidebar-deck">${escapeHtml((a.body || '').replace(/\n+/g, ' ').substring(0, 120))}${(a.body || '').length > 120 ? '...' : ''}</p>
                <div class="nws-byline"><span class="nws-author">${escapeHtml(a.author_name)}</span><span class="nws-dot">&middot;</span><span>${_state?.shard?.current_date || '—'}</span></div>
            </div>
        `).join('')
        : `<div class="nws-sidebar-story"><p class="nws-placeholder">[More stories will appear as articles are published.]</p></div>`;

    const leadImageHtml = lead.image_url
        ? `<img src="${escapeHtml(lead.image_url)}" alt="${escapeHtml(lead.headline)}">`
        : renderImageOrPlaceholder(null, 'Photo');

    // Truncate body for deck (first ~200 chars), collapsing newlines for clean display
    const leadBody = lead.body || '';
    const deckText = leadBody.replace(/\n+/g, ' ');
    const deck = deckText.length > 200 ? deckText.substring(0, 200) + '...' : deckText;

    section.innerHTML = `
        <div class="nws-lead-main" data-article-id="${lead.id}">
            ${editBtn(lead)}${deleteBtn(lead)}
            <span class="nws-section-tag">${escapeHtml(categoryLabel(lead.category))}</span>
            <h2 class="nws-lead-headline">${escapeHtml(lead.headline)}</h2>
            <p class="nws-lead-deck">${escapeHtml(deck)}</p>
            <div class="nws-byline">
                <span class="nws-author">${escapeHtml(lead.author_name)}</span>
                <span class="nws-dot">&middot;</span>
                <span>${_state?.shard?.current_date || '—'}</span>
            </div>
            <div class="nws-lead-body">
                ${formatLeadPreview(leadBody)}
            </div>
        </div>
        <div class="nws-lead-sidebar">
            <div class="nws-lead-image">${leadImageHtml}</div>
            <p class="nws-img-caption">${lead.image_url ? escapeHtml(lead.headline) : '<span class="nws-placeholder">[Photo]</span>'}</p>
            ${sidebarHtml}
        </div>
    `;
}

function populateSecondaryGrid(articles) {
    const grid = document.getElementById('nws-secondary-grid');
    if (!grid) return;

    // If we have articles, replace the placeholder slots
    if (articles.length === 0) return;

    // Pad to 3 with placeholders
    const slots = [...articles];
    const placeholderLabels = ['Crisis', 'Election', 'Economy'];

    const html = [0, 1, 2].map(i => {
        const a = slots[i];
        if (a) {
            const imgHtml = a.image_url
                ? `<img src="${escapeHtml(a.image_url)}" alt="${escapeHtml(a.headline)}" style="width:100%;height:100%;object-fit:cover;">`
                : `<div class="nws-img-ph" style="background:${categoryGradient(a.category)};">${escapeHtml(categoryLabel(a.category))}</div>`;

            return `<div class="nws-sec-story" data-article-id="${a.id}">
                ${editBtn(a)}${deleteBtn(a)}
                <div class="nws-sec-image">${imgHtml}</div>
                <span class="nws-section-tag">${escapeHtml(categoryLabel(a.category))}</span>
                <h3 class="nws-sec-headline">${escapeHtml(a.headline)}</h3>
                <p class="nws-sec-deck">${escapeHtml((a.body || '').replace(/\n+/g, ' ').substring(0, 150))}${(a.body || '').length > 150 ? '...' : ''}</p>
                <div class="nws-byline"><span class="nws-author">${escapeHtml(a.author_name)}</span><span class="nws-dot">&middot;</span><span>${_state?.shard?.current_date || '—'}</span></div>
            </div>`;
        } else {
            const label = placeholderLabels[i] || 'News';
            const defaultGradients = [
                'linear-gradient(135deg,#1a2a1a,#0d1a0d)',
                'linear-gradient(135deg,#1a1a2a,#0d0d1a)',
                'linear-gradient(135deg,#2a1a0a,#1a0d00)'
            ];
            return `<div class="nws-sec-story">
                <div class="nws-sec-image"><div class="nws-img-ph" style="background:${defaultGradients[i]};">${label}</div></div>
                <span class="nws-section-tag nws-placeholder">[${label}]</span>
                <h3 class="nws-sec-headline nws-placeholder">[${label} Section Headline]</h3>
                <p class="nws-sec-deck nws-placeholder">[Summary will appear here.]</p>
                <div class="nws-byline"><span class="nws-author nws-placeholder">[Author]</span><span class="nws-dot">&middot;</span><span class="nws-placeholder">[Date]</span></div>
            </div>`;
        }
    }).join('');

    grid.innerHTML = html;
}

function populateBriefs(articles) {
    if (articles.length === 0) return;

    const container = document.querySelector('.nws-bottom-left');
    if (!container) return;

    const headerHtml = '<div class="nws-col-header">In Brief</div>';
    const briefsHtml = articles.map((a, i) => `
        <div class="nws-brief-row" data-article-id="${a.id}">
            <div class="nws-brief-num">${i + 1}</div>
            <div class="nws-brief-text">
                <strong>${escapeHtml(a.headline)}${editBtn(a)}${deleteBtn(a)}</strong>
                ${escapeHtml((a.body || '').replace(/\n+/g, ' ').substring(0, 100))}${(a.body || '').length > 100 ? '...' : ''}
            </div>
        </div>
    `).join('');

    // Keep remaining placeholder rows if < 5 articles
    const remaining = 5 - articles.length;
    let placeholderHtml = '';
    for (let i = 0; i < remaining; i++) {
        placeholderHtml += `
            <div class="nws-brief-row">
                <div class="nws-brief-num">${articles.length + i + 1}</div>
                <div class="nws-brief-text">
                    <strong class="nws-placeholder">[Brief headline]</strong>
                    <span class="nws-placeholder">[Short summary of a recent story.]</span>
                </div>
            </div>
        `;
    }

    container.innerHTML = headerHtml + briefsHtml + placeholderHtml;
}

function populateOpinionStrip(articles) {
    const grid = document.querySelector('.nws-opinion-grid');
    if (!grid) return;
    if (articles.length === 0) return;

    // Pad to 4 slots with placeholders
    const html = [0, 1, 2, 3].map(i => {
        const a = articles[i];
        if (a) {
            // Truncate body to ~80 chars for the quote
            const quote = (a.body || '').length > 80
                ? (a.body || '').substring(0, 80) + '...'
                : (a.body || '');
            return `<div class="nws-op-card" data-article-id="${a.id}">
                ${editBtn(a)}${deleteBtn(a)}
                <div class="nws-op-author">${escapeHtml(a.author_name)} &mdash; Opinion</div>
                <div class="nws-op-headline">&ldquo;${escapeHtml(quote)}&rdquo;</div>
            </div>`;
        } else {
            return `<div class="nws-op-card">
                <div class="nws-op-author nws-placeholder">[Columnist] &mdash; [Topic]</div>
                <div class="nws-op-headline nws-placeholder">&ldquo;[Opinion headline will appear here.]&rdquo;</div>
            </div>`;
        }
    }).join('');

    grid.innerHTML = html;
}

// === THE CONTINENTAL LAYOUT ===

function renderContinentalLayout(lead, cards, secondary, opinions, briefs) {
    const content = document.getElementById('nws-main-content') || document.querySelector('.nws-main-content');
    if (!content) return;

    const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const deck = (a) => esc((a.body || '').replace(/\n+/g, ' ').substring(0, 200)) + ((a.body || '').length > 200 ? '...' : '');
    const shortDeck = (a) => esc((a.body || '').replace(/\n+/g, ' ').substring(0, 120)) + ((a.body || '').length > 120 ? '...' : '');
    const cat = (a) => esc(categoryLabel(a.category));
    const date = _state?.shard?.current_date || '—';
    const imgCls = { politics: '--politics', economy: '--economy', social: '--social', international: '--intl', entertainment: '--culture', science: '--science' };

    let h = '';

    // Empty state
    if (!lead && cards.length === 0 && secondary.length === 0 && opinions.length === 0 && briefs.length === 0) {
        h += '<div style="text-align:center;padding:60px 20px;color:#9e9b95;font-family:Outfit,sans-serif;">';
        h += '<div style="font-size:2rem;margin-bottom:12px;opacity:0.3;">📰</div>';
        h += '<div style="font-size:1rem;font-weight:600;">No articles yet</div>';
        h += '<div style="font-size:0.85rem;margin-top:6px;">Be the first to write for The Continental.</div>';
        h += '</div>';
        content.innerHTML = h;
        return;
    }

    // ── HERO (lead story) ──
    if (lead) {
        const heroImg = lead.image_url
            ? `<img src="${esc(lead.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;">`
            : '';
        h += `<div class="ct-hero" data-article-id="${lead.id}">
            <div class="ct-hero__image">${heroImg}</div>
            <div class="ct-hero__content">
                <div class="ct-hero__section">${cat(lead)}</div>
                <h1 class="ct-hero__headline">${esc(lead.headline)}</h1>
                <p class="ct-hero__lede">${deck(lead)}</p>
                <div class="ct-hero__meta">
                    <span class="ct-hero__author">${esc(lead.author_name)}</span>
                    <span>&middot;</span>
                    <span>${date}</span>
                </div>
            </div>
        </div>`;
    }

    // ── TOP STORIES GRID ──
    if (cards.length > 0) {
        h += `<div class="ct-section-divider">
            <span class="ct-section-divider__label">Top Stories</span>
            <div class="ct-section-divider__line"></div>
        </div>`;
        h += '<div class="ct-story-grid">';
        for (const a of cards) {
            const cls = imgCls[a.category] || '';
            const cardImg = a.image_url
                ? `<img src="${esc(a.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;">`
                : '';
            h += `<div class="ct-card" data-article-id="${a.id}">
                <div class="ct-card__image ct-card__image${cls}">${cardImg}
                    <span class="ct-card__image-label">${cat(a)}</span>
                </div>
                <div class="ct-card__body">
                    <div class="ct-card__section">${cat(a)}</div>
                    <h2 class="ct-card__headline">${esc(a.headline)}</h2>
                    <p class="ct-card__summary">${shortDeck(a)}</p>
                    <div class="ct-card__meta">
                        <span class="ct-card__author">${esc(a.author_name)}</span>
                        <span>&middot;</span>
                        <span>${date}</span>
                    </div>
                </div>
            </div>`;
        }
        h += '</div>';
    }

    // ── CONTINENTAL ANALYSIS (dark band) ──
    if (secondary.length > 0) {
        h += `</div><div class="ct-analysis-band"><div class="ct-analysis-band__inner">
            <div class="ct-analysis-band__header">
                <span class="ct-analysis-band__badge">Continental Analysis</span>
                <span class="ct-analysis-band__title">In-depth reporting from across Meridia</span>
            </div>
            <div class="ct-analysis-band__grid">`;
        for (const a of secondary) {
            h += `<div class="ct-analysis-story" data-article-id="${a.id}">
                <div class="ct-analysis-story__section">${cat(a)}</div>
                <h2 class="ct-analysis-story__headline">${esc(a.headline)}</h2>
                <p class="ct-analysis-story__summary">${shortDeck(a)}</p>
                <div class="ct-analysis-story__meta"><strong>${esc(a.author_name)}</strong> &middot; ${date}</div>
            </div>`;
        }
        h += `</div></div></div><div class="nws-main-content">`;
    }

    // ── ANALYSIS & OPINION + SIDEBAR ──
    if (opinions.length > 0 || briefs.length > 0) {
        h += `<div class="ct-section-divider">
            <span class="ct-section-divider__label">Analysis &amp; Opinion</span>
            <div class="ct-section-divider__line"></div>
        </div>`;
        h += '<div class="ct-two-col">';

        // Left: numbered opinion/analysis items
        h += '<div class="ct-analysis-list">';
        for (let i = 0; i < opinions.length; i++) {
            const a = opinions[i];
            h += `<div class="ct-analysis-item" data-article-id="${a.id}">
                <div class="ct-analysis-item__number">${String(i + 1).padStart(2, '0')}</div>
                <div class="ct-analysis-item__content">
                    <div class="ct-analysis-item__section">${cat(a)}</div>
                    <h3 class="ct-analysis-item__headline">${esc(a.headline)}</h3>
                    <p class="ct-analysis-item__summary">${shortDeck(a)}</p>
                    <div class="ct-analysis-item__meta"><strong>${esc(a.author_name)}</strong> &middot; ${date}</div>
                </div>
            </div>`;
        }
        h += '</div>';

        // Right: sidebar briefs
        h += '<div class="ct-sidebar">';
        h += '<div class="ct-sidebar__section"><div class="ct-sidebar__section-title">Also in This Edition</div>';
        for (const a of briefs) {
            h += `<div class="ct-sidebar-brief" data-article-id="${a.id}">
                <div class="ct-sidebar-brief__section">${cat(a)}</div>
                <div class="ct-sidebar-brief__headline">${esc(a.headline)}</div>
            </div>`;
        }
        h += '</div></div>';

        h += '</div>';
    }

    // ── FOOTER ──
    h += `<div class="ct-footer">
        <div class="ct-footer__inner">
            <div class="ct-footer__brand">
                <div class="ct-footer__title">The Continental</div>
                <div class="ct-footer__tagline">Independent journalism for Meridia.<br>Where Ideas Converge.</div>
            </div>
            <div>
                <div class="ct-footer__col-title">Sections</div>
                <span class="ct-footer__link">Politics</span>
                <span class="ct-footer__link">Economy</span>
                <span class="ct-footer__link">International</span>
                <span class="ct-footer__link">Society</span>
                <span class="ct-footer__link">Culture</span>
            </div>
        </div>
    </div>`;

    content.innerHTML = h;

    // Bind click handlers for article reader on all Continental articles
    content.querySelectorAll('[data-article-id]').forEach(el => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', (e) => {
            if (e.target.closest('.nws-edit-btn, .nws-delete-btn')) return;
            const id = el.dataset.articleId;
            const article = _articles.find(a => String(a.id) === String(id));
            if (article) renderArticleView(document.getElementById('newspaper-root'), article);
        });
    });
}

// === CATEGORY NAV ===

function bindCategoryNav(root) {
    const navItems = root.querySelectorAll('.nws-nav-item[data-category]');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active state
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            // Set filter and reload
            _categoryFilter = item.dataset.category;
            loadAndDisplayArticles();
        });
    });
}

// === ARCHIVES ===

function bindArchivesNav(root) {
    const btn = document.getElementById('nws-nav-archives');
    if (!btn) return;
    btn.addEventListener('click', () => renderArchivesListView(root));
}

async function renderArchivesListView(root) {
    if (!_supabase || !_state) return;

    try {
        const currentTick = _state.shard?.current_tick ?? 0;
        const gameDate = _state.shard?.current_date || '[Month], [Year]';
        const nationIds = await getShardNationIds();

        // Fetch ALL published articles across all nations in this shard
        const { data: articles, error } = await _supabase
            .from('player_articles')
            .select('*')
            .in('nation_id', nationIds)
            .eq('status', 'published')
            .order('published_tick', { ascending: false });

        if (error) {
            console.error('[News] Failed to load archive articles:', error);
            return;
        }

        // Group articles by season (3-month windows) using shared _seasonKey
        const grouped = {};
        for (const a of (articles || [])) {
            const tick = a.published_tick ?? 0;
            const key = _seasonKey(tick);
            if (!grouped[key]) grouped[key] = { label: key, maxTick: tick, articles: [] };
            grouped[key].articles.push(a);
            if (tick > grouped[key].maxTick) grouped[key].maxTick = tick;
        }

        // Sort by max tick descending (newest seasons first)
        const seasons = Object.values(grouped).sort((a, b) => b.maxTick - a.maxTick);

        // Mark current season
        const currentSeasonKey = _seasonKey(currentTick);

        const monthListHtml = seasons.length > 0
            ? seasons.map(s => {
                const current = s.label === currentSeasonKey ? ' <span class="nws-archive-current">Current</span>' : '';
                return `<div class="nws-archive-month" data-archive-season="${escapeHtml(s.label)}">
                    <div class="nws-archive-month-name">${escapeHtml(s.label)}${current}</div>
                    <div class="nws-archive-month-count">${s.articles.length} article${s.articles.length !== 1 ? 's' : ''}</div>
                </div>`;
            }).join('')
            : '<p class="nws-placeholder" style="text-align:center;padding:40px;">No articles have been published yet.</p>';

        root.innerHTML = `<div class="newspaper-container">
            <!-- TOP RIBBON -->
            <div class="nws-top-ribbon">
                <div class="nws-top-ribbon-inner">
                    <span>${gameDate}</span>
                    <span class="nws-edition">The Cruceran &mdash; Continental Edition</span>
                    <button class="nws-write-btn" id="nws-back-btn">&larr; Back to Front Page</button>
                </div>
            </div>

            <!-- MASTHEAD -->
            <div class="nws-masthead">
                <div class="nws-masthead-top">
                    <div class="nws-masthead-meta">Est. Year 1<br>Continental Record</div>
                    <h1>The Cruceran</h1>
                    <div class="nws-masthead-meta nws-masthead-meta-right">Free Press<br>International Wire</div>
                </div>
                <hr class="nws-masthead-rule">
                <div class="nws-rule-ornament">&mdash; &#10022; &mdash;</div>
                <div class="nws-masthead-tagline">&ldquo;Truth in the service of the people&rdquo;</div>
            </div>

            <!-- ARCHIVE CONTENT -->
            <div class="nws-main-content">
                <div class="nws-archives">
                    <h2 class="nws-archives-title">Older Issues</h2>
                    <p class="nws-archives-subtitle">Browse past editions of The Cruceran by season.</p>
                    <div class="nws-archive-list">
                        ${monthListHtml}
                    </div>
                </div>
            </div>

            <!-- FOOTER -->
            <div class="nws-footer">
                <h2>The Cruceran</h2>
                <p>Continental Edition &nbsp;&middot;&nbsp; Est. Year 1 &nbsp;&middot;&nbsp; All rights reserved &nbsp;&middot;&nbsp; Truth in the service of the people</p>
            </div>
        </div>`;

        // Bind back button
        document.getElementById('nws-back-btn')?.addEventListener('click', () => initNewspaper(_supabase, _state));

        // Bind season clicks
        root.querySelectorAll('[data-archive-season]').forEach(el => {
            el.addEventListener('click', () => {
                const key = el.dataset.archiveSeason;
                const seasonData = grouped[key];
                if (seasonData) renderArchivedEdition(root, seasonData.articles, seasonData.label);
            });
        });

        root.scrollTop = 0;
    } catch (err) {
        console.error('[News] Error loading archives:', err);
    }
}

function renderArchivedEdition(root, articles, dateLabel) {
    // Cache for article reader
    _articles = articles;

    // Separate opinion from news, sort news by body length
    const opinionArticles = articles.filter(a => a.category === 'opinion');
    const newsArticles = articles.filter(a => a.category !== 'opinion');
    const sorted = [...newsArticles].sort((a, b) => (b.body || '').length - (a.body || '').length);

    const lead = sorted[0];
    const sidebar = sorted.slice(1, 4);
    const secondary = sorted.slice(4, 7);
    const briefs = sorted.slice(7, 12);
    const opinions = opinionArticles.slice(0, 4);

    const leadHtml = lead ? buildLeadHtml(lead, sidebar, dateLabel) : '<p class="nws-placeholder" style="padding:40px;text-align:center;">[No articles in this edition]</p>';
    const secondaryHtml = buildSecondaryGridHtml(secondary);
    const opinionHtml = buildOpinionStripHtml(opinions);
    const briefsHtml = buildBriefsHtml(briefs);

    root.innerHTML = `<div class="newspaper-container">
        <!-- TOP RIBBON -->
        <div class="nws-top-ribbon">
            <div class="nws-top-ribbon-inner">
                <span>${escapeHtml(dateLabel)}</span>
                <span class="nws-edition">The Cruceran &mdash; Continental Edition</span>
                <button class="nws-write-btn" id="nws-back-to-archives">&larr; Back to Older Issues</button>
            </div>
        </div>

        <!-- MASTHEAD -->
        <div class="nws-masthead">
            <div class="nws-masthead-top">
                <div class="nws-masthead-meta">Est. Year 1<br>Continental Record</div>
                <h1>The Cruceran</h1>
                <div class="nws-masthead-meta nws-masthead-meta-right">Free Press<br>International Wire</div>
            </div>
            <hr class="nws-masthead-rule">
            <div class="nws-rule-ornament">&mdash; &#10022; &mdash;</div>
            <div class="nws-masthead-tagline">&ldquo;Truth in the service of the people&rdquo;</div>
        </div>

        <div class="nws-archive-edition-banner">
            <span>Archived Edition &mdash; ${escapeHtml(dateLabel)}</span>
        </div>

        <!-- MAIN CONTENT -->
        <div class="nws-main-content">
            <div class="nws-lead-section">${leadHtml}</div>
            ${secondaryHtml ? `<div class="nws-secondary-grid">${secondaryHtml}</div>` : ''}
        </div>

        ${opinionHtml}

        ${briefsHtml ? `<div class="nws-main-content">
            <div class="nws-bottom-grid">
                <div class="nws-bottom-left">
                    <div class="nws-col-header">In Brief</div>
                    ${briefsHtml}
                </div>
            </div>
        </div>` : ''}

        <!-- FOOTER -->
        <div class="nws-footer">
            <h2>The Cruceran</h2>
            <p>Continental Edition &nbsp;&middot;&nbsp; Est. Year 1 &nbsp;&middot;&nbsp; All rights reserved &nbsp;&middot;&nbsp; Truth in the service of the people</p>
        </div>
    </div>`;

    // Bind back to archives list
    document.getElementById('nws-back-to-archives')?.addEventListener('click', () => renderArchivesListView(root));

    // Set context so article reader "Back" returns to this archived edition
    _archiveBackContext = { root, articles, dateLabel };

    // Bind article reader for archived articles
    bindArticleReader(root);

    root.scrollTop = 0;
}

// === ARCHIVE LAYOUT BUILDERS ===

function buildLeadHtml(lead, sidebar, dateLabel) {
    const sidebarHtml = sidebar.length > 0
        ? sidebar.map(a => `
            <div class="nws-sidebar-story" data-article-id="${a.id}">
                <span class="nws-section-tag">${escapeHtml(categoryLabel(a.category))}</span>
                <h3 class="nws-sidebar-headline">${escapeHtml(a.headline)}</h3>
                <p class="nws-sidebar-deck">${escapeHtml((a.body || '').replace(/\n+/g, ' ').substring(0, 120))}${(a.body || '').length > 120 ? '...' : ''}</p>
                <div class="nws-byline"><span class="nws-author">${escapeHtml(a.author_name)}</span><span class="nws-dot">&middot;</span><span>${escapeHtml(dateLabel)}</span></div>
            </div>
        `).join('')
        : '';

    const leadImageHtml = lead.image_url
        ? `<img src="${escapeHtml(lead.image_url)}" alt="${escapeHtml(lead.headline)}">`
        : renderImageOrPlaceholder(null, 'Photo');

    const leadBody = lead.body || '';
    const deckText = leadBody.replace(/\n+/g, ' ');
    const deck = deckText.length > 200 ? deckText.substring(0, 200) + '...' : deckText;

    return `
        <div class="nws-lead-main" data-article-id="${lead.id}">
            <span class="nws-section-tag">${escapeHtml(categoryLabel(lead.category))}</span>
            <h2 class="nws-lead-headline">${escapeHtml(lead.headline)}</h2>
            <p class="nws-lead-deck">${escapeHtml(deck)}</p>
            <div class="nws-byline">
                <span class="nws-author">${escapeHtml(lead.author_name)}</span>
                <span class="nws-dot">&middot;</span>
                <span>${escapeHtml(dateLabel)}</span>
            </div>
            <div class="nws-lead-body">
                ${formatLeadPreview(leadBody)}
            </div>
        </div>
        <div class="nws-lead-sidebar">
            <div class="nws-lead-image">${leadImageHtml}</div>
            <p class="nws-img-caption">${lead.image_url ? escapeHtml(lead.headline) : '<span class="nws-placeholder">[Photo]</span>'}</p>
            ${sidebarHtml}
        </div>
    `;
}

function buildSecondaryGridHtml(articles) {
    if (articles.length === 0) return '';
    return articles.map(a => {
        const imgHtml = a.image_url
            ? `<img src="${escapeHtml(a.image_url)}" alt="${escapeHtml(a.headline)}" style="width:100%;height:100%;object-fit:cover;">`
            : `<div class="nws-img-ph" style="background:${categoryGradient(a.category)};">${escapeHtml(categoryLabel(a.category))}</div>`;
        return `<div class="nws-sec-story" data-article-id="${a.id}">
            <div class="nws-sec-image">${imgHtml}</div>
            <span class="nws-section-tag">${escapeHtml(categoryLabel(a.category))}</span>
            <h3 class="nws-sec-headline">${escapeHtml(a.headline)}</h3>
            <p class="nws-sec-deck">${escapeHtml((a.body || '').replace(/\n+/g, ' ').substring(0, 150))}${(a.body || '').length > 150 ? '...' : ''}</p>
            <div class="nws-byline"><span class="nws-author">${escapeHtml(a.author_name)}</span></div>
        </div>`;
    }).join('');
}

function buildOpinionStripHtml(articles) {
    if (articles.length === 0) return '';
    const cardsHtml = articles.map(a => {
        const quote = (a.body || '').length > 80 ? (a.body || '').substring(0, 80) + '...' : (a.body || '');
        return `<div class="nws-op-card" data-article-id="${a.id}">
            <div class="nws-op-author">${escapeHtml(a.author_name)} &mdash; Opinion</div>
            <div class="nws-op-headline">&ldquo;${escapeHtml(quote)}&rdquo;</div>
        </div>`;
    }).join('');
    return `<div class="nws-opinion-strip">
        <div class="nws-opinion-inner">
            <div class="nws-opinion-label">&mdash; Opinion &amp; Commentary &mdash;</div>
            <div class="nws-opinion-grid">${cardsHtml}</div>
        </div>
    </div>`;
}

function buildBriefsHtml(articles) {
    if (articles.length === 0) return '';
    return articles.map((a, i) => `
        <div class="nws-brief-row" data-article-id="${a.id}">
            <div class="nws-brief-num">${i + 1}</div>
            <div class="nws-brief-text">
                <strong>${escapeHtml(a.headline)}</strong>
                ${escapeHtml((a.body || '').replace(/\n+/g, ' ').substring(0, 100))}${(a.body || '').length > 100 ? '...' : ''}
            </div>
        </div>
    `).join('');
}


// ==================== VOLBAL LIGUE NATIONALE ====================

function _vlnGetPoints(r) { return (r.w * 3) + r.d; }

function _vlnSortedTable(standings) {
    return Object.values(standings).sort((a, b) => {
        const ptsDiff = _vlnGetPoints(b) - _vlnGetPoints(a);
        if (ptsDiff !== 0) return ptsDiff;
        return b.w - a.w;
    });
}

function _vlnFormDot(result) {
    const colors = { W: '#1a4a1a', D: '#8a6a20', L: '#8b1a1a' };
    return `<span class="vln-form-dot" style="background:${colors[result] || '#999'}"></span>`;
}

function _vlnPosClass(pos, total) {
    if (pos <= 3) return 'vln-pos-top';
    if (pos >= total - 2) return 'vln-pos-bottom';
    return '';
}

function _vlnRenderTable(standings, opts = {}) {
    const rows = _vlnSortedTable(standings);
    const muted = opts.muted || false;
    const totalTeams = rows.length;

    let html = `<div class="vln-table${muted ? ' vln-table-muted' : ''}">
        <div class="vln-thead">
            <span class="vln-col-pos">#</span>
            <span class="vln-col-name">Club</span>
            <span class="vln-col-stat">W</span>
            <span class="vln-col-stat">D</span>
            <span class="vln-col-stat">L</span>
            <span class="vln-col-pts">Pts</span>
            ${muted ? '' : '<span class="vln-col-form">Form</span>'}
        </div>`;

    rows.forEach((r, i) => {
        const pos = i + 1;
        const posClass = _vlnPosClass(pos, totalTeams);
        const zoneBreak = (pos === 3 || pos === 7) ? ' vln-zone-break' : '';
        const pts = _vlnGetPoints(r);
        const formDots = muted ? '' : r.form.map(f => _vlnFormDot(f)).join('');

        html += `<div class="vln-row${zoneBreak}">
            <span class="vln-col-pos ${posClass}">${pos}</span>
            <span class="vln-col-name">${r.name}</span>
            <span class="vln-col-stat">${r.w}</span>
            <span class="vln-col-stat">${r.d}</span>
            <span class="vln-col-stat">${r.l}</span>
            <span class="vln-col-pts">${pts}</span>
            ${muted ? '' : `<span class="vln-col-form">${formDots}</span>`}
        </div>`;
    });

    html += '</div>';
    return html;
}

function _vlnRenderMOTW(motw, matchweek) {
    if (!motw) return '';
    return `<div class="vln-motw">
        <div class="vln-motw-label">Match of the Week:</div>
        <div class="vln-motw-result">
            <span class="vln-motw-team">${motw.homeName}</span>
            <span class="vln-motw-score">${motw.homeScore} &mdash; ${motw.awayScore}</span>
            <span class="vln-motw-team">${motw.awayName}</span>
        </div>
        <div class="vln-motw-week">&mdash; Matchweek ${matchweek}</div>
    </div>`;
}

async function loadAndRenderVLN() {
    const widget = document.getElementById('vln-widget');
    if (!widget || !_supabase) return;

    try {
        const { data: vln, error } = await _supabase
            .from('vln_state')
            .select('*')
            .eq('shard_name', 'Alpha Shard')
            .maybeSingle();

        if (error || !vln) {
            widget.innerHTML = `
                <div class="nws-col-header">Volbal Ligue Nationale</div>
                <div class="vln-offseason">Season concludes in March.</div>`;
            return;
        }

        const currentTick = _state?.shard?.current_tick ?? 0;
        const year = 2000 + Math.floor(currentTick / 12);

        let bodyHtml = '<div class="nws-col-header">Volbal Ligue Nationale</div>';

        if (!vln.active) {
            // Off-season
            const hasStandings = vln.standings && Object.keys(vln.standings).length > 0
                && Object.values(vln.standings).some(r => r.played > 0);
            if (hasStandings) {
                bodyHtml += `<div class="vln-offseason">Off-season. Final standings below.</div>`;
                bodyHtml += `<div class="vln-final-label">Final Standings &mdash; Year ${vln.season}</div>`;
                bodyHtml += _vlnRenderTable(vln.standings, { muted: true });
            } else {
                bodyHtml += `<div class="vln-offseason">Season concludes in March.</div>`;
            }
        } else {
            // Active season
            const seasonComplete = vln.matchweek >= 18
                || (vln.fixtures || []).every(f => f.played);
            if (seasonComplete && (!vln.last_results || vln.last_results.length === 0)) {
                bodyHtml += `<div class="vln-matchweek">Final Standings</div>`;
            } else {
                bodyHtml += `<div class="vln-matchweek">Matchweek ${vln.matchweek} of 18</div>`;
            }
            bodyHtml += _vlnRenderTable(vln.standings);
            bodyHtml += _vlnRenderMOTW(vln.match_of_week, vln.matchweek);
        }

        widget.innerHTML = bodyHtml;
    } catch (e) {
        console.error('[VLN] Widget render failed:', e);
    }
}
