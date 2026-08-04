import { describe, it, expect, afterEach } from "vitest";
import { isAvailable, hasStayOverlap } from "./availability";
import { db } from "./db/client";
import { reservationsTable, roomStaysTable } from "./db/schema";
import { inArray } from "drizzle-orm";
import { ANONYMOUS_WALKIN_UUID } from "./constants";

const OVERLAP_ROOM_ID = 1;
const OVERLAP_CHECK_IN = new Date("2098-06-01T00:00:00");
const OVERLAP_CHECK_OUT = new Date("2098-06-03T00:00:00");

describe('isAvailable overlap detection', () => {
    const reservationIds: string[] = [];

    afterEach(async () => {
        if (reservationIds.length === 0) return;
        await db.delete(roomStaysTable).where(inArray(roomStaysTable.ReservationId, reservationIds));
        await db.delete(reservationsTable).where(inArray(reservationsTable.id, reservationIds));
        reservationIds.length = 0;
    });

    it('should exclude a room with an overlapping stay', async () => {
        const [reservation] = await db.insert(reservationsTable).values({
            GuestId: ANONYMOUS_WALKIN_UUID,
            PaymentStatus: 'Paid',
            BookingSource: 'WalkIn',
            Status: 'Active',
        }).returning();
        reservationIds.push(reservation.id);

        await db.insert(roomStaysTable).values({
            ReservationId: reservation.id,
            RoomId: OVERLAP_ROOM_ID,
            CheckInDate: new Date('2098-06-01T14:00:00'),
            CheckOutDate: new Date('2098-06-05T11:00:00'),
            NumberOfGuests: 1,
            RoomSubTotal: '100.00',
            RoomTaxAmount: '13.50',
            RoomTotalAmount: '113.50',
            RoomStayStatus: 'Confirmed',
        });

        const rooms = await isAvailable(new Date('2098-06-02T14:00:00'), new Date('2098-06-04T11:00:00'));
        expect(rooms.find((room) => room.id === OVERLAP_ROOM_ID)).toBeUndefined();
    });

    it('should include a room when dates do not overlap', async () => {
        const rooms = await isAvailable(new Date('2098-07-05T14:00:00'), new Date('2098-07-07T11:00:00'));
        expect(rooms.find((room) => room.id === OVERLAP_ROOM_ID)).toBeDefined();
    });
});

describe('hasStayOverlap helper', () => {
    const reservationIds: string[] = [];

    afterEach(async () => {
        if (reservationIds.length === 0) return;
        await db.delete(roomStaysTable).where(inArray(roomStaysTable.ReservationId, reservationIds));
        await db.delete(reservationsTable).where(inArray(reservationsTable.id, reservationIds));
        reservationIds.length = 0;
    });

    it('detects date overlaps for booked rooms', async () => {
        const [reservation] = await db.insert(reservationsTable).values({
            GuestId: ANONYMOUS_WALKIN_UUID,
            PaymentStatus: 'Paid',
            BookingSource: 'WalkIn',
            Status: 'Active',
        }).returning();
        reservationIds.push(reservation.id);

        await db.insert(roomStaysTable).values({
            ReservationId: reservation.id,
            RoomId: OVERLAP_ROOM_ID,
            CheckInDate: OVERLAP_CHECK_IN,
            CheckOutDate: OVERLAP_CHECK_OUT,
            NumberOfGuests: 1,
            RoomSubTotal: '100.00',
            RoomTaxAmount: '13.50',
            RoomTotalAmount: '113.50',
            RoomStayStatus: 'CheckedIn',
        });

        const hasOverlap = await hasStayOverlap(
            OVERLAP_ROOM_ID,
            new Date('2098-06-02T00:00:00'),
            new Date('2098-06-04T00:00:00'),
        );
        expect(hasOverlap).toBe(true);

        const noOverlap = await hasStayOverlap(
            OVERLAP_ROOM_ID,
            new Date('2098-06-05T00:00:00'),
            new Date('2098-06-07T00:00:00'),
        );
        expect(noOverlap).toBe(false);
    });

    it('ignores the stay being edited when excludeStayId is passed', async () => {
        const [reservation] = await db.insert(reservationsTable).values({
            GuestId: ANONYMOUS_WALKIN_UUID,
            PaymentStatus: 'Paid',
            BookingSource: 'WalkIn',
            Status: 'Active',
        }).returning();
        reservationIds.push(reservation.id);

        const [stay] = await db.insert(roomStaysTable).values({
            ReservationId: reservation.id,
            RoomId: OVERLAP_ROOM_ID,
            CheckInDate: OVERLAP_CHECK_IN,
            CheckOutDate: OVERLAP_CHECK_OUT,
            NumberOfGuests: 1,
            RoomSubTotal: '100.00',
            RoomTaxAmount: '13.50',
            RoomTotalAmount: '113.50',
            RoomStayStatus: 'Confirmed',
        }).returning();

        const noOverlap = await hasStayOverlap(
            OVERLAP_ROOM_ID,
            OVERLAP_CHECK_IN,
            OVERLAP_CHECK_OUT,
            stay.id,
        );
        expect(noOverlap).toBe(false);
    });
});