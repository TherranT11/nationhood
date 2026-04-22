// js/corp-auto-services.js — UI for browsing and accepting auto-rate insurance/loans
// from Finance subsidiaries operating in the same nation.
//
// Renders into a container element. Can be embedded in any corp page.

import { fetchAvailableRates, fetchMyPolicies } from './game/subsidiary-services.js';
import { monthlyInterest, principalPortion } from './game/loan-math.js';

let _supabase = null;
let _state = null;
let _rates = [];
let _myPolicies = [];

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

function computeFlatLoanMonthlyPayment(principal, annualRatePct, termMonths) {
    const safePrincipal = Math.max(0, Number(principal) || 0);
    const safeRate = Math.max(0, Number(annualRatePct) || 0);
    const safeTerm = Math.max(1, Number(termMonths) || 1);
    const monthlyInterest = (safePrincipal * (safeRate / 100)) / 12;
    const monthlyPrincipal = safePrincipal / safeTerm;
    return Math.round(monthlyInterest + monthlyPrincipal);
}

function computeAmortizedLoanMonthlyPayment(principal, annualRatePct, termMonths) {
    const safePrincipal = Math.max(0, Number(principal) || 0);
    const safeRate = Math.max(0, Number(annualRatePct) || 0);
    const safeTerm = Math.max(1, Number(termMonths) || 1);
    const monthlyRate = safeRate / 100 / 12;

    if (monthlyRate <= 0) {
        return Math.round(safePrincipal / safeTerm);
    }

    const rawPayment = safePrincipal * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -safeTerm)));
    return Math.round(rawPayment);
}

function normalizeLoanInterestModel(value) {
    const raw = String(value || '').trim().toLowerCase();
    if (raw === 'amortized' || raw === 'amortising' || raw === 'amortizing') return 'amortized';
    if (raw === 'flat' || raw === 'simple' || raw === 'flat_interest') return 'flat';
    return 'flat';
}

function getLoanInterestModel(source) {
    return normalizeLoanInterestModel(
        source?.loan_interest_model || source?.interest_model || source?.loan_interest_type,
    );
}

function getLoanFundingModel(source) {
    const raw = String(source?.loan_funding_model || '').trim().toLowerCase();
    return raw === 'parent_corp' ? 'parent_corp' : (raw === 'subsidiary_cash' ? 'subsidiary_cash' : null);
}

function computeLoanPreview(principal, annualRatePct, termMonths, interestModel) {
    const safePrincipal = Math.max(0, Number(principal) || 0);
    const safeRate = Math.max(0, Number(annualRatePct) || 0);
    const safeTerm = Math.max(1, Number(termMonths) || 1);
    const month1Interest = monthlyInterest(safePrincipal, safeRate);

    if (interestModel === 'amortized') {
        const monthlyPayment = computeAmortizedLoanMonthlyPayment(safePrincipal, safeRate, safeTerm);
        const month1Principal = principalPortion(monthlyPayment, month1Interest);
        const totalInterest = Math.max(0, Math.round((monthlyPayment * safeTerm) - safePrincipal));
        return { monthlyPayment, month1Interest, month1Principal, totalInterest };
    }

    const month1Principal = Math.round(safePrincipal / safeTerm);
    const monthlyPayment = month1Interest + month1Principal;
    const totalInterest = month1Interest * safeTerm;
    return { monthlyPayment, month1Interest, month1Principal, totalInterest };
}

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════

/**
 * Initialize the auto-services panel.
 * @param {object} supabase
 * @param {object} state — { faction, nation, shard }
 * @param {string} containerId — DOM element ID to render into
 * @param {string} [filterType] — 'insurance', 'loan', or null for both
 */
export async function initAutoServices(supabase, state, containerId, filterType) {
    _supabase = supabase;
    _state = state;

    const container = document.getElementById(containerId);
    if (!container) return;

    const nationId = state.nation?.id;
    const factionId = state.faction?.id;
    if (!nationId || !factionId) {
        container.innerHTML = '<div style="padding:20px;text-align:center;color:#666;font-size:10px;">No nation data.</div>';
        return;
    }

    container.innerHTML = '<div style="padding:20px;text-align:center;color:#666;font-family:var(--font-mono,monospace);font-size:10px;">Loading available services...</div>';

    const [ratesResult, policiesResult] = await Promise.all([
        fetchAvailableRates(supabase, nationId, filterType),
        fetchMyPolicies(supabase, factionId),
    ]);

    _rates = ratesResult;
    _myPolicies = policiesResult;

    renderPanel(container, filterType);
}

// ═══════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════

function renderPanel(container, filterType) {
    const insuranceRates = _rates.filter(r => r.service_type === 'insurance');
    const loanRates = _rates.filter(r => r.service_type === 'loan');
    const myInsurance = _myPolicies.filter(p => p.service_type === 'insurance');
    const myLoans = _myPolicies.filter(p => p.service_type === 'loan');

    const showInsurance = !filterType || filterType === 'insurance';
    const showLoans = !filterType || filterType === 'loan';

    let html = '';

    // Active policies summary
    if (myInsurance.length > 0 || myLoans.length > 0) {
        html += '<div class="cas-section"><div class="cas-section-title">Your Active Policies</div>';
        html += (myInsurance.concat(myLoans)).map(p => renderPolicyCard(p)).join('');
        html += '</div>';
    }

    // Available insurance
    if (showInsurance) {
        html += '<div class="cas-section"><div class="cas-section-title">Available Insurance</div><div class="cas-section-body">';
        if (insuranceRates.length === 0) {
            html += '<div class="cas-empty">No insurance subsidiaries operate in this nation.</div>';
        } else {
            html += insuranceRates.map(r => renderRateCard(r, 'insurance')).join('');
        }
        html += '</div></div>';
    }

    // Available loans
    if (showLoans) {
        html += '<div class="cas-section"><div class="cas-section-title">Available Credit</div><div class="cas-section-body">';
        if (loanRates.length === 0) {
            html += '<div class="cas-empty">No banking subsidiaries operate in this nation.</div>';
        } else {
            html += loanRates.map(r => renderRateCard(r, 'loan')).join('');
        }
        html += '</div></div>';
    }

    if (!html) {
        html = '<div class="cas-empty">No financial services available in this nation.</div>';
    }

    container.innerHTML = `<div class="cas-panel">${html}</div>`;

    // Bind accept buttons
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-accept-rate]');
        if (!btn) return;
        const rateId = btn.dataset.acceptRate;
        const type = btn.dataset.serviceType;
        openAcceptModal(container, rateId, type, filterType);
    });
}

function renderRateCard(rate, serviceType) {
    const subName = rate.corp_properties?.name || 'Unknown Subsidiary';
    const isInsurance = serviceType === 'insurance';
    const color = isInsurance ? '#c84' : '#5a8aaa';
    const label = isInsurance ? 'INSURANCE' : 'CREDIT';
    const rateLabel = isInsurance ? 'Annual Premium' : 'Annual Interest';
    const interestModel = getLoanInterestModel(rate);
    const fundingModel = getLoanFundingModel(rate);

    // Check if we already have a policy from this rate
    const hasPolicy = _myPolicies.some(p => p.rate_id === rate.id && p.status === 'active');

    return `
        <div class="cas-rate-card">
            <div class="cas-rate-header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="width:6px;height:6px;border-radius:50%;background:${color};display:inline-block;"></span>
                    <span style="font-size:11px;font-weight:700;color:#f0efe6;">${esc(subName)}</span>
                    <span class="cas-badge" style="color:${color};border-color:${color}44;background:${color}0a;">${label}</span>
                    ${!isInsurance ? `<span class="cas-badge" style="color:#8ab0c7;border-color:#8ab0c744;background:#8ab0c70f;">${interestModel === 'amortized' ? 'AMORTIZED' : 'FLAT'}</span>` : ''}
                    ${!isInsurance && fundingModel ? `<span class="cas-badge" style="color:#b9a46a;border-color:#b9a46a44;background:#b9a46a0f;">${fundingModel === 'parent_corp' ? 'PARENT FUNDED' : 'SUB FUNDED'}</span>` : ''}
                </div>
                <span style="font-family:monospace;font-size:8px;color:#666;">${rate.policies_issued || 0} policies issued</span>
            </div>
            <div class="cas-rate-body">
                <div class="cas-rate-row">
                    <span class="cas-rate-label">${rateLabel}</span>
                    <span class="cas-rate-value" style="color:${color};font-size:16px;">${rate.effective_rate}%</span>
                </div>
                <div class="cas-rate-breakdown">
                    <span>Base: ${rate.base_rate}%</span>
                    ${rate.markup > 0 ? `<span>+ Markup: ${rate.markup}%</span>` : ''}
                </div>
                <div class="cas-rate-row">
                    <span class="cas-rate-label">${isInsurance ? 'Max Coverage' : 'Max Loan'}</span>
                    <span class="cas-rate-value">${fmtMoney(rate.coverage_limit || 0)}</span>
                </div>
                ${isInsurance ? `<div class="cas-rate-row">
                    <span class="cas-rate-label">Deductible</span>
                    <span class="cas-rate-value">${rate.deductible_pct || 10}%</span>
                </div>` : ''}
                <div class="cas-rate-row">
                    <span class="cas-rate-label">Term</span>
                    <span class="cas-rate-value">${rate.min_term_months}-${rate.max_term_months} months</span>
                </div>
            </div>
            <div class="cas-rate-footer">
                ${hasPolicy
                    ? '<span style="font-family:monospace;font-size:8px;font-weight:700;color:#5cb85c;">✓ ACTIVE POLICY</span>'
                    : `<button class="cas-accept-btn" data-accept-rate="${rate.id}" data-service-type="${serviceType}" style="border-color:${color};color:${color};">Accept ${isInsurance ? 'Coverage' : 'Terms'}</button>`
                }
            </div>
        </div>
    `;
}

function renderPolicyCard(policy) {
    const isInsurance = policy.service_type === 'insurance';
    const color = isInsurance ? '#c84' : '#5a8aaa';
    const statusColor = policy.status === 'active' ? '#5cb85c' : policy.status === 'lapsed' ? '#d9534f' : '#666';
    const interestModel = getLoanInterestModel(policy);
    const fundingModel = getLoanFundingModel(policy);

    return `
        <div class="cas-policy-card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="cas-badge" style="color:${color};border-color:${color}44;background:${color}0a;">${isInsurance ? 'INSURANCE' : 'LOAN'}</span>
                    <span style="font-size:10px;font-weight:600;color:#c4c2b8;">${policy.rate_at_issue}% rate</span>
                    ${!isInsurance ? `<span class="cas-badge" style="color:#8ab0c7;border-color:#8ab0c744;background:#8ab0c70f;">${interestModel === 'amortized' ? 'AMORTIZED' : 'FLAT'}</span>` : ''}
                    ${!isInsurance && fundingModel ? `<span class="cas-badge" style="color:#b9a46a;border-color:#b9a46a44;background:#b9a46a0f;">${fundingModel === 'parent_corp' ? 'PARENT FUNDED' : 'SUB FUNDED'}</span>` : ''}
                </div>
                <span class="cas-badge" style="color:${statusColor};border-color:${statusColor}44;background:${statusColor}0a;">${policy.status.toUpperCase()}</span>
            </div>
            <div style="display:flex;gap:12px;margin-top:6px;font-family:monospace;font-size:8px;color:#888;">
                <span>${isInsurance ? 'Premium' : 'Payment'}: ${fmtMoney(policy.monthly_payment)}/mo</span>
                <span>Paid: ${fmtMoney(policy.total_paid)}</span>
                <span>${policy.payments_made} payments</span>
            </div>
        </div>
    `;
}

// ═══════════════════════════════════════════════════
// ACCEPT COVERAGE/LOAN MODAL
// ═══════════════════════════════════════════════════

let _acceptSubmitting = false;

function openAcceptModal(container, rateId, serviceType, filterType) {
    const rate = _rates.find(r => r.id === rateId);
    if (!rate) return;

    const isInsurance = serviceType === 'insurance';
    const color = isInsurance ? '#c84' : '#5a8aaa';
    const subName = rate.corp_properties?.name || 'Unknown';
    const maxAmount = rate.coverage_limit || 0;
    const loanInterestModel = getLoanInterestModel(rate);

    // Create overlay
    let overlay = document.getElementById('cas-accept-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'cas-accept-overlay';
        overlay.className = 'cas-overlay';
        document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
        <div class="cas-modal">
            <div class="cas-modal-header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="width:7px;height:7px;border-radius:50%;background:${color};display:inline-block;"></span>
                    <span style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:#888;text-transform:uppercase;">Accept ${isInsurance ? 'Insurance' : 'Loan'}</span>
                </div>
                <span class="cas-modal-close" id="cas-close">&times;</span>
            </div>
            <div style="padding:8px 16px;border-bottom:1px solid rgba(255,255,255,0.06);background:${color}08;display:flex;align-items:center;gap:8px;">
                <span style="width:5px;height:5px;border-radius:50%;background:${color};display:inline-block;"></span>
                <span style="font-family:monospace;font-size:9px;color:#888;">Provider:</span>
                <span style="font-family:monospace;font-size:9px;font-weight:700;color:${color};">${esc(subName)}</span>
            </div>
            <div style="padding:16px;display:flex;flex-direction:column;gap:14px;">
                <div>
                    <div style="font-family:monospace;font-size:7px;color:#4a4940;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">${isInsurance ? 'Coverage Amount' : 'Loan Amount'}</div>
                    <input type="number" id="cas-amount" placeholder="Enter amount" max="${maxAmount}" style="width:100%;padding:7px 10px;font-family:monospace;font-size:13px;color:#f0efe6;background:#1c1c18;border:1px solid rgba(255,255,255,0.08);outline:none;box-sizing:border-box;">
                    <div style="font-family:monospace;font-size:7px;color:#4a4940;margin-top:3px;">Max: ${fmtMoney(maxAmount)}</div>
                </div>
                <div>
                    <div style="font-family:monospace;font-size:7px;color:#4a4940;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Term (months)</div>
                    <input type="number" id="cas-term" value="${rate.min_term_months}" min="${rate.min_term_months}" max="${rate.max_term_months}" style="width:120px;padding:7px 10px;font-family:monospace;font-size:13px;color:#f0efe6;background:#1c1c18;border:1px solid rgba(255,255,255,0.08);outline:none;text-align:center;">
                    <span style="font-family:monospace;font-size:8px;color:#4a4940;margin-left:8px;">${rate.min_term_months}-${rate.max_term_months} months</span>
                </div>
                <div style="padding:8px 10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
                    <div style="font-family:monospace;font-size:7px;color:#4a4940;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">TERMS SUMMARY</div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:monospace;font-size:8px;color:#888;">Rate</span>
                        <span style="font-family:monospace;font-size:9px;font-weight:700;color:${color};">${rate.effective_rate}%</span>
                    </div>
                    ${isInsurance ? `<div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:monospace;font-size:8px;color:#888;">Deductible</span>
                        <span style="font-family:monospace;font-size:9px;font-weight:700;color:#c4c2b8;">${rate.deductible_pct}%</span>
                    </div>` : ''}
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:monospace;font-size:8px;color:#888;">Monthly ${isInsurance ? 'Premium' : 'Payment'}</span>
                        <span style="font-family:monospace;font-size:9px;font-weight:700;color:#c4c2b8;" id="cas-monthly">—</span>
                    </div>
                    ${!isInsurance ? `<div style="margin-top:8px;padding-top:8px;border-top:1px dashed rgba(255,255,255,0.08);font-family:monospace;font-size:8px;color:#9d9b91;">
                        ${loanInterestModel === 'amortized'
                            ? 'Amortized loan: interest is charged on remaining principal each month.'
                            : 'Flat loan: interest is charged on original principal each month.'
                        }
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:6px;">
                        <span style="font-family:monospace;font-size:8px;color:#888;">Month 1 Interest</span>
                        <span style="font-family:monospace;font-size:9px;color:#c4c2b8;" id="cas-month1-interest">—</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:3px;">
                        <span style="font-family:monospace;font-size:8px;color:#888;">Month 1 Principal</span>
                        <span style="font-family:monospace;font-size:9px;color:#c4c2b8;" id="cas-month1-principal">—</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:3px;">
                        <span style="font-family:monospace;font-size:8px;color:#888;">Total Interest (term)</span>
                        <span style="font-family:monospace;font-size:9px;color:#c4c2b8;" id="cas-total-interest">—</span>
                    </div>` : ''}
                </div>
            </div>
            <div style="padding:10px 16px;border-top:1px solid rgba(255,255,255,0.06);background:#1c1c18;display:flex;justify-content:flex-end;gap:6px;">
                <button class="cas-btn cas-btn--cancel" id="cas-cancel">Cancel</button>
                <button class="cas-btn cas-btn--submit" id="cas-submit" disabled style="background:${color};">Accept</button>
            </div>
        </div>
    `;

    overlay.classList.add('active');

    // Close
    const close = () => { overlay.classList.remove('active'); };
    document.getElementById('cas-close')?.addEventListener('click', close);
    document.getElementById('cas-cancel')?.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    // Monthly calc + submit enable
    const updateCalc = () => {
        const amount = Number(document.getElementById('cas-amount')?.value) || 0;
        const term = Number(document.getElementById('cas-term')?.value) || rate.min_term_months;
        const monthlyEl = document.getElementById('cas-monthly');
        const month1InterestEl = document.getElementById('cas-month1-interest');
        const month1PrincipalEl = document.getElementById('cas-month1-principal');
        const totalInterestEl = document.getElementById('cas-total-interest');
        const submitBtn = document.getElementById('cas-submit');

        if (amount > 0 && term > 0) {
            let monthly;
            if (isInsurance) {
                // Premium = (amount × rate%) / 12 per month
                monthly = Math.round((amount * rate.effective_rate / 100) / 12);
            } else {
                const preview = computeLoanPreview(amount, rate.effective_rate, term, loanInterestModel);
                monthly = preview.monthlyPayment;
                if (month1InterestEl) month1InterestEl.textContent = fmtMoney(preview.month1Interest);
                if (month1PrincipalEl) month1PrincipalEl.textContent = fmtMoney(preview.month1Principal);
                if (totalInterestEl) totalInterestEl.textContent = fmtMoney(preview.totalInterest);
            }
            if (monthlyEl) monthlyEl.textContent = fmtMoney(monthly);
            if (submitBtn) submitBtn.disabled = amount <= 0 || amount > maxAmount;
        } else {
            if (monthlyEl) monthlyEl.textContent = '\u2014';
            if (month1InterestEl) month1InterestEl.textContent = '\u2014';
            if (month1PrincipalEl) month1PrincipalEl.textContent = '\u2014';
            if (totalInterestEl) totalInterestEl.textContent = '\u2014';
            if (submitBtn) submitBtn.disabled = true;
        }
    };

    document.getElementById('cas-amount')?.addEventListener('input', updateCalc);
    document.getElementById('cas-term')?.addEventListener('input', updateCalc);

    // Submit
    document.getElementById('cas-submit')?.addEventListener('click', async () => {
        if (_acceptSubmitting) return;
        _acceptSubmitting = true;
        const btn = document.getElementById('cas-submit');
        if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }

        try {
            const amount = Number(document.getElementById('cas-amount')?.value) || 0;
            const term = Number(document.getElementById('cas-term')?.value) || rate.min_term_months;
            if (amount <= 0 || amount > maxAmount) return;

            const tick = _state.shard?.current_tick || 0;
            let monthly;
            if (isInsurance) {
                monthly = Math.round((amount * rate.effective_rate / 100) / 12);
            } else {
                monthly = computeLoanPreview(amount, rate.effective_rate, term, loanInterestModel).monthlyPayment;
            }

            const { data, error } = await _supabase.rpc('accept_subsidiary_auto_policy_txn', {
                p_rate_id: rate.id,
                p_borrower_faction_id: _state.faction?.id,
                p_principal: amount,
                p_term_months: term,
                p_monthly_payment: monthly,
                p_started_tick: tick,
                p_expires_tick: tick + term,
            });

            if (error) {
                console.error('[AutoServices] Accept failed:', error.message);
                alert('Failed: ' + error.message);
                return;
            }

            _myPolicies.push(data);
            rate.policies_issued = (rate.policies_issued || 0) + 1;

            // Log corporate event for news ticker
            try {
                const borrowerName = _state.faction?.faction_name || 'A corporation';
                const lenderSub = rate.corp_properties?.name || 'a financial institution';
                const nationId = rate.nation_id || _state.faction?.nation_id;
                if (nationId) {
                    await _supabase.from('event_log').insert({
                        nation_id: nationId,
                        event_name: isInsurance ? 'Insurance Policy Issued' : 'Loan Agreement Signed',
                        category: 'corporate',
                        description_chosen: isInsurance
                            ? `${borrowerName} has secured an insurance policy with ${lenderSub}.`
                            : `${borrowerName} has just agreed to terms on a substantial loan with ${lenderSub}.`,
                        fired_at_tick: tick,
                    });
                }
            } catch (_) { /* non-blocking */ }

            close();
            renderPanel(container, filterType);
        } catch (err) {
            console.error('[AutoServices] Accept error:', err);
            alert('An error occurred.');
        } finally {
            _acceptSubmitting = false;
            if (btn) { btn.disabled = false; btn.textContent = 'Accept'; }
        }
    });
}
