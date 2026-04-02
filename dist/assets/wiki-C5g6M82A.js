import{_ as o}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{i as B,a as M,r as I,f as A,e as q,g as F,h as G,j as J,k as K,s as O}from"./wiki-DVwzCJo1.js";import{e as s}from"./utils-C2W-HleY.js";(async()=>{const v=await B();if(!v)return;const{isLoggedIn:w,faction:y}=v,n=document.getElementById("wiki-root"),p=new URLSearchParams(window.location.search).get("slug")||"home";if(p==="home"){let t=[];try{t=await M(o)}catch{}let d="";if(t.length>0){const a=t[Math.floor(Math.random()*t.length)];try{const{data:i}=await o.from("wiki_pages").select("id, slug, title, body, template_type, template_data, infobox_image").eq("id",a.id).single();if(i){const h=i.template_type?i.template_type.charAt(0).toUpperCase()+i.template_type.slice(1):"",L=i.infobox_image?`<img src="${s(i.infobox_image)}" alt="${s(i.title)}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:4px;margin-bottom:8px;">`:"",j=L||h?`
                        <div class="wiki-explore-sidebar" style="flex:0 0 180px;border-right:1px solid var(--border-color);padding:14px;text-align:center;">
                            ${L}
                            <div style="font-weight:700;font-size:13px;color:var(--text-primary);">${s(i.title)}</div>
                            ${h?`<div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-top:4px;">${s(h)}</div>`:""}
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
                    </div>`}}catch{}}const m=t.filter(a=>a.template_type).slice(0,8),l=[...t].sort((a,i)=>(i.updated_at||"").localeCompare(a.updated_at||"")).slice(0,8),R=m.length?m.map(a=>{const i=a.template_type?`<span class="wiki-page-row-type">${s(a.template_type)}</span>`:"";return`<a href="wiki.html?slug=${encodeURIComponent(a.slug)}" class="wiki-page-row">
                    <span class="wiki-page-row-title">${s(a.title)}</span>${i}
                </a>`}).join(""):'<p style="color:var(--text-muted);font-size:13px;padding:10px 0;">No pages with templates yet.</p>',E=l.length?l.map(a=>{const i=a.updated_at?new Date(a.updated_at).toLocaleDateString():"";return`<a href="wiki.html?slug=${encodeURIComponent(a.slug)}" class="wiki-page-row">
                    <span class="wiki-page-row-title">${s(a.title)}</span>
                    <span class="wiki-page-row-meta">${i}</span>
                </a>`}).join(""):'<p style="color:var(--text-muted);font-size:13px;padding:10px 0;">No pages yet.</p>',W=w?'<a href="wiki-edit.html?new=1" class="wiki-btn wiki-btn-primary">New Page</a>':"";n.innerHTML=`
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
                        <div class="wiki-page-list">${R}</div>
                    </div>
                </div>
                <div class="wiki-home-section">
                    <div class="wiki-home-card">
                        <div class="wiki-home-card-title">Recently Updated</div>
                        <div class="wiki-page-list">${E}</div>
                    </div>
                </div>
            </div>
        `,await I(n);return}let e;try{e=await A(o,p)}catch(t){n.innerHTML=`<div class="wiki-empty"><h2>Error</h2><p>${s(t.message)}</p></div>`;return}if(!e){const t=w?`<a href="wiki-edit.html?new=1&title=${encodeURIComponent(p)}" class="wiki-btn wiki-btn-primary">Create This Page</a>`:"";n.innerHTML=`
            <div class="wiki-empty">
                <h2>Page Not Found</h2>
                <p>The wiki page "<strong>${s(p)}</strong>" doesn't exist yet.</p>
                ${t}
                <div style="margin-top:12px;">
                    <a href="wiki.html" class="wiki-btn">Wiki Home</a>
                    <a href="wiki-list.html" class="wiki-btn">All Pages</a>
                </div>
            </div>
        `;return}let u=new Set;try{u=await q(o)}catch{}const C=F(e.body||"<p><em>This page is empty.</em></p>",u),N=G(e),S=J(e.tags),T=[e.created_by,e.updated_by].filter(Boolean),f=await K(o,T),b=f[e.created_by]||null,$=f[e.updated_by]||null,x=e.created_at?new Date(e.created_at).toLocaleDateString():"",g=e.updated_at?new Date(e.updated_at).toLocaleDateString():"";let _="";const c=[];b&&c.push(`Created by <strong>${s(b)}</strong> on ${x}`),$&&e.updated_by!==e.created_by?c.push(`Last edited by <strong>${s($)}</strong> on ${g}`):g&&g!==x&&c.push(`Last edited on ${g}`),c.length&&(_=`<div class="wiki-page-meta">${c.join(" · ")}</div>`);let r=[];try{const{data:t}=await o.from("wiki_pages").select("slug, title").neq("slug",e.slug).ilike("body",`%[[${e.title}]]%`);if(r=t||[],e.slug!==O(e.title)){const{data:d}=await o.from("wiki_pages").select("slug, title").neq("slug",e.slug).ilike("body",`%[[${e.slug}]]%`);if(d){const m=new Set(r.map(l=>l.slug));d.forEach(l=>{m.has(l.slug)||r.push(l)})}}}catch{}const U=r.length?`<div class="wiki-backlinks">
            <div class="wiki-backlinks-title">What links here</div>
            <div class="wiki-backlinks-list">${r.map(t=>`<a href="wiki.html?slug=${encodeURIComponent(t.slug)}" class="wiki-backlink-item">${s(t.title)}</a>`).join("")}</div>
           </div>`:"",P=!!e.locked_by,D=P?'<span class="wiki-lock-badge" title="Locked by creator — only they can edit">Locked</span>':"";let H="";if(w&&y){const t=e.created_by===y.id;H=!P||t?`<a href="wiki-edit.html?slug=${encodeURIComponent(e.slug)}" class="wiki-btn">Edit</a>`:'<span class="wiki-btn wiki-btn-disabled" title="This page is locked by its creator">Locked</span>'}n.innerHTML=`
        <div class="wiki-page-header">
            <h1 class="wiki-page-title">${s(e.title)} ${D}</h1>
            <div class="wiki-header-actions">
                ${H}
                <a href="wiki.html" class="wiki-btn">Wiki Home</a>
                <a href="wiki-list.html" class="wiki-btn">All Pages</a>
            </div>
        </div>
        ${_}
        <div class="wiki-page-layout">
            <div class="wiki-body-col">
                <div class="wiki-body-content">${C}</div>
                ${S}
                ${U}
            </div>
            ${N}
        </div>
    `,await I(n)})();
