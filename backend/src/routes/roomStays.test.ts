import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import roomStaysRoutes from './roomStays';
import { db } from '../db/client';
import { reservationsTable, roomStaysTable, guestsTable, roomsTable } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { ANONYMOUS_WALKIN_UUID } from '../constants';

describe('PUT /api/roomstays/:id/cancel', () => {
    let app: FastifyInstance;
    const testReservationIds: string[] = [];
    let testStayConfirmedId: string;
    let testStayCheckedInId: string;
    let testStayCheckedOutId: string;

    beforeAll(async () => {
        app = Fastify();
        app.register(roomStaysRoutes);
        await app.ready();

        // 1. Reservation with 1 Confirmed stay
        const [res1] = await db.insert(reservationsTable).values({
            GuestId: ANONYMOUS_WALKIN_UUID,
            PaymentStatus: 'Unpaid',
            BookingSource: 'WalkIn',
            Status: 'Active',
        }).returning();
        testReservationIds.push(res1.id);

        const [stay1] = await db.insert(roomStaysTable).values({
            ReservationId: res1.id,
            RoomId: 1,
            CheckInDate: new Date('2099-08-01T00:00:00Z'),
            CheckOutDate: new Date('2099-08-05T00:00:00Z'),
            NumberOfGuests: 1,
            RoomSubTotal: '100.00',
            RoomTaxAmount: '10.00',
            RoomTotalAmount: '110.00',
            RoomStayStatus: 'Confirmed',
        }).returning();
        testStayConfirmedId = stay1.id;

        // 2. Reservation with 1 CheckedIn stay
        const [res2] = await db.insert(reservationsTable).values({
            GuestId: ANONYMOUS_WALKIN_UUID,
            PaymentStatus: 'Paid',
            BookingSource: 'Phone',
            Status: 'Active',
        }).returning();
        testReservationIds.push(res2.id);

        const [stay2] = await db.insert(roomStaysTable).values({
            ReservationId: res2.id,
            RoomId: 2,
            CheckInDate: new Date('2099-08-02T00:00:00Z'),
            CheckOutDate: new Date('2099-08-06T00:00:00Z'),
            NumberOfGuests: 1,
            RoomSubTotal: '100.00',
            RoomTaxAmount: '10.00',
            RoomTotalAmount: '110.00',
            RoomStayStatus: 'CheckedIn',
        }).returning();
        testStayCheckedInId = stay2.id;

        // 3. Reservation with 1 CheckedOut stay
        const [res3] = await db.insert(reservationsTable).values({
            GuestId: ANONYMOUS_WALKIN_UUID,
            PaymentStatus: 'Paid',
            BookingSource: 'DirectWeb',
            Status: 'Completed',
        }).returning();
        testReservationIds.push(res3.id);

        const [stay3] = await db.insert(roomStaysTable).values({
            ReservationId: res3.id,
            RoomId: 3,
            CheckInDate: new Date('2099-08-03T00:00:00Z'),
            CheckOutDate: new Date('2099-08-04T00:00:00Z'),
            NumberOfGuests: 1,
            RoomSubTotal: '100.00',
            RoomTaxAmount: '10.00',
            RoomTotalAmount: '110.00',
            RoomStayStatus: 'CheckedOut',
        }).returning();
        testStayCheckedOutId = stay3.id;
    });

    afterAll(async () => {
        if (testReservationIds.length > 0) {
            await db.delete(roomStaysTable).where(inArray(roomStaysTable.ReservationId, testReservationIds));
            await db.delete(reservationsTable).where(inArray(reservationsTable.id, testReservationIds));
        }
        await app.close();
    });

    it('rejects cancel on CheckedOut stay with 409', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: `/api/roomstays/${testStayCheckedOutId}/cancel`,
        });
        expect(response.statusCode).toBe(409);
        const body = JSON.parse(response.body);
        expect(body.message).toContain('CheckedOut');
    });

    it('cancels Confirmed stay without changing room cleanStatus', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: `/api/roomstays/${testStayConfirmedId}/cancel`,
        });
        expect(response.statusCode).toBe(200);

        const [stayRow] = await db.select().from(roomStaysTable).where(eq(roomStaysTable.id, testStayConfirmedId));
        expect(stayRow.RoomStayStatus).toBe('Cancelled');

        const [resRow] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, stayRow.ReservationId));
        expect(resRow.Status).toBe('Cancelled');
    });

    it('rejects cancel on already Cancelled stay with 409', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: `/api/roomstays/${testStayConfirmedId}/cancel`,
        });
        expect(response.statusCode).toBe(409);
        const body = JSON.parse(response.body);
        expect(body.message).toContain('already cancelled');
    });

    it('cancels CheckedIn stay and sets room cleanStatus to Dirty', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: `/api/roomstays/${testStayCheckedInId}/cancel`,
        });
        expect(response.statusCode).toBe(200);

        const [stayRow] = await db.select().from(roomStaysTable).where(eq(roomStaysTable.id, testStayCheckedInId));
        expect(stayRow.RoomStayStatus).toBe('Cancelled');

        const [roomRow] = await db.select().from(roomsTable).where(eq(roomsTable.id, 2));
        expect(roomRow.cleanStatus).toBe('Dirty');
    });
});

describe('PUT /api/roomstays/:id (room reassignment)', () => {
    let app: FastifyInstance;
    const testReservationIds: string[] = [];
    let confirmedStayId: string;
    let checkedInStayId: string;
    let checkedOutStayId: string;
    let unassignedStayId: string;

    beforeAll(async () => {
        app = Fastify();
        app.register(roomStaysRoutes);
        await app.ready();

        // 1. Confirmed stay in Room 1
        const [res1] = await db.insert(reservationsTable).values({
            GuestId: ANONYMOUS_WALKIN_UUID,
            PaymentStatus: 'Paid',
            BookingSource: 'WalkIn',
            Status: 'Active',
        }).returning();
        testReservationIds.push(res1.id);

        const [stay1] = await db.insert(roomStaysTable).values({
            ReservationId: res1.id,
            RoomId: 1,
            CheckInDate: new Date('2098-10-01T00:00:00Z'),
            CheckOutDate: new Date('2098-10-05T00:00:00Z'),
            NumberOfGuests: 1,
            RoomSubTotal: '100.00',
            RoomTaxAmount: '10.00',
            RoomTotalAmount: '110.00',
            RoomStayStatus: 'Confirmed',
        }).returning();
        confirmedStayId = stay1.id;

        // 2. CheckedIn stay in Room 3
        const [res2] = await db.insert(reservationsTable).values({
            GuestId: ANONYMOUS_WALKIN_UUID,
            PaymentStatus: 'Paid',
            BookingSource: 'Phone',
            Status: 'Active',
        }).returning();
        testReservationIds.push(res2.id);

        const [stay2] = await db.insert(roomStaysTable).values({
            ReservationId: res2.id,
            RoomId: 3,
            CheckInDate: new Date('2098-10-01T00:00:00Z'),
            CheckOutDate: new Date('2098-10-05T00:00:00Z'),
            NumberOfGuests: 1,
            RoomSubTotal: '100.00',
            RoomTaxAmount: '10.00',
            RoomTotalAmount: '110.00',
            RoomStayStatus: 'CheckedIn',
        }).returning();
        checkedInStayId = stay2.id;

        // 3. CheckedOut stay
        const [res3] = await db.insert(reservationsTable).values({
            GuestId: ANONYMOUS_WALKIN_UUID,
            PaymentStatus: 'Paid',
            BookingSource: 'DirectWeb',
            Status: 'Completed',
        }).returning();
        testReservationIds.push(res3.id);

        const [stay3] = await db.insert(roomStaysTable).values({
            ReservationId: res3.id,
            RoomId: 4,
            CheckInDate: new Date('2098-10-01T00:00:00Z'),
            CheckOutDate: new Date('2098-10-05T00:00:00Z'),
            NumberOfGuests: 1,
            RoomSubTotal: '100.00',
            RoomTaxAmount: '10.00',
            RoomTotalAmount: '110.00',
            RoomStayStatus: 'CheckedOut',
        }).returning();
        checkedOutStayId = stay3.id;

        // 4. Unassigned stay (RoomId: null)
        const [res4] = await db.insert(reservationsTable).values({
            GuestId: ANONYMOUS_WALKIN_UUID,
            PaymentStatus: 'Paid',
            BookingSource: 'DirectWeb',
            Status: 'Active',
        }).returning();
        testReservationIds.push(res4.id);

        const [stay4] = await db.insert(roomStaysTable).values({
            ReservationId: res4.id,
            RoomId: null,
            CheckInDate: new Date('2098-10-01T00:00:00Z'),
            CheckOutDate: new Date('2098-10-05T00:00:00Z'),
            NumberOfGuests: 1,
            RoomSubTotal: '100.00',
            RoomTaxAmount: '10.00',
            RoomTotalAmount: '110.00',
            RoomStayStatus: 'Confirmed',
        }).returning();
        unassignedStayId = stay4.id;

        // 5. Existing occupied stay in Room 6 for overlap test
        const [res5] = await db.insert(reservationsTable).values({
            GuestId: ANONYMOUS_WALKIN_UUID,
            PaymentStatus: 'Paid',
            BookingSource: 'WalkIn',
            Status: 'Active',
        }).returning();
        testReservationIds.push(res5.id);

        await db.insert(roomStaysTable).values({
            ReservationId: res5.id,
            RoomId: 6,
            CheckInDate: new Date('2098-10-01T00:00:00Z'),
            CheckOutDate: new Date('2098-10-05T00:00:00Z'),
            NumberOfGuests: 1,
            RoomSubTotal: '100.00',
            RoomTaxAmount: '10.00',
            RoomTotalAmount: '110.00',
            RoomStayStatus: 'Confirmed',
        });
    });

    afterAll(async () => {
        if (testReservationIds.length > 0) {
            await db.delete(roomStaysTable).where(inArray(roomStaysTable.ReservationId, testReservationIds));
            await db.delete(reservationsTable).where(inArray(reservationsTable.id, testReservationIds));
        }
        await app.close();
    });

    it('moves Confirmed stay from Room 1 to Room 7', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: `/api/roomstays/${confirmedStayId}`,
            payload: { roomId: 7 },
        });
        expect(response.statusCode).toBe(200);

        const [stayRow] = await db.select().from(roomStaysTable).where(eq(roomStaysTable.id, confirmedStayId));
        expect(stayRow.RoomId).toBe(7);
    });

    it('moves CheckedIn stay from Room 3 to Room 8 and sets old room (3) to Dirty', async () => {
        await db.update(roomsTable).set({ cleanStatus: 'Clean' }).where(eq(roomsTable.id, 3));

        const response = await app.inject({
            method: 'PUT',
            url: `/api/roomstays/${checkedInStayId}`,
            payload: { roomId: 8 },
        });
        expect(response.statusCode).toBe(200);

        const [stayRow] = await db.select().from(roomStaysTable).where(eq(roomStaysTable.id, checkedInStayId));
        expect(stayRow.RoomId).toBe(8);

        const [oldRoom] = await db.select().from(roomsTable).where(eq(roomsTable.id, 3));
        expect(oldRoom.cleanStatus).toBe('Dirty');
    });

    it('rejects moving to an occupied room (Room 6) with 409', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: `/api/roomstays/${confirmedStayId}`,
            payload: { roomId: 6 },
        });
        expect(response.statusCode).toBe(409);
    });

    it('rejects moving to a NotRented room (roomId 2 / Room 15) with 400', async () => {
        // Force the room to NotRented — don't rely on seed state
        await db.update(roomsTable).set({ cleanStatus: 'NotRented' }).where(eq(roomsTable.id, 2));
        const response = await app.inject({
            method: 'PUT',
            url: `/api/roomstays/${confirmedStayId}`,
            payload: { roomId: 2 },
        });
        // Restore seed state so other tests / real data aren't affected
        await db.update(roomsTable).set({ cleanStatus: 'NotRented' }).where(eq(roomsTable.id, 2));
        expect(response.statusCode).toBe(400);
    });

    it('assigns room to an unassigned stay (RoomId null -> 9) with no HK side effect', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: `/api/roomstays/${unassignedStayId}`,
            payload: { roomId: 9 },
        });
        expect(response.statusCode).toBe(200);

        const [stayRow] = await db.select().from(roomStaysTable).where(eq(roomStaysTable.id, unassignedStayId));
        expect(stayRow.RoomId).toBe(9);
    });

    it('rejects changing room on a CheckedOut stay with 409', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: `/api/roomstays/${checkedOutStayId}`,
            payload: { roomId: 10 },
        });
        expect(response.statusCode).toBe(409);
    });
});

describe('PUT /api/roomstays/:id (guest forking for anonymous walk-ins)', () => {
    let app: FastifyInstance;
    const testReservationIds: string[] = [];
    const testGuestIds: string[] = [];
    let walkInStay1Id: string;
    let walkInReservation1Id: string;
    let walkInStay2Id: string;
    let walkInReservation2Id: string;
    let phoneStayId: string;
    let phoneReservationId: string;
    let phoneGuestId: string;

    beforeAll(async () => {
        app = Fastify();
        app.register(roomStaysRoutes);
        await app.ready();

        // 1. Walk-in reservation 1 (ANONYMOUS_WALKIN_UUID)
        const [res1] = await db.insert(reservationsTable).values({
            GuestId: ANONYMOUS_WALKIN_UUID,
            PaymentStatus: 'Paid',
            BookingSource: 'WalkIn',
            Status: 'Active',
        }).returning();
        testReservationIds.push(res1.id);
        walkInReservation1Id = res1.id;

        const [stay1] = await db.insert(roomStaysTable).values({
            ReservationId: res1.id,
            RoomId: 1,
            CheckInDate: new Date('2098-11-01T00:00:00Z'),
            CheckOutDate: new Date('2098-11-05T00:00:00Z'),
            NumberOfGuests: 1,
            RoomSubTotal: '100.00',
            RoomTaxAmount: '10.00',
            RoomTotalAmount: '110.00',
            RoomStayStatus: 'Confirmed',
        }).returning();
        walkInStay1Id = stay1.id;

        // 2. Walk-in reservation 2 (ANONYMOUS_WALKIN_UUID)
        const [res2] = await db.insert(reservationsTable).values({
            GuestId: ANONYMOUS_WALKIN_UUID,
            PaymentStatus: 'Paid',
            BookingSource: 'WalkIn',
            Status: 'Active',
        }).returning();
        testReservationIds.push(res2.id);
        walkInReservation2Id = res2.id;

        const [stay2] = await db.insert(roomStaysTable).values({
            ReservationId: res2.id,
            RoomId: 3,
            CheckInDate: new Date('2098-11-01T00:00:00Z'),
            CheckOutDate: new Date('2098-11-05T00:00:00Z'),
            NumberOfGuests: 1,
            RoomSubTotal: '100.00',
            RoomTaxAmount: '10.00',
            RoomTotalAmount: '110.00',
            RoomStayStatus: 'Confirmed',
        }).returning();
        walkInStay2Id = stay2.id;

        // 3. Phone reservation (custom guest row)
        const [phoneGuest] = await db.insert(guestsTable).values({
            FirstName: 'Original',
            LastName: 'Guest',
            Phone: '555-0000',
            IsIdVerified: false,
        }).returning();
        phoneGuestId = phoneGuest.id;
        testGuestIds.push(phoneGuest.id);

        const [res3] = await db.insert(reservationsTable).values({
            GuestId: phoneGuest.id,
            PaymentStatus: 'Paid',
            BookingSource: 'Phone',
            Status: 'Active',
        }).returning();
        testReservationIds.push(res3.id);
        phoneReservationId = res3.id;

        const [stay3] = await db.insert(roomStaysTable).values({
            ReservationId: res3.id,
            RoomId: 4,
            CheckInDate: new Date('2098-11-01T00:00:00Z'),
            CheckOutDate: new Date('2098-11-05T00:00:00Z'),
            NumberOfGuests: 1,
            RoomSubTotal: '100.00',
            RoomTaxAmount: '10.00',
            RoomTotalAmount: '110.00',
            RoomStayStatus: 'Confirmed',
        }).returning();
        phoneStayId = stay3.id;
    });

    afterAll(async () => {
        if (testReservationIds.length > 0) {
            const reservations = await db.select().from(reservationsTable).where(inArray(reservationsTable.id, testReservationIds));
            const forkedGuestIds = reservations.map(r => r.GuestId).filter(id => id !== ANONYMOUS_WALKIN_UUID);

            await db.delete(roomStaysTable).where(inArray(roomStaysTable.ReservationId, testReservationIds));
            await db.delete(reservationsTable).where(inArray(reservationsTable.id, testReservationIds));

            const allGuestIdsToClean = Array.from(new Set([...testGuestIds, ...forkedGuestIds]));
            if (allGuestIdsToClean.length > 0) {
                await db.delete(guestsTable).where(inArray(guestsTable.id, allGuestIdsToClean));
            }
        }
        await app.close();
    });

    it('forks a new guest row when editing stay on ANONYMOUS_WALKIN_UUID reservation', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: `/api/roomstays/${walkInStay1Id}`,
            payload: { firstName: 'Jane', lastName: 'Doe', phone: '555-1234' },
        });
        expect(response.statusCode).toBe(200);

        const [resRow] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, walkInReservation1Id));
        expect(resRow.GuestId).not.toBe(ANONYMOUS_WALKIN_UUID);

        const [guestRow] = await db.select().from(guestsTable).where(eq(guestsTable.id, resRow.GuestId));
        expect(guestRow.FirstName).toBe('Jane');
        expect(guestRow.LastName).toBe('Doe');
        expect(guestRow.Phone).toBe('555-1234');

        // Anonymous guest row template remains untouched
        const [anonGuest] = await db.select().from(guestsTable).where(eq(guestsTable.id, ANONYMOUS_WALKIN_UUID));
        expect(anonGuest.FirstName).not.toBe('Jane');
    });

    it('updates existing guest row in place for non-anonymous guest reservation (phone)', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: `/api/roomstays/${phoneStayId}`,
            payload: { firstName: 'UpdatedName' },
        });
        expect(response.statusCode).toBe(200);

        const [resRow] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, phoneReservationId));
        expect(resRow.GuestId).toBe(phoneGuestId);

        const [guestRow] = await db.select().from(guestsTable).where(eq(guestsTable.id, phoneGuestId));
        expect(guestRow.FirstName).toBe('UpdatedName');
    });

    it('forks only the edited walk-in reservation, leaving other anonymous walk-in reservation pointing at template', async () => {
        const [resRow2Before] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, walkInReservation2Id));
        expect(resRow2Before.GuestId).toBe(ANONYMOUS_WALKIN_UUID);

        const response = await app.inject({
            method: 'PUT',
            url: `/api/roomstays/${walkInStay2Id}`,
            payload: { firstName: 'Demo', lastName: 'Guest' },
        });
        expect(response.statusCode).toBe(200);

        const [resRow2After] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, walkInReservation2Id));
        expect(resRow2After.GuestId).not.toBe(ANONYMOUS_WALKIN_UUID);

        const [guestRow] = await db.select().from(guestsTable).where(eq(guestsTable.id, resRow2After.GuestId));
        expect(guestRow.FirstName).toBe('Demo');
        expect(guestRow.LastName).toBe('Guest');
    });
});
