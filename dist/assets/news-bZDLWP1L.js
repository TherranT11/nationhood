import{_ as de}from"./preload-helper-BXl3LOEh.js";import{t as M}from"./utils-CY90Gazr.js";let g=null,h=null,q=[],C="all",T=null,D=null,R=null,S=null,F=!1,f="cruceran",Z=!1;const V={cruceran:{key:"cruceran",name:"The Cruceran",tagline:"Truth in the service of the people",nations:["Avelia","Palvera","San Estrella","Montequilla","Melizea","Sangreza","Sierramar"],style:"cruceran"},continental:{key:"continental",name:"The Continental",tagline:"Where Ideas Converge",nations:["Calveth","Flandis","Vostia"],style:"continental"},alsahwa:{key:"alsahwa",name:"Al-Sahwa",tagline:"Independent Voice of Al-Makir",nations:["Hajjara"],continent:"Al-Makir",style:"alsahwa"}};function pe(e){for(const[s,n]of Object.entries(V))if(n.nations.some(t=>t.toLowerCase()===(e||"").toLowerCase()))return s;return"cruceran"}function ne(e,s){const n=V[e];return n?n.nations.some(t=>t.toLowerCase()===(s||"").toLowerCase())?!0:L&&L.length>0?n.nations.some(t=>L.includes(t.toLowerCase())):!1:!1}let L=[];const ve=["Winter","Spring","Spring","Spring","Summer","Summer","Summer","Fall","Fall","Fall","Winter","Winter"];function x(e){const s=e%12,n=2e3+Math.floor(e/12),t=ve[s],i=s===0?n-1:n;return`${t} ${i}`}async function Y(e,s){g=e,h=s,T=null,C="all",R=null;const n=document.getElementById("newspaper-root");if(!n)return;if(L=[],s.faction?.faction_type==="corporation")try{const{data:w}=await e.from("corp_properties").select("nation_id, nations:nation_id(name)").eq("faction_id",s.faction.id).eq("is_active",!0);w&&(L=w.map(p=>(p.nations?.name||"").toLowerCase()).filter(Boolean))}catch{}Z||(f=pe(s.nation?.name));const t=s.shard?.current_date||"[Month], [Year]",i=ne(f,s.nation?.name),l="Write Article",a=Object.entries(V).map(([w,p])=>`<option value="${w}" ${w===f?"selected":""}>${p.name}</option>`).join("");n.innerHTML=`<div class="newspaper-container nws-pub-${f}">

        <!-- TOP RIBBON -->
        <div class="nws-top-ribbon${f==="continental"?" nws-top-ribbon--continental":f==="alsahwa"?" nws-top-ribbon--alsahwa":""}">
            <div class="nws-top-ribbon-inner">
                <span>${t}</span>
                <select class="nws-pub-switcher" id="nws-pub-switcher">${a}</select>
                ${i?`<span><button class="nws-write-btn" id="nws-write-article-btn">${l}</button></span>`:""}
            </div>
        </div>

        ${f==="alsahwa"?`
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
        </div>`:f==="continental"?`
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
                        <strong>Note:</strong> Mentions of real-world events, people, or entities will cause your party to lose all Momentum and Governance. Further violations will cause action.
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

    </div>`,we(),ue(),me(n),ge(n),ae(n),Ee(n),ke(n);const v=document.getElementById("nws-pub-switcher");v&&v.addEventListener("change",async()=>{const w=v.value;if(w!==f){f=w,Z=!0;try{await Y(g,h)}catch(p){console.error("[News] Publication switch failed:",p)}}});const d=document.getElementById("nws-reward-badge");if(d){const w=s.faction?.faction_type==="corporation";d.textContent=w?"+1 Reputation (1st Article)":"+2 Momentum (1st Article)"}await O(),Ne(),Me()}function we(){const e=document.getElementById("nws-modal-overlay"),s=document.getElementById("nws-write-article-btn"),n=document.getElementById("nws-modal-close"),t=document.getElementById("nws-article-body"),i=document.getElementById("nws-char-count"),l=document.getElementById("nws-article-image"),a=document.getElementById("nws-file-label-text"),v=document.getElementById("nws-image-preview"),d=document.getElementById("nws-image-preview-img");s&&s.addEventListener("click",()=>{j(),e.classList.add("active")}),n&&n.addEventListener("click",()=>{e.classList.remove("active"),j()});const w=document.getElementById("nws-remove-image-btn");w&&w.addEventListener("click",()=>{F=!0;const p=document.getElementById("nws-image-preview");p&&(p.style.display="none");const m=document.getElementById("nws-file-label-text");m&&(m.textContent="Click to select an image..."),w.style.display="none"}),t&&i&&t.addEventListener("input",()=>{const p=t.value.length,m=p<4e3;i.textContent=m?`${p.toLocaleString()} / 4,000 min`:`${p.toLocaleString()} / 12,000`,i.style.color=m?"var(--dred, #c55)":"",i.classList.toggle("nws-near-limit",p>=11500)}),l&&l.addEventListener("change",()=>{const p=l.files[0];if(!p){a.textContent="Click to select an image...",v.style.display="none";return}const m=2*1024*1024;if(p.size>m){B("Image must be under 2MB."),l.value="",a.textContent="Click to select an image...",v.style.display="none";return}a.textContent=p.name;const c=new FileReader;c.onload=o=>{d.src=o.target.result,v.style.display="block"},c.readAsDataURL(p)})}function B(e){const s=document.getElementById("nws-form-error");s&&(s.textContent=e,s.style.display="block",setTimeout(()=>{s.style.display="none"},5e3))}function Q(e){const s=document.getElementById("nws-form-success");s&&(s.textContent=e,s.style.display="block",setTimeout(()=>{s.style.display="none"},5e3))}function ue(){const e=document.getElementById("nws-submit-btn");e&&e.addEventListener("click",async()=>{if(e.disabled)return;const s=document.getElementById("nws-article-title").value.trim(),n=document.getElementById("nws-article-author").value.trim(),t=document.getElementById("nws-article-category").value,i=document.getElementById("nws-article-body").value.trim(),a=document.getElementById("nws-article-image").files[0]||null,v=!ne(f,h?.nation?.name);if(!s)return B("Please enter a headline.");if(!n)return B("Please enter a writer name.");if(!t)return B("Please select a category.");if(!i)return B("Please write an article body.");if(i.length<4e3)return B("Article must be at least 4,000 characters. Currently: "+i.length.toLocaleString()+".");if(i.length>12e3)return B("Article body must be 12,000 characters or fewer.");const d=!!S;e.disabled=!0,e.textContent=d?"Updating...":"Publishing...";try{const{nation:w,faction:p,shard:m}=h;if(d){let c;a?c=await X(w.id,a):F&&(c=null);const o={headline:s,author_name:n,body:i,category:t};c!==void 0&&(o.image_url=c);const{error:b}=await g.from("player_articles").update(o).eq("id",S).eq("author_faction_id",p.id);if(b)throw b;Q("Article updated!")}else{if(v){const{deductAP:I}=await de(async()=>{const{deductAP:$}=await import("./config-CTuAIx_5.js");return{deductAP:$}},[]),u=await I(g,p.id,1);if(!u.success){B("Not enough AP to post on another publication (need 1 AP).");return}p.action_points=u.newAp}let c=null;a&&(c=await X(w.id,a));const{error:o}=await g.from("player_articles").insert({nation_id:w.id,author_faction_id:p.id,author_name:n,headline:s,body:i,category:t,image_url:c,status:"published",published_tick:m?.current_tick||0,publication:f});if(o)throw o;const b=m?.current_tick||0;let y=0;const{data:_,error:E}=await g.from("player_articles").select("id").eq("author_faction_id",p.id).eq("published_tick",b);E&&console.error("[News] Failed to count articles this tick:",E),!E&&(!_||_.length<=1)&&(y=2);const P=`News article published (+${y})`;let A="Article published!";if(y>0)try{const{error:I}=await g.rpc("adjust_momentum",{p_faction_id:p.id,p_delta:y,p_label:P,p_tick:b});I?console.error("[News] Momentum reward failed:",I):A=`Article published! +${y} Momentum.`}catch(I){console.error("[News] Momentum reward error:",I)}sessionStorage.removeItem("nationhood_state"),Q(A)}j(),setTimeout(()=>{document.getElementById("nws-modal-overlay").classList.remove("active")},1500),await O()}catch(w){console.error(`[News] Article ${d?"update":"submission"} failed:`,w),B(`Failed to ${d?"update":"publish"} article. Please try again.`)}finally{e.disabled=!1,e.textContent=S?"Update Article":"Publish Article"}})}async function X(e,s){const n=s.name.split(".").pop()||"png",t=`player-articles/${e}/${Date.now()}.${n}`,{error:i}=await g.storage.from("public-assets").upload(t,s,{contentType:s.type,upsert:!0});if(i)throw i;const{data:l}=g.storage.from("public-assets").getPublicUrl(t);return l?.publicUrl||null}function N(e){return!h?.faction||e.author_faction_id!==h.faction.id?"":`<button class="nws-delete-btn" data-article-id="${e.id}" title="Delete article">&times;</button>`}function H(e){return!h?.faction||e.author_faction_id!==h.faction.id?"":`<button class="nws-edit-btn" data-edit-id="${e.id}" title="Edit article">&#9998;</button>`}function me(e){e.addEventListener("click",async s=>{const n=s.target.closest(".nws-delete-btn");if(!n)return;const t=n.dataset.articleId;if(!(!t||!confirm("Delete this article?"))){n.disabled=!0,n.textContent="...";try{const{error:i}=await g.from("player_articles").delete().eq("id",t).eq("author_faction_id",h.faction.id);if(i)throw i;await O()}catch(i){console.error("[News] Failed to delete article:",i),n.disabled=!1,n.textContent="×"}}})}function j(){S=null,F=!1,document.getElementById("nws-article-title").value="",document.getElementById("nws-article-author").value="",document.getElementById("nws-article-category").value="",document.getElementById("nws-article-body").value="";const e=document.getElementById("nws-article-image");e&&(e.value="");const s=document.getElementById("nws-file-label-text");s&&(s.textContent="Click to select an image...");const n=document.getElementById("nws-image-preview");n&&(n.style.display="none");const t=document.getElementById("nws-char-count");t&&(t.textContent="0 / 12000",t.classList.remove("nws-near-limit","nws-ap-qualified"));const i=document.getElementById("nws-remove-image-btn");i&&(i.style.display="none");const l=document.querySelector(".nws-modal-header h3");l&&(l.textContent="Write Article");const a=document.getElementById("nws-submit-btn");a&&(a.textContent="Publish Article")}function he(e){S=e.id,F=!1,document.getElementById("nws-article-title").value=e.headline||"",document.getElementById("nws-article-author").value=e.author_name||"",document.getElementById("nws-article-category").value=e.category||"",document.getElementById("nws-article-body").value=e.body||"";const s=(e.body||"").length,n=document.getElementById("nws-char-count");n&&(n.textContent=`${s} / 12000`,n.classList.toggle("nws-near-limit",s>=11500));const t=document.getElementById("nws-image-preview"),i=document.getElementById("nws-image-preview-img"),l=document.getElementById("nws-file-label-text"),a=document.getElementById("nws-remove-image-btn"),v=document.getElementById("nws-article-image");v&&(v.value=""),e.image_url?(i&&(i.src=e.image_url),t&&(t.style.display="block"),l&&(l.textContent="Current image (select new to replace)"),a&&(a.style.display="inline")):(t&&(t.style.display="none"),l&&(l.textContent="Click to select an image..."),a&&(a.style.display="none"));const d=document.querySelector(".nws-modal-header h3");d&&(d.textContent="Edit Article");const w=document.getElementById("nws-submit-btn");w&&(w.textContent="Update Article"),document.getElementById("nws-modal-overlay").classList.add("active")}function ge(e){e.addEventListener("click",s=>{const n=s.target.closest(".nws-edit-btn");if(!n)return;s.stopPropagation();const t=n.dataset.editId,i=q.find(l=>String(l.id)===String(t));i&&he(i)})}function ae(e){D&&e.removeEventListener("click",D),D=s=>{if(s.target.closest(".nws-delete-btn, .nws-edit-btn, .nws-write-btn, .nws-modal-overlay, button, a, input, select, textarea"))return;const n=s.target.closest("[data-article-id]");if(!n)return;const t=n.dataset.articleId,i=q.find(l=>String(l.id)===String(t));if(i)try{te(e,i)}catch(l){console.error("[News] Failed to open article:",l)}},e.addEventListener("click",D)}function te(e,s){const n=s.body||"",t=s.published_tick!=null?M(s.published_tick):h?.shard?.current_date||"[Month], [Year]",l=!!R?"&larr; Back to Edition":"&larr; Back to Front Page",a=le(n),v=s.image_url?`<div class="nws-reader-image">
            <img src="${r(s.image_url)}" alt="${r(s.headline)}">
            <p class="nws-img-caption">${r(s.headline)}</p>
           </div>`:"";e.innerHTML=`<div class="newspaper-container">
        <!-- TOP RIBBON -->
        <div class="nws-top-ribbon">
            <div class="nws-top-ribbon-inner">
                <span>${r(t)}</span>
                <span class="nws-edition">The Cruceran &mdash; Continental Edition</span>
                <button class="nws-write-btn" id="nws-back-btn">${l}</button>
            </div>
        </div>

        <!-- READER CONTENT -->
        <div class="nws-main-content">
            <div class="nws-reader">
                <div class="nws-reader-notice" role="note">
                    <strong>Note:</strong> Mentions of real-world events, people, or entities will cause your party to lose all Momentum and Governance. Further violations will cause action.
                </div>
                <span class="nws-section-tag">${r(k(s.category))} &mdash; ${r(t)}</span>
                <h1 class="nws-reader-headline">${r(s.headline)}</h1>
                <div class="nws-byline">
                    <span class="nws-author">${r(s.author_name)}</span>
                    <span class="nws-dot">&middot;</span>
                    <span>${r(t)}</span>
                </div>
                <hr class="nws-reader-rule">
                ${v}
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
    </div>`;const d=R,w=d?()=>ce(d.root,d.articles,d.dateLabel):()=>Y(g,h);document.getElementById("nws-back-btn")?.addEventListener("click",w),document.getElementById("nws-back-btn-bottom")?.addEventListener("click",w),be(s),e.scrollTop=0}async function be(e){const s=document.getElementById("nws-like-btn"),n=document.getElementById("nws-like-icon"),t=document.getElementById("nws-like-count");if(!s||!g||!h?.faction?.id)return;const i=h.faction.id;let l=!1;const{data:a}=await g.from("article_likes").select("id").eq("article_id",e.id).eq("faction_id",i).maybeSingle();a&&(s.classList.add("nws-like-btn--liked"),n.innerHTML="&#9829;"),s.addEventListener("click",async()=>{if(!l){l=!0,s.disabled=!0;try{const v=h.shard?.current_tick||0,{data:d,error:w}=await g.rpc("toggle_article_like",{p_article_id:e.id,p_faction_id:i,p_tick:v});if(w){console.error("[News] Like failed:",w.message);return}d.liked?(s.classList.add("nws-like-btn--liked"),n.innerHTML="&#9829;"):(s.classList.remove("nws-like-btn--liked"),n.innerHTML="&#9825;"),t.textContent=d.like_count,e.like_count=d.like_count}catch(v){console.error("[News] Like error:",v)}finally{l=!1,s.disabled=!1}}})}function r(e){const s=document.createElement("div");return s.textContent=e,s.innerHTML}function ie(e,s=1200){if(e.length<=s)return le(e);let n=e.lastIndexOf(" ",s);n<s*.5&&(n=s);const i=e.substring(0,n).split(/\n\n+/).filter(a=>a.trim());return i.map((a,v)=>`<p class="${v===0?"nws-drop-cap":""}">${W(r(a.trim()))}${v===i.length-1?"...":""}</p>`).join("")+'<p class="nws-read-more">Read More &rarr;</p>'}function W(e){return e.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>").replace(/__(.+?)__/g,"<u>$1</u>")}function le(e){const s=e.split(/\n\n+/).filter(n=>n.trim());return s.length<=1?`<p class="nws-drop-cap">${W(r(e))}</p>`:s.map((n,t)=>`<p class="${t===0?"nws-drop-cap":""}">${W(r(n.trim()))}</p>`).join("")}function k(e){return e==="elections"&&(e="politics"),{politics:"Politics",economy:"Business",international:"International",social:"Social",entertainment:"Entertainment",sports:"Sports",opinion:"Opinion"}[e]||e}function re(e){return e==="elections"&&(e="politics"),{politics:"linear-gradient(135deg,#2a1a2a,#1a0d1a)",economy:"linear-gradient(135deg,#2a1a0a,#1a0d00)",international:"linear-gradient(135deg,#0a1a2a,#001a2a)",social:"linear-gradient(135deg,#1a2a1a,#0d1a0d)",entertainment:"linear-gradient(135deg,#2a2a0a,#1a1a00)",sports:"linear-gradient(135deg,#2a0a0a,#1a0000)",opinion:"linear-gradient(135deg,#2a2a2a,#1a1a1a)"}[e]||"linear-gradient(135deg,#1a1a1a,#0d0d0d)"}async function z(){if(T)return T;const e=h?.shard,s=h?.nation;if(!e||!s)return[s?.id].filter(Boolean);const{data:n,error:t}=await g.from("nations").select("id").eq("shard_id",e.id);return t&&console.error("[News] Failed to fetch shard nations:",t),T=n&&n.length>0?n.map(i=>i.id):[s.id],T}async function O(){if(!(!g||!h))try{let e=await z();if(f==="alsahwa"){const{data:u}=await g.from("nations").select("id").eq("continent","Al-Makir");u&&u.length>0&&(e=u.map($=>$.id))}let s=g.from("player_articles").select("*").in("nation_id",e).eq("status","published").order("created_at",{ascending:!1});f==="alsahwa"?s=s.or("publication.eq.alsahwa,publication.eq.international"):f!=="cruceran"?s=s.or(`publication.eq.${f},publication.eq.international`):s=s.or("publication.eq.cruceran,publication.is.null,publication.eq.international");const{data:n,error:t}=await s;if(t){console.error("[News] Failed to load articles:",t);return}if(!n||n.length===0)return;const i=h.shard?.current_tick??0,l=x(i),a=n.filter(u=>x(u.published_tick??0)===l),v=n.filter(u=>x(u.published_tick??0)!==l),d=new Set(a.map(u=>u.category)),w=[],p=new Set;for(const u of v)u.category!=="opinion"&&(d.has(u.category)||(p.has(u.category)||p.add(u.category),w.push(u)));const m=n.filter(u=>u.category==="opinion").slice(0,4),c=[...a.filter(u=>u.category!=="opinion"),...w,...m];if(c.length===0)return;q=c;const o=C&&C!=="all"?c.filter(u=>(u.category==="elections"?"politics":u.category)===C):c;if(o.length===0&&C!=="all"){const u=`<p class="nws-placeholder" style="text-align:center;padding:40px;grid-column:1/-1;">No ${k(C)} articles in this edition.</p>`,$=document.getElementById("nws-lead-section");$&&($.innerHTML=u);const U=document.getElementById("nws-secondary-grid");U&&(U.innerHTML="");const K=document.querySelector(".nws-opinion-grid");K&&(K.innerHTML="");const J=document.querySelector(".nws-bottom-left");J&&(J.innerHTML="");return}const b=C==="opinion",_=[...b?o:o.filter(u=>u.category!=="opinion")].sort((u,$)=>($.published_tick??0)-(u.published_tick??0)),E=_[0],P=_.slice(1,4),A=_.slice(4,7),I=[...c].sort((u,$)=>new Date($.created_at)-new Date(u.created_at)).slice(0,5);f==="continental"?$e(E,P,A,m.slice(0,4),I):(E&&fe(E,P),ye(A),ee(b?[]:m.slice(0,4)),_e(I))}catch(e){console.error("[News] Error loading articles:",e)}}function fe(e,s){const n=document.getElementById("nws-lead-section");if(!n||!e)return;const t=s.length>0?s.map(d=>`
            <div class="nws-sidebar-story" data-article-id="${d.id}">
                ${H(d)}${N(d)}
                <span class="nws-section-tag">${r(k(d.category))}</span>
                <h3 class="nws-sidebar-headline">${r(d.headline)}</h3>
                <p class="nws-sidebar-deck">${r((d.body||"").replace(/\n+/g," ").substring(0,120))}${(d.body||"").length>120?"...":""}</p>
                <div class="nws-byline"><span class="nws-author">${r(d.author_name)}</span><span class="nws-dot">&middot;</span><span>${d.published_tick!=null?M(d.published_tick):h?.shard?.current_date||"—"}</span></div>
            </div>
        `).join(""):'<div class="nws-sidebar-story"><p class="nws-placeholder">[More stories will appear as articles are published.]</p></div>',i=e.image_url?`<img src="${r(e.image_url)}" alt="${r(e.headline)}">`:"",l=e.body||"",a=l.replace(/\n+/g," "),v=a.length>200?a.substring(0,200)+"...":a;n.innerHTML=`
        <div class="nws-lead-main" data-article-id="${e.id}">
            ${H(e)}${N(e)}
            <span class="nws-section-tag">${r(k(e.category))}</span>
            <h2 class="nws-lead-headline">${r(e.headline)}</h2>
            <p class="nws-lead-deck">${r(v)}</p>
            <div class="nws-byline">
                <span class="nws-author">${r(e.author_name)}</span>
                <span class="nws-dot">&middot;</span>
                <span>${e.published_tick!=null?M(e.published_tick):h?.shard?.current_date||"—"}</span>
            </div>
            <div class="nws-lead-body">
                ${ie(l)}
            </div>
        </div>
        <div class="nws-lead-sidebar">
            ${e.image_url?`<div class="nws-lead-image">${i}</div>
            <p class="nws-img-caption">${r(e.headline)}</p>`:""}
            ${t}
        </div>
    `}function ye(e){const s=document.getElementById("nws-secondary-grid");if(!s||e.length===0)return;const n=[...e],t=["Crisis","Election","Business"],i=[0,1,2].map(l=>{const a=n[l];if(a){const v=a.image_url?`<img src="${r(a.image_url)}" alt="${r(a.headline)}" style="width:100%;height:100%;object-fit:cover;">`:`<div class="nws-img-ph" style="background:${re(a.category)};">${r(k(a.category))}</div>`;return`<div class="nws-sec-story" data-article-id="${a.id}">
                ${H(a)}${N(a)}
                <div class="nws-sec-image">${v}</div>
                <span class="nws-section-tag">${r(k(a.category))}</span>
                <h3 class="nws-sec-headline">${r(a.headline)}</h3>
                <p class="nws-sec-deck">${r((a.body||"").replace(/\n+/g," ").substring(0,150))}${(a.body||"").length>150?"...":""}</p>
                <div class="nws-byline"><span class="nws-author">${r(a.author_name)}</span><span class="nws-dot">&middot;</span><span>${a.published_tick!=null?M(a.published_tick):h?.shard?.current_date||"—"}</span></div>
            </div>`}else{const v=t[l]||"News";return`<div class="nws-sec-story">
                <div class="nws-sec-image"><div class="nws-img-ph" style="background:${["linear-gradient(135deg,#1a2a1a,#0d1a0d)","linear-gradient(135deg,#1a1a2a,#0d0d1a)","linear-gradient(135deg,#2a1a0a,#1a0d00)"][l]};">${v}</div></div>
                <span class="nws-section-tag nws-placeholder">[${v}]</span>
                <h3 class="nws-sec-headline nws-placeholder">[${v} Section Headline]</h3>
                <p class="nws-sec-deck nws-placeholder">[Summary will appear here.]</p>
                <div class="nws-byline"><span class="nws-author nws-placeholder">[Author]</span><span class="nws-dot">&middot;</span><span class="nws-placeholder">[Date]</span></div>
            </div>`}}).join("");s.innerHTML=i}function _e(e){if(e.length===0)return;const s=document.querySelector(".nws-bottom-left");if(!s)return;const n='<div class="nws-col-header">In Brief</div>',t=e.map((a,v)=>`
        <div class="nws-brief-row" data-article-id="${a.id}">
            <div class="nws-brief-num">${v+1}</div>
            <div class="nws-brief-text">
                <strong>${r(a.headline)}${H(a)}${N(a)}</strong>
                ${r((a.body||"").replace(/\n+/g," ").substring(0,100))}${(a.body||"").length>100?"...":""}
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
                ${H(i)}${N(i)}
                <div class="nws-op-author">${r(i.author_name)} &mdash; Opinion</div>
                <div class="nws-op-headline">&ldquo;${r(l)}&rdquo;</div>
            </div>`}else return`<div class="nws-op-card">
                <div class="nws-op-author nws-placeholder">[Columnist] &mdash; [Topic]</div>
                <div class="nws-op-headline nws-placeholder">&ldquo;[Opinion headline will appear here.]&rdquo;</div>
            </div>`}).join("");s.innerHTML=n}function $e(e,s,n,t,i){const l=document.getElementById("nws-main-content")||document.querySelector(".nws-main-content");if(!l)return;const a=o=>(o||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"),v=o=>a((o.body||"").replace(/\n+/g," ").substring(0,200))+((o.body||"").length>200?"...":""),d=o=>a((o.body||"").replace(/\n+/g," ").substring(0,120))+((o.body||"").length>120?"...":""),w=o=>a(k(o.category)),p=o=>o?.published_tick!=null?M(o.published_tick):h?.shard?.current_date||"—",m={politics:"--politics",economy:"--economy",social:"--social",international:"--intl",entertainment:"--culture",science:"--science"};let c="";if(!e&&s.length===0&&n.length===0&&t.length===0&&i.length===0){c+='<div style="text-align:center;padding:60px 20px;color:#9e9b95;font-family:Outfit,sans-serif;">',c+='<div style="font-size:2rem;margin-bottom:12px;opacity:0.3;">📰</div>',c+='<div style="font-size:1rem;font-weight:600;">No articles yet</div>',c+='<div style="font-size:0.85rem;margin-top:6px;">Be the first to write for The Continental.</div>',c+="</div>",l.innerHTML=c;return}if(e){const o=e.image_url?`<img src="${a(e.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;">`:"";c+=`<div class="ct-hero" data-article-id="${e.id}">
            <div class="ct-hero__image">${o}</div>
            <div class="ct-hero__content">
                <div class="ct-hero__section">${w(e)}</div>
                <h1 class="ct-hero__headline">${a(e.headline)}</h1>
                <p class="ct-hero__lede">${v(e)}</p>
                <div class="ct-hero__meta">
                    <span class="ct-hero__author">${a(e.author_name)}</span>
                    <span>&middot;</span>
                    <span>${p(e)}</span>
                </div>
            </div>
        </div>`}if(s.length>0){c+=`<div class="ct-section-divider">
            <span class="ct-section-divider__label">Top Stories</span>
            <div class="ct-section-divider__line"></div>
        </div>`,c+='<div class="ct-story-grid">';for(const o of s){const b=m[o.category]||"",y=o.image_url?`<img src="${a(o.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;">`:"";c+=`<div class="ct-card" data-article-id="${o.id}">
                <div class="ct-card__image ct-card__image${b}">${y}
                    <span class="ct-card__image-label">${w(o)}</span>
                </div>
                <div class="ct-card__body">
                    <div class="ct-card__section">${w(o)}</div>
                    <h2 class="ct-card__headline">${a(o.headline)}</h2>
                    <p class="ct-card__summary">${d(o)}</p>
                    <div class="ct-card__meta">
                        <span class="ct-card__author">${a(o.author_name)}</span>
                        <span>&middot;</span>
                        <span>${p(o)}</span>
                    </div>
                </div>
            </div>`}c+="</div>"}if(n.length>0){c+=`</div><div class="ct-analysis-band"><div class="ct-analysis-band__inner">
            <div class="ct-analysis-band__header">
                <span class="ct-analysis-band__badge">Continental Analysis</span>
                <span class="ct-analysis-band__title">In-depth reporting from across Meridian</span>
            </div>
            <div class="ct-analysis-band__grid">`;for(const o of n)c+=`<div class="ct-analysis-story" data-article-id="${o.id}">
                <div class="ct-analysis-story__section">${w(o)}</div>
                <h2 class="ct-analysis-story__headline">${a(o.headline)}</h2>
                <p class="ct-analysis-story__summary">${d(o)}</p>
                <div class="ct-analysis-story__meta"><strong>${a(o.author_name)}</strong> &middot; ${p(o)}</div>
            </div>`;c+='</div></div></div><div class="nws-main-content">'}if(t.length>0||i.length>0){c+=`<div class="ct-section-divider">
            <span class="ct-section-divider__label">Analysis &amp; Opinion</span>
            <div class="ct-section-divider__line"></div>
        </div>`,c+='<div class="ct-two-col">',c+='<div class="ct-analysis-list">';for(let o=0;o<t.length;o++){const b=t[o];c+=`<div class="ct-analysis-item" data-article-id="${b.id}">
                <div class="ct-analysis-item__number">${String(o+1).padStart(2,"0")}</div>
                <div class="ct-analysis-item__content">
                    <div class="ct-analysis-item__section">${w(b)}</div>
                    <h3 class="ct-analysis-item__headline">${a(b.headline)}</h3>
                    <p class="ct-analysis-item__summary">${d(b)}</p>
                    <div class="ct-analysis-item__meta"><strong>${a(b.author_name)}</strong> &middot; ${p(b)}</div>
                </div>
            </div>`}c+="</div>",c+='<div class="ct-sidebar">',c+='<div class="ct-sidebar__section"><div class="ct-sidebar__section-title">Also in This Edition</div>';for(const o of i)c+=`<div class="ct-sidebar-brief" data-article-id="${o.id}">
                <div class="ct-sidebar-brief__section">${w(o)}</div>
                <div class="ct-sidebar-brief__headline">${a(o.headline)}</div>
            </div>`;c+="</div></div>",c+="</div>"}c+=`<div class="ct-footer">
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
    </div>`,l.innerHTML=c,l.querySelectorAll("[data-article-id]").forEach(o=>{o.style.cursor="pointer",o.addEventListener("click",b=>{if(b.target.closest(".nws-edit-btn, .nws-delete-btn"))return;const y=o.dataset.articleId,_=q.find(E=>String(E.id)===String(y));_&&te(document.getElementById("newspaper-root"),_)})})}function ke(e){const s=e.querySelectorAll(".nws-nav-item[data-category]");s.forEach(t=>{t.addEventListener("click",()=>{s.forEach(i=>i.classList.remove("active")),t.classList.add("active"),C=t.dataset.category,O()})});const n=e.querySelectorAll(".nws-alsahwa-nav-item[data-cat]");n.forEach(t=>{t.addEventListener("click",()=>{n.forEach(i=>i.classList.remove("nws-alsahwa-nav-item--active")),t.classList.add("nws-alsahwa-nav-item--active"),C=t.dataset.cat,O()})})}function Ee(e){const s=document.getElementById("nws-nav-archives");s&&s.addEventListener("click",()=>oe(e))}async function oe(e){if(!(!g||!h))try{const s=h.shard?.current_tick??0,n=h.shard?.current_date||"[Month], [Year]",t=await z(),{data:i,error:l}=await g.from("player_articles").select("*").in("nation_id",t).eq("status","published").order("published_tick",{ascending:!1});if(l){console.error("[News] Failed to load archive articles:",l);return}const a={};for(const p of i||[]){const m=p.published_tick??0,c=x(m);a[c]||(a[c]={label:c,maxTick:m,articles:[]}),a[c].articles.push(p),m>a[c].maxTick&&(a[c].maxTick=m)}const v=Object.values(a).sort((p,m)=>m.maxTick-p.maxTick),d=x(s),w=v.length>0?v.map(p=>{const m=p.label===d?' <span class="nws-archive-current">Current</span>':"";return`<div class="nws-archive-month" data-archive-season="${r(p.label)}">
                    <div class="nws-archive-month-name">${r(p.label)}${m}</div>
                    <div class="nws-archive-month-count">${p.articles.length} article${p.articles.length!==1?"s":""}</div>
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
                        ${w}
                    </div>
                </div>
            </div>

            <!-- FOOTER -->
            <div class="nws-footer">
                <h2>The Cruceran</h2>
                <p>Continental Edition &nbsp;&middot;&nbsp; Est. Year 1 &nbsp;&middot;&nbsp; All rights reserved &nbsp;&middot;&nbsp; Truth in the service of the people</p>
            </div>
        </div>`,document.getElementById("nws-back-btn")?.addEventListener("click",()=>Y(g,h)),e.querySelectorAll("[data-archive-season]").forEach(p=>{p.addEventListener("click",()=>{const m=p.dataset.archiveSeason,c=a[m];c&&ce(e,c.articles,c.label)})}),e.scrollTop=0}catch(s){console.error("[News] Error loading archives:",s)}}function ce(e,s,n){q=s;const t=s.filter(y=>y.category==="opinion"),l=[...s.filter(y=>y.category!=="opinion")].sort((y,_)=>(_.body||"").length-(y.body||"").length),a=l[0],v=l.slice(1,4),d=l.slice(4,7),w=l.slice(7,12),p=t.slice(0,4),m=a?Ie(a,v,n):'<p class="nws-placeholder" style="padding:40px;text-align:center;">[No articles in this edition]</p>',c=Be(d),o=Ce(p),b=Ae(w);e.innerHTML=`<div class="newspaper-container">
        <!-- TOP RIBBON -->
        <div class="nws-top-ribbon">
            <div class="nws-top-ribbon-inner">
                <span>${r(n)}</span>
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
            <span>Archived Edition &mdash; ${r(n)}</span>
        </div>

        <!-- MAIN CONTENT -->
        <div class="nws-main-content">
            <div class="nws-lead-section">${m}</div>
            ${c?`<div class="nws-secondary-grid">${c}</div>`:""}
        </div>

        ${o}

        ${b?`<div class="nws-main-content">
            <div class="nws-bottom-grid">
                <div class="nws-bottom-left">
                    <div class="nws-col-header">In Brief</div>
                    ${b}
                </div>
            </div>
        </div>`:""}

        <!-- FOOTER -->
        <div class="nws-footer">
            <h2>The Cruceran</h2>
            <p>Continental Edition &nbsp;&middot;&nbsp; Est. Year 1 &nbsp;&middot;&nbsp; All rights reserved &nbsp;&middot;&nbsp; Truth in the service of the people</p>
        </div>
    </div>`,document.getElementById("nws-back-to-archives")?.addEventListener("click",()=>oe(e)),R={root:e,articles:s,dateLabel:n},ae(e),e.scrollTop=0}function Ie(e,s,n){const t=s.length>0?s.map(d=>`
            <div class="nws-sidebar-story" data-article-id="${d.id}">
                <span class="nws-section-tag">${r(k(d.category))}</span>
                <h3 class="nws-sidebar-headline">${r(d.headline)}</h3>
                <p class="nws-sidebar-deck">${r((d.body||"").replace(/\n+/g," ").substring(0,120))}${(d.body||"").length>120?"...":""}</p>
                <div class="nws-byline"><span class="nws-author">${r(d.author_name)}</span><span class="nws-dot">&middot;</span><span>${r(n)}</span></div>
            </div>
        `).join(""):"",i=e.image_url?`<img src="${r(e.image_url)}" alt="${r(e.headline)}">`:"",l=e.body||"",a=l.replace(/\n+/g," "),v=a.length>200?a.substring(0,200)+"...":a;return`
        <div class="nws-lead-main" data-article-id="${e.id}">
            <span class="nws-section-tag">${r(k(e.category))}</span>
            <h2 class="nws-lead-headline">${r(e.headline)}</h2>
            <p class="nws-lead-deck">${r(v)}</p>
            <div class="nws-byline">
                <span class="nws-author">${r(e.author_name)}</span>
                <span class="nws-dot">&middot;</span>
                <span>${r(n)}</span>
            </div>
            <div class="nws-lead-body">
                ${ie(l)}
            </div>
        </div>
        <div class="nws-lead-sidebar">
            ${e.image_url?`<div class="nws-lead-image">${i}</div>
            <p class="nws-img-caption">${r(e.headline)}</p>`:""}
            ${t}
        </div>
    `}function Be(e){return e.length===0?"":e.map(s=>{const n=s.image_url?`<img src="${r(s.image_url)}" alt="${r(s.headline)}" style="width:100%;height:100%;object-fit:cover;">`:`<div class="nws-img-ph" style="background:${re(s.category)};">${r(k(s.category))}</div>`;return`<div class="nws-sec-story" data-article-id="${s.id}">
            <div class="nws-sec-image">${n}</div>
            <span class="nws-section-tag">${r(k(s.category))}</span>
            <h3 class="nws-sec-headline">${r(s.headline)}</h3>
            <p class="nws-sec-deck">${r((s.body||"").replace(/\n+/g," ").substring(0,150))}${(s.body||"").length>150?"...":""}</p>
            <div class="nws-byline"><span class="nws-author">${r(s.author_name)}</span></div>
        </div>`}).join("")}function Ce(e){return e.length===0?"":`<div class="nws-opinion-strip">
        <div class="nws-opinion-inner">
            <div class="nws-opinion-label">&mdash; Opinion &amp; Commentary &mdash;</div>
            <div class="nws-opinion-grid">${e.map(n=>{const t=(n.body||"").length>80?(n.body||"").substring(0,80)+"...":n.body||"";return`<div class="nws-op-card" data-article-id="${n.id}">
            <div class="nws-op-author">${r(n.author_name)} &mdash; Opinion</div>
            <div class="nws-op-headline">&ldquo;${r(t)}&rdquo;</div>
        </div>`}).join("")}</div>
        </div>
    </div>`}function Ae(e){return e.length===0?"":e.map((s,n)=>`
        <div class="nws-brief-row" data-article-id="${s.id}">
            <div class="nws-brief-num">${n+1}</div>
            <div class="nws-brief-text">
                <strong>${r(s.headline)}</strong>
                ${r((s.body||"").replace(/\n+/g," ").substring(0,100))}${(s.body||"").length>100?"...":""}
            </div>
        </div>
    `).join("")}function G(e){return e.w*3+e.d}function Te(e){return Object.values(e).sort((s,n)=>{const t=G(n)-G(s);return t!==0?t:n.w-s.w})}function Se(e){return`<span class="vln-form-dot" style="background:${{W:"#1a4a1a",D:"#8a6a20",L:"#8b1a1a"}[e]||"#999"}"></span>`}function Le(e,s){return e<=3?"vln-pos-top":e>=s-2?"vln-pos-bottom":""}function se(e,s={}){const n=Te(e),t=s.muted||!1,i=n.length;let l=`<div class="vln-table${t?" vln-table-muted":""}">
        <div class="vln-thead">
            <span class="vln-col-pos">#</span>
            <span class="vln-col-name">Club</span>
            <span class="vln-col-stat">W</span>
            <span class="vln-col-stat">D</span>
            <span class="vln-col-stat">L</span>
            <span class="vln-col-pts">Pts</span>
            ${t?"":'<span class="vln-col-form">Form</span>'}
        </div>`;return n.forEach((a,v)=>{const d=v+1,w=Le(d,i),p=d===3||d===7?" vln-zone-break":"",m=G(a),c=t?"":a.form.map(o=>Se(o)).join("");l+=`<div class="vln-row${p}">
            <span class="vln-col-pos ${w}">${d}</span>
            <span class="vln-col-name">${a.name}</span>
            <span class="vln-col-stat">${a.w}</span>
            <span class="vln-col-stat">${a.d}</span>
            <span class="vln-col-stat">${a.l}</span>
            <span class="vln-col-pts">${m}</span>
            ${t?"":`<span class="vln-col-form">${c}</span>`}
        </div>`}),l+="</div>",l}function xe(e,s){return e?`<div class="vln-motw">
        <div class="vln-motw-label">Match of the Week:</div>
        <div class="vln-motw-result">
            <span class="vln-motw-team">${e.homeName}</span>
            <span class="vln-motw-score">${e.homeScore} &mdash; ${e.awayScore}</span>
            <span class="vln-motw-team">${e.awayName}</span>
        </div>
        <div class="vln-motw-week">&mdash; Matchweek ${s}</div>
    </div>`:""}async function Me(){const e=document.getElementById("vln-widget");if(!(!e||!g))try{const{data:s,error:n}=await g.from("vln_state").select("*").eq("shard_name","Alpha Shard").maybeSingle();if(n||!s){e.innerHTML=`
                <div class="nws-col-header">Volbal Ligue Nationale</div>
                <div class="vln-offseason">Season concludes in March.</div>`;return}const t=h?.shard?.current_tick??0,i=2e3+Math.floor(t/12);let l='<div class="nws-col-header">Volbal Ligue Nationale</div>';s.active?((s.matchweek>=18||(s.fixtures||[]).every(v=>v.played))&&(!s.last_results||s.last_results.length===0)?l+='<div class="vln-matchweek">Final Standings</div>':l+=`<div class="vln-matchweek">Matchweek ${s.matchweek} of 18</div>`,l+=se(s.standings),l+=xe(s.match_of_week,s.matchweek)):s.standings&&Object.keys(s.standings).length>0&&Object.values(s.standings).some(v=>v.played>0)?(l+='<div class="vln-offseason">Off-season. Final standings below.</div>',l+=`<div class="vln-final-label">Final Standings &mdash; Year ${s.season}</div>`,l+=se(s.standings,{muted:!0})):l+='<div class="vln-offseason">Season concludes in March.</div>',e.innerHTML=l}catch(s){console.error("[VLN] Widget render failed:",s)}}async function Ne(){if(!(!g||!h))try{const e=await z(),s=h.shard?.current_tick||0,{data:n}=await g.from("event_log").select("description_chosen, fired_at_tick").in("nation_id",e).eq("category","corporate").gte("fired_at_tick",Math.max(0,s-12)).order("fired_at_tick",{ascending:!1}).limit(20),t=document.querySelector(".nws-ticker-scroll");if(!t)return;const i='  <span class="nws-ticker-sep">◆</span>  ';if(n&&n.length>0){const l=n.map(a=>a.description_chosen);t.innerHTML=l.join(i)+i+l.join(i)}}catch(e){console.error("[Ticker] Failed to load corporate events:",e)}}export{Y as i};
