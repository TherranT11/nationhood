// Carries the civ name/capital/trait chosen on /found forward to
// /found/seat, where the hex is picked and the actual rf_nations row is
// inserted. One key, one shape, read and written from exactly these three
// functions — /found and /found/seat both import this rather than each
// hardcoding the sessionStorage key and hoping the shape stays in sync.
var KEY = "nh_pending_founding";

export function setPendingFounding(data){
  sessionStorage.setItem(KEY, JSON.stringify(data));
}

export function getPendingFounding(){
  var raw = sessionStorage.getItem(KEY);
  if(!raw) return null;
  try{
    var d = JSON.parse(raw);
    if(!d || typeof d.civName !== "string" || typeof d.capitalName !== "string" || typeof d.trait !== "string") return null;
    if(!d.civName.trim() || !d.capitalName.trim() || !d.trait.trim()) return null;
    return d;
  } catch(err){
    return null;
  }
}

export function clearPendingFounding(){
  sessionStorage.removeItem(KEY);
}
