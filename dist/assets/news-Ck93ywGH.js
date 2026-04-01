import{_ as ne}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{i as ae}from"./common-BedtaFOo.js";import"./guide-RrxJIDYT.js";import{t as te}from"./utils-C2W-HleY.js";let u=null,h=null,H=[],k="all",B=null,x=null,L=null,I=null,N=!1,_=!1;const ie=["Winter","Spring","Spring","Spring","Summer","Summer","Summer","Fall","Fall","Fall","Winter","Winter"];function C(e){const s=e%12,n=2e3+Math.floor(e/12),a=ie[s],i=s===0?n-1:n;return`${a} ${i}`}async function R(e,s){if(u=e,h=s,B=null,k="all",L=null,_=!1,s.nation?.id){const{data:l}=await e.from("administrations").select("government_type").eq("nation_id",s.nation.id).order("started_at_tick",{ascending:!1}).limit(1).maybeSingle();l?.government_type==="autocracy"&&(_=!0)}const n=document.getElementById("newspaper-root");if(!n)return;const a=s.shard?.current_date||"[Month], [Year]";n.innerHTML=`<div class="newspaper-container">

        <!-- TOP RIBBON -->
        <div class="nws-top-ribbon">
            <div class="nws-top-ribbon-inner">
                <span>${a}</span>
                <span class="nws-edition">The Cruceran &mdash; Continental Edition</span>
                <button class="nws-write-btn" id="nws-write-article-btn">Write Article</button>
            </div>
        </div>

        <!-- MASTHEAD -->
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
        </div>

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
        <div class="nws-main-content">

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

    </div>`,de(),pe(),me(n),we(n),Y(n),$e(n),ye(n);const i=document.getElementById("nws-reward-badge");i&&(i.textContent=_?"+1 Backing (4000+)":"+2 Vis, +1 Approval, +1 Enthusiasm (4000+)"),await q(),xe()}async function le(e,s){const{data:n}=await u.from("faction_electoral_standing").select("visibility").eq("faction_id",e).eq("nation_id",s).maybeSingle(),a=Number(n?.visibility??0),i=Math.min(100,a+2);await u.from("faction_electoral_standing").update({visibility:i}).eq("faction_id",e).eq("nation_id",s)}async function re(e,s){const{data:n}=await u.from("faction_electoral_standing").select("id, party_approval").eq("faction_id",e).eq("nation_id",s).maybeSingle();if(!n)return;const a=Number(n.party_approval??0),i=Math.min(90,a+1);await u.from("faction_electoral_standing").update({party_approval:i}).eq("id",n.id)}async function oe(e){const{data:s}=await u.from("electorate_profile").select("id, enthusiasm").eq("nation_id",e).maybeSingle();if(!s)return;const n=Number(s.enthusiasm??50),a=Math.min(90,n+1);await u.from("electorate_profile").update({enthusiasm:a}).eq("id",s.id)}async function ce(e){const{data:s}=await u.from("faction_pillar_state").select("pillar, backing").eq("faction_id",e).maybeSingle();if(!s)return;const n=Number(s.backing??0),a=Math.min(20,n+1);await u.from("faction_pillar_state").update({backing:a}).eq("faction_id",e)}function de(){const e=document.getElementById("nws-modal-overlay"),s=document.getElementById("nws-write-article-btn"),n=document.getElementById("nws-modal-close"),a=document.getElementById("nws-article-body"),i=document.getElementById("nws-char-count"),l=document.getElementById("nws-article-image"),t=document.getElementById("nws-file-label-text"),d=document.getElementById("nws-image-preview"),o=document.getElementById("nws-image-preview-img");s&&s.addEventListener("click",()=>{S(),e.classList.add("active")}),n&&n.addEventListener("click",()=>{e.classList.remove("active"),S()}),e&&e.addEventListener("click",c=>{c.target===e&&(e.classList.remove("active"),S())});const w=document.getElementById("nws-remove-image-btn");w&&w.addEventListener("click",()=>{N=!0;const c=document.getElementById("nws-image-preview");c&&(c.style.display="none");const p=document.getElementById("nws-file-label-text");p&&(p.textContent="Click to select an image..."),w.style.display="none"}),a&&i&&a.addEventListener("input",()=>{const c=a.value.length;let p;_?p=c>=4e3?" · +1 Backing":` · ${4e3-c} more for +1 Backing`:p=c>=4e3?" · +2 Visibility":` · ${4e3-c} more for +2 Visibility`,i.textContent=`${c} / 12000${p}`,i.classList.toggle("nws-near-limit",c>=11500),i.classList.toggle("nws-ap-qualified",c>=4e3&&c<11500)}),l&&l.addEventListener("change",()=>{const c=l.files[0];if(!c){t.textContent="Click to select an image...",d.style.display="none";return}const p=2*1024*1024;if(c.size>p){E("Image must be under 2MB."),l.value="",t.textContent="Click to select an image...",d.style.display="none";return}t.textContent=c.name;const m=new FileReader;m.onload=g=>{o.src=g.target.result,d.style.display="block"},m.readAsDataURL(c)})}function E(e){const s=document.getElementById("nws-form-error");s&&(s.textContent=e,s.style.display="block",setTimeout(()=>{s.style.display="none"},5e3))}function j(e){const s=document.getElementById("nws-form-success");s&&(s.textContent=e,s.style.display="block",setTimeout(()=>{s.style.display="none"},5e3))}function pe(){const e=document.getElementById("nws-submit-btn");e&&e.addEventListener("click",async()=>{if(e.disabled)return;const s=document.getElementById("nws-article-title").value.trim(),n=document.getElementById("nws-article-author").value.trim(),a=document.getElementById("nws-article-category").value,i=document.getElementById("nws-article-body").value.trim(),t=document.getElementById("nws-article-image").files[0]||null;if(!s)return E("Please enter a headline.");if(!n)return E("Please enter a writer name.");if(!a)return E("Please select a category.");if(!i)return E("Please write an article body.");if(i.length>12e3)return E("Article body must be 12000 characters or fewer.");const d=!!I;e.disabled=!0,e.textContent=d?"Updating...":"Publishing...";try{const{nation:o,faction:w,shard:c}=h;if(d){let p;t?p=await V(o.id,t):N&&(p=null);const m={headline:s,author_name:n,body:i,category:a};p!==void 0&&(m.image_url=p);const{error:g}=await u.from("player_articles").update(m).eq("id",I).eq("author_faction_id",w.id);if(g)throw g;j("Article updated!")}else{let p=null;t&&(p=await V(o.id,t));const{error:m}=await u.from("player_articles").insert({nation_id:o.id,author_faction_id:w.id,author_name:n,headline:s,body:i,category:a,image_url:p,status:"published",published_tick:c?.current_tick||0});if(m)throw m;let g="Article published!";if(_){const f=i.length>=4e3?1:0;f>0?(ce(w.id).catch(b=>console.error("[News] Backing reward failed:",b)),g=`Article published! +${f} Backing.`):g=`Article published! (${i.length}/4000 chars — no backing reward)`}else i.length>=4e3?(le(w.id,o.id).catch(f=>console.error("[News] Visibility reward failed:",f)),re(w.id,o.id).catch(f=>console.error("[News] Approval reward failed:",f)),oe(o.id).catch(f=>console.error("[News] Enthusiasm reward failed:",f)),g="Article published! +2 Visibility, +1 Approval, +1 Enthusiasm."):g=`Article published! (${i.length}/4000 chars — no reward)`;j(g)}S(),setTimeout(()=>{document.getElementById("nws-modal-overlay").classList.remove("active")},1500),await q()}catch(o){console.error(`[News] Article ${d?"update":"submission"} failed:`,o),E(`Failed to ${d?"update":"publish"} article. Please try again.`)}finally{e.disabled=!1,e.textContent=I?"Update Article":"Publish Article"}})}async function V(e,s){const n=s.name.split(".").pop()||"png",a=`player-articles/${e}/${Date.now()}.${n}`,{error:i}=await u.storage.from("public-assets").upload(a,s,{contentType:s.type,upsert:!0});if(i)throw i;const{data:l}=u.storage.from("public-assets").getPublicUrl(a);return l?.publicUrl||null}function T(e){return!h?.faction||e.author_faction_id!==h.faction.id?"":`<button class="nws-delete-btn" data-article-id="${e.id}" title="Delete article">&times;</button>`}function A(e){return!h?.faction||e.author_faction_id!==h.faction.id?"":`<button class="nws-edit-btn" data-edit-id="${e.id}" title="Edit article">&#9998;</button>`}function me(e){e.addEventListener("click",async s=>{const n=s.target.closest(".nws-delete-btn");if(!n)return;const a=n.dataset.articleId;if(!(!a||!confirm("Delete this article?"))){n.disabled=!0,n.textContent="...";try{const{error:i}=await u.from("player_articles").delete().eq("id",a).eq("author_faction_id",h.faction.id);if(i)throw i;await q()}catch(i){console.error("[News] Failed to delete article:",i),n.disabled=!1,n.textContent="×"}}})}function S(){I=null,N=!1,document.getElementById("nws-article-title").value="",document.getElementById("nws-article-author").value="",document.getElementById("nws-article-category").value="",document.getElementById("nws-article-body").value="";const e=document.getElementById("nws-article-image");e&&(e.value="");const s=document.getElementById("nws-file-label-text");s&&(s.textContent="Click to select an image...");const n=document.getElementById("nws-image-preview");n&&(n.style.display="none");const a=document.getElementById("nws-char-count");a&&(a.textContent="0 / 12000",a.classList.remove("nws-near-limit","nws-ap-qualified"));const i=document.getElementById("nws-remove-image-btn");i&&(i.style.display="none");const l=document.querySelector(".nws-modal-header h3");l&&(l.textContent="Write Article");const t=document.getElementById("nws-submit-btn");t&&(t.textContent="Publish Article")}function ve(e){I=e.id,N=!1,document.getElementById("nws-article-title").value=e.headline||"",document.getElementById("nws-article-author").value=e.author_name||"",document.getElementById("nws-article-category").value=e.category||"",document.getElementById("nws-article-body").value=e.body||"";const s=(e.body||"").length,n=document.getElementById("nws-char-count");if(n){let c;_?c=s>=4e3?" · +1 Backing":` · ${4e3-s} more for +1 Backing`:s>=8e3?c=" · +2 Enthusiasm":s>=4e3?c=` · +1 Enthusiasm · ${8e3-s} more for +2`:c=` · ${4e3-s} more for enthusiasm`,n.textContent=`${s} / 12000${c}`,n.classList.toggle("nws-near-limit",s>=11500),n.classList.toggle("nws-ap-qualified",s>=4e3&&s<11500)}const a=document.getElementById("nws-image-preview"),i=document.getElementById("nws-image-preview-img"),l=document.getElementById("nws-file-label-text"),t=document.getElementById("nws-remove-image-btn"),d=document.getElementById("nws-article-image");d&&(d.value=""),e.image_url?(i&&(i.src=e.image_url),a&&(a.style.display="block"),l&&(l.textContent="Current image (select new to replace)"),t&&(t.style.display="inline")):(a&&(a.style.display="none"),l&&(l.textContent="Click to select an image..."),t&&(t.style.display="none"));const o=document.querySelector(".nws-modal-header h3");o&&(o.textContent="Edit Article");const w=document.getElementById("nws-submit-btn");w&&(w.textContent="Update Article"),document.getElementById("nws-modal-overlay").classList.add("active")}function we(e){e.addEventListener("click",s=>{const n=s.target.closest(".nws-edit-btn");if(!n)return;s.stopPropagation();const a=n.dataset.editId,i=H.find(l=>String(l.id)===String(a));i&&ve(i)})}function Y(e){x&&e.removeEventListener("click",x),x=s=>{if(s.target.closest(".nws-delete-btn, .nws-edit-btn, .nws-write-btn, .nws-modal-overlay, button, a, input, select, textarea"))return;const n=s.target.closest("[data-article-id]");if(!n)return;const a=n.dataset.articleId,i=H.find(l=>String(l.id)===String(a));if(i)try{ue(e,i)}catch(l){console.error("[News] Failed to open article:",l)}},e.addEventListener("click",x)}function ue(e,s){const n=s.body||"",a=s.published_tick!=null?te(s.published_tick):h?.shard?.current_date||"[Month], [Year]",l=!!L?"&larr; Back to Edition":"&larr; Back to Front Page",t=z(n),d=s.image_url?`<div class="nws-reader-image">
            <img src="${r(s.image_url)}" alt="${r(s.headline)}">
            <p class="nws-img-caption">${r(s.headline)}</p>
           </div>`:"";e.innerHTML=`<div class="newspaper-container">
        <!-- TOP RIBBON -->
        <div class="nws-top-ribbon">
            <div class="nws-top-ribbon-inner">
                <span>${r(a)}</span>
                <span class="nws-edition">The Cruceran &mdash; Continental Edition</span>
                <button class="nws-write-btn" id="nws-back-btn">${l}</button>
            </div>
        </div>

        <!-- READER CONTENT -->
        <div class="nws-main-content">
            <div class="nws-reader">
                <span class="nws-section-tag">${r(y(s.category))} &mdash; ${r(a)}</span>
                <h1 class="nws-reader-headline">${r(s.headline)}</h1>
                <div class="nws-byline">
                    <span class="nws-author">${r(s.author_name)}</span>
                    <span class="nws-dot">&middot;</span>
                    <span>${r(a)}</span>
                </div>
                <hr class="nws-reader-rule">
                ${d}
                <div class="nws-reader-body">
                    ${t}
                </div>
                <hr class="nws-reader-rule">
                <button class="nws-back-link" id="nws-back-btn-bottom">${l}</button>
            </div>
        </div>

        <!-- FOOTER -->
        <div class="nws-footer">
            <h2>The Cruceran</h2>
            <p>Continental Edition &nbsp;&middot;&nbsp; Est. Year 1 &nbsp;&middot;&nbsp; All rights reserved &nbsp;&middot;&nbsp; Truth in the service of the people</p>
        </div>
    </div>`;const o=L,w=o?()=>X(o.root,o.articles,o.dateLabel):()=>R(u,h);document.getElementById("nws-back-btn")?.addEventListener("click",w),document.getElementById("nws-back-btn-bottom")?.addEventListener("click",w),e.scrollTop=0}function r(e){const s=document.createElement("div");return s.textContent=e,s.innerHTML}function U(e,s=1200){if(e.length<=s)return z(e);let n=e.lastIndexOf(" ",s);n<s*.5&&(n=s);const i=e.substring(0,n).split(/\n\n+/).filter(t=>t.trim());return i.map((t,d)=>`<p class="${d===0?"nws-drop-cap":""}">${O(r(t.trim()))}${d===i.length-1?"...":""}</p>`).join("")+'<p class="nws-read-more">Read More &rarr;</p>'}function O(e){return e.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>").replace(/__(.+?)__/g,"<u>$1</u>")}function z(e){const s=e.split(/\n\n+/).filter(n=>n.trim());return s.length<=1?`<p class="nws-drop-cap">${O(r(e))}</p>`:s.map((n,a)=>`<p class="${a===0?"nws-drop-cap":""}">${O(r(n.trim()))}</p>`).join("")}function y(e){return e==="elections"&&(e="politics"),{politics:"Politics",economy:"Economy",international:"International",social:"Social",entertainment:"Entertainment",sports:"Sports",opinion:"Opinion"}[e]||e}function K(e){return e==="elections"&&(e="politics"),{politics:"linear-gradient(135deg,#2a1a2a,#1a0d1a)",economy:"linear-gradient(135deg,#2a1a0a,#1a0d00)",international:"linear-gradient(135deg,#0a1a2a,#001a2a)",social:"linear-gradient(135deg,#1a2a1a,#0d1a0d)",entertainment:"linear-gradient(135deg,#2a2a0a,#1a1a00)",sports:"linear-gradient(135deg,#2a0a0a,#1a0000)",opinion:"linear-gradient(135deg,#2a2a2a,#1a1a1a)"}[e]||"linear-gradient(135deg,#1a1a1a,#0d0d0d)"}function Z(e,s){return`<div class="nws-img-placeholder">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="4" fill="rgba(255,255,255,0.05)"/>
            <circle cx="18" cy="20" r="6" fill="rgba(255,255,255,0.1)"/>
            <path d="M6 38 L18 26 L26 34 L34 22 L42 38Z" fill="rgba(255,255,255,0.08)"/>
        </svg>
        <span style="font-family:'Inter',sans-serif;font-size:9px;color:rgba(255,255,255,0.2);letter-spacing:1px;text-transform:uppercase;">${r(s)}</span>
    </div>`}async function J(){if(B)return B;const e=h?.shard,s=h?.nation;if(!e||!s)return[s?.id].filter(Boolean);const{data:n,error:a}=await u.from("nations").select("id").eq("shard_id",e.id);return a&&console.error("[News] Failed to fetch shard nations:",a),B=n&&n.length>0?n.map(i=>i.id):[s.id],B}async function q(){if(!(!u||!h))try{const e=await J(),{data:s,error:n}=await u.from("player_articles").select("*").in("nation_id",e).eq("status","published").order("created_at",{ascending:!1});if(n){console.error("[News] Failed to load articles:",n);return}if(!s||s.length===0)return;const a=h.shard?.current_tick??0,i=C(a),l=s.filter(v=>C(v.published_tick??0)===i),t=s.filter(v=>C(v.published_tick??0)!==i),d=new Set(l.map(v=>v.category)),o=[],w=new Set;for(const v of t)v.category!=="opinion"&&(d.has(v.category)||(w.has(v.category)||w.add(v.category),o.push(v)));const c=s.filter(v=>v.category==="opinion").slice(0,4),p=[...l.filter(v=>v.category!=="opinion"),...o,...c];if(p.length===0)return;H=p;const m=k&&k!=="all"?p.filter(v=>(v.category==="elections"?"politics":v.category)===k):p;if(m.length===0&&k!=="all"){const v=`<p class="nws-placeholder" style="text-align:center;padding:40px;grid-column:1/-1;">No ${y(k)} articles in this edition.</p>`,$=document.getElementById("nws-lead-section");$&&($.innerHTML=v);const D=document.getElementById("nws-secondary-grid");D&&(D.innerHTML="");const F=document.querySelector(".nws-opinion-grid");F&&(F.innerHTML="");const W=document.querySelector(".nws-bottom-left");W&&(W.innerHTML="");return}const f=[...m.filter(v=>v.category!=="opinion")].sort((v,$)=>($.published_tick??0)-(v.published_tick??0)),b=f[0],M=f.slice(1,4),ee=f.slice(4,7),se=[...p].sort((v,$)=>new Date($.created_at)-new Date(v.created_at)).slice(0,5);b&&he(b,M),ge(ee),be(c.slice(0,4)),fe(se)}catch(e){console.error("[News] Error loading articles:",e)}}function he(e,s){const n=document.getElementById("nws-lead-section");if(!n||!e)return;const a=s.length>0?s.map(o=>`
            <div class="nws-sidebar-story" data-article-id="${o.id}">
                ${A(o)}${T(o)}
                <span class="nws-section-tag">${r(y(o.category))}</span>
                <h3 class="nws-sidebar-headline">${r(o.headline)}</h3>
                <p class="nws-sidebar-deck">${r((o.body||"").replace(/\n+/g," ").substring(0,120))}${(o.body||"").length>120?"...":""}</p>
                <div class="nws-byline"><span class="nws-author">${r(o.author_name)}</span><span class="nws-dot">&middot;</span><span>${h?.shard?.current_date||"—"}</span></div>
            </div>
        `).join(""):'<div class="nws-sidebar-story"><p class="nws-placeholder">[More stories will appear as articles are published.]</p></div>',i=e.image_url?`<img src="${r(e.image_url)}" alt="${r(e.headline)}">`:Z(null,"Photo"),l=e.body||"",t=l.replace(/\n+/g," "),d=t.length>200?t.substring(0,200)+"...":t;n.innerHTML=`
        <div class="nws-lead-main" data-article-id="${e.id}">
            ${A(e)}${T(e)}
            <span class="nws-section-tag">${r(y(e.category))}</span>
            <h2 class="nws-lead-headline">${r(e.headline)}</h2>
            <p class="nws-lead-deck">${r(d)}</p>
            <div class="nws-byline">
                <span class="nws-author">${r(e.author_name)}</span>
                <span class="nws-dot">&middot;</span>
                <span>${h?.shard?.current_date||"—"}</span>
            </div>
            <div class="nws-lead-body">
                ${U(l)}
            </div>
        </div>
        <div class="nws-lead-sidebar">
            <div class="nws-lead-image">${i}</div>
            <p class="nws-img-caption">${e.image_url?r(e.headline):'<span class="nws-placeholder">[Photo]</span>'}</p>
            ${a}
        </div>
    `}function ge(e){const s=document.getElementById("nws-secondary-grid");if(!s||e.length===0)return;const n=[...e],a=["Crisis","Election","Economy"],i=[0,1,2].map(l=>{const t=n[l];if(t){const d=t.image_url?`<img src="${r(t.image_url)}" alt="${r(t.headline)}" style="width:100%;height:100%;object-fit:cover;">`:`<div class="nws-img-ph" style="background:${K(t.category)};">${r(y(t.category))}</div>`;return`<div class="nws-sec-story" data-article-id="${t.id}">
                ${A(t)}${T(t)}
                <div class="nws-sec-image">${d}</div>
                <span class="nws-section-tag">${r(y(t.category))}</span>
                <h3 class="nws-sec-headline">${r(t.headline)}</h3>
                <p class="nws-sec-deck">${r((t.body||"").replace(/\n+/g," ").substring(0,150))}${(t.body||"").length>150?"...":""}</p>
                <div class="nws-byline"><span class="nws-author">${r(t.author_name)}</span><span class="nws-dot">&middot;</span><span>${h?.shard?.current_date||"—"}</span></div>
            </div>`}else{const d=a[l]||"News";return`<div class="nws-sec-story">
                <div class="nws-sec-image"><div class="nws-img-ph" style="background:${["linear-gradient(135deg,#1a2a1a,#0d1a0d)","linear-gradient(135deg,#1a1a2a,#0d0d1a)","linear-gradient(135deg,#2a1a0a,#1a0d00)"][l]};">${d}</div></div>
                <span class="nws-section-tag nws-placeholder">[${d}]</span>
                <h3 class="nws-sec-headline nws-placeholder">[${d} Section Headline]</h3>
                <p class="nws-sec-deck nws-placeholder">[Summary will appear here.]</p>
                <div class="nws-byline"><span class="nws-author nws-placeholder">[Author]</span><span class="nws-dot">&middot;</span><span class="nws-placeholder">[Date]</span></div>
            </div>`}}).join("");s.innerHTML=i}function fe(e){if(e.length===0)return;const s=document.querySelector(".nws-bottom-left");if(!s)return;const n='<div class="nws-col-header">In Brief</div>',a=e.map((t,d)=>`
        <div class="nws-brief-row" data-article-id="${t.id}">
            <div class="nws-brief-num">${d+1}</div>
            <div class="nws-brief-text">
                <strong>${r(t.headline)}${A(t)}${T(t)}</strong>
                ${r((t.body||"").replace(/\n+/g," ").substring(0,100))}${(t.body||"").length>100?"...":""}
            </div>
        </div>
    `).join(""),i=5-e.length;let l="";for(let t=0;t<i;t++)l+=`
            <div class="nws-brief-row">
                <div class="nws-brief-num">${e.length+t+1}</div>
                <div class="nws-brief-text">
                    <strong class="nws-placeholder">[Brief headline]</strong>
                    <span class="nws-placeholder">[Short summary of a recent story.]</span>
                </div>
            </div>
        `;s.innerHTML=n+a+l}function be(e){const s=document.querySelector(".nws-opinion-grid");if(!s||e.length===0)return;const n=[0,1,2,3].map(a=>{const i=e[a];if(i){const l=(i.body||"").length>80?(i.body||"").substring(0,80)+"...":i.body||"";return`<div class="nws-op-card" data-article-id="${i.id}">
                ${A(i)}${T(i)}
                <div class="nws-op-author">${r(i.author_name)} &mdash; Opinion</div>
                <div class="nws-op-headline">&ldquo;${r(l)}&rdquo;</div>
            </div>`}else return`<div class="nws-op-card">
                <div class="nws-op-author nws-placeholder">[Columnist] &mdash; [Topic]</div>
                <div class="nws-op-headline nws-placeholder">&ldquo;[Opinion headline will appear here.]&rdquo;</div>
            </div>`}).join("");s.innerHTML=n}function ye(e){const s=e.querySelectorAll(".nws-nav-item[data-category]");s.forEach(n=>{n.addEventListener("click",()=>{s.forEach(a=>a.classList.remove("active")),n.classList.add("active"),k=n.dataset.category,q()})})}function $e(e){const s=document.getElementById("nws-nav-archives");s&&s.addEventListener("click",()=>Q(e))}async function Q(e){if(!(!u||!h))try{const s=h.shard?.current_tick??0,n=h.shard?.current_date||"[Month], [Year]",a=await J(),{data:i,error:l}=await u.from("player_articles").select("*").in("nation_id",a).eq("status","published").order("published_tick",{ascending:!1});if(l){console.error("[News] Failed to load archive articles:",l);return}const t={};for(const c of i||[]){const p=c.published_tick??0,m=C(p);t[m]||(t[m]={label:m,maxTick:p,articles:[]}),t[m].articles.push(c),p>t[m].maxTick&&(t[m].maxTick=p)}const d=Object.values(t).sort((c,p)=>p.maxTick-c.maxTick),o=C(s),w=d.length>0?d.map(c=>{const p=c.label===o?' <span class="nws-archive-current">Current</span>':"";return`<div class="nws-archive-month" data-archive-season="${r(c.label)}">
                    <div class="nws-archive-month-name">${r(c.label)}${p}</div>
                    <div class="nws-archive-month-count">${c.articles.length} article${c.articles.length!==1?"s":""}</div>
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
        </div>`,document.getElementById("nws-back-btn")?.addEventListener("click",()=>R(u,h)),e.querySelectorAll("[data-archive-season]").forEach(c=>{c.addEventListener("click",()=>{const p=c.dataset.archiveSeason,m=t[p];m&&X(e,m.articles,m.label)})}),e.scrollTop=0}catch(s){console.error("[News] Error loading archives:",s)}}function X(e,s,n){H=s;const a=s.filter(b=>b.category==="opinion"),l=[...s.filter(b=>b.category!=="opinion")].sort((b,M)=>(M.body||"").length-(b.body||"").length),t=l[0],d=l.slice(1,4),o=l.slice(4,7),w=l.slice(7,12),c=a.slice(0,4),p=t?Ee(t,d,n):'<p class="nws-placeholder" style="padding:40px;text-align:center;">[No articles in this edition]</p>',m=ke(o),g=_e(c),f=Be(w);e.innerHTML=`<div class="newspaper-container">
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
            <div class="nws-lead-section">${p}</div>
            ${m?`<div class="nws-secondary-grid">${m}</div>`:""}
        </div>

        ${g}

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
    </div>`,document.getElementById("nws-back-to-archives")?.addEventListener("click",()=>Q(e)),L={root:e,articles:s,dateLabel:n},Y(e),e.scrollTop=0}function Ee(e,s,n){const a=s.length>0?s.map(o=>`
            <div class="nws-sidebar-story" data-article-id="${o.id}">
                <span class="nws-section-tag">${r(y(o.category))}</span>
                <h3 class="nws-sidebar-headline">${r(o.headline)}</h3>
                <p class="nws-sidebar-deck">${r((o.body||"").replace(/\n+/g," ").substring(0,120))}${(o.body||"").length>120?"...":""}</p>
                <div class="nws-byline"><span class="nws-author">${r(o.author_name)}</span><span class="nws-dot">&middot;</span><span>${r(n)}</span></div>
            </div>
        `).join(""):"",i=e.image_url?`<img src="${r(e.image_url)}" alt="${r(e.headline)}">`:Z(null,"Photo"),l=e.body||"",t=l.replace(/\n+/g," "),d=t.length>200?t.substring(0,200)+"...":t;return`
        <div class="nws-lead-main" data-article-id="${e.id}">
            <span class="nws-section-tag">${r(y(e.category))}</span>
            <h2 class="nws-lead-headline">${r(e.headline)}</h2>
            <p class="nws-lead-deck">${r(d)}</p>
            <div class="nws-byline">
                <span class="nws-author">${r(e.author_name)}</span>
                <span class="nws-dot">&middot;</span>
                <span>${r(n)}</span>
            </div>
            <div class="nws-lead-body">
                ${U(l)}
            </div>
        </div>
        <div class="nws-lead-sidebar">
            <div class="nws-lead-image">${i}</div>
            <p class="nws-img-caption">${e.image_url?r(e.headline):'<span class="nws-placeholder">[Photo]</span>'}</p>
            ${a}
        </div>
    `}function ke(e){return e.length===0?"":e.map(s=>{const n=s.image_url?`<img src="${r(s.image_url)}" alt="${r(s.headline)}" style="width:100%;height:100%;object-fit:cover;">`:`<div class="nws-img-ph" style="background:${K(s.category)};">${r(y(s.category))}</div>`;return`<div class="nws-sec-story" data-article-id="${s.id}">
            <div class="nws-sec-image">${n}</div>
            <span class="nws-section-tag">${r(y(s.category))}</span>
            <h3 class="nws-sec-headline">${r(s.headline)}</h3>
            <p class="nws-sec-deck">${r((s.body||"").replace(/\n+/g," ").substring(0,150))}${(s.body||"").length>150?"...":""}</p>
            <div class="nws-byline"><span class="nws-author">${r(s.author_name)}</span></div>
        </div>`}).join("")}function _e(e){return e.length===0?"":`<div class="nws-opinion-strip">
        <div class="nws-opinion-inner">
            <div class="nws-opinion-label">&mdash; Opinion &amp; Commentary &mdash;</div>
            <div class="nws-opinion-grid">${e.map(n=>{const a=(n.body||"").length>80?(n.body||"").substring(0,80)+"...":n.body||"";return`<div class="nws-op-card" data-article-id="${n.id}">
            <div class="nws-op-author">${r(n.author_name)} &mdash; Opinion</div>
            <div class="nws-op-headline">&ldquo;${r(a)}&rdquo;</div>
        </div>`}).join("")}</div>
        </div>
    </div>`}function Be(e){return e.length===0?"":e.map((s,n)=>`
        <div class="nws-brief-row" data-article-id="${s.id}">
            <div class="nws-brief-num">${n+1}</div>
            <div class="nws-brief-text">
                <strong>${r(s.headline)}</strong>
                ${r((s.body||"").replace(/\n+/g," ").substring(0,100))}${(s.body||"").length>100?"...":""}
            </div>
        </div>
    `).join("")}function P(e){return e.w*3+e.d}function Ie(e){return Object.values(e).sort((s,n)=>{const a=P(n)-P(s);return a!==0?a:n.w-s.w})}function Ce(e){return`<span class="vln-form-dot" style="background:${{W:"#1a4a1a",D:"#8a6a20",L:"#8b1a1a"}[e]||"#999"}"></span>`}function Te(e,s){return e<=3?"vln-pos-top":e>=s-2?"vln-pos-bottom":""}function G(e,s={}){const n=Ie(e),a=s.muted||!1,i=n.length;let l=`<div class="vln-table${a?" vln-table-muted":""}">
        <div class="vln-thead">
            <span class="vln-col-pos">#</span>
            <span class="vln-col-name">Club</span>
            <span class="vln-col-stat">W</span>
            <span class="vln-col-stat">D</span>
            <span class="vln-col-stat">L</span>
            <span class="vln-col-pts">Pts</span>
            ${a?"":'<span class="vln-col-form">Form</span>'}
        </div>`;return n.forEach((t,d)=>{const o=d+1,w=Te(o,i),c=o===3||o===7?" vln-zone-break":"",p=P(t),m=a?"":t.form.map(g=>Ce(g)).join("");l+=`<div class="vln-row${c}">
            <span class="vln-col-pos ${w}">${o}</span>
            <span class="vln-col-name">${t.name}</span>
            <span class="vln-col-stat">${t.w}</span>
            <span class="vln-col-stat">${t.d}</span>
            <span class="vln-col-stat">${t.l}</span>
            <span class="vln-col-pts">${p}</span>
            ${a?"":`<span class="vln-col-form">${m}</span>`}
        </div>`}),l+="</div>",l}function Ae(e,s){return e?`<div class="vln-motw">
        <div class="vln-motw-label">Match of the Week:</div>
        <div class="vln-motw-result">
            <span class="vln-motw-team">${e.homeName}</span>
            <span class="vln-motw-score">${e.homeScore} &mdash; ${e.awayScore}</span>
            <span class="vln-motw-team">${e.awayName}</span>
        </div>
        <div class="vln-motw-week">&mdash; Matchweek ${s}</div>
    </div>`:""}async function xe(){const e=document.getElementById("vln-widget");if(!(!e||!u))try{const{data:s,error:n}=await u.from("vln_state").select("*").eq("shard_name","Alpha Shard").maybeSingle();if(n||!s){e.innerHTML=`
                <div class="nws-col-header">Volbal Ligue Nationale</div>
                <div class="vln-offseason">Season concludes in March.</div>`;return}const a=h?.shard?.current_tick??0,i=2e3+Math.floor(a/12);let l='<div class="nws-col-header">Volbal Ligue Nationale</div>';s.active?((s.matchweek>=18||(s.fixtures||[]).every(d=>d.played))&&(!s.last_results||s.last_results.length===0)?l+='<div class="vln-matchweek">Final Standings</div>':l+=`<div class="vln-matchweek">Matchweek ${s.matchweek} of 18</div>`,l+=G(s.standings),l+=Ae(s.match_of_week,s.matchweek)):s.standings&&Object.keys(s.standings).length>0&&Object.values(s.standings).some(d=>d.played>0)?(l+='<div class="vln-offseason">Off-season. Final standings below.</div>',l+=`<div class="vln-final-label">Final Standings &mdash; Year ${s.season}</div>`,l+=G(s.standings,{muted:!0})):l+='<div class="vln-offseason">Season concludes in March.</div>',e.innerHTML=l}catch(s){console.error("[VLN] Widget render failed:",s)}}ae("news",async e=>{await R(ne,e)});
