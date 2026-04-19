// js/corp-sub-dashboard.js — Subsidiary Services Dashboard
// Shows rate management, active policies, revenue/claims, markup control.
// Embedded into subsidiary detail views by calling initSubDashboard().

import { calculateEffectiveRate, fetchAvailableRates } from './game/subsidiary-services.js';

let _supabase = null;
let _state = null;
let _rate = null;          // this subsidiary's auto-rate row
let _policies = [];        // policies issued by this subsidiary
let _subsidiaryId = null;

function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function fmtMoney(n) {
    if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
    if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'k';
    return '$' + n;
}

function normalizeLoanInterestModel(value) {
    const raw = String(value || '').trim().toLowerCase();
    if (raw === 'amortized' || raw === 'amortising' || raw === 'amortizing') return 'amortized';
    if (raw === 'flat' || raw === 'simple' || raw === 'flat_interest') return 'flat';
    return 'flat';
}

function getLoanFundingModel(source) {
    const raw = String(source?.loan_funding_model || '').trim().toLowerCase();
    return raw === 'parent_corp' ? 'parent_corp' : (raw === 'subsidiary_cash' ? 'subsidiary_cash' : null);
}

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════

/**
 * Initialize the subsidiary services dashboard.
 * Call this for any Insurance or Banking subsidiary.
 *
 * @param {object} supabase
 * @param {object} state — { faction, nation, shard }
 * @param {string} containerId — DOM element to render into
 * @param {string} subsidiaryId — corp_properties.id of the regional_hq
 */
export async function initSubDashboard(supabase, state, containerId, subsidiaryId) {
    _supabase = supabase;
    _state = state;
    _subsidiaryId = subsidiaryId;

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div style="padding:16px;text-align:center;color:#4a4940;font-family:monospace;font-size:10px;">Loading dashboard...</div>';

    // Fetch rate + policies in parallel
    const [rateResult, policiesResult] = await Promise.all([
        supabase.from('subsidiary_auto_rates').select('*').eq('subsidiary_id', subsidiaryId).maybeSingle(),
        supabase.from('subsidiary_auto_policies').select('*').eq('subsidiary_id', subsidiaryId).order('started_tick', { ascending: false }).limit(50),
    ]);

    if (rateResult.error) console.error('[SubDash] Rate fetch error:', rateResult.error.message);
    if (policiesResult.error) console.error('[SubDash] Policies fetch error:', policiesResult.error.message);

    _rate = rateResult.data;
    _policies = policiesResult.data || [];

    renderDashboard(container);
}

// ═══════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════

function renderDashboard(container) {
    const rate = _rate;
    const policies = _policies;
    const isInsurance = rate?.service_type === 'insurance';
    const color = isInsurance ? '#c84' : '#5a8aaa';
    const label = isInsurance ? 'Insurance' : 'Banking';

    if (!rate) {
        container.innerHTML = `
            <div class="csd-panel">
                <div class="csd-empty">
                    <div style="font-size:1.5rem;margin-bottom:8px;opacity:0.4;">${isInsurance ? '\uD83D\uDEE1\uFE0F' : '\uD83C\uDFE6'}</div>
                    <div style="font-family:monospace;font-size:10px;color:#888;">Auto-rate not yet generated.</div>
                    <div style="font-family:monospace;font-size:8px;color:#4a4940;margin-top:4px;">Rates are generated automatically each tick based on national interest rates.</div>
                </div>
            </div>
        `;
        return;
    }

    const activePolicies = policies.filter(p => p.status === 'active');
    const totalRevenue = Number(rate.total_revenue ?? 0);
    const totalClaims = Number(rate.total_claims ?? 0);
    const netRevenue = totalRevenue - totalClaims;
    const netColor = netRevenue >= 0 ? '#5cb85c' : '#d9534f';

    const policyRows = policies.slice(0, 20).map(p => {
        const statusColor = p.status === 'active' ? '#5cb85c' : p.status === 'defaulted' ? '#d9534f' : p.status === 'repaid' ? '#5a8aaa' : '#666';
        const loanInterestModel = normalizeLoanInterestModel(p.loan_interest_model || p.interest_model || p.loan_interest_type);
        const fundingModel = getLoanFundingModel(p);
        return `
            <div class="csd-policy-row">
                <span class="csd-policy-status" style="color:${statusColor};">\u25CF</span>
                <span class="csd-policy-type">${p.service_type === 'insurance' ? 'INS' : 'LOAN'}</span>
                <span class="csd-policy-rate">${p.rate_at_issue}%</span>
                <span class="csd-policy-principal">${fmtMoney(p.principal)}</span>
                <span class="csd-policy-payment">${fmtMoney(p.monthly_payment)}/mo</span>
                <span class="csd-policy-paid">${fmtMoney(p.total_paid)} paid</span>
                ${p.service_type === 'loan' ? `<span class="csd-policy-type" style="color:#8ab0c7;">${loanInterestModel === 'amortized' ? 'AMORTIZED' : 'FLAT'}</span>` : ''}
                ${p.service_type === 'loan' && fundingModel ? `<span class="csd-policy-type" style="color:#b9a46a;">${fundingModel === 'parent_corp' ? 'PARENT' : 'SUB CASH'}</span>` : ''}
                <span class="csd-policy-badge" style="color:${statusColor};border-color:${statusColor}44;background:${statusColor}0a;">${p.status.toUpperCase()}</span>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="csd-panel">
            <!-- Header -->
            <div class="csd-header">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;"></span>
                    <span style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:${color};text-transform:uppercase;">${label} Services Dashboard</span>
                </div>
                <span style="font-family:monospace;font-size:8px;color:#666;">${rate.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
            </div>

            <!-- Rate overview -->
            <div class="csd-rate-section">
                <div class="csd-rate-card">
                    <div class="csd-rate-card-label">Effective Rate</div>
                    <div class="csd-rate-card-value" style="color:${color};font-size:24px;">${rate.effective_rate}%</div>
                    <div class="csd-rate-breakdown">
                        Base: ${rate.base_rate}% ${Number(rate.markup) > 0 ? '+ Markup: ' + rate.markup + '%' : ''}
                    </div>
                </div>
                <div class="csd-rate-card">
                    <div class="csd-rate-card-label">Active Policies</div>
                    <div class="csd-rate-card-value">${activePolicies.length}</div>
                    <div class="csd-rate-breakdown">${rate.policies_issued || 0} total issued</div>
                </div>
                <div class="csd-rate-card">
                    <div class="csd-rate-card-label">Net Revenue</div>
                    <div class="csd-rate-card-value" style="color:${netColor};">${fmtMoney(netRevenue)}</div>
                    <div class="csd-rate-breakdown">
                        <span style="color:#5cb85c;">${fmtMoney(totalRevenue)} collected</span>
                        ${totalClaims > 0 ? ` &mdash; <span style="color:#d9534f;">${fmtMoney(totalClaims)} claims</span>` : ''}
                    </div>
                </div>
                ${isInsurance ? `<div class="csd-rate-card">
                    <div class="csd-rate-card-label">Deductible</div>
                    <div class="csd-rate-card-value">${rate.deductible_pct}%</div>
                    <div class="csd-rate-breakdown">Applied to claim payouts</div>
                </div>` : ''}
            </div>

            <!-- Markup control -->
            <div class="csd-markup-section">
                <div class="csd-markup-header">
                    <span class="csd-markup-label">Owner Markup</span>
                    <span class="csd-markup-value" id="csd-markup-display">${rate.markup}%</span>
                </div>
                <div class="csd-markup-slider-row">
                    <span style="font-family:monospace;font-size:7px;color:#4a4940;">0%</span>
                    <input type="range" min="0" max="50" step="1" value="${Math.round(Number(rate.markup) * 10)}" id="csd-markup-slider" class="csd-slider">
                    <span style="font-family:monospace;font-size:7px;color:#4a4940;">5%</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
                    <span style="font-family:monospace;font-size:7px;color:#4a4940;">Higher markup = more revenue per policy, fewer customers</span>
                    <button class="csd-save-btn" id="csd-save-markup">Save Markup</button>
                </div>
            </div>

            <!-- Service limits -->
            <div class="csd-limits-section">
                <div class="csd-limits-row">
                    <span class="csd-limits-label">${isInsurance ? 'Max Coverage' : 'Max Loan'}</span>
                    <span class="csd-limits-value">${fmtMoney(rate.coverage_limit || 0)}</span>
                </div>
                <div class="csd-limits-row">
                    <span class="csd-limits-label">Term Range</span>
                    <span class="csd-limits-value">${rate.min_term_months}-${rate.max_term_months} months</span>
                </div>
            </div>

            <!-- Policies table -->
            <div class="csd-policies-section">
                <div class="csd-policies-title">Issued Policies (${policies.length})</div>
                ${policies.length === 0
                    ? '<div style="font-family:monospace;font-size:9px;color:#4a4940;font-style:italic;padding:8px 0;">No policies issued yet. Corporations in this nation will see your rates and can accept coverage.</div>'
                    : `<div class="csd-policies-list">${policyRows}</div>`
                }
            </div>
        </div>
    `;

    // Bind markup slider
    const slider = document.getElementById('csd-markup-slider');
    const display = document.getElementById('csd-markup-display');
    if (slider && display) {
        slider.addEventListener('input', () => {
            display.textContent = (slider.value / 10).toFixed(1) + '%';
        });
    }

    // Bind save markup
    document.getElementById('csd-save-markup')?.addEventListener('click', async () => {
        const newMarkup = Number(slider?.value || 0) / 10;
        const btn = document.getElementById('csd-save-markup');
        if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }

        try {
            const nation = _state.nation;
            const rateInfo = calculateEffectiveRate(nation, rate.service_type, newMarkup);

            const { error } = await _supabase
                .from('subsidiary_auto_rates')
                .update({
                    markup: rateInfo.markup,
                    effective_rate: rateInfo.effectiveRate,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', rate.id);

            if (error) {
                console.error('[SubDash] Save markup failed:', error.message);
                alert('Failed to save markup.');
                return;
            }

            rate.markup = rateInfo.markup;
            rate.effective_rate = rateInfo.effectiveRate;
            renderDashboard(container);
        } catch (err) {
            console.error('[SubDash] Save markup error:', err);
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'Save Markup'; }
        }
    });
}
