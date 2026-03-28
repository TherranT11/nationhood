INSERT INTO system_config (key, value) VALUES ('admin_panel_html', $$
<div class="admin-container">
        <button class="logout-btn" onclick="logout()">Logout</button>
        <h1>🛡️ Admin Control Panel</h1>

        <!-- Global Stats -->
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-label">Total Nations</div><div class="stat-value" id="stat-nations">—</div></div>
            <div class="stat-card"><div class="stat-label">Total Players</div><div class="stat-value" id="stat-players">—</div></div>
            <div class="stat-card"><div class="stat-label">Active Parties</div><div class="stat-value" id="stat-parties">—</div></div>
            <div class="stat-card"><div class="stat-label">Current Tick</div><div class="stat-value" id="stat-tick">—</div></div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
            <button class="tab active" onclick="showTab('shard')">Shard</button>
            <button class="tab" onclick="showTab('elections')">Elections</button>
            <button class="tab" onclick="showTab('players')">Players</button>
            <button class="tab" onclick="showTab('voters')">Voters</button>
            <button class="tab" onclick="showTab('danger')">Danger Zone</button>
            <button class="tab" onclick="showTab('inspector')">Inspector</button>
            <button class="tab" onclick="showTab('audit')">Policy Audit</button>
            <button class="tab" onclick="showTab('ministries')">Ministries</button>
            <button class="tab" onclick="showTab('statconnect')">Stat Connector</button>
            <button class="tab" onclick="showTab('stataudit')">Stat Audit</button>
            <button class="tab" onclick="showTab('integrity')">Integrity</button>
        </div>

        <!-- ==================== SHARD TAB ==================== -->
        <div class="tab-content active" id="tab-shard">
            <h2>📊 Shard Status</h2>
            <div class="shard-info">
                <div class="info-row"><span class="info-label">Shard Name:</span><span class="info-value" id="info-name">Loading...</span></div>
                <div class="info-row"><span class="info-label">Current Date:</span><span class="info-value" id="info-date">Loading...</span></div>
                <div class="info-row"><span class="info-label">Current Tick:</span><span class="info-value" id="info-tick">Loading...</span></div>
                <div class="info-row"><span class="info-label">Next Tick At:</span><span class="info-value" id="info-next-tick">Loading...</span></div>
            </div>
            <div class="tick-interval-box">
                <h3>⏱️ Tick Interval</h3>
                <p style="color:#888; font-size:0.85rem; margin-bottom:15px;">Set how often the game advances. Changes apply after the next tick.</p>
                <div class="interval-selector">
                    <button class="interval-btn" data-hours="1" onclick="setTickInterval(1)">1 Hour</button>
                    <button class="interval-btn" data-hours="2" onclick="setTickInterval(2)">2 Hours</button>
                    <button class="interval-btn" data-hours="4" onclick="setTickInterval(4)">4 Hours</button>
                    <button class="interval-btn" data-hours="6" onclick="setTickInterval(6)">6 Hours</button>
                    <button class="interval-btn" data-hours="8" onclick="setTickInterval(8)">8 Hours</button>
                    <button class="interval-btn" data-hours="12" onclick="setTickInterval(12)">12 Hours</button>
                    <button class="interval-btn" data-hours="24" onclick="setTickInterval(24)">24 Hours</button>
                </div>
                <div id="interval-status" class="status success hidden"></div>
            </div>
            <button class="btn btn-primary" onclick="advanceTickAdmin()">⏭️ Advance Tick Manually</button>
            <button class="btn btn-primary" onclick="reprocessTickAdmin()" style="margin-left:8px;background:#b8860b;border-color:#b8860b;">🔄 Reprocess Current Tick</button>
            <div id="tick-status" class="status info hidden"></div>
        </div>

        <!-- ==================== ELECTIONS TAB ==================== -->
        <div class="tab-content" id="tab-elections">
            <h2>🗳️ Run Election</h2>
            <div class="info-box"><strong>ℹ️ Manual Election</strong><br>Run an election immediately for any nation. This bypasses the normal election schedule.</div>
            <div class="input-group">
                <label>Select Nation</label>
                <select id="election-nation-select" onchange="onElectionNationSelect()"><option value="">-- Choose a nation --</option></select>
            </div>
            <div id="election-nation-info" class="shard-info hidden">
                <div class="info-row"><span class="info-label">Government Type:</span><span class="info-value" id="election-info-gov-type">-</span></div>
                <div class="info-row"><span class="info-label">Total Seats:</span><span class="info-value" id="election-info-seats">-</span></div>
                <div class="info-row"><span class="info-label">Eligible Voters:</span><span class="info-value" id="election-info-voters">-</span></div>
                <div class="info-row"><span class="info-label">Parties:</span><span class="info-value" id="election-info-parties">-</span></div>
                <div class="info-row"><span class="info-label">Last Election:</span><span class="info-value" id="election-info-last">-</span></div>
                <div id="election-info-scheduled" class="info-row" style="display:none;"><span class="info-label">Next Scheduled:</span><span class="info-value" id="election-info-next">-</span></div>
                <div id="election-info-candidates" class="info-row" style="display:none;"><span class="info-label">Candidates:</span><span class="info-value" id="election-info-cand-status">-</span></div>
            </div>
            <!-- Election type selector (shown only for Presidential nations) -->
            <div id="election-type-selector" class="input-group" style="display:none;">
                <label>Election Type</label>
                <select id="election-type-select">
                    <option value="parliamentary">Parliamentary (midterm — seats only, president stays)</option>
                    <option value="presidential">General Election (parliamentary seats + presidential vote)</option>
                </select>
            </div>
            <div id="election-type-warning" style="display:none;background:#3a2a1a;border:1px solid #d48a3c;border-radius:6px;padding:10px 14px;margin-bottom:10px;font-size:0.82rem;color:#d48a3c;"></div>
            <div style="display:flex; gap:10px; margin-bottom:10px;">
                <button class="btn btn-success" style="flex:1;" id="run-election-btn" disabled onclick="runElection()">🗳️ RUN ELECTION NOW</button>
                <button class="btn btn-secondary" style="flex:1;" id="preview-election-btn" disabled onclick="previewElection()">🔍 PREVIEW ELECTION</button>
            </div>
            <div id="election-status" class="status info hidden"></div>
            <div id="election-results" class="election-results hidden">
                <h3 style="color: #5cb85c; margin-bottom: 15px;">📊 Election Results</h3>
                <div id="election-results-content"></div>
            </div>
            <div id="election-preview" class="election-results hidden" style="border-color:#d48a3c;">
                <h3 id="election-preview-header" style="color: #d48a3c; margin-bottom: 15px;">🔍 Election Preview (Client-Side Simulation)</h3>
                <div id="election-preview-summary" style="color:#ccc; font-size:0.85rem; margin-bottom:12px;"></div>
                <div id="election-preview-content"></div>
                <div id="election-preview-blocs" style="margin-top:15px;"></div>
            </div>

            <!-- ========== SCHEDULE ELECTION ========== -->
            <hr style="border-color:#333; margin:20px 0;">
            <h3>📅 Schedule Election</h3>
            <div class="info-box"><strong>ℹ️ Schedule elections</strong><br>Set the first election tick and frequency for a nation. The system auto-schedules all subsequent elections after each one completes. Frequency is saved to the nation and used by advanceTick.</div>
            <div class="input-group">
                <label>Nation</label>
                <select id="schedule-nation-select" onchange="onScheduleNationChange()">
                    <option value="__all__">All Nations (Democracies)</option>
                </select>
            </div>
            <div class="input-group">
                <label>Election Type</label>
                <select id="schedule-type-select" onchange="updateElectionPreviewList()">
                    <option value="parliamentary">Parliamentary</option>
                    <option value="presidential">Presidential (Presidential Republics Only)</option>
                </select>
            </div>
            <div class="input-group">
                <label>Election Frequency (ticks between elections)</label>
                <select id="schedule-frequency-select" onchange="updateElectionPreviewList()">
                    <option value="24">Every 24 ticks (2 years)</option>
                    <option value="36">Every 36 ticks (3 years)</option>
                    <option value="48" selected>Every 48 ticks (4 years)</option>
                    <option value="60">Every 60 ticks (5 years)</option>
                    <option value="72">Every 72 ticks (6 years)</option>
                    <option value="84">Every 84 ticks (7 years)</option>
                </select>
                <div style="font-size:0.75rem;color:#888;" id="schedule-freq-hint"></div>
            </div>
            <div class="input-group">
                <label>First Election Tick</label>
                <input type="number" id="schedule-tick-input" min="1" placeholder="e.g. 24" oninput="updateElectionPreviewList()">
                <div style="font-size:0.75rem;color:#888;" id="schedule-tick-hint"></div>
            </div>

            <!-- Projected Elections Preview -->
            <div id="schedule-preview-box" style="background:#1a1a17; border:1px solid rgba(255,255,255,0.08); border-radius:4px; padding:12px 14px; margin-bottom:14px; display:none;">
                <div style="font-family:'JetBrains Mono',monospace; font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#8a8778; margin-bottom:8px;">Projected Elections</div>
                <div id="schedule-preview-list" style="font-family:'JetBrains Mono',monospace; font-size:0.8rem; color:#c8c4b8; line-height:1.8;"></div>
            </div>

            <button class="btn btn-primary" style="width:100%;" id="schedule-election-btn" onclick="scheduleElection()">📅 SCHEDULE ELECTION & SAVE FREQUENCY</button>
            <div id="schedule-status" class="status info hidden"></div>
        </div>


        <!-- ==================== PLAYERS TAB ==================== -->
        <div class="tab-content" id="tab-players">
            <h2>👥 Player Management</h2>
            <p style="color: #888; font-size: 0.9rem; margin-bottom: 15px;">View all players, their nation status, and manage accounts.</p>
            <div style="margin-bottom:20px; display:flex; gap:8px; flex-wrap:wrap;">
                <button class="btn btn-secondary" style="padding:8px 16px; font-size:0.8rem;" onclick="filterPlayers('all')">All</button>
                <button class="btn btn-success" style="padding:8px 16px; font-size:0.8rem;" onclick="filterPlayers('active')">In Nation</button>
                <button class="btn btn-warning" style="padding:8px 16px; font-size:0.8rem;" onclick="filterPlayers('orphaned')">No Nation</button>
                <button class="btn" style="padding:8px 16px; font-size:0.8rem; background:#aa3300; color:#fff;" onclick="filterPlayers('inactive')">Inactive</button>
            </div>
            <div id="player-count" style="color:#888; font-size:0.85rem; margin-bottom:15px;"></div>
            <div id="players-list"></div>
        </div>

        <!-- ==================== VOTERS TAB ==================== -->
        <div class="tab-content" id="tab-voters">
            <h2>🗳️ Voter Bloc Management</h2>
            <p style="color:#888; font-size:0.9rem; margin-bottom:20px;">
                Create and manage named voter blocs per nation. Each bloc has ideology scores, population weight, and priority issues.
            </p>

            <!-- Nation Selector -->
            <div class="input-group">
                <label>Select Nation</label>
                <select id="voter-nation-select" onchange="onVoterNationSelect()">
                    <option value="">-- Choose a nation --</option>
                </select>
            </div>

            <!-- Everything below hidden until nation selected -->
            <div id="voter-nation-info" class="hidden">

                <!-- Population & Eligible Voters -->
                <div class="shard-info">
                    <div class="info-row">
                        <span class="info-label">Total Population:</span>
                        <span class="info-value" id="voter-pop-display">—</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Eligible Voters:</span>
                        <span style="display:flex; align-items:center; gap:10px;">
                            <input type="number" id="voter-eligible-input" class="eligible-input" min="0">
                            <span id="voter-eligible-pct" style="color:#888; font-size:0.85rem;"></span>
                        </span>
                    </div>
                </div>

                <!-- Ideology Axis Sliders -->
                <div style="margin:24px 0;">
                    <h3 style="color:#ffcc00; font-size:1rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:16px;">
                        Nation Ideology Axes
                    </h3>
                    <p style="color:#888; font-size:0.85rem; margin-bottom:16px;">
                        Each slider sets the national population split for this ideology axis. These values define the electorate's ideological landscape.
                    </p>
                    <div id="ideology-sliders-container"></div>
                </div>

                <!-- Save Axes -->
                <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-bottom:30px;">
                    <button class="btn btn-primary" onclick="saveAxes()">Save All</button>
                    <button class="btn btn-secondary" onclick="autoFillAllVars()">Auto-fill Variance from Polarization</button>
                    <button class="btn btn-secondary" onclick="resetAxesToSaved()">Reset</button>
                    <span id="axes-save-status" style="font-weight:bold;"></span>
                </div>

                <!-- Divider -->
                <div style="border-top:2px solid #333; margin:30px 0;"></div>

                <h3 style="color:#CE93D8; font-size:1rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">
                    Voter Blocs
                </h3>
                <p style="color:#888; font-size:0.85rem; margin-bottom:16px;">
                    Named demographic groups with ideology scores and population weights. Parties have separate approval ratings with each bloc.
                </p>

                <!-- Weight Validator -->
                <div class="weight-validator" id="weight-validator">
                    <span class="weight-validator-label">Total Population Weight:</span>
                    <span class="weight-validator-value" id="weight-total">0%</span>
                    <span class="weight-validator-status" id="weight-status"></span>
                </div>

                <!-- Action Buttons -->
                <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:24px;">
                    <button class="btn btn-primary" onclick="showAddBlocForm()">+ Add Bloc</button>
                </div>

                <div id="bloc-action-status" style="margin-bottom:16px;"></div>

                <!-- Add/Edit Bloc Form (hidden by default) -->
                <div id="bloc-form-container" class="hidden"></div>

                <!-- Existing Blocs List -->
                <div id="existing-blocs-display">
                    <div class="no-players">Select a nation to view voter blocs.</div>
                </div>
            </div>
        </div>

        <!-- ==================== DANGER ZONE TAB ==================== -->
        <div class="tab-content" id="tab-danger">
            <h2>🔥 Danger Zone</h2>

            <!-- Seed Snapshot Section -->
            <div style="background:#1a2a1a; border:1px solid #5cb85c; border-radius:8px; padding:16px; margin-bottom:24px;">
                <strong style="color:#5cb85c;">📸 Seed Snapshot</strong><br>
                <p style="color:#aaa; font-size:0.85rem; margin:8px 0;">
                    Saves every nation's current stats as the reset point. When you reset the shard, nation stats will be restored to this snapshot.
                    Do this once after setting up nations and before starting gameplay.
                </p>
                <button class="btn btn-success" onclick="snapshotSeedStats()">Save Current Stats as Seed</button>
                <span id="seed-status" style="margin-left:12px;"></span>
                <div id="seed-info" style="margin-top:8px; font-size:0.8rem; color:#888;"></div>
            </div>

            <!-- Reset Section -->
            <div class="warning">
                <strong>⚠️ FULL SHARD RESET</strong><br><br>
                This will:<br>
                • Reset game date to January, 2000 &amp; tick to 0<br>
                • Restore ALL nation stats from seed snapshot<br>
                • <strong>DELETE</strong> all political parties (players must recreate)<br>
                • Clear all bills, laws, elections, administrations<br>
                • Clear all ministry events, PM candidates, crises<br>
                • Clear event logs, campaign actions, history<br>
                • Reset voter bloc approvals<br>
                • Clear diplomatic messages, proposals, action logs<br>
                • Does NOT delete user accounts<br>
                • Does NOT delete voter blocs, policies, or templates
            </div>
            <button class="btn btn-danger btn-full" id="reset-btn" onclick="resetShard()">🔥 RESET ALPHA SHARD 🔥</button>
            <div id="reset-status" class="status info hidden"></div>
            <div id="reset-log" style="margin-top:12px; font-size:0.8rem; color:#aaa; max-height:300px; overflow-y:auto;"></div>
        </div>

        <!-- ==================== INSPECTOR TAB ==================== -->
        <div class="tab-content" id="tab-inspector">
            <h2>🔍 Nation Inspector</h2>
            <p style="color:#888; font-size:0.9rem; margin-bottom:20px;">
                Browse any game page for any nation. Optionally view as a specific faction to see their ministries, AP, etc.
            </p>

            <div style="display:flex; gap:12px; align-items:flex-end; flex-wrap:wrap; margin-bottom:12px;">
                <div class="input-group" style="flex:1; min-width:200px; margin-bottom:0;">
                    <label>Nation</label>
                    <select id="inspector-nation-select" onchange="loadInspectorFactions()">
                        <option value="">-- Choose a nation --</option>
                    </select>
                </div>
                <div class="input-group" style="flex:1; min-width:200px; margin-bottom:0;">
                    <label>View As (Faction)</label>
                    <select id="inspector-faction-select">
                        <option value="">— Default (your account) —</option>
                    </select>
                </div>
            </div>
            <div style="display:flex; gap:12px; align-items:flex-end; flex-wrap:wrap; margin-bottom:20px;">
                <div class="input-group" style="flex:1; min-width:200px; margin-bottom:0;">
                    <label>Page</label>
                    <select id="inspector-page-select">
                        <option value="politics.html">🎭 Politics</option>
                        <option value="elections.html">🗳️ Elections</option>
                        <option value="government.html">🏛️ Government</option>
                        <option value="nation.html">📊 Nation Stats</option>
                        <option value="economy.html">💰 Economy</option>
                        <option value="laws.html">📜 Laws</option>
                        <option value="bill.html">📝 Bills</option>
                        <option value="factions.html">⚔️ Factions</option>
                        <option value="conflict.html">💥 Conflict</option>
                        <option value="diplomacy.html">🤝 Diplomacy</option>
                        <option value="select-candidate.html?role=pm">👤 Select PM</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="loadInspector()" style="margin-bottom:0; height:44px;">
                    🔍 LOAD
                </button>
                <button class="btn btn-secondary" onclick="openInspectorNewTab()" style="margin-bottom:0; height:44px;" title="Open in new browser tab">
                    ↗ NEW TAB
                </button>
            </div>

            <div id="inspector-current" class="shard-info hidden" style="margin-bottom:15px;">
                <div class="info-row">
                    <span class="info-label">Viewing:</span>
                    <span class="info-value" id="inspector-current-label">—</span>
                </div>
            </div>

            <div id="inspector-frame-container" class="hidden" style="position:relative;">
                <div style="display:flex; gap:8px; margin-bottom:10px;">
                    <button class="btn btn-secondary" style="padding:6px 14px; font-size:0.8rem;" onclick="reloadInspector()">🔄 Reload</button>
                    <button class="btn btn-secondary" style="padding:6px 14px; font-size:0.8rem;" onclick="resizeInspector('600px')">S</button>
                    <button class="btn btn-secondary" style="padding:6px 14px; font-size:0.8rem;" onclick="resizeInspector('900px')">M</button>
                    <button class="btn btn-secondary" style="padding:6px 14px; font-size:0.8rem;" onclick="resizeInspector('1200px')">L</button>
                </div>
                <iframe id="inspector-frame" style="width:100%; height:900px; border:2px solid #333; border-radius:6px; background:#0a0a0a;"></iframe>
            </div>
        </div>

        <div class="tab-content" id="tab-audit">
            <h2>Policy Audit</h2>
            <p style="color:#888; margin-bottom:16px;">Review all active policies across all nations with their computed annual budget costs.</p>
            <button class="btn btn-primary" onclick="runPolicyAudit()">Run Policy Audit</button>
            <button class="btn btn-primary" onclick="recalculatePolicyCosts()" style="margin-left:8px; background:#e67e22;">Recalculate Policy Costs</button>
            <div id="audit-status" class="status info hidden"></div>
            <div id="audit-results" style="margin-top:20px;"></div>
        </div>

        <!-- ==================== MINISTRIES TAB ==================== -->
        <div class="tab-content" id="tab-ministries">
            <h2>Ministry Institution Config</h2>
            <p style="color:#888; margin-bottom:16px;">Set the base cost per capita and stat attachments for each ministry institution. Changes are saved to the database and apply immediately.</p>

            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap;">
                <label style="font-family:var(--font-mono, monospace);font-size:0.72rem;color:#888;text-transform:uppercase;letter-spacing:0.06em;">Preview Nation</label>
                <select id="mc-nation-select" onchange="onMCNationChange(this.value)" style="padding:4px 8px;background:#1a1a18;border:1px solid #333;color:#ccc;font-size:0.82rem;min-width:200px;"></select>
                <button onclick="commitAllAllocations()" style="font-family:var(--font-mono, monospace);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding:5px 14px;background:#5cb85c;border:1px solid #4a9a4a;color:#fff;cursor:pointer;">Commit All to Budget</button>
            </div>

            <div id="ministry-config-status" class="status success hidden"></div>
            <div id="ministry-config-body" style="margin-top:12px;">Loading...</div>
        </div>

        <!-- ==================== STAT CONNECTOR TAB ==================== -->
        <div class="tab-content" id="tab-statconnect">
            <h2>Stat Connector</h2>
            <p style="color:#888; margin-bottom:8px;">Define how stats influence each other. When a source stat crosses a threshold, the target stat is nudged each tick. Changes are saved to the database and processed by the tick engine.</p>

            <!-- Overview stats -->
            <div id="sc-overview" class="sc-overview-grid"></div>

            <!-- Sub-tabs -->
            <div class="sc-tabs">
                <button class="sc-tab active" onclick="showScTab('connections')">CONNECTIONS <span id="sc-tab-count" style="color:#555;font-size:0.8em;"></span></button>
                <button class="sc-tab" onclick="showScTab('cascade')">CASCADE MAP</button>
                <button class="sc-tab" onclick="showScTab('safety')">LOOP DETECTOR</button>
            </div>

            <!-- Connections sub-tab -->
            <div class="sc-subtab active" id="sc-sub-connections">
                <div class="sc-toolbar">
                    <div class="sc-filters">
                        <div class="sc-filter-group">
                            <label>CATEGORY</label>
                            <select id="sc-filter-cat" onchange="renderScConnections()">
                                <option value="all">All Categories</option>
                                <option value="economic">ECONOMIC</option>
                                <option value="governance">GOVERNANCE</option>
                                <option value="stability">STABILITY</option>
                                <option value="social">SOCIAL &amp; SERVICES</option>
                            </select>
                        </div>
                        <div class="sc-filter-group">
                            <label>STAT</label>
                            <select id="sc-filter-stat" onchange="renderScConnections()">
                                <option value="">All Stats</option>
                            </select>
                        </div>
                        <button class="btn-secondary" style="padding:6px 12px; font-size:0.75rem;" onclick="document.getElementById('sc-filter-cat').value='all'; document.getElementById('sc-filter-stat').value=''; renderScConnections();">CLEAR</button>
                        <span id="sc-filter-info" style="color:#666; font-size:0.8rem; margin-left:auto;"></span>
                    </div>
                    <button class="btn-success" style="padding:8px 16px; font-size:0.8rem; white-space:nowrap;" onclick="addScConnection()">+ NEW CONNECTION</button>
                </div>
                <div id="sc-connection-list"></div>
            </div>

            <!-- Cascade sub-tab -->
            <div class="sc-subtab" id="sc-sub-cascade">
                <div id="sc-cascade-body"></div>
            </div>

            <!-- Safety sub-tab -->
            <div class="sc-subtab" id="sc-sub-safety">
                <div id="sc-safety-body"></div>
            </div>
        </div>

        <!-- ==================== STAT AUDIT TAB ==================== -->
        <div class="tab-content" id="tab-stataudit">
            <h2>Stat Delta Audit</h2>
            <p style="color:#888; margin-bottom:16px;">
                Investigate why a nation stat changed. Shows every system that touches the chosen stat this tick:
                active laws, stat connections, crises, ministry actions, leader traits, and natural decay.
            </p>
            <div style="display:flex; gap:12px; align-items:flex-end; flex-wrap:wrap; margin-bottom:20px;">
                <div class="input-group" style="flex:1; min-width:200px; margin-bottom:0;">
                    <label>Nation</label>
                    <select id="sa-nation-select"></select>
                </div>
                <div class="input-group" style="flex:1; min-width:200px; margin-bottom:0;">
                    <label>Stat</label>
                    <select id="sa-stat-select"></select>
                </div>
                <button class="btn btn-primary" onclick="runStatAudit()" style="margin-bottom:0; height:44px;">
                    Run Audit
                </button>
            </div>
            <div id="sa-results" style="font-family:monospace; font-size:0.85rem; white-space:pre-wrap; color:#ccc;"></div>

            <div id="sa-revise-section" style="display:none; margin-top:20px; padding:16px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px;">
                <h3 style="margin:0 0 8px 0; font-size:0.95rem; color:#fa0;">Revise Stat</h3>
                <p style="color:#888; margin:0 0 12px 0; font-size:0.82rem;">Override the current value of this stat. Use this to fix bugged stat values.</p>
                <div style="display:flex; gap:10px; align-items:flex-end;">
                    <div class="input-group" style="margin-bottom:0; width:120px;">
                        <label>New Value (1–100)</label>
                        <input type="number" id="sa-revise-value" min="1" max="100" step="1" placeholder="50" style="width:100%;">
                    </div>
                    <button class="btn btn-primary" onclick="reviseStatValue()" style="margin-bottom:0; height:44px; background:#fa0; border-color:#fa0;">
                        Revise
                    </button>
                </div>
                <div id="sa-revise-result" style="margin-top:10px; font-size:0.85rem;"></div>
            </div>
        </div>

        <!-- ==================== INTEGRITY TAB ==================== -->
        <div class="tab-content" id="tab-integrity">
            <h2>Player Integrity</h2>
            <p style="color:#888; font-size:0.9rem; margin-bottom:15px;">Detect multi-account abuse, view fingerprint clusters, and manage bans.</p>

            <!-- Sub-tabs -->
            <div style="display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap;">
                <button class="btn btn-secondary int-btn active" id="int-btn-clusters" style="padding:8px 16px; font-size:0.8rem;" onclick="showIntegrityView('clusters')">Suspicious Clusters</button>
                <button class="btn btn-secondary int-btn" id="int-btn-all" style="padding:8px 16px; font-size:0.8rem;" onclick="showIntegrityView('all')">All Fingerprints</button>
                <button class="btn btn-secondary int-btn" id="int-btn-bans" style="padding:8px 16px; font-size:0.8rem;" onclick="showIntegrityView('bans')">Active Bans</button>
                <button class="btn btn-secondary int-btn" id="int-btn-timeline" style="padding:8px 16px; font-size:0.8rem;" onclick="showIntegrityView('timeline')">Creation Timeline</button>
            </div>

            <div id="integrity-status" style="color:#888; font-size:0.85rem; margin-bottom:15px;"></div>
            <div id="integrity-content" style="font-size:0.9rem;"></div>
        </div>


    </div>
$$);
