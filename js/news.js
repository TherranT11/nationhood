// js/news.js — The Cruceran newspaper page

export async function initNewspaper(supabase, state) {
    const root = document.getElementById('newspaper-root');
    if (!root) return;

    const { nation, faction, shard } = state;
    const gameDate = shard?.current_date || '[Month], [Year]';

    root.innerHTML = `<div class="newspaper-container">
        <!-- Newspaper content will be rendered in subsequent phases -->
        <div style="padding:40px;text-align:center;color:#6b5a40;font-family:'Playfair Display',serif;font-size:18px;font-style:italic;">
            The Cruceran — Loading...
        </div>
    </div>`;
}
