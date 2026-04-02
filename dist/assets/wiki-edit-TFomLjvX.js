import{_ as o}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{i as J,f as X,c as Z,u as H,s as A,r as ee}from"./wiki-DVwzCJo1.js";import{e as d}from"./utils-C2W-HleY.js";const te=[{value:"",label:"None"},{value:"nation",label:"Nation"},{value:"person",label:"Person"},{value:"corporation",label:"Corporation"},{value:"religion",label:"Religion"},{value:"culture",label:"Culture"},{value:"political_party",label:"Political Party"},{value:"law",label:"Law"},{value:"agreement",label:"Agreement"},{value:"event",label:"Event"},{value:"organization",label:"Organization"},{value:"military_unit",label:"Military Unit"},{value:"product",label:"Product"},{value:"location",label:"Location"},{value:"sports",label:"Sports"}];(async()=>{const L=await J({requireAuth:!0});if(!L)return;const{faction:p,nation:k}=L,w=document.getElementById("wiki-root"),E=new URLSearchParams(window.location.search),z=E.has("new"),$=E.get("slug");let t=null;if($&&!z){try{t=await X(o,$)}catch(e){w.innerHTML=`<div class="wiki-empty"><h2>Error</h2><p>${d(e.message)}</p></div>`;return}if(!t){w.innerHTML='<div class="wiki-empty"><h2>Page Not Found</h2><p><a href="wiki-list.html" class="wiki-btn">Back to Wiki</a></p></div>';return}}if(t&&t.locked_by&&t.locked_by!==p.id){w.innerHTML=`<div class="wiki-empty"><h2>Page Locked</h2><p>This page is locked by its creator. Only they can edit it.</p>
            <a href="wiki.html?slug=${encodeURIComponent(t.slug)}" class="wiki-btn">Back to Page</a></div>`;return}const M=t?t.title:E.get("title")||"",C=t?t.body:"",T=t&&t.template_type||"",N=t&&Array.isArray(t.template_data)?t.template_data:[];let r=t&&t.infobox_image||"";const R=t&&Array.isArray(t.tags)?t.tags:[],W=t?t.created_by===p.id:!0,j=t?!!t.locked_by:!1,O=te.map(e=>`<option value="${e.value}" ${e.value===T?"selected":""}>${e.label}</option>`).join("");let b=[];try{const{data:e}=await o.storage.from("wiki-images").list(k.id,{limit:100,sortBy:{column:"created_at",order:"desc"}});e&&(b=e.filter(i=>/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(i.name)).map(i=>{const{data:l}=o.storage.from("wiki-images").getPublicUrl(`${k.id}/${i.name}`);return{name:i.name,url:l?.publicUrl||""}}).filter(i=>i.url))}catch{}const V=b.length?`<div class="wiki-image-gallery" id="image-gallery" style="display:none;">
            <div class="wiki-infobox-editor-title">Existing Images <button class="wiki-btn" id="close-gallery" type="button" style="float:right;font-size:10px;">Close</button></div>
            <div class="wiki-gallery-grid">${b.map(e=>`<img src="${d(e.url)}" class="wiki-gallery-thumb" data-url="${d(e.url)}" title="${d(e.name)}">`).join("")}</div>
           </div>`:"";w.innerHTML=`
        <div class="wiki-editor-form">
            <div class="wiki-page-header">
                <h1 class="wiki-page-title">${t?"Edit Page":"New Page"}</h1>
                <div class="wiki-header-actions">
                    ${t?`<a href="wiki.html?slug=${encodeURIComponent(t.slug)}" class="wiki-btn">View Page</a>`:""}
                    <a href="wiki.html" class="wiki-btn">Wiki Home</a>
                    <a href="wiki-list.html" class="wiki-btn">All Pages</a>
                </div>
            </div>

            <div class="wiki-field">
                <label for="wiki-title">Title</label>
                <input type="text" id="wiki-title" class="wiki-input" value="${d(M)}" placeholder="Page title..." maxlength="200">
            </div>

            ${t?`<div class="wiki-field">
                <label for="wiki-slug">Slug (URL)</label>
                <input type="text" id="wiki-slug" class="wiki-input" value="${d(t.slug)}" placeholder="page-slug" maxlength="200">
                <div style="font-size:10px;color:var(--text-muted);margin-top:4px;">Changing the slug will break existing wiki links to this page.</div>
            </div>`:""}

            ${W?`<div class="wiki-field" style="display:flex;align-items:center;gap:10px;">
                <label class="wiki-lock-toggle" style="margin:0;display:flex;align-items:center;gap:8px;cursor:pointer;">
                    <input type="checkbox" id="wiki-lock" ${j?"checked":""}>
                    <span style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);">Lock page (only you can edit)</span>
                </label>
            </div>`:""}

            <div class="wiki-field">
                <label for="wiki-template">Template</label>
                <select id="wiki-template" class="wiki-select">${O}</select>
            </div>

            <div id="infobox-section" class="wiki-infobox-editor" style="display:${T?"block":"none"}">
                <div class="wiki-infobox-editor-title">Infobox</div>

                <div class="wiki-image-upload-area">
                    <img class="wiki-image-preview" id="infobox-preview"
                         src="${r||"data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22><rect fill=%22%23252525%22 width=%2280%22 height=%2280%22/><text x=%2240%22 y=%2244%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2211%22>No image</text></svg>"}"
                         alt="Infobox image">
                    <div>
                        <input type="file" id="infobox-file" accept="image/*" style="display:none">
                        <button class="wiki-btn" id="infobox-upload-btn" type="button">Upload Image</button>
                        ${r?'<button class="wiki-btn wiki-btn-danger" id="infobox-remove-img" type="button" style="margin-left:6px">Remove</button>':""}
                    </div>
                </div>

                <div class="wiki-infobox-editor-title" style="margin-top:8px;">Details</div>
                <div id="kv-rows"></div>
                <button class="wiki-btn" id="add-kv-btn" type="button" style="margin-top:6px;">+ Add Row</button>
            </div>

            <div id="wiki-tag-mount"></div>

            <div class="wiki-field">
                <label>Content ${b.length?'<button class="wiki-btn" id="toggle-gallery" type="button" style="float:right;font-size:10px;">Browse Images</button>':""}</label>
                <div id="quill-editor"></div>
                ${V}
            </div>

            <div class="wiki-editor-actions">
                <div class="wiki-editor-actions-left">
                    <button class="wiki-btn wiki-btn-primary" id="save-btn" type="button">Save Page</button>
                    <a href="${t?`wiki.html?slug=${encodeURIComponent(t.slug)}`:"wiki-list.html"}" class="wiki-btn">Cancel</a>
                </div>
                ${t?'<button class="wiki-btn wiki-btn-danger" id="delete-btn" type="button">Delete Page</button>':""}
            </div>

            <div id="wiki-status" style="margin-top:10px;font-size:12px;color:var(--text-secondary);"></div>
        </div>
    `;const I=Z({initialTags:R,placeholder:"add tag..."});document.getElementById("wiki-tag-mount").appendChild(I.container);const n=new Quill("#quill-editor",{theme:"snow",placeholder:"Write your page content here... Use [[Page Name]] to link to other wiki pages.",modules:{toolbar:{container:[[{header:[1,2,3,!1]}],["bold","italic","underline"],[{list:"ordered"},{list:"bullet"}],["link","image","wiki-link"],["clean"]],handlers:{image:G,"wiki-link":F}}}});C&&(n.root.innerHTML=C);const f=document.querySelector(".ql-wiki-link");f&&(f.innerHTML="[[]]",f.title="Insert wiki link",f.style.cssText="font-size:11px;font-weight:700;width:auto;padding:0 4px;color:var(--text-secondary);");function F(){const e=n.getSelection(!0);if(e.length>0){const i=n.getText(e.index,e.length);n.deleteText(e.index,e.length),n.insertText(e.index,`[[${i}]]`),n.setSelection(e.index+i.length+4)}else{const i=prompt("Enter the wiki page name to link to:");i&&(n.insertText(e.index,`[[${i}]]`),n.setSelection(e.index+i.length+4))}}async function G(){const e=document.createElement("input");e.type="file",e.accept="image/*",e.onchange=async()=>{const i=e.files[0];if(!i)return;const l=document.getElementById("wiki-status");l.textContent="Uploading image...";try{const a=await H(o,k.id,i),u=n.getSelection(!0);n.insertEmbed(u.index,"image",a),n.setSelection(u.index+1),l.textContent=""}catch(a){l.textContent="Image upload failed: "+a.message,l.style.color="var(--red)"}},e.click()}document.getElementById("wiki-template").addEventListener("change",e=>{document.getElementById("infobox-section").style.display=e.target.value?"block":"none"}),document.getElementById("infobox-upload-btn").addEventListener("click",()=>{document.getElementById("infobox-file").click()}),document.getElementById("infobox-file").addEventListener("change",async e=>{const i=e.target.files[0];if(!i)return;const l=document.getElementById("wiki-status"),a=document.getElementById("infobox-upload-btn");a.textContent="Uploading...",a.disabled=!0;try{r=await H(o,k.id,i),document.getElementById("infobox-preview").src=r,a.textContent="Upload Image",a.disabled=!1,l.textContent=""}catch(u){a.textContent="Upload Image",a.disabled=!1,l.textContent="Image upload failed: "+u.message,l.style.color="var(--red)"}});const B=document.getElementById("infobox-remove-img");B&&B.addEventListener("click",()=>{r="",document.getElementById("infobox-preview").src="data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22><rect fill=%22%23252525%22 width=%2280%22 height=%2280%22/><text x=%2240%22 y=%2244%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2211%22>No image</text></svg>",B.remove()});const _=document.getElementById("kv-rows");function S(e="",i=""){const l=document.createElement("div");l.className="wiki-kv-row",l.innerHTML=`
            <input type="text" placeholder="Label" value="${d(e)}" class="kv-label">
            <input type="text" placeholder="Value" value="${d(i)}" class="kv-value">
            <button type="button" class="wiki-kv-remove">&times;</button>
        `,l.querySelector(".wiki-kv-remove").addEventListener("click",()=>l.remove()),_.appendChild(l)}N.forEach(e=>S(e.label,e.value)),document.getElementById("add-kv-btn").addEventListener("click",()=>S());function K(){const e=[];return _.querySelectorAll(".wiki-kv-row").forEach(i=>{const l=i.querySelector(".kv-label").value.trim(),a=i.querySelector(".kv-value").value.trim();(l||a)&&e.push({label:l,value:a})}),e}let h=!1;const v=()=>{h=!0};document.getElementById("wiki-title").addEventListener("input",v),document.getElementById("wiki-template").addEventListener("change",v),n.on("text-change",v);const P=document.getElementById("wiki-slug");P&&P.addEventListener("input",v),I.container.addEventListener("click",()=>setTimeout(v,50)),window.addEventListener("beforeunload",e=>{h&&(e.preventDefault(),e.returnValue="")}),document.getElementById("save-btn").addEventListener("click",async()=>{const e=document.getElementById("wiki-title").value.trim();if(!e){document.getElementById("wiki-status").textContent="Title is required.",document.getElementById("wiki-status").style.color="var(--red)";return}const i=document.getElementById("wiki-slug");let l;if(t&&i?l=A(i.value.trim())||t.slug:l=A(e),!l){document.getElementById("wiki-status").textContent="Could not generate a valid slug from the title.",document.getElementById("wiki-status").style.color="var(--red)";return}const a=document.getElementById("wiki-template").value||null,u=n.root.innerHTML,Q=a?K():[],q=document.getElementById("wiki-lock"),Y=q&&q.checked?p.id:null,x=document.getElementById("save-btn");x.textContent="Saving...",x.disabled=!0;const D=document.getElementById("wiki-status"),m={nation_id:k.id,slug:l,title:e,body:u,template_type:a,template_data:Q,infobox_image:r||null,locked_by:Y,tags:I.getTags(),updated_by:p.id,updated_at:new Date().toISOString()};try{let y;if(t){const{error:s}=await o.from("wiki_pages").update(m).eq("id",t.id);y=s}else{m.created_by=p.id;const{error:s}=await o.from("wiki_pages").insert(m);y=s}if(y)if(delete m.tags,t){const{error:s}=await o.from("wiki_pages").update(m).eq("id",t.id);if(s)throw s}else{const{error:s}=await o.from("wiki_pages").insert(m);if(s)throw s}h=!1,window.location.href=`wiki.html?slug=${encodeURIComponent(l)}`}catch(y){x.textContent="Save Page",x.disabled=!1,D.textContent="Save failed: "+y.message,D.style.color="var(--red)"}});const c=document.getElementById("delete-btn");c&&t&&c.addEventListener("click",async()=>{if(confirm("Delete this wiki page? This cannot be undone.")){c.textContent="Deleting...",c.disabled=!0;try{const{error:e}=await o.from("wiki_pages").delete().eq("id",t.id);if(e)throw e;h=!1,window.location.href="wiki-list.html"}catch(e){c.textContent="Delete Page",c.disabled=!1,document.getElementById("wiki-status").textContent="Delete failed: "+e.message,document.getElementById("wiki-status").style.color="var(--red)"}}});const U=document.getElementById("toggle-gallery"),g=document.getElementById("image-gallery");U&&g&&(U.addEventListener("click",()=>{g.style.display=g.style.display==="none"?"block":"none"}),document.getElementById("close-gallery")?.addEventListener("click",()=>{g.style.display="none"}),g.querySelectorAll(".wiki-gallery-thumb").forEach(e=>{e.addEventListener("click",()=>{const i=e.dataset.url,l=n.getSelection(!0);n.insertEmbed(l.index,"image",i),n.setSelection(l.index+1),g.style.display="none"})})),await ee(w)})();
