// Shared display formatting — one source for how game values are shown.

// Denarii are stored small (e.g. 3) but displayed scaled ×1000 → "3,000".
// Visual only: the stored value is unchanged. Used wherever a gens's denarii
// appears, so the convention lives in exactly one place.
export function denariiDisplay(n) {
  return (Number(n) * 1000).toLocaleString('en-US');
}
