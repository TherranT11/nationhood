-- Add overreach_reset_tick column to nations so that executive orders issued by a
-- previous president do not count toward the new president's overreach window.
-- getOverreachCount() and fetchActiveOrders() now filter: issued_tick >= max(window_start, overreach_reset_tick).

ALTER TABLE nations ADD COLUMN IF NOT EXISTS overreach_reset_tick int DEFAULT 0;
