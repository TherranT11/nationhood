import{_ as a}from"./supabase-client-BXEzLDpS.js";/* empty css                  *//* empty css            */import{b as u,s as g}from"./common-DnQvEMW5.js";import"./government-structure-Df0JI6nQ.js";import"./trade-constants-DM83F6RS.js";import"./stats-Cb8eW3Os.js";import"./bills-ZF8Y05CJ.js";import{c as x,e as y}from"./utils-C2W-HleY.js";import"./messaging-5qyQ6ziq.js";import"./config-BIsh65GI.js";let d=null;async function v(){const{data:{user:o}}=await a.auth.getUser();if(!o){window.location.href="login.html";return}let i=null,r=3;for(;r>0;){const{data:n,error:s}=await a.from("factions").select("*").eq("id",o.id).single();if(n){i=n;break}r--,r>0&&await new Promise(l=>setTimeout(l,1e3))}if(!i){alert("Faction not found. Please sign up."),window.location.href="signup.html";return}const{data:t}=await a.from("shard").select("current_date, next_tick_at, current_tick").eq("name","Alpha Shard").single();t&&(document.getElementById("game-date").innerText=t.current_date||"Unknown",document.getElementById("tick-countdown").innerText="",t.next_tick_at&&(nextTickAt=new Date(t.next_tick_at),startTickCountdown()))}function w(){if(!d)return;const o=d.name.toLowerCase().replace(/\s+/g,"");window.location.href=`${o}.html`}document.querySelectorAll(".land").forEach(o=>{o.addEventListener("click",async i=>{i.stopPropagation(),document.querySelectorAll(".land").forEach(t=>t.classList.remove("selected-nation")),i.target.classList.add("selected-nation");const r=i.target.getAttribute("data-nation-name");document.getElementById("details").innerHTML=`
                <p style="color: #888; font-style: italic;">Loading ${r} data...</p>
            `;try{const{data:t,error:n}=await a.from("nations").select("*").eq("name",r).single();if(n)throw n;if(!t){document.getElementById("details").innerHTML=`
                        <p style="color: #d9534f;">Error: Nation data not found.</p>
                    `;return}d=t;const{data:s,error:l}=await a.from("factions").select("id, faction_type, nation_id").eq("nation_id",t.id).eq("faction_type","party"),c=x(s||[],t.id),m=t.max_parties||8,p=c>=m,b=e=>e==null?"N/A":e.toLocaleString(),f=e=>e==null?"N/A":(e=Number(e),e>=1e12?"$"+(e/1e12).toFixed(1)+" Trillion":e>=1e9?"$"+(e/1e9).toFixed(1)+" Billion":e>=1e6?"$"+(e/1e6).toFixed(1)+" Million":"$"+e.toLocaleString());u(t.gdp,"gdp"),u(t.debt,"debt"),document.getElementById("details").innerHTML=`
                    <div style="margin-bottom: 20px;">
                        <h2 style="color: #ffcc00; margin: 0 0 5px 0; font-size: 1.5rem;">${y(t.name)}</h2>
                        <div style="color: #888; font-size: 0.85rem; margin-bottom: 15px;">Capital: ${y(t.capital||"Unknown")}</div>
                    </div>
                    
                    <div style="display: grid; gap: 12px;">
                        <div style="background: #1a1a1a; padding: 10px; border-radius: 4px; border-left: 3px solid #ffcc00;">
                            <div style="font-size: 0.75rem; color: #888; text-transform: uppercase; margin-bottom: 5px;">Population</div>
                            <div style="font-size: 1.1rem; color: #fff; font-weight: bold;">${b(t.population)}</div>
                        </div>
                        
                        <div style="background: #1a1a1a; padding: 10px; border-radius: 4px; border-left: 3px solid #5cb85c;">
                            <div style="font-size: 0.75rem; color: #888; text-transform: uppercase; margin-bottom: 5px;">Government Type</div>
                            <div style="font-size: 1.1rem; color: #fff; font-weight: bold;">${t.government_type||"Not Set"}</div>
                        </div>
                        
                        <div style="background: #1a1a1a; padding: 10px; border-radius: 4px; border-left: 3px solid #5b9bd5;">
                            <div style="font-size: 0.75rem; color: #888; text-transform: uppercase; margin-bottom: 5px;">GDP</div>
                            <div style="font-size: 1.1rem; color: #fff; font-weight: bold;">${f(g(t.gdp))}</div>
                        </div>

                        <div style="background: #1a1a1a; padding: 10px; border-radius: 4px; border-left: 3px solid #d48a3c;">
                            <div style="font-size: 0.75rem; color: #888; text-transform: uppercase; margin-bottom: 5px;">National Debt</div>
                            <div style="font-size: 1.1rem; color: #fff; font-weight: bold;">${f(g(t.debt))}</div>
                        </div>
                        
                        <div style="background: #1a1a1a; padding: 10px; border-radius: 4px; border-left: 3px solid #9c27b0;">
                            <div style="font-size: 0.75rem; color: #888; text-transform: uppercase; margin-bottom: 5px;">Political Parties</div>
                            <div style="font-size: 1.1rem; color: ${p?"#ff6b6b":"#fff"}; font-weight: bold;">${c} / ${m}</div>
                            ${p?'<div style="font-size:0.72rem;color:#ff6b6b;margin-top:4px;">Nation at party capacity</div>':""}
                        </div>
                    </div>
                    
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #333; font-size: 0.8rem; color: #666;">
                        <em>Data synchronized with Alpha Shard</em>
                    </div>
                `,document.getElementById("view-nation-btn").classList.remove("hidden")}catch(t){console.error("Error loading nation data:",t),document.getElementById("details").innerHTML=`
                    <p style="color: #d9534f;">Error loading nation data. Please try again.</p>
                `,document.getElementById("view-nation-btn").classList.add("hidden")}})});v();window.viewNation=w;
