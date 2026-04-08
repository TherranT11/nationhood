-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: Judicial Appointment Politicization Act
-- Date: 2026-04-01
--
-- Adds a boolean flag to nations for tracking whether the Judicial Appointment
-- Politicization Act foundational law is active.
-- ════════════════════════════════════════════════════════════════════════════════

-- Nation flag: is this law active?
ALTER TABLE nations ADD COLUMN IF NOT EXISTS judicial_appointment_politicization BOOLEAN DEFAULT FALSE;

-- Bill proposal field: used when drafting the foundational bill
ALTER TABLE bills ADD COLUMN IF NOT EXISTS proposed_judicial_appointment_politicization BOOLEAN DEFAULT FALSE;
