import { useState } from "react";

const COLORS = {
  bg: "#141412",
  bgCard: "#252525",
  bgHover: "#2a2a2a",
  bgInner: "#1a1a1a",
  bgInput: "#252525",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(255,255,255,0.12)",
  textPrimary: "#e0e0e0",
  textSecondary: "#888888",
  textTertiary: "#666666",
  green: "#4ade80",
  greenDim: "rgba(74,222,128,0.08)",
  greenBorder: "rgba(74,222,128,0.2)",
  yellow: "#facc15",
  yellowDim: "rgba(250,204,21,0.08)",
  yellowBorder: "rgba(250,204,21,0.2)",
  orange: "#f97316",
  orangeDim: "rgba(249,115,22,0.08)",
  orangeBorder: "rgba(249,115,22,0.2)",
  red: "#ef4444",
  redDim: "rgba(239,68,68,0.08)",
  redBorder: "rgba(239,68,68,0.2)",
  cyan: "#22d3ee",
  cyanDim: "rgba(34,211,238,0.08)",
  cyanBorder: "rgba(34,211,238,0.2)",
  teal: "#2dd4bf",
  tealDim: "rgba(45,212,191,0.07)",
  tealBorder: "rgba(45,212,191,0.22)",
  purple: "#a78bfa",
  purpleDim: "rgba(167,139,250,0.08)",
  purpleBorder: "rgba(167,139,250,0.2)",
};

const mono = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace";
const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// ── Rally Outcome Definitions ──

const RALLY_OUTCOMES = [
  {
    id: "rousing", name: "Rousing Success",
    targetMin: 6, targetMax: 8,
    spillover: 2, spilloverScope: "adjacent",
    polarization: 1,
    color: COLORS.green,
    icon: "★",
    desc: "Massive turnout, overflowing venue",
  },
  {
    id: "solid", name: "Solid Turnout",
    targetMin: 3, targetMax: 5,
    spillover: 0, spilloverScope: "none",
    polarization: 0,
    color: COLORS.teal,
    icon: "●",
    desc: "Steady crowd, strong showing",
  },
  {
    id: "low", name: "Low Turnout",
    targetMin: 1, targetMax: 2,
    spillover: 0, spilloverScope: "none",
    polarization: 0,
    color: COLORS.yellow,
    icon: "○",
    desc: "Sparse attendance, questions raised",
  },
  {
    id: "gaffe", name: "Gaffe",
    targetMin: -3, targetMax: -2,
    spillover: -1, spilloverScope: "random_adjacent",
    polarization: 1,
    color: COLORS.orange,
    icon: "✕",
    desc: "Remarks draw backlash",
  },
  {
    id: "divisive", name: "Divisive Speech",
    targetMin: 5, targetMax: 7,
    spillover: -2, spilloverScope: "all_others",
    polarization: 2,
    color: COLORS.purple,
    icon: "◆",
    desc: "Energizes base, alienates everyone else",
  },
  {
    id: "counter", name: "Counter-Protest",
    targetMin: -1, targetMax: -1,
    spillover: -2, spilloverScope: "all",
    polarization: 2,
    color: COLORS.red,
    icon: "⚡",
    desc: "Disrupted by counter-protesters",
  },
];

// ── Data ──

const PARTY = {
  name: "Real People's Front of San Estrella",
  axes: { liberty: 38, tradition: 32, security: 45, globalism: 62, individualism: 30 },
};

const NATION_STATE = {
  crisisCount: 0,
  polarization: 42,
  civilUnrest: 25,
};

const BLOCS = [
  {
    id: "biz", name: "Business Owners", pop: 16.0, approval: 38,
    axes: { liberty: 72, tradition: 50, security: 45, globalism: 55, individualism: 78 },
    axis_weights: { liberty: 0.25, tradition: 0.05, security: 0.10, globalism: 0.15, individualism: 0.45 },
    priorities: ["Economics", "Labor"],
    rallied_recently: 0,
    opposed_blocs: ["Urban Workers"],
    adjacent_blocs: ["Military & Security", "Rural Traditionalists"],
  },
  {
    id: "urban_work", name: "Urban Workers", pop: 15.0, approval: 71,
    axes: { liberty: 40, tradition: 38, security: 50, globalism: 48, individualism: 22 },
    axis_weights: { liberty: 0.15, tradition: 0.10, security: 0.10, globalism: 0.10, individualism: 0.55 },
    priorities: ["Labor", "Economics"],
    rallied_recently: 1,
    opposed_blocs: ["Business Owners"],
    adjacent_blocs: ["Urban Progressives", "Ethnic Minorities"],
  },
  {
    id: "urban_prog", name: "Urban Progressives", pop: 14.0, approval: 64,
    axes: { liberty: 35, tradition: 18, security: 55, globalism: 70, individualism: 25 },
    axis_weights: { liberty: 0.30, tradition: 0.30, security: 0.10, globalism: 0.15, individualism: 0.15 },
    priorities: ["Social", "Education"],
    rallied_recently: 0,
    opposed_blocs: ["Nationalist Bloc", "Religious Conservatives"],
    adjacent_blocs: ["Urban Workers", "Academics & Professionals", "Ethnic Minorities"],
  },
  {
    id: "academics", name: "Academics & Professionals", pop: 12.0, approval: 57,
    axes: { liberty: 42, tradition: 25, security: 48, globalism: 75, individualism: 45 },
    axis_weights: { liberty: 0.15, tradition: 0.25, security: 0.05, globalism: 0.35, individualism: 0.20 },
    priorities: ["Education", "International"],
    rallied_recently: 0,
    opposed_blocs: ["Nationalist Bloc"],
    adjacent_blocs: ["Urban Progressives"],
  },
  {
    id: "nationalists", name: "Nationalist Bloc", pop: 11.0, approval: 22,
    axes: { liberty: 60, tradition: 78, security: 35, globalism: 12, individualism: 58 },
    axis_weights: { liberty: 0.10, tradition: 0.25, security: 0.15, globalism: 0.40, individualism: 0.10 },
    priorities: ["Military", "Immigration"],
    rallied_recently: 0,
    opposed_blocs: ["Urban Progressives", "Ethnic Minorities", "Academics & Professionals"],
    adjacent_blocs: ["Rural Traditionalists", "Military & Security"],
  },
  {
    id: "ethnic", name: "Ethnic Minorities", pop: 10.0, approval: 66,
    axes: { liberty: 35, tradition: 40, security: 52, globalism: 60, individualism: 28 },
    axis_weights: { liberty: 0.35, tradition: 0.10, security: 0.15, globalism: 0.15, individualism: 0.25 },
    priorities: ["Social", "Immigration"],
    rallied_recently: 0,
    opposed_blocs: ["Nationalist Bloc"],
    adjacent_blocs: ["Urban Workers", "Urban Progressives"],
  },
  {
    id: "religious", name: "Religious Conservatives", pop: 10.0, approval: 29,
    axes: { liberty: 68, tradition: 88, security: 42, globalism: 30, individualism: 65 },
    axis_weights: { liberty: 0.20, tradition: 0.45, security: 0.05, globalism: 0.10, individualism: 0.20 },
    priorities: ["Social", "Governance"],
    rallied_recently: 0,
    opposed_blocs: ["Urban Progressives"],
    adjacent_blocs: ["Rural Traditionalists"],
  },
  {
    id: "rural", name: "Rural Traditionalists", pop: 10.0, approval: 33,
    axes: { liberty: 55, tradition: 75, security: 48, globalism: 25, individualism: 70 },
    axis_weights: { liberty: 0.15, tradition: 0.35, security: 0.10, globalism: 0.15, individualism: 0.25 },
    priorities: ["Agriculture", "Social"],
    rallied_recently: 0,
    opposed_blocs: ["Urban Progressives"],
    adjacent_blocs: ["Religious Conservatives", "Nationalist Bloc", "Business Owners"],
  },
  {
    id: "military", name: "Military & Security", pop: 2.0, approval: 26,
    axes: { liberty: 65, tradition: 70, security: 18, globalism: 30, individualism: 60 },
    axis_weights: { liberty: 0.15, tradition: 0.15, security: 0.45, globalism: 0.10, individualism: 0.15 },
    priorities: ["Military", "Governance"],
    rallied_recently: 0,
    opposed_blocs: [],
    adjacent_blocs: ["Nationalist Bloc", "Business Owners"],
  },
];

// ── Calculations ──

function calcAlignment(partyAxes, blocAxes, blocWeights) {
  let total = 0;
  Object.keys(blocWeights).forEach((axis) => {
    const distance = Math.abs(partyAxes[axis] - blocAxes[axis]);
    total += (100 - distance) * blocWeights[axis];
  });
  return Math.round(total);
}

function getRallyOutcomeWeights(blocApproval, ralliedRecently, nationState) {
  const weights = { rousing: 20, solid: 38, low: 15, gaffe: 12, divisive: 8, counter: 5 };

  if (blocApproval > 60) {
    weights.rousing += 12; weights.low -= 5; weights.gaffe -= 4;
  } else if (blocApproval < 30) {
    weights.rousing -= 10; weights.low += 10; weights.gaffe += 8;
  }

  if (nationState.crisisCount > 0) {
    weights.gaffe += 6; weights.divisive += 4; weights.counter += 10;
    weights.rousing -= 8; weights.solid -= 6;
  }

  if (nationState.polarization > 60) {
    weights.divisive += 6; weights.counter += 4; weights.solid -= 4;
  }

  if (ralliedRecently >= 1) {
    weights.gaffe += 5 * ralliedRecently;
    weights.rousing -= 3 * ralliedRecently;
    weights.low += 3 * ralliedRecently;
  }

  if (nationState.civilUnrest > 40) {
    weights.counter += 8; weights.rousing -= 4;
  }

  for (const k of Object.keys(weights)) weights[k] = Math.max(1, weights[k]);
  const total = Object.values(weights).reduce((s, v) => s + v, 0);
  for (const k of Object.keys(weights)) weights[k] = Math.round((weights[k] / total) * 100);

  return weights;
}

function getRallyRiskLevel(weights) {
  const badPct = (weights.gaffe || 0) + (weights.divisive || 0) + (weights.counter || 0);
  if (badPct >= 40) return { label: "Dangerous", color: COLORS.red, colorDim: COLORS.redDim, colorBorder: COLORS.redBorder };
  if (badPct >= 25) return { label: "Risky", color: COLORS.orange, colorDim: COLORS.orangeDim, colorBorder: COLORS.orangeBorder };
  if (badPct >= 15) return { label: "Moderate", color: COLORS.yellow, colorDim: COLORS.yellowDim, colorBorder: COLORS.yellowBorder };
  return { label: "Safe", color: COLORS.green, colorDim: COLORS.greenDim, colorBorder: COLORS.greenBorder };
}

function getActiveModifiers(blocApproval, ralliedRecently, nationState) {
  const mods = [];
  if (blocApproval > 60)
    mods.push({ label: "High approval with bloc", effect: "Rousing ↑ · Low ↓ · Gaffe ↓", positive: true });
  if (blocApproval < 30)
    mods.push({ label: "Low approval with bloc", effect: "Low Turnout ↑ · Gaffe ↑ · Rousing ↓", positive: false });
  if (nationState.crisisCount > 0)
    mods.push({ label: `Active crisis (${nationState.crisisCount})`, effect: "Gaffe ↑ · Counter ↑↑ · Rousing ↓", positive: false });
  if (nationState.polarization > 60)
    mods.push({ label: `High polarization (${nationState.polarization})`, effect: "Divisive ↑ · Counter ↑ · Solid ↓", positive: false });
  if (nationState.civilUnrest > 40)
    mods.push({ label: `Elevated civil unrest (${nationState.civilUnrest})`, effect: "Counter ↑↑ · Rousing ↓", positive: false });
  if (ralliedRecently >= 1)
    mods.push({ label: `Rallied this bloc ${ralliedRecently}x recently`, effect: "Gaffe ↑ · Low ↑ · Rousing ↓ (stale material)", positive: false });
  return mods;
}

function getApprovalColor(val) {
  if (val >= 65) return COLORS.green;
  if (val >= 45) return COLORS.yellow;
  if (val >= 30) return COLORS.orange;
  return COLORS.red;
}

function getAlignmentColor(val) {
  if (val >= 75) return COLORS.green;
  if (val >= 55) return COLORS.cyan;
  if (val >= 40) return COLORS.yellow;
  return COLORS.red;
}

function formatRange(min, max) {
  if (min === max) return `${min > 0 ? "+" : ""}${min}`;
  return `${min > 0 ? "+" : ""}${min} to ${max > 0 ? "+" : ""}${max}`;
}

function spilloverLabel(scope) {
  switch (scope) {
    case "adjacent": return "Adjacent blocs";
    case "random_adjacent": return "1 random adjacent";
    case "all_others": return "All other blocs";
    case "all": return "All blocs";
    default: return "None";
  }
}

// ── Components ──

function Pill({ color, children }) {
  const colorMap = {
    green: { bg: COLORS.greenDim, text: COLORS.green, border: COLORS.greenBorder },
    yellow: { bg: COLORS.yellowDim, text: COLORS.yellow, border: COLORS.yellowBorder },
    orange: { bg: COLORS.orangeDim, text: COLORS.orange, border: COLORS.orangeBorder },
    red: { bg: COLORS.redDim, text: COLORS.red, border: COLORS.redBorder },
    cyan: { bg: COLORS.cyanDim, text: COLORS.cyan, border: COLORS.cyanBorder },
    teal: { bg: COLORS.tealDim, text: COLORS.teal, border: COLORS.tealBorder },
    purple: { bg: COLORS.purpleDim, text: COLORS.purple, border: COLORS.purpleBorder },
    dim: { bg: "rgba(255,255,255,0.04)", text: COLORS.textTertiary, border: COLORS.border },
  };
  const c = colorMap[color] || colorMap.dim;
  return (
    <span style={{
      fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
      padding: "2px 7px", borderRadius: 3, background: c.bg, color: c.text, border: `1px solid ${c.border}`, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function OutcomeBar({ outcome, pct, maxPct }) {
  const isNegative = outcome.targetMax < 0 || (outcome.id === "divisive" || outcome.id === "counter");
  const barWidth = maxPct > 0 ? (pct / maxPct) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, height: 22 }}>
      {/* Icon */}
      <span style={{ fontFamily: mono, fontSize: 11, color: outcome.color, width: 14, textAlign: "center" }}>
        {outcome.icon}
      </span>
      {/* Name */}
      <span style={{
        fontFamily: mono, fontSize: 10, color: COLORS.textSecondary, width: 110, flexShrink: 0,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {outcome.name}
      </span>
      {/* Bar */}
      <div style={{ flex: 1, height: 10, background: "rgba(255,255,255,0.03)", borderRadius: 2, overflow: "hidden", position: "relative" }}>
        <div style={{
          width: `${barWidth}%`, height: "100%", borderRadius: 2,
          background: outcome.color, opacity: 0.35,
          transition: "width 0.3s ease",
        }} />
      </div>
      {/* Percentage */}
      <span style={{
        fontFamily: mono, fontSize: 11, fontWeight: 700, color: outcome.color,
        width: 32, textAlign: "right", flexShrink: 0,
      }}>
        {pct}%
      </span>
      {/* Effect range */}
      <span style={{
        fontFamily: mono, fontSize: 10,
        color: outcome.targetMin >= 0 ? COLORS.green : (outcome.id === "divisive" ? COLORS.purple : COLORS.red),
        width: 52, textAlign: "right", flexShrink: 0,
      }}>
        {formatRange(outcome.targetMin, outcome.targetMax)}
      </span>
    </div>
  );
}

function BlocCard({ bloc, selected, onSelect, party, nationState }) {
  const isSelected = selected;
  const alignment = calcAlignment(party.axes, bloc.axes, bloc.axis_weights);
  const weights = getRallyOutcomeWeights(bloc.approval, bloc.rallied_recently, nationState);
  const risk = getRallyRiskLevel(weights);
  const modifiers = getActiveModifiers(bloc.approval, bloc.rallied_recently, nationState);
  const approvalColor = getApprovalColor(bloc.approval);
  const alignColor = getAlignmentColor(alignment);
  const maxPct = Math.max(...Object.values(weights));

  // Expected value calculation
  const expectedValue = RALLY_OUTCOMES.reduce((sum, o) => {
    const avg = (o.targetMin + o.targetMax) / 2;
    return sum + avg * ((weights[o.id] || 0) / 100);
  }, 0);

  // Positive outcome chance
  const positivePct = (weights.rousing || 0) + (weights.solid || 0) + (weights.low || 0);

  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected ? COLORS.bgHover : COLORS.bgCard,
        border: `1px solid ${isSelected ? COLORS.orangeBorder : COLORS.border}`,
        borderRadius: 3,
        cursor: "pointer",
        transition: "all 0.15s ease",
        overflow: "hidden",
      }}
    >
      {/* Compact header */}
      <div style={{ padding: "8px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: isSelected ? COLORS.textPrimary : COLORS.textSecondary }}>
              {bloc.name}
            </span>
            <span style={{ fontFamily: mono, fontSize: 9, color: COLORS.textTertiary }}>{bloc.pop}%</span>
            {bloc.rallied_recently > 0 && <Pill color="orange">Rallied {bloc.rallied_recently}x</Pill>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Alignment */}
            <div style={{ textAlign: "right" }}>
              <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.textTertiary, display: "block" }}>
                Align
              </span>
              <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: alignColor }}>{alignment}</span>
            </div>
            {/* Current approval */}
            <div style={{ textAlign: "right" }}>
              <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.textTertiary, display: "block" }}>
                Appr.
              </span>
              <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: approvalColor }}>{bloc.approval}</span>
            </div>
            {/* Risk */}
            <div style={{
              textAlign: "center", minWidth: 60,
              padding: "2px 8px", borderRadius: 3,
              background: risk.colorDim,
              border: `1px solid ${risk.colorBorder}`,
            }}>
              <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.textTertiary, display: "block" }}>
                Risk
              </span>
              <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: risk.color }}>
                {risk.label}
              </span>
            </div>
          </div>
        </div>
        {/* Approval bar */}
        <div style={{ height: 3, background: "rgba(255,255,255,0.03)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${bloc.approval}%`, height: "100%", background: approvalColor, borderRadius: 2, opacity: 0.5 }} />
        </div>
      </div>

      {/* Expanded detail */}
      {isSelected && (
        <div style={{ padding: "10px 12px", background: COLORS.bgInner, borderTop: `1px solid ${COLORS.border}` }}>

          {/* Outcome Odds */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{
                fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                color: COLORS.textTertiary,
              }}>Outcome Odds</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: mono, fontSize: 9, color: COLORS.textTertiary }}>
                  Positive: <span style={{ color: COLORS.green, fontWeight: 700 }}>{positivePct}%</span>
                </span>
                <span style={{ fontFamily: mono, fontSize: 9, color: COLORS.textTertiary }}>
                  E[V]: <span style={{ color: expectedValue >= 0 ? COLORS.green : COLORS.red, fontWeight: 700 }}>
                    {expectedValue >= 0 ? "+" : ""}{expectedValue.toFixed(1)}
                  </span>
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {RALLY_OUTCOMES.map((o) => (
                <OutcomeBar key={o.id} outcome={o} pct={weights[o.id] || 0} maxPct={maxPct} />
              ))}
            </div>
          </div>

          {/* Outcome Details Table */}
          <div style={{ marginBottom: 14 }}>
            <span style={{
              fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
              color: COLORS.textTertiary, display: "block", marginBottom: 6,
            }}>Outcome Effects</span>
            <div style={{
              display: "grid",
              gridTemplateColumns: "14px 110px 1fr 1fr 50px",
              gap: "2px 8px",
              alignItems: "center",
            }}>
              {/* Header row */}
              {["", "Outcome", "Spillover", "Scope", "Pol."].map((h, i) => (
                <span key={i} style={{
                  fontFamily: mono, fontSize: 8, letterSpacing: "0.08em", textTransform: "uppercase",
                  color: COLORS.textTertiary, paddingBottom: 4,
                }}>{h}</span>
              ))}
              {RALLY_OUTCOMES.map((o) => (
                <>
                  <span key={`${o.id}-icon`} style={{ fontFamily: mono, fontSize: 10, color: o.color, textAlign: "center" }}>{o.icon}</span>
                  <span key={`${o.id}-name`} style={{ fontFamily: mono, fontSize: 10, color: COLORS.textSecondary }}>{o.name}</span>
                  <span key={`${o.id}-spill`} style={{
                    fontFamily: mono, fontSize: 10,
                    color: o.spillover > 0 ? COLORS.green : o.spillover < 0 ? COLORS.red : COLORS.textTertiary,
                  }}>
                    {o.spillover === 0 ? "—" : `${o.spillover > 0 ? "+" : ""}${o.spillover}`}
                  </span>
                  <span key={`${o.id}-scope`} style={{ fontFamily: mono, fontSize: 9, color: COLORS.textTertiary }}>
                    {o.spilloverScope === "none" ? "—" : spilloverLabel(o.spilloverScope)}
                  </span>
                  <span key={`${o.id}-pol`} style={{
                    fontFamily: mono, fontSize: 10, textAlign: "center",
                    color: o.polarization > 0 ? COLORS.orange : COLORS.textTertiary,
                  }}>
                    {o.polarization > 0 ? `+${o.polarization}` : "—"}
                  </span>
                </>
              ))}
            </div>
          </div>

          {/* Active Modifiers */}
          <div style={{ marginBottom: 14 }}>
            <span style={{
              fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
              color: COLORS.textTertiary, display: "block", marginBottom: 6,
            }}>Active Modifiers</span>
            {modifiers.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {modifiers.map((m, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "4px 8px",
                    background: m.positive ? "rgba(74,222,128,0.03)" : "rgba(239,68,68,0.03)",
                    borderLeft: `2px solid ${m.positive ? COLORS.green : COLORS.red}`,
                    borderRadius: "0 2px 2px 0",
                  }}>
                    <span style={{ fontFamily: mono, fontSize: 11, color: COLORS.textSecondary }}>{m.label}</span>
                    <span style={{ fontFamily: mono, fontSize: 9, color: m.positive ? COLORS.green : COLORS.orange }}>{m.effect}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: "4px 8px",
                background: "rgba(74,222,128,0.03)",
                borderLeft: `2px solid ${COLORS.green}`,
                borderRadius: "0 2px 2px 0",
              }}>
                <span style={{ fontFamily: mono, fontSize: 10, color: COLORS.green }}>
                  No modifiers — base odds apply
                </span>
              </div>
            )}
          </div>

          {/* Best / Worst Case */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14,
          }}>
            <div style={{
              padding: "8px 10px", background: "rgba(74,222,128,0.03)",
              border: `1px solid ${COLORS.greenBorder}`, borderRadius: 3,
            }}>
              <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.textTertiary, display: "block", marginBottom: 4 }}>
                Best Case — Rousing ({weights.rousing}%)
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: COLORS.green }}>
                  {bloc.name}: <span style={{ fontWeight: 700 }}>+6 to +8</span>
                </span>
                <span style={{ fontFamily: mono, fontSize: 11, color: COLORS.green }}>
                  Adjacent blocs: <span style={{ fontWeight: 700 }}>+2</span>
                </span>
                <span style={{ fontFamily: mono, fontSize: 11, color: COLORS.orange }}>
                  Polarization: <span style={{ fontWeight: 700 }}>+1</span>
                </span>
                <span style={{ fontFamily: mono, fontSize: 10, fontStyle: "italic", color: COLORS.textTertiary, marginTop: 2 }}>
                  "Massive turnout — supporters overflow venue"
                </span>
              </div>
            </div>
            <div style={{
              padding: "8px 10px", background: "rgba(239,68,68,0.03)",
              border: `1px solid ${COLORS.redBorder}`, borderRadius: 3,
            }}>
              <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.textTertiary, display: "block", marginBottom: 4 }}>
                Worst Case — Counter ({weights.counter}%)
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: COLORS.red }}>
                  {bloc.name}: <span style={{ fontWeight: 700 }}>-1</span>
                </span>
                <span style={{ fontFamily: mono, fontSize: 11, color: COLORS.red }}>
                  All blocs: <span style={{ fontWeight: 700 }}>-2</span>
                </span>
                <span style={{ fontFamily: mono, fontSize: 11, color: COLORS.orange }}>
                  Polarization: <span style={{ fontWeight: 700 }}>+2</span>
                </span>
                <span style={{ fontFamily: mono, fontSize: 10, fontStyle: "italic", color: COLORS.textTertiary, marginTop: 2 }}>
                  "Counter-protesters disrupt — police intervene"
                </span>
              </div>
            </div>
          </div>

          {/* Divisive Speech callout */}
          <div style={{
            padding: "6px 10px", marginBottom: 14,
            background: COLORS.purpleDim,
            border: `1px solid ${COLORS.purpleBorder}`, borderRadius: 3,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontFamily: mono, fontSize: 11, color: COLORS.purple }}>◆</span>
            <div>
              <span style={{ fontFamily: mono, fontSize: 10, color: COLORS.purple, fontWeight: 700 }}>
                Divisive Speech ({weights.divisive}%)
              </span>
              <span style={{ fontFamily: mono, fontSize: 10, color: COLORS.textTertiary, marginLeft: 8 }}>
                The wild card — strong gains with {bloc.name} (+5 to +7) but -2 with every other bloc. High reward, high collateral.
              </span>
            </div>
          </div>

          {/* Headline note */}
          <div style={{
            padding: "6px 10px",
            background: "rgba(255,255,255,0.02)",
            border: `1px solid ${COLORS.border}`, borderRadius: 3,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontFamily: mono, fontSize: 10, color: COLORS.textTertiary }}>
              All outcomes generate a public headline visible to rival parties
            </span>
            <Pill color="dim">Public</Pill>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──

export default function HoldARally() {
  const [selectedBloc, setSelectedBloc] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [rolledOutcome, setRolledOutcome] = useState(null);

  const bloc = BLOCS.find((b) => b.id === selectedBloc);
  const weights = bloc ? getRallyOutcomeWeights(bloc.approval, bloc.rallied_recently, NATION_STATE) : null;
  const risk = weights ? getRallyRiskLevel(weights) : null;

  function simulateRally() {
    if (!weights) return;
    // Weighted random roll
    const ids = ["rousing", "solid", "low", "gaffe", "divisive", "counter"];
    let sum = 0;
    const cumulative = [];
    for (const id of ids) {
      sum += weights[id] || 0;
      cumulative.push({ id, threshold: sum });
    }
    const roll = Math.random() * sum;
    const outcomeId = (cumulative.find((c) => roll <= c.threshold) || cumulative[cumulative.length - 1]).id;
    const outcome = RALLY_OUTCOMES.find((o) => o.id === outcomeId);
    const delta = outcome.targetMin + Math.floor(Math.random() * (outcome.targetMax - outcome.targetMin + 1));

    setRolledOutcome({ outcome, delta });
    setShowResult(true);
  }

  return (
    <div style={{
      background: COLORS.bg, minHeight: "100vh", padding: 24,
      fontFamily: sans, color: COLORS.textPrimary, maxWidth: 860, margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{
        background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 3,
        padding: "12px 16px", marginBottom: 16,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.orange }}>
            Hold a Rally
          </span>
          <span style={{ fontFamily: sans, fontSize: 13, color: COLORS.textSecondary }}>{PARTY.name}</span>
        </div>
      </div>

      {/* Character callout */}
      <div style={{
        padding: "8px 14px", marginBottom: 16,
        background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 3,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontFamily: mono, fontSize: 10, color: COLORS.textTertiary }}>
          Random outcome · Generates headlines · Can polarize · High risk, high reward
        </span>
        <Pill color="orange">Volatile</Pill>
      </div>

      {/* Result overlay */}
      {showResult && bloc && rolledOutcome && (
        <div style={{
          background: COLORS.bgCard,
          border: `1px solid ${rolledOutcome.outcome.targetMin >= 0 ? COLORS.greenBorder : COLORS.redBorder}`,
          borderRadius: 3, overflow: "hidden", marginBottom: 16,
        }}>
          <div style={{
            padding: "12px 16px",
            background: `linear-gradient(90deg, ${rolledOutcome.outcome.color}15, transparent)`,
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: mono, fontSize: 16, color: rolledOutcome.outcome.color }}>
                {rolledOutcome.outcome.icon}
              </span>
              <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: rolledOutcome.outcome.color }}>
                {rolledOutcome.outcome.name}
              </span>
            </div>
            <span
              onClick={() => { setShowResult(false); setSelectedBloc(null); setRolledOutcome(null); }}
              style={{ fontFamily: mono, fontSize: 11, color: COLORS.textTertiary, cursor: "pointer", padding: "4px 8px" }}
            >Dismiss</span>
          </div>
          <div style={{ padding: 16 }}>
            {/* Headline */}
            <div style={{
              fontFamily: sans, fontSize: 14, fontStyle: "italic", color: COLORS.textSecondary,
              marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${COLORS.border}`,
            }}>
              {rolledOutcome.outcome.headline(bloc.name)}
            </div>
            {/* Effects */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: COLORS.textSecondary }}>{bloc.name} approval</span>
                <span style={{
                  fontFamily: mono, fontSize: 12, fontWeight: 700,
                  color: rolledOutcome.delta >= 0 ? COLORS.green : COLORS.red,
                }}>
                  {rolledOutcome.delta >= 0 ? "+" : ""}{rolledOutcome.delta}
                </span>
              </div>
              {rolledOutcome.outcome.spillover !== 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: mono, fontSize: 11, color: COLORS.textSecondary }}>
                    {spilloverLabel(rolledOutcome.outcome.spilloverScope)}
                  </span>
                  <span style={{
                    fontFamily: mono, fontSize: 12, fontWeight: 700,
                    color: rolledOutcome.outcome.spillover > 0 ? COLORS.green : COLORS.red,
                  }}>
                    {rolledOutcome.outcome.spillover > 0 ? "+" : ""}{rolledOutcome.outcome.spillover}
                  </span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: COLORS.textSecondary }}>Polarization</span>
                <span style={{
                  fontFamily: mono, fontSize: 12, fontWeight: 700,
                  color: rolledOutcome.outcome.polarization > 0 ? COLORS.orange : COLORS.green,
                }}>
                  +{rolledOutcome.outcome.polarization}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: COLORS.textSecondary }}>Headline</span>
                <Pill color="dim">Published</Pill>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bloc selection */}
      {!showResult && (
        <>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${COLORS.border}`,
          }}>
            <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.orange }}>
              Select Target Bloc
            </span>
            <span style={{ fontFamily: mono, fontSize: 9, color: COLORS.textTertiary }}>
              Higher approval = better odds · Crises and polarization increase risk
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
            {BLOCS.map((b) => (
              <BlocCard
                key={b.id}
                bloc={b}
                selected={selectedBloc === b.id}
                onSelect={() => { setSelectedBloc(selectedBloc === b.id ? null : b.id); }}
                party={PARTY}
                nationState={NATION_STATE}
              />
            ))}
          </div>

          {/* Confirmation bar */}
          {bloc && (
            <div style={{
              position: "sticky", bottom: 0,
              padding: "12px 16px", background: COLORS.bgCard,
              border: `1px solid ${COLORS.border}`, borderRadius: 3,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <span style={{ fontFamily: sans, fontSize: 13, color: COLORS.textPrimary }}>
                  Rally → <span style={{ color: COLORS.orange }}>{bloc.name}</span>
                </span>
                <span style={{ fontFamily: mono, fontSize: 11, color: risk.color, marginLeft: 12 }}>
                  {risk.label} risk
                </span>
                <span style={{ fontFamily: mono, fontSize: 11, color: COLORS.textTertiary, marginLeft: 8 }}>
                  · E[V]: {(() => {
                    const ev = RALLY_OUTCOMES.reduce((sum, o) => sum + ((o.targetMin + o.targetMax) / 2) * ((weights[o.id] || 0) / 100), 0);
                    return `${ev >= 0 ? "+" : ""}${ev.toFixed(1)}`;
                  })()}
                </span>
              </div>
              <button
                onClick={simulateRally}
                style={{
                  fontFamily: mono, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                  padding: "10px 28px", borderRadius: 3,
                  border: `1px solid ${COLORS.orangeBorder}`,
                  background: COLORS.orangeDim,
                  color: COLORS.orange,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.target.style.background = "rgba(249,115,22,0.14)"; }}
                onMouseLeave={(e) => { e.target.style.background = COLORS.orangeDim; }}
              >
                Hold Rally — 3 AP
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
