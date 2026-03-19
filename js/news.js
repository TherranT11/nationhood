// js/news.js — The Cruceran newspaper page

export async function initNewspaper(supabase, state) {
    const root = document.getElementById('newspaper-root');
    if (!root) return;

    const { nation, faction, shard } = state;
    const gameDate = shard?.current_date || '[Month], [Year]';

    root.innerHTML = `<div class="newspaper-container">

        <!-- TOP RIBBON -->
        <div class="nws-top-ribbon">
            <div class="nws-top-ribbon-inner">
                <span>${gameDate}</span>
                <span class="nws-edition">The Cruceran &mdash; Continental Edition</span>
                <button class="nws-write-btn" id="nws-write-article-btn">Write Article &mdash; Gain 1 AP</button>
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
                <div class="nws-nav-item active">Front Page</div>
                <div class="nws-nav-item">Politics</div>
                <div class="nws-nav-item">Economy</div>
                <div class="nws-nav-item">International</div>
                <div class="nws-nav-item">Social</div>
                <div class="nws-nav-item">Entertainment</div>
                <div class="nws-nav-item">Elections</div>
                <div class="nws-nav-item">Sports</div>
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

    </div>`;
}
