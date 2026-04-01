/**
 * game-common.js — Barrel re-export file
 *
 * Re-exports all game logic from domain modules under js/game/.
 * This file exists for backward compatibility: all HTML pages import
 * from ./js/game-common.js and continue to work without changes.
 */

export * from './game/config.js';
export * from './game/government-types.js';
export * from './game/trade-constants.js';
export * from './game/diplomacy-constants.js';
export * from './game/ideology.js';
export * from './game/stats.js';
export * from './game/momentum.js';
export * from './game/budget.js';
export * from './game/government-structure.js';
export * from './game/caucus.js';
export * from './game/bills.js';
export * from './game/elections.js';
export * from './game/presidential.js';
export * from './game/political-actions.js';
export * from './game/executive-orders.js';
export * from './game/election-simulation.js';
export * from './game/sovereign-default.js';
export * from './game/valdorian-templates.js';
export * from './game/valdorian-generator.js';
export * from './game/party-leadership.js';
export * from './game/protest.js';
export * from './game/electorate.js';
export * from './game/vln.js';
