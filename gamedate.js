// One source for the in-game date label. The date is the global game tick
// (the same for every nation and page), so we cache the last value and paint it
// instantly — no "January, 1980" placeholder flash — then confirm it against the
// live tick. Used by the topbar and the public game-date chips.
import { currentTick } from '/supabase.js';
import { tickToDate } from '/util.js';

const KEY = 'nh-gamedate';

// The last date we showed, or '' if we've never resolved one (private mode, or
// a first-ever visit). '' is shown as blank rather than a wrong month.
export function cachedGameDate(){
  try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; }
}

// Resolve the live date from the current tick and remember it for next time.
export async function liveGameDate(){
  const d = tickToDate(await currentTick());
  try { localStorage.setItem(KEY, d); } catch (e) {}
  return d;
}

// Paint `el` with the cached date now, then update it from the live tick.
export function mountGameDate(el){
  if (!el) return;
  const c = cachedGameDate();
  if (c) el.textContent = c;
  liveGameDate().then(function (d) { el.textContent = d; }).catch(function () {});
}
