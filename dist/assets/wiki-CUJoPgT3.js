import{_ as l}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{i as B,a as M,r as C,f as A,e as q,g as F,h as G,j as J,k as K,s as O}from"./wiki-BGRbODxS.js";import{a as s}from"./utils-CzgKGX6o.js";(async()=>{const v=await B();if(!v)return;const{isLoggedIn:h,faction:y}=v,c=document.getElementById("wiki-root"),o=new URLSearchParams(window.location.search).get("slug")||"home";if(o!=="home"){const t=document.createElement("link");t.rel="canonical",t.href=`wiki-${encodeURIComponent(o)}.html`,document.head.appendChild(t),history.replaceState(null,"",`wiki-${encodeURIComponent(o)}.html${window.location.hash||""}`)}if(o==="home"){let t=[];try{t=await M(l)}catch{}let d="";if(t.length>0){const a=t[Math.floor(Math.random()*t.length)];try{const{data:i}=await l.from("wiki_pages").select("id, slug, title, body, template_type, template_data, infobox_image").eq("id",a.id).single();if(i){const w=i.template_type?i.template_type.charAt(0).toUpperCase()+i.template_type.slice(1):"",L=i.infobox_image?`<img src="${s(i.infobox_image)}" alt="${s(i.title)}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:4px;margin-bottom:8px;">`:"",j=L||w?`
                        <div class="wiki-explore-sidebar" style="flex:0 0 180px;border-right:1px solid var(--border-color);padding:14px;text-align:center;">
                            ${L}
                            <div style="font-weight:700;font-size:13px;color:var(--text-primary);">${s(i.title)}</div>
                            ${w?`<div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-top:4px;">${s(w)}</div>`:""}
                        </div>`:"",k=(i.body||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),z=k.length>600?k.slice(0,600)+"...":k;d=`
                    <div class="wiki-home-section">
                        <div class="wiki-home-card">
                            <div class="wiki-home-card-title" style="display:flex;align-items:center;justify-content:space-between;">
                                <span>Explore Nationhood</span>
                                <a href="wiki.html?slug=${encodeURIComponent(i.slug)}" class="wiki-btn" style="font-size:9px;padding:3px 10px;margin:0;">Read Full Page</a>
                            </div>
                            <div class="wiki-home-card-body" style="padding:0;">
                                <div style="display:flex;gap:0;">
                                    ${j}
                                    <div style="flex:1;padding:16px;overflow:hidden;">
                                        <a href="wiki.html?slug=${encodeURIComponent(i.slug)}" style="color:var(--accent);font-weight:700;font-size:15px;text-decoration:none;">${s(i.title)}</a>
                                        <p style="color:var(--text-secondary);font-size:12.5px;line-height:1.6;margin-top:8px;">${s(z)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`}}catch{}}const m=t.filter(a=>a.template_type).slice(0,8),n=[...t].sort((a,i)=>(i.updated_at||"").localeCompare(a.updated_at||"")).slice(0,8),D=m.length?m.map(a=>{const i=a.template_type?`<span class="wiki-page-row-type">${s(a.template_type)}</span>`:"";return`<a href="wiki.html?slug=${encodeURIComponent(a.slug)}" class="wiki-page-row">
                    <span class="wiki-page-row-title">${s(a.title)}</span>${i}
                </a>`}).join(""):'<p style="color:var(--text-muted);font-size:13px;padding:10px 0;">No pages with templates yet.</p>',E=n.length?n.map(a=>{const i=a.updated_at?new Date(a.updated_at).toLocaleDateString():"";return`<a href="wiki.html?slug=${encodeURIComponent(a.slug)}" class="wiki-page-row">
                    <span class="wiki-page-row-title">${s(a.title)}</span>
                    <span class="wiki-page-row-meta">${i}</span>
                </a>`}).join(""):'<p style="color:var(--text-muted);font-size:13px;padding:10px 0;">No pages yet.</p>',W=h?'<a href="wiki-edit.html?new=1" class="wiki-btn wiki-btn-primary">New Page</a>':"";c.innerHTML=`
            <div class="wiki-page-header">
                <h1 class="wiki-page-title">Wiki</h1>
                <div class="wiki-header-actions">
                    ${W}
                    <a href="wiki-list.html" class="wiki-btn">All Pages</a>
                </div>
            </div>

            <div class="wiki-home-section" style="margin-top:20px;">
                <div class="wiki-home-card">
                    <div class="wiki-home-card-title">About</div>
                    <div class="wiki-home-card-body">
                        <p>Welcome to the <strong>Nationhood Wiki</strong> — the living encyclopedia of your world.</p>
                        <p>Document nations, history, key figures, corporations, religions, and cultures. Every player can create and edit pages. Use <code>[[Page Name]]</code> in the editor to link between pages.</p>
                        <p><strong>${t.length}</strong> page${t.length!==1?"s":""} and counting.</p>
                    </div>
                </div>
            </div>

            ${d}

            <div class="wiki-home-columns">
                <div class="wiki-home-section">
                    <div class="wiki-home-card">
                        <div class="wiki-home-card-title">Important Pages</div>
                        <div class="wiki-page-list">${D}</div>
                    </div>
                </div>
                <div class="wiki-home-section">
                    <div class="wiki-home-card">
                        <div class="wiki-home-card-title">Recently Updated</div>
                        <div class="wiki-page-list">${E}</div>
                    </div>
                </div>
            </div>
        `,await C(c);return}let e;try{e=await A(l,o)}catch(t){c.innerHTML=`<div class="wiki-empty"><h2>Error</h2><p>${s(t.message)}</p></div>`;return}if(!e){const t=h?`<a href="wiki-edit.html?new=1&title=${encodeURIComponent(o)}" class="wiki-btn wiki-btn-primary">Create This Page</a>`:"";c.innerHTML=`
            <div class="wiki-empty">
                <h2>Page Not Found</h2>
                <p>The wiki page "<strong>${s(o)}</strong>" doesn't exist yet.</p>
                ${t}
                <div style="margin-top:12px;">
                    <a href="wiki.html" class="wiki-btn">Wiki Home</a>
                    <a href="wiki-list.html" class="wiki-btn">All Pages</a>
                </div>
            </div>
        `;return}let u=new Set;try{u=await q(l)}catch{}const I=F(e.body||"<p><em>This page is empty.</em></p>",u),U=G(e),R=J(e.tags),S=[e.created_by,e.updated_by].filter(Boolean),f=await K(l,S),b=f[e.created_by]||null,$=f[e.updated_by]||null,x=e.created_at?new Date(e.created_at).toLocaleDateString():"",g=e.updated_at?new Date(e.updated_at).toLocaleDateString():"";let _="";const r=[];b&&r.push(`Created by <strong>${s(b)}</strong> on ${x}`),$&&e.updated_by!==e.created_by?r.push(`Last edited by <strong>${s($)}</strong> on ${g}`):g&&g!==x&&r.push(`Last edited on ${g}`),r.length&&(_=`<div class="wiki-page-meta">${r.join(" · ")}</div>`);let p=[];try{const{data:t}=await l.from("wiki_pages").select("slug, title").neq("slug",e.slug).ilike("body",`%[[${e.title}]]%`);if(p=t||[],e.slug!==O(e.title)){const{data:d}=await l.from("wiki_pages").select("slug, title").neq("slug",e.slug).ilike("body",`%[[${e.slug}]]%`);if(d){const m=new Set(p.map(n=>n.slug));d.forEach(n=>{m.has(n.slug)||p.push(n)})}}}catch{}const N=p.length?`<div class="wiki-backlinks">
            <div class="wiki-backlinks-title">What links here</div>
            <div class="wiki-backlinks-list">${p.map(t=>`<a href="wiki.html?slug=${encodeURIComponent(t.slug)}" class="wiki-backlink-item">${s(t.title)}</a>`).join("")}</div>
           </div>`:"",P=!!e.locked_by,T=P?'<span class="wiki-lock-badge" title="Locked by creator — only they can edit">Locked</span>':"";let H="";if(h&&y){const t=e.created_by===y.id;H=!P||t?`<a href="wiki-edit.html?slug=${encodeURIComponent(e.slug)}" class="wiki-btn">Edit</a>`:'<span class="wiki-btn wiki-btn-disabled" title="This page is locked by its creator">Locked</span>'}c.innerHTML=`
        <div class="wiki-page-header">
            <h1 class="wiki-page-title">${s(e.title)} ${T}</h1>
            <div class="wiki-header-actions">
                ${H}
                <a href="wiki.html" class="wiki-btn">Wiki Home</a>
                <a href="wiki-list.html" class="wiki-btn">All Pages</a>
            </div>
        </div>
        ${_}
        ${U}
        <div class="wiki-body-content">${I}</div>
        ${R}
        ${N}
    `,await C(c)})();
