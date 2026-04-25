// js/role-actions.js — Shared shell for role-based Actions panels.
//
// Owns the outer chrome common to the Political Parties Actions tab
// (js/party-actions.js) and the Corporations Actions tab (Phase 2):
//   - Header row: title + entity badge + 3 stat pills on the right
//   - Status bar: left count item + right list of tagged items
//   - Main split: left role list container + right action panel container
//
// Caller populates the role list and action panel by id after the shell
// renders. All party- or corp-specific behaviour (modal dialogs, action
// handlers, per-role rendering) lives in the caller.
//
// Class names intentionally keep the .pa-* prefix for this phase so the
// existing css/party-actions.css continues to style the shell unchanged.
// A later phase can rename once both consumers are wired.

function esc(str) {
    if (str == null) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
}

/**
 * Render the shared Actions-panel shell. Populates `root` with the
 * header, status bar, and main split. The role list and action panel
 * are left empty — caller fills them via the returned refs or by
 * looking up the container IDs in `cfg`.
 *
 * @param {HTMLElement} root
 * @param {Object} cfg
 * @param {string} cfg.title - e.g. 'Party Actions' or 'Actions'.
 * @param {string} cfg.entityName - e.g. 'Partido Liberal'.
 * @param {string} [cfg.entityColor] - accent color; defaults to party gold.
 * @param {Array<{label:string,value:(string|number),color?:string}>} [cfg.stats]
 *   - Header stat pills (up to 3 rendered). Pre-formatted strings.
 * @param {Array<Object>} [cfg.statusBarItems]
 *   - Each item is {type:'count', label, big, bigColor?, dim1?, dim2?}
 *     OR {type:'list', label, items:[{label, statusClass?, title?}]}.
 * @param {string} cfg.rolesContainerId - id assigned to the roles column.
 * @param {string} cfg.panelContainerId - id assigned to the action panel.
 * @param {string|number} [cfg.rolesColumnWidth] - override for the roles
 *   column width (default is `.pa-leaders`'s 200px from css/party-actions.css;
 *   corp uses 262px to fit the wider executive cards).
 * @param {string} [cfg.extraHtml] - appended after `.pa-page` (e.g. modal overlays).
 * @returns {{roles:HTMLElement, panel:HTMLElement}} refs to the two
 *   containers so the caller can populate without re-querying.
 */
export function renderRoleActionsShell(root, cfg) {
    if (!root) return { roles: null, panel: null };
    const accent = cfg.entityColor || '#c8a832';

    const statsHtml = (cfg.stats || []).map(s => `
        <div class="pa-header-stat">
            <div class="pa-header-stat-label">${esc(s.label)}</div>
            <div class="pa-header-stat-value"${s.color ? ` style="color:${s.color};"` : ''}>${esc(s.value)}</div>
        </div>
    `).join('');

    const statusBarHtml = (cfg.statusBarItems || []).map(item => {
        if (item.type === 'count') {
            return `
                <div class="pa-status-item">
                    <div class="pa-status-label">${esc(item.label)}</div>
                    <div class="pa-status-value">
                        <span class="pa-status-big"${item.bigColor ? ` style="color:${item.bigColor};"` : ''}>${esc(item.big)}</span>
                        ${item.dim1 ? `<span class="pa-status-dim">${esc(item.dim1)}</span>` : ''}
                        ${item.dim2 ? `<span class="pa-status-dim">${esc(item.dim2)}</span>` : ''}
                    </div>
                </div>
            `;
        }
        if (item.type === 'list') {
            return `
                <div class="pa-status-item">
                    <div class="pa-status-label">${esc(item.label)}</div>
                    <div style="display:flex;gap:4px;margin-top:3px;">
                        ${(item.items || []).map(s => `<span class="pa-platform-slot ${s.statusClass || ''}"${s.title ? ` title="${esc(s.title)}"` : ''}>${esc(s.label)}</span>`).join('')}
                    </div>
                </div>
            `;
        }
        return '';
    }).join('');

    root.innerHTML = `
        <div class="pa-page">
            <div class="pa-header">
                <div class="pa-header-left">
                    <span class="pa-title" style="color:${accent};">${esc(cfg.title || 'Actions')}</span>
                    <div class="pa-party-badge">
                        <div class="pa-party-dot" style="background:${accent};"></div>
                        <span class="pa-party-name">${esc(cfg.entityName || '')}</span>
                    </div>
                </div>
                <div class="pa-header-stats">${statsHtml}</div>
            </div>
            <div class="pa-status-bar">${statusBarHtml}</div>
            <div class="pa-main">
                <div class="pa-leaders" id="${cfg.rolesContainerId}"${cfg.rolesColumnWidth ? ` style="width:${typeof cfg.rolesColumnWidth === 'number' ? cfg.rolesColumnWidth + 'px' : cfg.rolesColumnWidth};"` : ''}></div>
                <div class="pa-actions-panel" id="${cfg.panelContainerId}"></div>
            </div>
        </div>
        ${cfg.extraHtml || ''}
    `;

    return {
        roles: document.getElementById(cfg.rolesContainerId),
        panel: document.getElementById(cfg.panelContainerId),
    };
}
