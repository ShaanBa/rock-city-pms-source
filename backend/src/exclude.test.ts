import { describe, it, expect, afterEach } from 'vitest';
import { db } from './db/client';
import { reservationsTable, roomStaysTable } from './db/schema';
import { inArray } from 'drizzle-orm';
import { ANONYMOUS_WALKIN_UUID } from './constants';

/**
 * Ticket 25 — Step 5: prove the DB EXCLUDE guardrail rejects overlapping active stays.
 * Uses far-future dates so we don't collide with seed/production bookings.
 */
const TEST_ROOM_ID = 1;
const CHECK_IN = new Date('2099-06-01T00:00:00');
const CHECK_OUT = new Date('2099-06-03T00:00:00');

describe('EXCLUDE constraint (no_overlapping_active_stays)', () => {
    const reservationIds: string[] = [];

    afterEach(async () => {
        if (reservationIds.length === 0) return;
        await db.delete(roomStaysTable).where(inArray(roomStaysTable.ReservationId, reservationIds));
        await db.delete(reservationsTable).where(inArray(reservationsTable.id, reservationIds));
        reservationIds.length = 0;
    });

    async function createReservation() {
        const [reservation] = await db.insert(reservationsTable).values({
            GuestId: ANONYMOUS_WALKIN_UUID,
            PaymentStatus: 'Paid',
            BookingSource: 'WalkIn',
            Status: 'Active',
        }).returning();
        reservationIds.push(reservation.id);
        return reservation;
    }

    async function insertActiveStay(reservationId: string) {
        await db.insert(roomStaysTable).values({
            ReservationId: reservationId,
            RoomId: TEST_ROOM_ID,
            CheckInDate: CHECK_IN,
            CheckOutDate: CHECK_OUT,
            NumberOfGuests: 1,
            RoomSubTotal: '100.00',
            RoomTaxAmount: '13.50',
            RoomTotalAmount: '113.50',
            RoomStayStatus: 'CheckedIn',
        });
    }

    it('rejects a second overlapping active stay on the same room (Postgres 23P01)', async () => {
        const first = await createReservation();
        await insertActiveStay(first.id);

        const second = await createReservation();

        await expect(insertActiveStay(second.id)).rejects.toSatisfy((error: unknown) => {
            const pgCode = (error as { cause?: { code?: string } }).cause?.code
                ?? (error as { code?: string }).code;
            return pgCode === '23P01';
        });
    });

    it('allows a second stay on the same room when the first is CheckedOut', async () => {
        const first = await createReservation();
        await db.insert(roomStaysTable).values({
            ReservationId: first.id,
            RoomId: TEST_ROOM_ID,
            CheckInDate: CHECK_IN,
            CheckOutDate: CHECK_OUT,
            NumberOfGuests: 1,
            RoomSubTotal: '100.00',
            RoomTaxAmount: '13.50',
            RoomTotalAmount: '113.50',
            RoomStayStatus: 'CheckedOut',
        });

        const second = await createReservation();
        await expect(insertActiveStay(second.id)).resolves.toBeUndefined();
    });
});
