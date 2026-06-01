import{_ as de}from"./preload-helper-BXl3LOEh.js";import{t as q}from"./utils-CzgKGX6o.js";import{f as pe}from"./government-structure-DBjJ7E-l.js";let h=null,g=null,D=[],S="all",N=null,F=null,W=null,x=null,G=!1,$="cruceran",Z=!1;const U={cruceran:{key:"cruceran",name:"The Cruceran",tagline:"Truth in the service of the people",nations:["Avelia","Palvera","San Estrella","Montequilla","Melizea","Sangreza","Sierramar"],style:"cruceran"},continental:{key:"continental",name:"The Continental",tagline:"Where Ideas Converge",nations:["Calveth","Flandis","Vostia","Dravka"],style:"continental"},alsahwa:{key:"alsahwa",name:"Al-Sahwa",tagline:"Independent Voice of Al-Makir",nations:["Hajjara"],continent:"Al-Makir",style:"alsahwa"}};function ve(e){for(const[s,n]of Object.entries(U))if(n.nations.some(t=>t.toLowerCase()===(e||"").toLowerCase()))return s;return"cruceran"}function ne(e,s){const n=U[e];return n?n.nations.some(t=>t.toLowerCase()===(s||"").toLowerCase())?!0:j&&j.length>0?n.nations.some(t=>j.includes(t.toLowerCase())):!1:!1}let j=[];const we=["Winter","Spring","Spring","Spring","Summer","Summer","Summer","Fall","Fall","Fall","Winter","Winter"];function H(e){const s=e%12,n=2e3+Math.floor(e/12),t=we[s],i=s===0?n-1:n;return`${t} ${i}`}async function K(e,s){h=e,g=s,N=null,S="all",W=null;const n=document.getElementById("newspaper-root");if(!n)return;j=[],Z||($=ve(s.nation?.name));const t=s.shard?.current_date||"[Month], [Year]",i=ne($,s.nation?.name),l="Write Article",a=Object.entries(U).map(([o,r])=>`<option value="${o}" ${o===$?"selected":""}>${r.name}</option>`).join("");n.innerHTML=`<div class="newspaper-container nws-pub-${$}">

        <!-- TOP RIBBON -->
        <div class="nws-top-ribbon${$==="continental"?" nws-top-ribbon--continental":$==="alsahwa"?" nws-top-ribbon--alsahwa":""}">
            <div class="nws-top-ribbon-inner">
                <span>${t}</span>
                <select class="nws-pub-switcher" id="nws-pub-switcher">${a}</select>
                ${i?`<span><button class="nws-write-btn" id="nws-write-article-btn">${l}</button></span>`:""}
            </div>
        </div>

        ${$==="alsahwa"?`
        <!-- AL-SAHWA GEOMETRIC BORDER -->
        <div class="nws-alsahwa-geo-border"></div>

        <!-- AL-SAHWA MASTHEAD -->
        <div class="nws-alsahwa-masthead">
            <div class="nws-alsahwa-masthead-inner">
                <div class="nws-alsahwa-brand">
                    <div class="nws-alsahwa-mark">
                        <div class="nws-alsahwa-mark-outer"></div>
                        <div class="nws-alsahwa-mark-inner"></div>
                        <div class="nws-alsahwa-mark-dot"></div>
                    </div>
                    <div class="nws-alsahwa-titles">
                        <div class="nws-alsahwa-arabic">الصحوة</div>
                        <div class="nws-alsahwa-english">Al-Sahwa</div>
                        <div class="nws-alsahwa-subtitle">Independent Voice of Al-Makir</div>
                    </div>
                </div>
                <div class="nws-alsahwa-right">
                    <div class="nws-alsahwa-date">${t}</div>
                    ${i?`<button class="nws-alsahwa-watch" id="nws-write-article-btn-alsahwa">${l}</button>`:""}
                </div>
            </div>
        </div>

        <!-- AL-SAHWA NAV -->
        <nav class="nws-alsahwa-nav">
            <div class="nws-alsahwa-nav-inner">
                <a class="nws-alsahwa-nav-item nws-alsahwa-nav-item--active" data-cat="all">Front Page</a>
                <a class="nws-alsahwa-nav-item" data-cat="politics">Governance</a>
                <a class="nws-alsahwa-nav-item" data-cat="economy">Economy</a>
                <a class="nws-alsahwa-nav-item" data-cat="business">Energy</a>
                <a class="nws-alsahwa-nav-item" data-cat="social">Society</a>
                <a class="nws-alsahwa-nav-item" data-cat="international">World</a>
                <a class="nws-alsahwa-nav-item" data-cat="opinion">Opinion</a>
                <a class="nws-alsahwa-nav-item" data-cat="entertainment">Culture</a>
                <a class="nws-alsahwa-nav-item" data-cat="sports">Sport</a>
            </div>
        </nav>

        <!-- AL-SAHWA ENERGY STRIP -->
        <div class="nws-alsahwa-energy">
            <div class="nws-alsahwa-energy-inner">
                <span class="nws-alsahwa-energy-label">Energy</span>
                <span class="nws-alsahwa-energy-item"><span class="nws-alsahwa-energy-name">Brent</span> <span class="nws-alsahwa-energy-val">$72.40</span> <span class="nws-alsahwa-energy-up">▲ 2.1%</span></span>
                <span class="nws-alsahwa-energy-item"><span class="nws-alsahwa-energy-name">WTI</span> <span class="nws-alsahwa-energy-val">$68.20</span> <span class="nws-alsahwa-energy-up">▲ 1.8%</span></span>
                <span class="nws-alsahwa-energy-item"><span class="nws-alsahwa-energy-name">LNG</span> <span class="nws-alsahwa-energy-val">$14.80</span> <span class="nws-alsahwa-energy-up">▲ 8.2%</span></span>
                <span class="nws-alsahwa-energy-item"><span class="nws-alsahwa-energy-name">Gold</span> <span class="nws-alsahwa-energy-val">$1,412</span> <span class="nws-alsahwa-energy-up">▲ 3.4%</span></span>
            </div>
        </div>`:$==="continental"?`
        <!-- CONTINENTAL MASTHEAD -->
        <div class="nws-continental-masthead">
            <div class="nws-continental-masthead-top">
                <span class="nws-continental-edition">Continental Edition</span>
            </div>
            <div class="nws-continental-masthead-main">
                <h1 class="nws-continental-title">The Continental</h1>
                <span class="nws-continental-subtitle">Independent Journalism for Meridian</span>
            </div>
        </div>`:`
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
                <div class="nws-nav-item" data-category="economy">Business</div>
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
                        <div class="nws-img-ph" style="background:linear-gradient(135deg,#2a1a0a,#1a0d00);">Business</div>
                    </div>
                    <span class="nws-section-tag nws-placeholder">[Business]</span>
                    <h3 class="nws-sec-headline nws-placeholder">[Business Section Headline]</h3>
                    <p class="nws-sec-deck nws-placeholder">[Summary of a business-related article will appear here.]</p>
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
                    <span class="nws-ap-badge" id="nws-reward-badge" style="margin-right:24px;"></span>
                </div>
                <button class="nws-modal-close" id="nws-modal-close">&times;</button>
                <div class="nws-modal-body">
                    <div class="nws-writer-notice" role="note">
                        <strong>Note:</strong> Mentions of real-world events, people, or entities will cause your party to lose all Momentum. Further violations will cause action.
                    </div>
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
                            <option value="economy">Business</option>
                            <option value="international">International</option>
                            <option value="social">Social</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="sports">Sports</option>
                            <option value="opinion">Opinion</option>
                        </select>
                    </div>

                    <div class="nws-form-group" id="nws-targeting-group" style="display:none;">
                        <label for="nws-article-sector">Target Sector <span style="color:var(--text-secondary,#888);font-weight:400;">(optional)</span></label>
                        <select id="nws-article-sector"><option value="">— No sector effect —</option></select>
                        <label for="nws-article-party" style="margin-top:12px;display:block;">Target Party</label>
                        <select id="nws-article-party"><option value="">— Select a party —</option></select>
                        <div class="nws-file-info" id="nws-targeting-hint">Pick a sector + party to shift that party's popularity there: your own party <strong>+0.3</strong>, any other party <strong>−0.3</strong>. First article each tick only. Leave the sector blank to publish with no popularity effect.</div>
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
                        <textarea id="nws-article-body" placeholder="Write your article (minimum 4,000 characters, max 12,000). Use blank lines for paragraph breaks. Formatting: *italic*, **bold**, __underline__" maxlength="12000"></textarea>
                        <div class="nws-char-count" id="nws-char-count">0 / 12000</div>
                    </div>

                    <button class="nws-submit-btn" id="nws-submit-btn">Publish Article</button>
                </div>
            </div>
        </div>

    </div>`,ue(),me(),he(n),fe(n),ae(n),Ie(n),Ee(n);const p=document.getElementById("nws-pub-switcher");p&&p.addEventListener("change",async()=>{const o=p.value;if(o!==$){$=o,Z=!0;try{await K(h,g)}catch(r){console.error("[News] Publication switch failed:",r)}}});const d=s.faction?.faction_type==="corporation",m=s.faction?.faction_type==="party",v=document.getElementById("nws-reward-badge");v&&(v.textContent=d?"+1 Reputation (1st Article)":m?"±0.3 Sector Popularity (1st Article)":"");const w=document.getElementById("nws-targeting-group");if(w&&m&&s.nation?.id){w.style.display="";const o=s.faction?.id,[r,f]=await Promise.all([h.from("sectors").select("id, name").eq("nation_id",s.nation.id).eq("is_active",!0).order("name"),h.from("factions").select("id, faction_name, abbreviation").eq("nation_id",s.nation.id).eq("faction_type","party").is("abandoned_at",null)]);r.error&&console.warn("[News] sector load failed:",r.error.message),f.error&&console.warn("[News] party load failed:",f.error.message);const b=document.getElementById("nws-article-sector");b&&(b.innerHTML='<option value="">— No sector effect —</option>'+(r.data||[]).map(E=>`<option value="${E.id}">${c(E.name)}</option>`).join(""));const _=document.getElementById("nws-article-party");if(_){const E=(f.data||[]).slice().sort((k,y)=>k.id===o?-1:y.id===o?1:0);_.innerHTML='<option value="">— Select a party —</option>'+E.map(k=>`<option value="${k.id}">${c(k.faction_name||k.abbreviation||"Party")}${k.id===o?" (your party)":""}</option>`).join("")}}await R(),He(),Ne()}function ue(){const e=document.getElementById("nws-modal-overlay"),s=document.getElementById("nws-write-article-btn"),n=document.getElementById("nws-modal-close"),t=document.getElementById("nws-article-body"),i=document.getElementById("nws-char-count"),l=document.getElementById("nws-article-image"),a=document.getElementById("nws-file-label-text"),p=document.getElementById("nws-image-preview"),d=document.getElementById("nws-image-preview-img");s&&s.addEventListener("click",()=>{V(),e.classList.add("active")}),n&&n.addEventListener("click",()=>{e.classList.remove("active"),V()});const m=document.getElementById("nws-remove-image-btn");m&&m.addEventListener("click",()=>{G=!0;const v=document.getElementById("nws-image-preview");v&&(v.style.display="none");const w=document.getElementById("nws-file-label-text");w&&(w.textContent="Click to select an image..."),m.style.display="none"}),t&&i&&t.addEventListener("input",()=>{const v=t.value.length,w=v<4e3;i.textContent=w?`${v.toLocaleString()} / 4,000 min`:`${v.toLocaleString()} / 12,000`,i.style.color=w?"var(--dred, #c55)":"",i.classList.toggle("nws-near-limit",v>=11500)}),l&&l.addEventListener("change",()=>{const v=l.files[0];if(!v){a.textContent="Click to select an image...",p.style.display="none";return}const w=2*1024*1024;if(v.size>w){A("Image must be under 2MB."),l.value="",a.textContent="Click to select an image...",p.style.display="none";return}a.textContent=v.name;const o=new FileReader;o.onload=r=>{d.src=r.target.result,p.style.display="block"},o.readAsDataURL(v)})}function A(e){const s=document.getElementById("nws-form-error");s&&(s.textContent=e,s.style.display="block",setTimeout(()=>{s.style.display="none"},5e3))}function Q(e){const s=document.getElementById("nws-form-success");s&&(s.textContent=e,s.style.display="block",setTimeout(()=>{s.style.display="none"},5e3))}function me(){const e=document.getElementById("nws-submit-btn");e&&e.addEventListener("click",async()=>{if(e.disabled)return;const s=document.getElementById("nws-article-title").value.trim(),n=document.getElementById("nws-article-author").value.trim(),t=document.getElementById("nws-article-category").value,i=document.getElementById("nws-article-body").value.trim(),a=document.getElementById("nws-article-image").files[0]||null,p=!ne($,g?.nation?.name);if(!s)return A("Please enter a headline.");if(!n)return A("Please enter a writer name.");if(!t)return A("Please select a category.");if(!i)return A("Please write an article body.");if(i.length<4e3)return A("Article must be at least 4,000 characters. Currently: "+i.length.toLocaleString()+".");if(i.length>12e3)return A("Article body must be 12,000 characters or fewer.");const d=document.getElementById("nws-article-sector")?.value||"",m=document.getElementById("nws-article-party")?.value||"";if(!x&&g.faction?.faction_type==="party"&&!!d!=!!m)return A("To shift popularity, choose BOTH a sector and a party — or leave both blank.");const v=!!x;e.disabled=!0,e.textContent=v?"Updating...":"Publishing...";try{const{nation:w,faction:o,shard:r}=g;if(v){let f;a?f=await X(w.id,a):G&&(f=null);const b={headline:s,author_name:n,body:i,category:t};f!==void 0&&(b.image_url=f);const{error:_}=await h.from("player_articles").update(b).eq("id",x).eq("author_faction_id",o.id);if(_)throw _;Q("Article updated!")}else{if(p){const{deductAP:y}=await de(async()=>{const{deductAP:u}=await import("./config-BER7HlcX.js");return{deductAP:u}},[]),B=await y(h,o.id,1);if(!B.success){A("Not enough AP to post on another publication (need 1 AP).");return}o.action_points=B.newAp}let f=null;a&&(f=await X(w.id,a));const{error:b}=await h.from("player_articles").insert({nation_id:w.id,author_faction_id:o.id,author_name:n,headline:s,body:i,category:t,image_url:f,status:"published",published_tick:r?.current_tick||0,publication:$});if(b)throw b;const _=r?.current_tick||0,E=o?.faction_type==="corporation";let k="Article published!";if(E){let y=0;const{data:B,error:u}=await h.from("player_articles").select("id").eq("author_faction_id",o.id).eq("published_tick",_);if(u&&console.error("[News] Failed to count articles this tick:",u),!u&&(!B||B.length<=1))y=2;else try{const{data:I}=await h.from("active_laws").select("id, policies!inner(policy_key)").eq("nation_id",w.id).eq("is_reversal",!1).eq("policies.policy_key","internet_sovereignty").limit(1).maybeSingle();if(I){const L=await pe(h,w.id),M=new Set(L?.party_ids||[]);L?.lead_party_id&&M.add(L.lead_party_id),M.has(o.id)&&(y=1)}}catch(I){console.warn("[News] ISA coalition-bonus check failed:",I?.message||I)}if(y>0)try{const{error:I}=await h.rpc("adjust_momentum",{p_faction_id:o.id,p_delta:y,p_label:`News article published (+${y})`,p_tick:_});I?console.error("[News] Momentum reward failed:",I):k=`Article published! +${y} Momentum.`}catch(I){console.error("[News] Momentum reward error:",I)}}else if(o?.faction_type==="party"&&d&&m)try{const{data:y,error:B}=await h.rpc("article_sector_popularity",{p_target_party_id:m,p_sector_id:d});B?console.error("[News] Article popularity failed:",B):y?.success?k=`Article published! ${y.delta_tenths>0?"+0.3":"−0.3"} sector popularity.`:y?.reason==="already_written_this_tick"?k="Article published! (No popularity change — you already moved a sector this tick.)":y?.reason==="no_popularity_row"&&(k="Article published! (That party has no standing in this sector to move.)")}catch(y){console.error("[News] Article popularity error:",y)}sessionStorage.removeItem("nationhood_state"),Q(k)}V(),setTimeout(()=>{document.getElementById("nws-modal-overlay").classList.remove("active")},1500),await R()}catch(w){console.error(`[News] Article ${v?"update":"submission"} failed:`,w),A(`Failed to ${v?"update":"publish"} article. Please try again.`)}finally{e.disabled=!1,e.textContent=x?"Update Article":"Publish Article"}})}async function X(e,s){const n=s.name.split(".").pop()||"png",t=`player-articles/${e}/${Date.now()}.${n}`,{error:i}=await h.storage.from("public-assets").upload(t,s,{contentType:s.type,upsert:!0});if(i)throw i;const{data:l}=h.storage.from("public-assets").getPublicUrl(t);return l?.publicUrl||null}function O(e){return!g?.faction||e.author_faction_id!==g.faction.id?"":`<button class="nws-delete-btn" data-article-id="${e.id}" title="Delete article">&times;</button>`}function P(e){return!g?.faction||e.author_faction_id!==g.faction.id?"":`<button class="nws-edit-btn" data-edit-id="${e.id}" title="Edit article">&#9998;</button>`}function he(e){e.addEventListener("click",async s=>{const n=s.target.closest(".nws-delete-btn");if(!n)return;const t=n.dataset.articleId;if(!(!t||!confirm("Delete this article?"))){n.disabled=!0,n.textContent="...";try{const{error:i}=await h.from("player_articles").delete().eq("id",t).eq("author_faction_id",g.faction.id);if(i)throw i;await R()}catch(i){console.error("[News] Failed to delete article:",i),n.disabled=!1,n.textContent="×"}}})}function V(){x=null,G=!1,document.getElementById("nws-article-title").value="",document.getElementById("nws-article-author").value="",document.getElementById("nws-article-category").value="",document.getElementById("nws-article-body").value="";const e=document.getElementById("nws-article-sector");e&&(e.value="");const s=document.getElementById("nws-article-party");s&&(s.value="");const n=document.getElementById("nws-article-image");n&&(n.value="");const t=document.getElementById("nws-file-label-text");t&&(t.textContent="Click to select an image...");const i=document.getElementById("nws-image-preview");i&&(i.style.display="none");const l=document.getElementById("nws-char-count");l&&(l.textContent="0 / 12000",l.classList.remove("nws-near-limit","nws-ap-qualified"));const a=document.getElementById("nws-remove-image-btn");a&&(a.style.display="none");const p=document.querySelector(".nws-modal-header h3");p&&(p.textContent="Write Article");const d=document.getElementById("nws-submit-btn");d&&(d.textContent="Publish Article")}function ge(e){x=e.id,G=!1,document.getElementById("nws-article-title").value=e.headline||"",document.getElementById("nws-article-author").value=e.author_name||"",document.getElementById("nws-article-category").value=e.category||"",document.getElementById("nws-article-body").value=e.body||"";const s=(e.body||"").length,n=document.getElementById("nws-char-count");n&&(n.textContent=`${s} / 12000`,n.classList.toggle("nws-near-limit",s>=11500));const t=document.getElementById("nws-image-preview"),i=document.getElementById("nws-image-preview-img"),l=document.getElementById("nws-file-label-text"),a=document.getElementById("nws-remove-image-btn"),p=document.getElementById("nws-article-image");p&&(p.value=""),e.image_url?(i&&(i.src=e.image_url),t&&(t.style.display="block"),l&&(l.textContent="Current image (select new to replace)"),a&&(a.style.display="inline")):(t&&(t.style.display="none"),l&&(l.textContent="Click to select an image..."),a&&(a.style.display="none"));const d=document.querySelector(".nws-modal-header h3");d&&(d.textContent="Edit Article");const m=document.getElementById("nws-submit-btn");m&&(m.textContent="Update Article"),document.getElementById("nws-modal-overlay").classList.add("active")}function fe(e){e.addEventListener("click",s=>{const n=s.target.closest(".nws-edit-btn");if(!n)return;s.stopPropagation();const t=n.dataset.editId,i=D.find(l=>String(l.id)===String(t));i&&ge(i)})}function ae(e){F&&e.removeEventListener("click",F),F=s=>{if(s.target.closest(".nws-delete-btn, .nws-edit-btn, .nws-write-btn, .nws-modal-overlay, button, a, input, select, textarea"))return;const n=s.target.closest("[data-article-id]");if(!n)return;const t=n.dataset.articleId,i=D.find(l=>String(l.id)===String(t));if(i)try{te(e,i)}catch(l){console.error("[News] Failed to open article:",l)}},e.addEventListener("click",F)}function te(e,s){const n=s.body||"",t=s.published_tick!=null?q(s.published_tick):g?.shard?.current_date||"[Month], [Year]",l=!!W?"&larr; Back to Edition":"&larr; Back to Front Page",a=le(n),p=s.image_url?`<div class="nws-reader-image">
            <img src="${c(s.image_url)}" alt="${c(s.headline)}">
            <p class="nws-img-caption">${c(s.headline)}</p>
           </div>`:"";e.innerHTML=`<div class="newspaper-container">
        <!-- TOP RIBBON -->
        <div class="nws-top-ribbon">
            <div class="nws-top-ribbon-inner">
                <span>${c(t)}</span>
                <span class="nws-edition">The Cruceran &mdash; Continental Edition</span>
                <button class="nws-write-btn" id="nws-back-btn">${l}</button>
            </div>
        </div>

        <!-- READER CONTENT -->
        <div class="nws-main-content">
            <div class="nws-reader">
                <div class="nws-reader-notice" role="note">
                    <strong>Note:</strong> Mentions of real-world events, people, or entities will cause your party to lose all Momentum. Further violations will cause action.
                </div>
                <span class="nws-section-tag">${c(C(s.category))} &mdash; ${c(t)}</span>
                <h1 class="nws-reader-headline">${c(s.headline)}</h1>
                <div class="nws-byline">
                    <span class="nws-author">${c(s.author_name)}</span>
                    <span class="nws-dot">&middot;</span>
                    <span>${c(t)}</span>
                </div>
                <hr class="nws-reader-rule">
                ${p}
                <div class="nws-reader-body">
                    ${a}
                </div>
                <hr class="nws-reader-rule">
                <div class="nws-like-bar" id="nws-like-bar">
                    <button class="nws-like-btn" id="nws-like-btn" data-article-id="${s.id}">
                        <span class="nws-like-icon" id="nws-like-icon">&#9825;</span> Like
                    </button>
                    <span class="nws-like-count" id="nws-like-count">${s.like_count||0}</span>
                </div>
                <button class="nws-back-link" id="nws-back-btn-bottom">${l}</button>
            </div>
        </div>

        <!-- FOOTER -->
        <div class="nws-footer">
            <h2>The Cruceran</h2>
            <p>Continental Edition &nbsp;&middot;&nbsp; Est. Year 1 &nbsp;&middot;&nbsp; All rights reserved &nbsp;&middot;&nbsp; Truth in the service of the people</p>
        </div>
    </div>`;const d=W,m=d?()=>ce(d.root,d.articles,d.dateLabel):()=>K(h,g);document.getElementById("nws-back-btn")?.addEventListener("click",m),document.getElementById("nws-back-btn-bottom")?.addEventListener("click",m),ye(s),e.scrollTop=0}async function ye(e){const s=document.getElementById("nws-like-btn"),n=document.getElementById("nws-like-icon"),t=document.getElementById("nws-like-count");if(!s||!h||!g?.faction?.id)return;const i=g.faction.id;let l=!1;const{data:a}=await h.from("article_likes").select("id").eq("article_id",e.id).eq("faction_id",i).maybeSingle();a&&(s.classList.add("nws-like-btn--liked"),n.innerHTML="&#9829;"),s.addEventListener("click",async()=>{if(!l){l=!0,s.disabled=!0;try{const p=g.shard?.current_tick||0,{data:d,error:m}=await h.rpc("toggle_article_like",{p_article_id:e.id,p_faction_id:i,p_tick:p});if(m){console.error("[News] Like failed:",m.message);return}d.liked?(s.classList.add("nws-like-btn--liked"),n.innerHTML="&#9829;"):(s.classList.remove("nws-like-btn--liked"),n.innerHTML="&#9825;"),t.textContent=d.like_count,e.like_count=d.like_count}catch(p){console.error("[News] Like error:",p)}finally{l=!1,s.disabled=!1}}})}function c(e){const s=document.createElement("div");return s.textContent=e,s.innerHTML}function ie(e,s=1200){if(e.length<=s)return le(e);let n=e.lastIndexOf(" ",s);n<s*.5&&(n=s);const i=e.substring(0,n).split(/\n\n+/).filter(a=>a.trim());return i.map((a,p)=>`<p class="${p===0?"nws-drop-cap":""}">${Y(c(a.trim()))}${p===i.length-1?"...":""}</p>`).join("")+'<p class="nws-read-more">Read More &rarr;</p>'}function Y(e){return e.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>").replace(/__(.+?)__/g,"<u>$1</u>")}function le(e){const s=e.split(/\n\n+/).filter(n=>n.trim());return s.length<=1?`<p class="nws-drop-cap">${Y(c(e))}</p>`:s.map((n,t)=>`<p class="${t===0?"nws-drop-cap":""}">${Y(c(n.trim()))}</p>`).join("")}function C(e){return e==="elections"&&(e="politics"),{politics:"Politics",economy:"Business",international:"International",social:"Social",entertainment:"Entertainment",sports:"Sports",opinion:"Opinion"}[e]||e}function oe(e){return e==="elections"&&(e="politics"),{politics:"linear-gradient(135deg,#2a1a2a,#1a0d1a)",economy:"linear-gradient(135deg,#2a1a0a,#1a0d00)",international:"linear-gradient(135deg,#0a1a2a,#001a2a)",social:"linear-gradient(135deg,#1a2a1a,#0d1a0d)",entertainment:"linear-gradient(135deg,#2a2a0a,#1a1a00)",sports:"linear-gradient(135deg,#2a0a0a,#1a0000)",opinion:"linear-gradient(135deg,#2a2a2a,#1a1a1a)"}[e]||"linear-gradient(135deg,#1a1a1a,#0d0d0d)"}async function J(){if(N)return N;const e=g?.shard,s=g?.nation;if(!e||!s)return[s?.id].filter(Boolean);const{data:n,error:t}=await h.from("nations").select("id").eq("shard_id",e.id);return t&&console.error("[News] Failed to fetch shard nations:",t),N=n&&n.length>0?n.map(i=>i.id):[s.id],N}async function R(){if(!(!h||!g))try{let e=await J();if($==="alsahwa"){const{data:u}=await h.from("nations").select("id").eq("continent","Al-Makir");u&&u.length>0&&(e=u.map(T=>T.id))}let s=h.from("player_articles").select("*").in("nation_id",e).eq("status","published").order("created_at",{ascending:!1});$==="alsahwa"?s=s.or("publication.eq.alsahwa,publication.eq.international"):$!=="cruceran"?s=s.or(`publication.eq.${$},publication.eq.international`):s=s.or("publication.eq.cruceran,publication.is.null,publication.eq.international");const{data:n,error:t}=await s;if(t){console.error("[News] Failed to load articles:",t);return}if(!n||n.length===0)return;const i=g.shard?.current_tick??0,l=H(i),a=n.filter(u=>H(u.published_tick??0)===l),p=n.filter(u=>H(u.published_tick??0)!==l),d=new Set(a.map(u=>u.category)),m=[],v=new Set;for(const u of p)u.category!=="opinion"&&(d.has(u.category)||(v.has(u.category)||v.add(u.category),m.push(u)));const w=n.filter(u=>u.category==="opinion").slice(0,4),o=[...a.filter(u=>u.category!=="opinion"),...m,...w];if(o.length===0)return;D=o;const r=S&&S!=="all"?o.filter(u=>(u.category==="elections"?"politics":u.category)===S):o;if(r.length===0&&S!=="all"){const u=`<p class="nws-placeholder" style="text-align:center;padding:40px;grid-column:1/-1;">No ${C(S)} articles in this edition.</p>`,T=document.getElementById("nws-lead-section");T&&(T.innerHTML=u);const I=document.getElementById("nws-secondary-grid");I&&(I.innerHTML="");const L=document.querySelector(".nws-opinion-grid");L&&(L.innerHTML="");const M=document.querySelector(".nws-bottom-left");M&&(M.innerHTML="");return}const f=S==="opinion",_=[...f?r:r.filter(u=>u.category!=="opinion")].sort((u,T)=>(T.published_tick??0)-(u.published_tick??0)),E=_[0],k=_.slice(1,4),y=_.slice(4,7),B=[...o].sort((u,T)=>new Date(T.created_at)-new Date(u.created_at)).slice(0,5);$==="continental"?ke(E,k,y,w.slice(0,4),B):(E&&be(E,k),_e(y),ee(f?[]:w.slice(0,4)),$e(B))}catch(e){console.error("[News] Error loading articles:",e)}}function be(e,s){const n=document.getElementById("nws-lead-section");if(!n||!e)return;const t=s.length>0?s.map(d=>`
            <div class="nws-sidebar-story" data-article-id="${d.id}">
                ${P(d)}${O(d)}
                <span class="nws-section-tag">${c(C(d.category))}</span>
                <h3 class="nws-sidebar-headline">${c(d.headline)}</h3>
                <p class="nws-sidebar-deck">${c((d.body||"").replace(/\n+/g," ").substring(0,120))}${(d.body||"").length>120?"...":""}</p>
                <div class="nws-byline"><span class="nws-author">${c(d.author_name)}</span><span class="nws-dot">&middot;</span><span>${d.published_tick!=null?q(d.published_tick):g?.shard?.current_date||"—"}</span></div>
            </div>
        `).join(""):'<div class="nws-sidebar-story"><p class="nws-placeholder">[More stories will appear as articles are published.]</p></div>',i=e.image_url?`<img src="${c(e.image_url)}" alt="${c(e.headline)}">`:"",l=e.body||"",a=l.replace(/\n+/g," "),p=a.length>200?a.substring(0,200)+"...":a;n.innerHTML=`
        <div class="nws-lead-main" data-article-id="${e.id}">
            ${P(e)}${O(e)}
            <span class="nws-section-tag">${c(C(e.category))}</span>
            <h2 class="nws-lead-headline">${c(e.headline)}</h2>
            <p class="nws-lead-deck">${c(p)}</p>
            <div class="nws-byline">
                <span class="nws-author">${c(e.author_name)}</span>
                <span class="nws-dot">&middot;</span>
                <span>${e.published_tick!=null?q(e.published_tick):g?.shard?.current_date||"—"}</span>
            </div>
            <div class="nws-lead-body">
                ${ie(l)}
            </div>
        </div>
        <div class="nws-lead-sidebar">
            ${e.image_url?`<div class="nws-lead-image">${i}</div>
            <p class="nws-img-caption">${c(e.headline)}</p>`:""}
            ${t}
        </div>
    `}function _e(e){const s=document.getElementById("nws-secondary-grid");if(!s||e.length===0)return;const n=[...e],t=["Crisis","Election","Business"],i=[0,1,2].map(l=>{const a=n[l];if(a){const p=a.image_url?`<img src="${c(a.image_url)}" alt="${c(a.headline)}" style="width:100%;height:100%;object-fit:cover;">`:`<div class="nws-img-ph" style="background:${oe(a.category)};">${c(C(a.category))}</div>`;return`<div class="nws-sec-story" data-article-id="${a.id}">
                ${P(a)}${O(a)}
                <div class="nws-sec-image">${p}</div>
                <span class="nws-section-tag">${c(C(a.category))}</span>
                <h3 class="nws-sec-headline">${c(a.headline)}</h3>
                <p class="nws-sec-deck">${c((a.body||"").replace(/\n+/g," ").substring(0,150))}${(a.body||"").length>150?"...":""}</p>
                <div class="nws-byline"><span class="nws-author">${c(a.author_name)}</span><span class="nws-dot">&middot;</span><span>${a.published_tick!=null?q(a.published_tick):g?.shard?.current_date||"—"}</span></div>
            </div>`}else{const p=t[l]||"News";return`<div class="nws-sec-story">
                <div class="nws-sec-image"><div class="nws-img-ph" style="background:${["linear-gradient(135deg,#1a2a1a,#0d1a0d)","linear-gradient(135deg,#1a1a2a,#0d0d1a)","linear-gradient(135deg,#2a1a0a,#1a0d00)"][l]};">${p}</div></div>
                <span class="nws-section-tag nws-placeholder">[${p}]</span>
                <h3 class="nws-sec-headline nws-placeholder">[${p} Section Headline]</h3>
                <p class="nws-sec-deck nws-placeholder">[Summary will appear here.]</p>
                <div class="nws-byline"><span class="nws-author nws-placeholder">[Author]</span><span class="nws-dot">&middot;</span><span class="nws-placeholder">[Date]</span></div>
            </div>`}}).join("");s.innerHTML=i}function $e(e){if(e.length===0)return;const s=document.querySelector(".nws-bottom-left");if(!s)return;const n='<div class="nws-col-header">In Brief</div>',t=e.map((a,p)=>`
        <div class="nws-brief-row" data-article-id="${a.id}">
            <div class="nws-brief-num">${p+1}</div>
            <div class="nws-brief-text">
                <strong>${c(a.headline)}${P(a)}${O(a)}</strong>
                ${c((a.body||"").replace(/\n+/g," ").substring(0,100))}${(a.body||"").length>100?"...":""}
            </div>
        </div>
    `).join(""),i=5-e.length;let l="";for(let a=0;a<i;a++)l+=`
            <div class="nws-brief-row">
                <div class="nws-brief-num">${e.length+a+1}</div>
                <div class="nws-brief-text">
                    <strong class="nws-placeholder">[Brief headline]</strong>
                    <span class="nws-placeholder">[Short summary of a recent story.]</span>
                </div>
            </div>
        `;s.innerHTML=n+t+l}function ee(e){const s=document.querySelector(".nws-opinion-grid");if(!s||e.length===0)return;const n=[0,1,2,3].map(t=>{const i=e[t];if(i){const l=(i.body||"").length>80?(i.body||"").substring(0,80)+"...":i.body||"";return`<div class="nws-op-card" data-article-id="${i.id}">
                ${P(i)}${O(i)}
                <div class="nws-op-author">${c(i.author_name)} &mdash; Opinion</div>
                <div class="nws-op-headline">&ldquo;${c(l)}&rdquo;</div>
            </div>`}else return`<div class="nws-op-card">
                <div class="nws-op-author nws-placeholder">[Columnist] &mdash; [Topic]</div>
                <div class="nws-op-headline nws-placeholder">&ldquo;[Opinion headline will appear here.]&rdquo;</div>
            </div>`}).join("");s.innerHTML=n}function ke(e,s,n,t,i){const l=document.getElementById("nws-main-content")||document.querySelector(".nws-main-content");if(!l)return;const a=r=>(r||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"),p=r=>a((r.body||"").replace(/\n+/g," ").substring(0,200))+((r.body||"").length>200?"...":""),d=r=>a((r.body||"").replace(/\n+/g," ").substring(0,120))+((r.body||"").length>120?"...":""),m=r=>a(C(r.category)),v=r=>r?.published_tick!=null?q(r.published_tick):g?.shard?.current_date||"—",w={politics:"--politics",economy:"--economy",social:"--social",international:"--intl",entertainment:"--culture",science:"--science"};let o="";if(!e&&s.length===0&&n.length===0&&t.length===0&&i.length===0){o+='<div style="text-align:center;padding:60px 20px;color:#9e9b95;font-family:Outfit,sans-serif;">',o+='<div style="font-size:2rem;margin-bottom:12px;opacity:0.3;">📰</div>',o+='<div style="font-size:1rem;font-weight:600;">No articles yet</div>',o+='<div style="font-size:0.85rem;margin-top:6px;">Be the first to write for The Continental.</div>',o+="</div>",l.innerHTML=o;return}if(e){const r=e.image_url?`<img src="${a(e.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;">`:"";o+=`<div class="ct-hero" data-article-id="${e.id}">
            <div class="ct-hero__image">${r}</div>
            <div class="ct-hero__content">
                <div class="ct-hero__section">${m(e)}</div>
                <h1 class="ct-hero__headline">${a(e.headline)}</h1>
                <p class="ct-hero__lede">${p(e)}</p>
                <div class="ct-hero__meta">
                    <span class="ct-hero__author">${a(e.author_name)}</span>
                    <span>&middot;</span>
                    <span>${v(e)}</span>
                </div>
            </div>
        </div>`}if(s.length>0){o+=`<div class="ct-section-divider">
            <span class="ct-section-divider__label">Top Stories</span>
            <div class="ct-section-divider__line"></div>
        </div>`,o+='<div class="ct-story-grid">';for(const r of s){const f=w[r.category]||"",b=r.image_url?`<img src="${a(r.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;">`:"";o+=`<div class="ct-card" data-article-id="${r.id}">
                <div class="ct-card__image ct-card__image${f}">${b}
                    <span class="ct-card__image-label">${m(r)}</span>
                </div>
                <div class="ct-card__body">
                    <div class="ct-card__section">${m(r)}</div>
                    <h2 class="ct-card__headline">${a(r.headline)}</h2>
                    <p class="ct-card__summary">${d(r)}</p>
                    <div class="ct-card__meta">
                        <span class="ct-card__author">${a(r.author_name)}</span>
                        <span>&middot;</span>
                        <span>${v(r)}</span>
                    </div>
                </div>
            </div>`}o+="</div>"}if(n.length>0){o+=`</div><div class="ct-analysis-band"><div class="ct-analysis-band__inner">
            <div class="ct-analysis-band__header">
                <span class="ct-analysis-band__badge">Continental Analysis</span>
                <span class="ct-analysis-band__title">In-depth reporting from across Meridian</span>
            </div>
            <div class="ct-analysis-band__grid">`;for(const r of n)o+=`<div class="ct-analysis-story" data-article-id="${r.id}">
                <div class="ct-analysis-story__section">${m(r)}</div>
                <h2 class="ct-analysis-story__headline">${a(r.headline)}</h2>
                <p class="ct-analysis-story__summary">${d(r)}</p>
                <div class="ct-analysis-story__meta"><strong>${a(r.author_name)}</strong> &middot; ${v(r)}</div>
            </div>`;o+='</div></div></div><div class="nws-main-content">'}if(t.length>0||i.length>0){o+=`<div class="ct-section-divider">
            <span class="ct-section-divider__label">Analysis &amp; Opinion</span>
            <div class="ct-section-divider__line"></div>
        </div>`,o+='<div class="ct-two-col">',o+='<div class="ct-analysis-list">';for(let r=0;r<t.length;r++){const f=t[r];o+=`<div class="ct-analysis-item" data-article-id="${f.id}">
                <div class="ct-analysis-item__number">${String(r+1).padStart(2,"0")}</div>
                <div class="ct-analysis-item__content">
                    <div class="ct-analysis-item__section">${m(f)}</div>
                    <h3 class="ct-analysis-item__headline">${a(f.headline)}</h3>
                    <p class="ct-analysis-item__summary">${d(f)}</p>
                    <div class="ct-analysis-item__meta"><strong>${a(f.author_name)}</strong> &middot; ${v(f)}</div>
                </div>
            </div>`}o+="</div>",o+='<div class="ct-sidebar">',o+='<div class="ct-sidebar__section"><div class="ct-sidebar__section-title">Also in This Edition</div>';for(const r of i)o+=`<div class="ct-sidebar-brief" data-article-id="${r.id}">
                <div class="ct-sidebar-brief__section">${m(r)}</div>
                <div class="ct-sidebar-brief__headline">${a(r.headline)}</div>
            </div>`;o+="</div></div>",o+="</div>"}o+=`<div class="ct-footer">
        <div class="ct-footer__inner">
            <div class="ct-footer__brand">
                <div class="ct-footer__title">The Continental</div>
                <div class="ct-footer__tagline">Independent journalism for Meridian.<br>Where Ideas Converge.</div>
            </div>
            <div>
                <div class="ct-footer__col-title">Sections</div>
                <span class="ct-footer__link">Politics</span>
                <span class="ct-footer__link">Business</span>
                <span class="ct-footer__link">International</span>
                <span class="ct-footer__link">Society</span>
                <span class="ct-footer__link">Culture</span>
            </div>
        </div>
    </div>`,l.innerHTML=o,l.querySelectorAll("[data-article-id]").forEach(r=>{r.style.cursor="pointer",r.addEventListener("click",f=>{if(f.target.closest(".nws-edit-btn, .nws-delete-btn"))return;const b=r.dataset.articleId,_=D.find(E=>String(E.id)===String(b));_&&te(document.getElementById("newspaper-root"),_)})})}function Ee(e){const s=e.querySelectorAll(".nws-nav-item[data-category]");s.forEach(t=>{t.addEventListener("click",()=>{s.forEach(i=>i.classList.remove("active")),t.classList.add("active"),S=t.dataset.category,R()})});const n=e.querySelectorAll(".nws-alsahwa-nav-item[data-cat]");n.forEach(t=>{t.addEventListener("click",()=>{n.forEach(i=>i.classList.remove("nws-alsahwa-nav-item--active")),t.classList.add("nws-alsahwa-nav-item--active"),S=t.dataset.cat,R()})})}function Ie(e){const s=document.getElementById("nws-nav-archives");s&&s.addEventListener("click",()=>re(e))}async function re(e){if(!(!h||!g))try{const s=g.shard?.current_tick??0,n=g.shard?.current_date||"[Month], [Year]",t=await J(),{data:i,error:l}=await h.from("player_articles").select("*").in("nation_id",t).eq("status","published").order("published_tick",{ascending:!1});if(l){console.error("[News] Failed to load archive articles:",l);return}const a={};for(const v of i||[]){const w=v.published_tick??0,o=H(w);a[o]||(a[o]={label:o,maxTick:w,articles:[]}),a[o].articles.push(v),w>a[o].maxTick&&(a[o].maxTick=w)}const p=Object.values(a).sort((v,w)=>w.maxTick-v.maxTick),d=H(s),m=p.length>0?p.map(v=>{const w=v.label===d?' <span class="nws-archive-current">Current</span>':"";return`<div class="nws-archive-month" data-archive-season="${c(v.label)}">
                    <div class="nws-archive-month-name">${c(v.label)}${w}</div>
                    <div class="nws-archive-month-count">${v.articles.length} article${v.articles.length!==1?"s":""}</div>
                </div>`}).join(""):'<p class="nws-placeholder" style="text-align:center;padding:40px;">No articles have been published yet.</p>';e.innerHTML=`<div class="newspaper-container">
            <!-- TOP RIBBON -->
            <div class="nws-top-ribbon">
                <div class="nws-top-ribbon-inner">
                    <span>${n}</span>
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
                        ${m}
                    </div>
                </div>
            </div>

            <!-- FOOTER -->
            <div class="nws-footer">
                <h2>The Cruceran</h2>
                <p>Continental Edition &nbsp;&middot;&nbsp; Est. Year 1 &nbsp;&middot;&nbsp; All rights reserved &nbsp;&middot;&nbsp; Truth in the service of the people</p>
            </div>
        </div>`,document.getElementById("nws-back-btn")?.addEventListener("click",()=>K(h,g)),e.querySelectorAll("[data-archive-season]").forEach(v=>{v.addEventListener("click",()=>{const w=v.dataset.archiveSeason,o=a[w];o&&ce(e,o.articles,o.label)})}),e.scrollTop=0}catch(s){console.error("[News] Error loading archives:",s)}}function ce(e,s,n){D=s;const t=s.filter(b=>b.category==="opinion"),l=[...s.filter(b=>b.category!=="opinion")].sort((b,_)=>(_.body||"").length-(b.body||"").length),a=l[0],p=l.slice(1,4),d=l.slice(4,7),m=l.slice(7,12),v=t.slice(0,4),w=a?Be(a,p,n):'<p class="nws-placeholder" style="padding:40px;text-align:center;">[No articles in this edition]</p>',o=Ce(d),r=Te(v),f=Ae(m);e.innerHTML=`<div class="newspaper-container">
        <!-- TOP RIBBON -->
        <div class="nws-top-ribbon">
            <div class="nws-top-ribbon-inner">
                <span>${c(n)}</span>
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
            <span>Archived Edition &mdash; ${c(n)}</span>
        </div>

        <!-- MAIN CONTENT -->
        <div class="nws-main-content">
            <div class="nws-lead-section">${w}</div>
            ${o?`<div class="nws-secondary-grid">${o}</div>`:""}
        </div>

        ${r}

        ${f?`<div class="nws-main-content">
            <div class="nws-bottom-grid">
                <div class="nws-bottom-left">
                    <div class="nws-col-header">In Brief</div>
                    ${f}
                </div>
            </div>
        </div>`:""}

        <!-- FOOTER -->
        <div class="nws-footer">
            <h2>The Cruceran</h2>
            <p>Continental Edition &nbsp;&middot;&nbsp; Est. Year 1 &nbsp;&middot;&nbsp; All rights reserved &nbsp;&middot;&nbsp; Truth in the service of the people</p>
        </div>
    </div>`,document.getElementById("nws-back-to-archives")?.addEventListener("click",()=>re(e)),W={root:e,articles:s,dateLabel:n},ae(e),e.scrollTop=0}function Be(e,s,n){const t=s.length>0?s.map(d=>`
            <div class="nws-sidebar-story" data-article-id="${d.id}">
                <span class="nws-section-tag">${c(C(d.category))}</span>
                <h3 class="nws-sidebar-headline">${c(d.headline)}</h3>
                <p class="nws-sidebar-deck">${c((d.body||"").replace(/\n+/g," ").substring(0,120))}${(d.body||"").length>120?"...":""}</p>
                <div class="nws-byline"><span class="nws-author">${c(d.author_name)}</span><span class="nws-dot">&middot;</span><span>${c(n)}</span></div>
            </div>
        `).join(""):"",i=e.image_url?`<img src="${c(e.image_url)}" alt="${c(e.headline)}">`:"",l=e.body||"",a=l.replace(/\n+/g," "),p=a.length>200?a.substring(0,200)+"...":a;return`
        <div class="nws-lead-main" data-article-id="${e.id}">
            <span class="nws-section-tag">${c(C(e.category))}</span>
            <h2 class="nws-lead-headline">${c(e.headline)}</h2>
            <p class="nws-lead-deck">${c(p)}</p>
            <div class="nws-byline">
                <span class="nws-author">${c(e.author_name)}</span>
                <span class="nws-dot">&middot;</span>
                <span>${c(n)}</span>
            </div>
            <div class="nws-lead-body">
                ${ie(l)}
            </div>
        </div>
        <div class="nws-lead-sidebar">
            ${e.image_url?`<div class="nws-lead-image">${i}</div>
            <p class="nws-img-caption">${c(e.headline)}</p>`:""}
            ${t}
        </div>
    `}function Ce(e){return e.length===0?"":e.map(s=>{const n=s.image_url?`<img src="${c(s.image_url)}" alt="${c(s.headline)}" style="width:100%;height:100%;object-fit:cover;">`:`<div class="nws-img-ph" style="background:${oe(s.category)};">${c(C(s.category))}</div>`;return`<div class="nws-sec-story" data-article-id="${s.id}">
            <div class="nws-sec-image">${n}</div>
            <span class="nws-section-tag">${c(C(s.category))}</span>
            <h3 class="nws-sec-headline">${c(s.headline)}</h3>
            <p class="nws-sec-deck">${c((s.body||"").replace(/\n+/g," ").substring(0,150))}${(s.body||"").length>150?"...":""}</p>
            <div class="nws-byline"><span class="nws-author">${c(s.author_name)}</span></div>
        </div>`}).join("")}function Te(e){return e.length===0?"":`<div class="nws-opinion-strip">
        <div class="nws-opinion-inner">
            <div class="nws-opinion-label">&mdash; Opinion &amp; Commentary &mdash;</div>
            <div class="nws-opinion-grid">${e.map(n=>{const t=(n.body||"").length>80?(n.body||"").substring(0,80)+"...":n.body||"";return`<div class="nws-op-card" data-article-id="${n.id}">
            <div class="nws-op-author">${c(n.author_name)} &mdash; Opinion</div>
            <div class="nws-op-headline">&ldquo;${c(t)}&rdquo;</div>
        </div>`}).join("")}</div>
        </div>
    </div>`}function Ae(e){return e.length===0?"":e.map((s,n)=>`
        <div class="nws-brief-row" data-article-id="${s.id}">
            <div class="nws-brief-num">${n+1}</div>
            <div class="nws-brief-text">
                <strong>${c(s.headline)}</strong>
                ${c((s.body||"").replace(/\n+/g," ").substring(0,100))}${(s.body||"").length>100?"...":""}
            </div>
        </div>
    `).join("")}function z(e){return e.w*3+e.d}function Se(e){return Object.values(e).sort((s,n)=>{const t=z(n)-z(s);return t!==0?t:n.w-s.w})}function Le(e){return`<span class="vln-form-dot" style="background:${{W:"#1a4a1a",D:"#8a6a20",L:"#8b1a1a"}[e]||"#999"}"></span>`}function xe(e,s){return e<=3?"vln-pos-top":e>=s-2?"vln-pos-bottom":""}function se(e,s={}){const n=Se(e),t=s.muted||!1,i=n.length;let l=`<div class="vln-table${t?" vln-table-muted":""}">
        <div class="vln-thead">
            <span class="vln-col-pos">#</span>
            <span class="vln-col-name">Club</span>
            <span class="vln-col-stat">W</span>
            <span class="vln-col-stat">D</span>
            <span class="vln-col-stat">L</span>
            <span class="vln-col-pts">Pts</span>
            ${t?"":'<span class="vln-col-form">Form</span>'}
        </div>`;return n.forEach((a,p)=>{const d=p+1,m=xe(d,i),v=d===3||d===7?" vln-zone-break":"",w=z(a),o=t?"":a.form.map(r=>Le(r)).join("");l+=`<div class="vln-row${v}">
            <span class="vln-col-pos ${m}">${d}</span>
            <span class="vln-col-name">${a.name}</span>
            <span class="vln-col-stat">${a.w}</span>
            <span class="vln-col-stat">${a.d}</span>
            <span class="vln-col-stat">${a.l}</span>
            <span class="vln-col-pts">${w}</span>
            ${t?"":`<span class="vln-col-form">${o}</span>`}
        </div>`}),l+="</div>",l}function Me(e,s){return e?`<div class="vln-motw">
        <div class="vln-motw-label">Match of the Week:</div>
        <div class="vln-motw-result">
            <span class="vln-motw-team">${e.homeName}</span>
            <span class="vln-motw-score">${e.homeScore} &mdash; ${e.awayScore}</span>
            <span class="vln-motw-team">${e.awayName}</span>
        </div>
        <div class="vln-motw-week">&mdash; Matchweek ${s}</div>
    </div>`:""}async function Ne(){const e=document.getElementById("vln-widget");if(!(!e||!h))try{const{data:s,error:n}=await h.from("vln_state").select("*").eq("shard_name","Alpha Shard").maybeSingle();if(n||!s){e.innerHTML=`
                <div class="nws-col-header">Volbal Ligue Nationale</div>
                <div class="vln-offseason">Season concludes in March.</div>`;return}const t=g?.shard?.current_tick??0,i=2e3+Math.floor(t/12);let l='<div class="nws-col-header">Volbal Ligue Nationale</div>';s.active?((s.matchweek>=18||(s.fixtures||[]).every(p=>p.played))&&(!s.last_results||s.last_results.length===0)?l+='<div class="vln-matchweek">Final Standings</div>':l+=`<div class="vln-matchweek">Matchweek ${s.matchweek} of 18</div>`,l+=se(s.standings),l+=Me(s.match_of_week,s.matchweek)):s.standings&&Object.keys(s.standings).length>0&&Object.values(s.standings).some(p=>p.played>0)?(l+='<div class="vln-offseason">Off-season. Final standings below.</div>',l+=`<div class="vln-final-label">Final Standings &mdash; Year ${s.season}</div>`,l+=se(s.standings,{muted:!0})):l+='<div class="vln-offseason">Season concludes in March.</div>',e.innerHTML=l}catch(s){console.error("[VLN] Widget render failed:",s)}}async function He(){if(!(!h||!g))try{const e=await J(),s=g.shard?.current_tick||0,{data:n}=await h.from("event_log").select("description_chosen, fired_at_tick").in("nation_id",e).eq("category","corporate").gte("fired_at_tick",Math.max(0,s-12)).order("fired_at_tick",{ascending:!1}).limit(20),t=document.querySelector(".nws-ticker-scroll");if(!t)return;const i='  <span class="nws-ticker-sep">◆</span>  ';if(n&&n.length>0){const l=n.map(a=>a.description_chosen);t.innerHTML=l.join(i)+i+l.join(i)}}catch(e){console.error("[Ticker] Failed to load corporate events:",e)}}export{K as i};
