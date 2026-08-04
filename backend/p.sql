-- Ticket 3: Which rooms can we sell for a guest date range?
-- Guest window for this test (change these two literals when testing in psql):
--   guest check-in:  2026-05-20 2:00 PM
--   guest check-out: 2026-05-30 2:00 PM  (use 11:00 AM if you want standard motel checkout time)

SELECT * FROM rooms
WHERE
    -- Step 1: Rooms the operator can rent now (Dirty still counts if cleaning occurs before arrival)
    "CleanStatus" IN ('Clean', 'Dirty')

    -- Step 2: Hide this room if ANY blocking stay exists on THIS room (see subquery)
    AND NOT EXISTS (
        SELECT 1
        FROM room_stays
        WHERE
            -- Tie stay to the outer room row (without this, every room checks all stays)
            room_stays."RoomId" = rooms.id

            -- Only future/active holds block inventory (checked-out / cancelled = free again)
            AND "RoomStayStatus" IN ('Confirmed', 'CheckedIn')

            -- Overlap = both lines below must be true for the same stay.
            -- Memory trick: each line mixes ONE date from the OLD stay with ONE from the NEW guest.
            --
            --   existing check-in  <  guest check-out
            --   ("old guest still starts before new guest is done")
            --
            AND room_stays."CheckInDate" < '2026-05-30 11:00:00'::timestamptz

            --   existing check-out  >  guest check-in
            --   ("old guest still there after new guest wants to arrive")
            --
            AND room_stays."CheckOutDate" > '2026-05-20 14:00:00'::timestamptz
    )

-- Step 3: Best rooms first (tier 1 before tier 3); smoking sort can come later
ORDER BY "PriorityTier";

-- ---------------------------------------------------------------------------
-- Why NOT EXISTS?
--   We only ask: "Did I find a bad stay?" SELECT 1 = yes, no columns needed.
--   If subquery returns a row → room is NOT available.
--   If subquery returns nothing → room IS available.
--
-- Timeline (room 2, existing stay May 22 2pm → May 24 11am):
--
--   Existing:  [====22 -------- 24====]
--   Guest:        [====20 ------------- 30====]
--   Overlap?     YES → room 2 should NOT appear in results.
--
-- Quick sanity cases (swap the two timestamps above and re-run):
--   Guest May 18 → May 22 11am  → NO overlap (old ends before new starts) → room shows
--   Guest May 25 → May 30        → NO overlap (old ends May 24)           → room shows
--   Guest May 20 → May 30        → YES overlap                            → 0 rows (only room 2)
-- ---------------------------------------------------------------------------

INSERT INTO guests (id, "IsIdVerified", "IsDNR", "AdminNotes")
VALUES ('00000000-0000-0000-0000-000000000001', true, false, 'Anonymous Walk In Guest');