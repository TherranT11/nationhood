import{_ as le}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{_ as oe,i as ce}from"./common-CxfFcfZv.js";import"./guide-C4vj_XhJ.js";import{t as re}from"./utils-C2W-HleY.js";import"./messaging-5qyQ6ziq.js";let b=null,w=null,L=[],C="all",B=null,O=null,H=null,T=null,N=!1,y="cruceran",Y=!1;const j={cruceran:{key:"cruceran",name:"The Cruceran",tagline:"Truth in the service of the people",nations:["Avelia","Palvera","San Estrella","Montequilla","Melizea","Sangreza"],style:"cruceran"},continental:{key:"continental",name:"The Continental",tagline:"Where Ideas Converge",nations:["Calveth"],style:"continental"}};function de(e){for(const[s,n]of Object.entries(j))if(n.nations.some(a=>a.toLowerCase()===(e||"").toLowerCase()))return s;return"cruceran"}function pe(e,s){const n=j[e];return n?n.nations.some(a=>a.toLowerCase()===(s||"").toLowerCase()):!1}const ve=["Winter","Spring","Spring","Spring","Summer","Summer","Summer","Fall","Fall","Fall","Winter","Winter"];function x(e){const s=e%12,n=2e3+Math.floor(e/12),a=ve[s],l=s===0?n-1:n;return`${a} ${l}`}async function P(e,s){b=e,w=s,B=null,C="all",H=null;const n=document.getElementById("newspaper-root");if(!n)return;Y||(y=de(s.nation?.name));const a=s.shard?.current_date||"[Month], [Year]",l=pe(y,s.nation?.name),i=Object.entries(j).map(([d,m])=>`<option value="${d}" ${d===y?"selected":""}>${m.name}</option>`).join("");n.innerHTML=`<div class="newspaper-container nws-pub-${y}">

        <!-- TOP RIBBON -->
        <div class="nws-top-ribbon${y==="continental"?" nws-top-ribbon--continental":""}">
            <div class="nws-top-ribbon-inner">
                <span>${a}</span>
                <select class="nws-pub-switcher" id="nws-pub-switcher">${i}</select>
                ${l?'<span><button class="nws-write-btn" id="nws-write-article-btn">Write Article</button></span>':"<span></span>"}
            </div>
        </div>

        ${y==="continental"?`
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
                    <span class="nws-ap-badge" id="nws-reward-badge">+5 Momentum (8000+)</span>
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

                    <div class="nws-form-group nws-intl-check">
                        <label class="nws-intl-label">
                            <input type="checkbox" id="nws-intl-checkbox">
                            <strong>Post Internationally</strong>: This will show up across all news sites. Cost 1 AP.
                        </label>
                    </div>

                    <button class="nws-submit-btn" id="nws-submit-btn">Publish Article</button>
                </div>
            </div>
        </div>

    </div>`,me(),ue(),he(n),ge(n),Z(n),ke(n),Ee(n);const t=document.getElementById("nws-pub-switcher");t&&t.addEventListener("change",async()=>{const d=t.value;if(d!==y){y=d,Y=!0;try{await P(b,w)}catch(m){console.error("[News] Publication switch failed:",m)}}});const v=document.getElementById("nws-reward-badge");v&&(v.textContent="+5 Momentum (8000+)"),await q(),Me()}function me(){const e=document.getElementById("nws-modal-overlay"),s=document.getElementById("nws-write-article-btn"),n=document.getElementById("nws-modal-close"),a=document.getElementById("nws-article-body"),l=document.getElementById("nws-char-count"),i=document.getElementById("nws-article-image"),t=document.getElementById("nws-file-label-text"),v=document.getElementById("nws-image-preview"),d=document.getElementById("nws-image-preview-img");s&&s.addEventListener("click",()=>{D(),e.classList.add("active")}),n&&n.addEventListener("click",()=>{e.classList.remove("active"),D()});const m=document.getElementById("nws-remove-image-btn");m&&m.addEventListener("click",()=>{N=!0;const p=document.getElementById("nws-image-preview");p&&(p.style.display="none");const u=document.getElementById("nws-file-label-text");u&&(u.textContent="Click to select an image..."),m.style.display="none"}),a&&l&&a.addEventListener("input",()=>{const p=a.value.length,u=p>=8e3?" · +5 Momentum":` · ${8e3-p} more for +5 Momentum`;l.textContent=`${p} / 12000${u}`,l.classList.toggle("nws-near-limit",p>=11500),l.classList.toggle("nws-ap-qualified",p>=8e3&&p<11500)}),i&&i.addEventListener("change",()=>{const p=i.files[0];if(!p){t.textContent="Click to select an image...",v.style.display="none";return}const u=2*1024*1024;if(p.size>u){E("Image must be under 2MB."),i.value="",t.textContent="Click to select an image...",v.style.display="none";return}t.textContent=p.name;const c=new FileReader;c.onload=r=>{d.src=r.target.result,v.style.display="block"},c.readAsDataURL(p)})}function E(e){const s=document.getElementById("nws-form-error");s&&(s.textContent=e,s.style.display="block",setTimeout(()=>{s.style.display="none"},5e3))}function V(e){const s=document.getElementById("nws-form-success");s&&(s.textContent=e,s.style.display="block",setTimeout(()=>{s.style.display="none"},5e3))}function ue(){const e=document.getElementById("nws-submit-btn");e&&e.addEventListener("click",async()=>{if(e.disabled)return;const s=document.getElementById("nws-article-title").value.trim(),n=document.getElementById("nws-article-author").value.trim(),a=document.getElementById("nws-article-category").value,l=document.getElementById("nws-article-body").value.trim(),t=document.getElementById("nws-article-image").files[0]||null,v=document.getElementById("nws-intl-checkbox")?.checked||!1;if(!s)return E("Please enter a headline.");if(!n)return E("Please enter a writer name.");if(!a)return E("Please select a category.");if(!l)return E("Please write an article body.");if(l.length>12e3)return E("Article body must be 12000 characters or fewer.");const d=!!T;e.disabled=!0,e.textContent=d?"Updating...":"Publishing...";try{const{nation:m,faction:p,shard:u}=w;if(d){let c;t?c=await K(m.id,t):N&&(c=null);const r={headline:s,author_name:n,body:l,category:a};c!==void 0&&(r.image_url=c);const{error:g}=await b.from("player_articles").update(r).eq("id",T).eq("author_faction_id",p.id);if(g)throw g;V("Article updated!")}else{if(v){const{deductAP:$}=await oe(async()=>{const{deductAP:M}=await import("./config-BIsh65GI.js");return{deductAP:M}},[]),k=await $(b,p.id,1);if(!k.success){E("Not enough AP for international post (need 1 AP).");return}p.action_points=k.newAp}let c=null;t&&(c=await K(m.id,t));const{error:r}=await b.from("player_articles").insert({nation_id:m.id,author_faction_id:p.id,author_name:n,headline:s,body:l,category:a,image_url:c,status:"published",published_tick:u?.current_tick||0,publication:v?"international":y});if(r)throw r;let g="Article published!";l.length>=8e3?(b.rpc("adjust_momentum",{p_faction_id:p.id,p_delta:5,p_label:"News article published (+5)",p_tick:u?.current_tick||0}).then(({error:f})=>{f&&console.error("[News] Momentum reward failed:",f)}),g="Article published! +5 Momentum."):g=`Article published! (${l.length}/8000 chars — no momentum reward)`,V(g)}D(),setTimeout(()=>{document.getElementById("nws-modal-overlay").classList.remove("active")},1500),await q()}catch(m){console.error(`[News] Article ${d?"update":"submission"} failed:`,m),E(`Failed to ${d?"update":"publish"} article. Please try again.`)}finally{e.disabled=!1,e.textContent=T?"Update Article":"Publish Article"}})}async function K(e,s){const n=s.name.split(".").pop()||"png",a=`player-articles/${e}/${Date.now()}.${n}`,{error:l}=await b.storage.from("public-assets").upload(a,s,{contentType:s.type,upsert:!0});if(l)throw l;const{data:i}=b.storage.from("public-assets").getPublicUrl(a);return i?.publicUrl||null}function S(e){return!w?.faction||e.author_faction_id!==w.faction.id?"":`<button class="nws-delete-btn" data-article-id="${e.id}" title="Delete article">&times;</button>`}function A(e){return!w?.faction||e.author_faction_id!==w.faction.id?"":`<button class="nws-edit-btn" data-edit-id="${e.id}" title="Edit article">&#9998;</button>`}function he(e){e.addEventListener("click",async s=>{const n=s.target.closest(".nws-delete-btn");if(!n)return;const a=n.dataset.articleId;if(!(!a||!confirm("Delete this article?"))){n.disabled=!0,n.textContent="...";try{const{error:l}=await b.from("player_articles").delete().eq("id",a).eq("author_faction_id",w.faction.id);if(l)throw l;await q()}catch(l){console.error("[News] Failed to delete article:",l),n.disabled=!1,n.textContent="×"}}})}function D(){T=null,N=!1,document.getElementById("nws-article-title").value="",document.getElementById("nws-article-author").value="",document.getElementById("nws-article-category").value="",document.getElementById("nws-article-body").value="";const e=document.getElementById("nws-article-image");e&&(e.value="");const s=document.getElementById("nws-file-label-text");s&&(s.textContent="Click to select an image...");const n=document.getElementById("nws-image-preview");n&&(n.style.display="none");const a=document.getElementById("nws-char-count");a&&(a.textContent="0 / 12000",a.classList.remove("nws-near-limit","nws-ap-qualified"));const l=document.getElementById("nws-remove-image-btn");l&&(l.style.display="none");const i=document.querySelector(".nws-modal-header h3");i&&(i.textContent="Write Article");const t=document.getElementById("nws-submit-btn");t&&(t.textContent="Publish Article");const v=document.getElementById("nws-intl-checkbox");v&&(v.checked=!1,v.closest(".nws-intl-check").style.display="")}function we(e){T=e.id,N=!1,document.getElementById("nws-article-title").value=e.headline||"",document.getElementById("nws-article-author").value=e.author_name||"",document.getElementById("nws-article-category").value=e.category||"",document.getElementById("nws-article-body").value=e.body||"";const s=(e.body||"").length,n=document.getElementById("nws-char-count");if(n){const u=s>=8e3?" · +5 Momentum":` · ${8e3-s} more for +5 Momentum`;n.textContent=`${s} / 12000${u}`,n.classList.toggle("nws-near-limit",s>=11500),n.classList.toggle("nws-ap-qualified",s>=8e3&&s<11500)}const a=document.getElementById("nws-image-preview"),l=document.getElementById("nws-image-preview-img"),i=document.getElementById("nws-file-label-text"),t=document.getElementById("nws-remove-image-btn"),v=document.getElementById("nws-article-image");v&&(v.value=""),e.image_url?(l&&(l.src=e.image_url),a&&(a.style.display="block"),i&&(i.textContent="Current image (select new to replace)"),t&&(t.style.display="inline")):(a&&(a.style.display="none"),i&&(i.textContent="Click to select an image..."),t&&(t.style.display="none"));const d=document.querySelector(".nws-modal-header h3");d&&(d.textContent="Edit Article");const m=document.getElementById("nws-submit-btn");m&&(m.textContent="Update Article");const p=document.getElementById("nws-intl-checkbox");p&&(p.checked=!1,p.closest(".nws-intl-check").style.display="none"),document.getElementById("nws-modal-overlay").classList.add("active")}function ge(e){e.addEventListener("click",s=>{const n=s.target.closest(".nws-edit-btn");if(!n)return;s.stopPropagation();const a=n.dataset.editId,l=L.find(i=>String(i.id)===String(a));l&&we(l)})}function Z(e){O&&e.removeEventListener("click",O),O=s=>{if(s.target.closest(".nws-delete-btn, .nws-edit-btn, .nws-write-btn, .nws-modal-overlay, button, a, input, select, textarea"))return;const n=s.target.closest("[data-article-id]");if(!n)return;const a=n.dataset.articleId,l=L.find(i=>String(i.id)===String(a));if(l)try{Q(e,l)}catch(i){console.error("[News] Failed to open article:",i)}},e.addEventListener("click",O)}function Q(e,s){const n=s.body||"",a=s.published_tick!=null?re(s.published_tick):w?.shard?.current_date||"[Month], [Year]",i=!!H?"&larr; Back to Edition":"&larr; Back to Front Page",t=ee(n),v=s.image_url?`<div class="nws-reader-image">
            <img src="${o(s.image_url)}" alt="${o(s.headline)}">
            <p class="nws-img-caption">${o(s.headline)}</p>
           </div>`:"";e.innerHTML=`<div class="newspaper-container">
        <!-- TOP RIBBON -->
        <div class="nws-top-ribbon">
            <div class="nws-top-ribbon-inner">
                <span>${o(a)}</span>
                <span class="nws-edition">The Cruceran &mdash; Continental Edition</span>
                <button class="nws-write-btn" id="nws-back-btn">${i}</button>
            </div>
        </div>

        <!-- READER CONTENT -->
        <div class="nws-main-content">
            <div class="nws-reader">
                <span class="nws-section-tag">${o(_(s.category))} &mdash; ${o(a)}</span>
                <h1 class="nws-reader-headline">${o(s.headline)}</h1>
                <div class="nws-byline">
                    <span class="nws-author">${o(s.author_name)}</span>
                    <span class="nws-dot">&middot;</span>
                    <span>${o(a)}</span>
                </div>
                <hr class="nws-reader-rule">
                ${v}
                <div class="nws-reader-body">
                    ${t}
                </div>
                <hr class="nws-reader-rule">
                <button class="nws-back-link" id="nws-back-btn-bottom">${i}</button>
            </div>
        </div>

        <!-- FOOTER -->
        <div class="nws-footer">
            <h2>The Cruceran</h2>
            <p>Continental Edition &nbsp;&middot;&nbsp; Est. Year 1 &nbsp;&middot;&nbsp; All rights reserved &nbsp;&middot;&nbsp; Truth in the service of the people</p>
        </div>
    </div>`;const d=H,m=d?()=>ie(d.root,d.articles,d.dateLabel):()=>P(b,w);document.getElementById("nws-back-btn")?.addEventListener("click",m),document.getElementById("nws-back-btn-bottom")?.addEventListener("click",m),e.scrollTop=0}function o(e){const s=document.createElement("div");return s.textContent=e,s.innerHTML}function X(e,s=1200){if(e.length<=s)return ee(e);let n=e.lastIndexOf(" ",s);n<s*.5&&(n=s);const l=e.substring(0,n).split(/\n\n+/).filter(t=>t.trim());return l.map((t,v)=>`<p class="${v===0?"nws-drop-cap":""}">${R(o(t.trim()))}${v===l.length-1?"...":""}</p>`).join("")+'<p class="nws-read-more">Read More &rarr;</p>'}function R(e){return e.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>").replace(/__(.+?)__/g,"<u>$1</u>")}function ee(e){const s=e.split(/\n\n+/).filter(n=>n.trim());return s.length<=1?`<p class="nws-drop-cap">${R(o(e))}</p>`:s.map((n,a)=>`<p class="${a===0?"nws-drop-cap":""}">${R(o(n.trim()))}</p>`).join("")}function _(e){return e==="elections"&&(e="politics"),{politics:"Politics",economy:"Economy",international:"International",social:"Social",entertainment:"Entertainment",sports:"Sports",opinion:"Opinion"}[e]||e}function se(e){return e==="elections"&&(e="politics"),{politics:"linear-gradient(135deg,#2a1a2a,#1a0d1a)",economy:"linear-gradient(135deg,#2a1a0a,#1a0d00)",international:"linear-gradient(135deg,#0a1a2a,#001a2a)",social:"linear-gradient(135deg,#1a2a1a,#0d1a0d)",entertainment:"linear-gradient(135deg,#2a2a0a,#1a1a00)",sports:"linear-gradient(135deg,#2a0a0a,#1a0000)",opinion:"linear-gradient(135deg,#2a2a2a,#1a1a1a)"}[e]||"linear-gradient(135deg,#1a1a1a,#0d0d0d)"}function ne(e,s){return`<div class="nws-img-placeholder">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="4" fill="rgba(255,255,255,0.05)"/>
            <circle cx="18" cy="20" r="6" fill="rgba(255,255,255,0.1)"/>
            <path d="M6 38 L18 26 L26 34 L34 22 L42 38Z" fill="rgba(255,255,255,0.08)"/>
        </svg>
        <span style="font-family:'Inter',sans-serif;font-size:9px;color:rgba(255,255,255,0.2);letter-spacing:1px;text-transform:uppercase;">${o(s)}</span>
    </div>`}async function te(){if(B)return B;const e=w?.shard,s=w?.nation;if(!e||!s)return[s?.id].filter(Boolean);const{data:n,error:a}=await b.from("nations").select("id").eq("shard_id",e.id);return a&&console.error("[News] Failed to fetch shard nations:",a),B=n&&n.length>0?n.map(l=>l.id):[s.id],B}async function q(){if(!(!b||!w))try{const e=await te();let s=b.from("player_articles").select("*").in("nation_id",e).eq("status","published").order("created_at",{ascending:!1});y!=="cruceran"?s=s.or(`publication.eq.${y},publication.eq.international`):s=s.or("publication.eq.cruceran,publication.is.null,publication.eq.international");const{data:n,error:a}=await s;if(a){console.error("[News] Failed to load articles:",a);return}if(!n||n.length===0)return;const l=w.shard?.current_tick??0,i=x(l),t=n.filter(h=>x(h.published_tick??0)===i),v=n.filter(h=>x(h.published_tick??0)!==i),d=new Set(t.map(h=>h.category)),m=[],p=new Set;for(const h of v)h.category!=="opinion"&&(d.has(h.category)||(p.has(h.category)||p.add(h.category),m.push(h)));const u=n.filter(h=>h.category==="opinion").slice(0,4),c=[...t.filter(h=>h.category!=="opinion"),...m,...u];if(c.length===0)return;L=c;const r=C&&C!=="all"?c.filter(h=>(h.category==="elections"?"politics":h.category)===C):c;if(r.length===0&&C!=="all"){const h=`<p class="nws-placeholder" style="text-align:center;padding:40px;grid-column:1/-1;">No ${_(C)} articles in this edition.</p>`,I=document.getElementById("nws-lead-section");I&&(I.innerHTML=h);const G=document.getElementById("nws-secondary-grid");G&&(G.innerHTML="");const z=document.querySelector(".nws-opinion-grid");z&&(z.innerHTML="");const U=document.querySelector(".nws-bottom-left");U&&(U.innerHTML="");return}const f=[...r.filter(h=>h.category!=="opinion")].sort((h,I)=>(I.published_tick??0)-(h.published_tick??0)),$=f[0],k=f.slice(1,4),M=f.slice(4,7),W=[...c].sort((h,I)=>new Date(I.created_at)-new Date(h.created_at)).slice(0,5);y==="continental"?$e($,k,M,u.slice(0,4),W):($&&be($,k),fe(M),_e(u.slice(0,4)),ye(W))}catch(e){console.error("[News] Error loading articles:",e)}}function be(e,s){const n=document.getElementById("nws-lead-section");if(!n||!e)return;const a=s.length>0?s.map(d=>`
            <div class="nws-sidebar-story" data-article-id="${d.id}">
                ${A(d)}${S(d)}
                <span class="nws-section-tag">${o(_(d.category))}</span>
                <h3 class="nws-sidebar-headline">${o(d.headline)}</h3>
                <p class="nws-sidebar-deck">${o((d.body||"").replace(/\n+/g," ").substring(0,120))}${(d.body||"").length>120?"...":""}</p>
                <div class="nws-byline"><span class="nws-author">${o(d.author_name)}</span><span class="nws-dot">&middot;</span><span>${w?.shard?.current_date||"—"}</span></div>
            </div>
        `).join(""):'<div class="nws-sidebar-story"><p class="nws-placeholder">[More stories will appear as articles are published.]</p></div>',l=e.image_url?`<img src="${o(e.image_url)}" alt="${o(e.headline)}">`:ne(null,"Photo"),i=e.body||"",t=i.replace(/\n+/g," "),v=t.length>200?t.substring(0,200)+"...":t;n.innerHTML=`
        <div class="nws-lead-main" data-article-id="${e.id}">
            ${A(e)}${S(e)}
            <span class="nws-section-tag">${o(_(e.category))}</span>
            <h2 class="nws-lead-headline">${o(e.headline)}</h2>
            <p class="nws-lead-deck">${o(v)}</p>
            <div class="nws-byline">
                <span class="nws-author">${o(e.author_name)}</span>
                <span class="nws-dot">&middot;</span>
                <span>${w?.shard?.current_date||"—"}</span>
            </div>
            <div class="nws-lead-body">
                ${X(i)}
            </div>
        </div>
        <div class="nws-lead-sidebar">
            <div class="nws-lead-image">${l}</div>
            <p class="nws-img-caption">${e.image_url?o(e.headline):'<span class="nws-placeholder">[Photo]</span>'}</p>
            ${a}
        </div>
    `}function fe(e){const s=document.getElementById("nws-secondary-grid");if(!s||e.length===0)return;const n=[...e],a=["Crisis","Election","Economy"],l=[0,1,2].map(i=>{const t=n[i];if(t){const v=t.image_url?`<img src="${o(t.image_url)}" alt="${o(t.headline)}" style="width:100%;height:100%;object-fit:cover;">`:`<div class="nws-img-ph" style="background:${se(t.category)};">${o(_(t.category))}</div>`;return`<div class="nws-sec-story" data-article-id="${t.id}">
                ${A(t)}${S(t)}
                <div class="nws-sec-image">${v}</div>
                <span class="nws-section-tag">${o(_(t.category))}</span>
                <h3 class="nws-sec-headline">${o(t.headline)}</h3>
                <p class="nws-sec-deck">${o((t.body||"").replace(/\n+/g," ").substring(0,150))}${(t.body||"").length>150?"...":""}</p>
                <div class="nws-byline"><span class="nws-author">${o(t.author_name)}</span><span class="nws-dot">&middot;</span><span>${w?.shard?.current_date||"—"}</span></div>
            </div>`}else{const v=a[i]||"News";return`<div class="nws-sec-story">
                <div class="nws-sec-image"><div class="nws-img-ph" style="background:${["linear-gradient(135deg,#1a2a1a,#0d1a0d)","linear-gradient(135deg,#1a1a2a,#0d0d1a)","linear-gradient(135deg,#2a1a0a,#1a0d00)"][i]};">${v}</div></div>
                <span class="nws-section-tag nws-placeholder">[${v}]</span>
                <h3 class="nws-sec-headline nws-placeholder">[${v} Section Headline]</h3>
                <p class="nws-sec-deck nws-placeholder">[Summary will appear here.]</p>
                <div class="nws-byline"><span class="nws-author nws-placeholder">[Author]</span><span class="nws-dot">&middot;</span><span class="nws-placeholder">[Date]</span></div>
            </div>`}}).join("");s.innerHTML=l}function ye(e){if(e.length===0)return;const s=document.querySelector(".nws-bottom-left");if(!s)return;const n='<div class="nws-col-header">In Brief</div>',a=e.map((t,v)=>`
        <div class="nws-brief-row" data-article-id="${t.id}">
            <div class="nws-brief-num">${v+1}</div>
            <div class="nws-brief-text">
                <strong>${o(t.headline)}${A(t)}${S(t)}</strong>
                ${o((t.body||"").replace(/\n+/g," ").substring(0,100))}${(t.body||"").length>100?"...":""}
            </div>
        </div>
    `).join(""),l=5-e.length;let i="";for(let t=0;t<l;t++)i+=`
            <div class="nws-brief-row">
                <div class="nws-brief-num">${e.length+t+1}</div>
                <div class="nws-brief-text">
                    <strong class="nws-placeholder">[Brief headline]</strong>
                    <span class="nws-placeholder">[Short summary of a recent story.]</span>
                </div>
            </div>
        `;s.innerHTML=n+a+i}function _e(e){const s=document.querySelector(".nws-opinion-grid");if(!s||e.length===0)return;const n=[0,1,2,3].map(a=>{const l=e[a];if(l){const i=(l.body||"").length>80?(l.body||"").substring(0,80)+"...":l.body||"";return`<div class="nws-op-card" data-article-id="${l.id}">
                ${A(l)}${S(l)}
                <div class="nws-op-author">${o(l.author_name)} &mdash; Opinion</div>
                <div class="nws-op-headline">&ldquo;${o(i)}&rdquo;</div>
            </div>`}else return`<div class="nws-op-card">
                <div class="nws-op-author nws-placeholder">[Columnist] &mdash; [Topic]</div>
                <div class="nws-op-headline nws-placeholder">&ldquo;[Opinion headline will appear here.]&rdquo;</div>
            </div>`}).join("");s.innerHTML=n}function $e(e,s,n,a,l){const i=document.getElementById("nws-main-content")||document.querySelector(".nws-main-content");if(!i)return;const t=r=>(r||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"),v=r=>t((r.body||"").replace(/\n+/g," ").substring(0,200))+((r.body||"").length>200?"...":""),d=r=>t((r.body||"").replace(/\n+/g," ").substring(0,120))+((r.body||"").length>120?"...":""),m=r=>t(_(r.category)),p=w?.shard?.current_date||"—",u={politics:"--politics",economy:"--economy",social:"--social",international:"--intl",entertainment:"--culture",science:"--science"};let c="";if(!e&&s.length===0&&n.length===0&&a.length===0&&l.length===0){c+='<div style="text-align:center;padding:60px 20px;color:#9e9b95;font-family:Outfit,sans-serif;">',c+='<div style="font-size:2rem;margin-bottom:12px;opacity:0.3;">📰</div>',c+='<div style="font-size:1rem;font-weight:600;">No articles yet</div>',c+='<div style="font-size:0.85rem;margin-top:6px;">Be the first to write for The Continental.</div>',c+="</div>",i.innerHTML=c;return}if(e){const r=e.image_url?`<img src="${t(e.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;">`:"";c+=`<div class="ct-hero" data-article-id="${e.id}">
            <div class="ct-hero__image">${r}</div>
            <div class="ct-hero__content">
                <div class="ct-hero__section">${m(e)}</div>
                <h1 class="ct-hero__headline">${t(e.headline)}</h1>
                <p class="ct-hero__lede">${v(e)}</p>
                <div class="ct-hero__meta">
                    <span class="ct-hero__author">${t(e.author_name)}</span>
                    <span>&middot;</span>
                    <span>${p}</span>
                </div>
            </div>
        </div>`}if(s.length>0){c+=`<div class="ct-section-divider">
            <span class="ct-section-divider__label">Top Stories</span>
            <div class="ct-section-divider__line"></div>
        </div>`,c+='<div class="ct-story-grid">';for(const r of s){const g=u[r.category]||"",f=r.image_url?`<img src="${t(r.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;">`:"";c+=`<div class="ct-card" data-article-id="${r.id}">
                <div class="ct-card__image ct-card__image${g}">${f}
                    <span class="ct-card__image-label">${m(r)}</span>
                </div>
                <div class="ct-card__body">
                    <div class="ct-card__section">${m(r)}</div>
                    <h2 class="ct-card__headline">${t(r.headline)}</h2>
                    <p class="ct-card__summary">${d(r)}</p>
                    <div class="ct-card__meta">
                        <span class="ct-card__author">${t(r.author_name)}</span>
                        <span>&middot;</span>
                        <span>${p}</span>
                    </div>
                </div>
            </div>`}c+="</div>"}if(n.length>0){c+=`</div><div class="ct-analysis-band"><div class="ct-analysis-band__inner">
            <div class="ct-analysis-band__header">
                <span class="ct-analysis-band__badge">Continental Analysis</span>
                <span class="ct-analysis-band__title">In-depth reporting from across Meridian</span>
            </div>
            <div class="ct-analysis-band__grid">`;for(const r of n)c+=`<div class="ct-analysis-story" data-article-id="${r.id}">
                <div class="ct-analysis-story__section">${m(r)}</div>
                <h2 class="ct-analysis-story__headline">${t(r.headline)}</h2>
                <p class="ct-analysis-story__summary">${d(r)}</p>
                <div class="ct-analysis-story__meta"><strong>${t(r.author_name)}</strong> &middot; ${p}</div>
            </div>`;c+='</div></div></div><div class="nws-main-content">'}if(a.length>0||l.length>0){c+=`<div class="ct-section-divider">
            <span class="ct-section-divider__label">Analysis &amp; Opinion</span>
            <div class="ct-section-divider__line"></div>
        </div>`,c+='<div class="ct-two-col">',c+='<div class="ct-analysis-list">';for(let r=0;r<a.length;r++){const g=a[r];c+=`<div class="ct-analysis-item" data-article-id="${g.id}">
                <div class="ct-analysis-item__number">${String(r+1).padStart(2,"0")}</div>
                <div class="ct-analysis-item__content">
                    <div class="ct-analysis-item__section">${m(g)}</div>
                    <h3 class="ct-analysis-item__headline">${t(g.headline)}</h3>
                    <p class="ct-analysis-item__summary">${d(g)}</p>
                    <div class="ct-analysis-item__meta"><strong>${t(g.author_name)}</strong> &middot; ${p}</div>
                </div>
            </div>`}c+="</div>",c+='<div class="ct-sidebar">',c+='<div class="ct-sidebar__section"><div class="ct-sidebar__section-title">Also in This Edition</div>';for(const r of l)c+=`<div class="ct-sidebar-brief" data-article-id="${r.id}">
                <div class="ct-sidebar-brief__section">${m(r)}</div>
                <div class="ct-sidebar-brief__headline">${t(r.headline)}</div>
            </div>`;c+="</div></div>",c+="</div>"}c+=`<div class="ct-footer">
        <div class="ct-footer__inner">
            <div class="ct-footer__brand">
                <div class="ct-footer__title">The Continental</div>
                <div class="ct-footer__tagline">Independent journalism for Meridian.<br>Where Ideas Converge.</div>
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
    </div>`,i.innerHTML=c,i.querySelectorAll("[data-article-id]").forEach(r=>{r.style.cursor="pointer",r.addEventListener("click",g=>{if(g.target.closest(".nws-edit-btn, .nws-delete-btn"))return;const f=r.dataset.articleId,$=L.find(k=>String(k.id)===String(f));$&&Q(document.getElementById("newspaper-root"),$)})})}function Ee(e){const s=e.querySelectorAll(".nws-nav-item[data-category]");s.forEach(n=>{n.addEventListener("click",()=>{s.forEach(a=>a.classList.remove("active")),n.classList.add("active"),C=n.dataset.category,q()})})}function ke(e){const s=document.getElementById("nws-nav-archives");s&&s.addEventListener("click",()=>ae(e))}async function ae(e){if(!(!b||!w))try{const s=w.shard?.current_tick??0,n=w.shard?.current_date||"[Month], [Year]",a=await te(),{data:l,error:i}=await b.from("player_articles").select("*").in("nation_id",a).eq("status","published").order("published_tick",{ascending:!1});if(i){console.error("[News] Failed to load archive articles:",i);return}const t={};for(const p of l||[]){const u=p.published_tick??0,c=x(u);t[c]||(t[c]={label:c,maxTick:u,articles:[]}),t[c].articles.push(p),u>t[c].maxTick&&(t[c].maxTick=u)}const v=Object.values(t).sort((p,u)=>u.maxTick-p.maxTick),d=x(s),m=v.length>0?v.map(p=>{const u=p.label===d?' <span class="nws-archive-current">Current</span>':"";return`<div class="nws-archive-month" data-archive-season="${o(p.label)}">
                    <div class="nws-archive-month-name">${o(p.label)}${u}</div>
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
                        ${m}
                    </div>
                </div>
            </div>

            <!-- FOOTER -->
            <div class="nws-footer">
                <h2>The Cruceran</h2>
                <p>Continental Edition &nbsp;&middot;&nbsp; Est. Year 1 &nbsp;&middot;&nbsp; All rights reserved &nbsp;&middot;&nbsp; Truth in the service of the people</p>
            </div>
        </div>`,document.getElementById("nws-back-btn")?.addEventListener("click",()=>P(b,w)),e.querySelectorAll("[data-archive-season]").forEach(p=>{p.addEventListener("click",()=>{const u=p.dataset.archiveSeason,c=t[u];c&&ie(e,c.articles,c.label)})}),e.scrollTop=0}catch(s){console.error("[News] Error loading archives:",s)}}function ie(e,s,n){L=s;const a=s.filter(f=>f.category==="opinion"),i=[...s.filter(f=>f.category!=="opinion")].sort((f,$)=>($.body||"").length-(f.body||"").length),t=i[0],v=i.slice(1,4),d=i.slice(4,7),m=i.slice(7,12),p=a.slice(0,4),u=t?Ie(t,v,n):'<p class="nws-placeholder" style="padding:40px;text-align:center;">[No articles in this edition]</p>',c=Ce(d),r=Be(p),g=Te(m);e.innerHTML=`<div class="newspaper-container">
        <!-- TOP RIBBON -->
        <div class="nws-top-ribbon">
            <div class="nws-top-ribbon-inner">
                <span>${o(n)}</span>
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
            <span>Archived Edition &mdash; ${o(n)}</span>
        </div>

        <!-- MAIN CONTENT -->
        <div class="nws-main-content">
            <div class="nws-lead-section">${u}</div>
            ${c?`<div class="nws-secondary-grid">${c}</div>`:""}
        </div>

        ${r}

        ${g?`<div class="nws-main-content">
            <div class="nws-bottom-grid">
                <div class="nws-bottom-left">
                    <div class="nws-col-header">In Brief</div>
                    ${g}
                </div>
            </div>
        </div>`:""}

        <!-- FOOTER -->
        <div class="nws-footer">
            <h2>The Cruceran</h2>
            <p>Continental Edition &nbsp;&middot;&nbsp; Est. Year 1 &nbsp;&middot;&nbsp; All rights reserved &nbsp;&middot;&nbsp; Truth in the service of the people</p>
        </div>
    </div>`,document.getElementById("nws-back-to-archives")?.addEventListener("click",()=>ae(e)),H={root:e,articles:s,dateLabel:n},Z(e),e.scrollTop=0}function Ie(e,s,n){const a=s.length>0?s.map(d=>`
            <div class="nws-sidebar-story" data-article-id="${d.id}">
                <span class="nws-section-tag">${o(_(d.category))}</span>
                <h3 class="nws-sidebar-headline">${o(d.headline)}</h3>
                <p class="nws-sidebar-deck">${o((d.body||"").replace(/\n+/g," ").substring(0,120))}${(d.body||"").length>120?"...":""}</p>
                <div class="nws-byline"><span class="nws-author">${o(d.author_name)}</span><span class="nws-dot">&middot;</span><span>${o(n)}</span></div>
            </div>
        `).join(""):"",l=e.image_url?`<img src="${o(e.image_url)}" alt="${o(e.headline)}">`:ne(null,"Photo"),i=e.body||"",t=i.replace(/\n+/g," "),v=t.length>200?t.substring(0,200)+"...":t;return`
        <div class="nws-lead-main" data-article-id="${e.id}">
            <span class="nws-section-tag">${o(_(e.category))}</span>
            <h2 class="nws-lead-headline">${o(e.headline)}</h2>
            <p class="nws-lead-deck">${o(v)}</p>
            <div class="nws-byline">
                <span class="nws-author">${o(e.author_name)}</span>
                <span class="nws-dot">&middot;</span>
                <span>${o(n)}</span>
            </div>
            <div class="nws-lead-body">
                ${X(i)}
            </div>
        </div>
        <div class="nws-lead-sidebar">
            <div class="nws-lead-image">${l}</div>
            <p class="nws-img-caption">${e.image_url?o(e.headline):'<span class="nws-placeholder">[Photo]</span>'}</p>
            ${a}
        </div>
    `}function Ce(e){return e.length===0?"":e.map(s=>{const n=s.image_url?`<img src="${o(s.image_url)}" alt="${o(s.headline)}" style="width:100%;height:100%;object-fit:cover;">`:`<div class="nws-img-ph" style="background:${se(s.category)};">${o(_(s.category))}</div>`;return`<div class="nws-sec-story" data-article-id="${s.id}">
            <div class="nws-sec-image">${n}</div>
            <span class="nws-section-tag">${o(_(s.category))}</span>
            <h3 class="nws-sec-headline">${o(s.headline)}</h3>
            <p class="nws-sec-deck">${o((s.body||"").replace(/\n+/g," ").substring(0,150))}${(s.body||"").length>150?"...":""}</p>
            <div class="nws-byline"><span class="nws-author">${o(s.author_name)}</span></div>
        </div>`}).join("")}function Be(e){return e.length===0?"":`<div class="nws-opinion-strip">
        <div class="nws-opinion-inner">
            <div class="nws-opinion-label">&mdash; Opinion &amp; Commentary &mdash;</div>
            <div class="nws-opinion-grid">${e.map(n=>{const a=(n.body||"").length>80?(n.body||"").substring(0,80)+"...":n.body||"";return`<div class="nws-op-card" data-article-id="${n.id}">
            <div class="nws-op-author">${o(n.author_name)} &mdash; Opinion</div>
            <div class="nws-op-headline">&ldquo;${o(a)}&rdquo;</div>
        </div>`}).join("")}</div>
        </div>
    </div>`}function Te(e){return e.length===0?"":e.map((s,n)=>`
        <div class="nws-brief-row" data-article-id="${s.id}">
            <div class="nws-brief-num">${n+1}</div>
            <div class="nws-brief-text">
                <strong>${o(s.headline)}</strong>
                ${o((s.body||"").replace(/\n+/g," ").substring(0,100))}${(s.body||"").length>100?"...":""}
            </div>
        </div>
    `).join("")}function F(e){return e.w*3+e.d}function xe(e){return Object.values(e).sort((s,n)=>{const a=F(n)-F(s);return a!==0?a:n.w-s.w})}function Se(e){return`<span class="vln-form-dot" style="background:${{W:"#1a4a1a",D:"#8a6a20",L:"#8b1a1a"}[e]||"#999"}"></span>`}function Ae(e,s){return e<=3?"vln-pos-top":e>=s-2?"vln-pos-bottom":""}function J(e,s={}){const n=xe(e),a=s.muted||!1,l=n.length;let i=`<div class="vln-table${a?" vln-table-muted":""}">
        <div class="vln-thead">
            <span class="vln-col-pos">#</span>
            <span class="vln-col-name">Club</span>
            <span class="vln-col-stat">W</span>
            <span class="vln-col-stat">D</span>
            <span class="vln-col-stat">L</span>
            <span class="vln-col-pts">Pts</span>
            ${a?"":'<span class="vln-col-form">Form</span>'}
        </div>`;return n.forEach((t,v)=>{const d=v+1,m=Ae(d,l),p=d===3||d===7?" vln-zone-break":"",u=F(t),c=a?"":t.form.map(r=>Se(r)).join("");i+=`<div class="vln-row${p}">
            <span class="vln-col-pos ${m}">${d}</span>
            <span class="vln-col-name">${t.name}</span>
            <span class="vln-col-stat">${t.w}</span>
            <span class="vln-col-stat">${t.d}</span>
            <span class="vln-col-stat">${t.l}</span>
            <span class="vln-col-pts">${u}</span>
            ${a?"":`<span class="vln-col-form">${c}</span>`}
        </div>`}),i+="</div>",i}function Le(e,s){return e?`<div class="vln-motw">
        <div class="vln-motw-label">Match of the Week:</div>
        <div class="vln-motw-result">
            <span class="vln-motw-team">${e.homeName}</span>
            <span class="vln-motw-score">${e.homeScore} &mdash; ${e.awayScore}</span>
            <span class="vln-motw-team">${e.awayName}</span>
        </div>
        <div class="vln-motw-week">&mdash; Matchweek ${s}</div>
    </div>`:""}async function Me(){const e=document.getElementById("vln-widget");if(!(!e||!b))try{const{data:s,error:n}=await b.from("vln_state").select("*").eq("shard_name","Alpha Shard").maybeSingle();if(n||!s){e.innerHTML=`
                <div class="nws-col-header">Volbal Ligue Nationale</div>
                <div class="vln-offseason">Season concludes in March.</div>`;return}const a=w?.shard?.current_tick??0,l=2e3+Math.floor(a/12);let i='<div class="nws-col-header">Volbal Ligue Nationale</div>';s.active?((s.matchweek>=18||(s.fixtures||[]).every(v=>v.played))&&(!s.last_results||s.last_results.length===0)?i+='<div class="vln-matchweek">Final Standings</div>':i+=`<div class="vln-matchweek">Matchweek ${s.matchweek} of 18</div>`,i+=J(s.standings),i+=Le(s.match_of_week,s.matchweek)):s.standings&&Object.keys(s.standings).length>0&&Object.values(s.standings).some(v=>v.played>0)?(i+='<div class="vln-offseason">Off-season. Final standings below.</div>',i+=`<div class="vln-final-label">Final Standings &mdash; Year ${s.season}</div>`,i+=J(s.standings,{muted:!0})):i+='<div class="vln-offseason">Season concludes in March.</div>',e.innerHTML=i}catch(s){console.error("[VLN] Widget render failed:",s)}}ce("news",async e=>{await P(le,e)});
