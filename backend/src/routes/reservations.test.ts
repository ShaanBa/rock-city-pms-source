import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import reservationsRoutes from './reservations';
import { db } from '../db/client';
import { reservationsTable, roomStaysTable, guestsTable, roomsTable } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { ANONYMOUS_WALKIN_UUID } from '../constants';

describe('GET /api/reservations', () => {
    let app: FastifyInstance;
    const testReservationIds: string[] = [];
    const testGuestIds: string[] = [];
    let room1Number = 14;

    beforeAll(async () => {
        app = Fastify();
        app.register(reservationsRoutes);
        await app.ready();

        // Check actual RoomNumber for RoomId 1
        const [r1] = await db.select().from(roomsTable).where(eq(roomsTable.id, 1));
        if (r1) {
            room1Number = r1.RoomNumber;
        }

        // Insert test guest
        const [guest] = await db.insert(guestsTable).values({
            FirstName: 'Sprint7TestGuestFirstName',
            LastName: 'Sprint7TestGuestLastName',
            Phone: '555-999-7777',
        }).returning();
        testGuestIds.push(guest.id);

        // Active / Confirmed stay
        const [res1] = await db.insert(reservationsTable).values({
            GuestId: guest.id,
            PaymentStatus: 'Paid',
            BookingSource: 'WalkIn',
            Status: 'Active',
        }).returning();
        testReservationIds.push(res1.id);

        await db.insert(roomStaysTable).values({
            ReservationId: res1.id,
            RoomId: 1,
            CheckInDate: new Date('2099-07-10T00:00:00Z'),
            CheckOutDate: new Date('2099-07-15T00:00:00Z'),
            NumberOfGuests: 2,
            RoomSubTotal: '200.00',
            RoomTaxAmount: '20.00',
            RoomTotalAmount: '220.00',
            RoomStayStatus: 'Confirmed',
        });

        // Cancelled stay
        const [res2] = await db.insert(reservationsTable).values({
            GuestId: ANONYMOUS_WALKIN_UUID,
            PaymentStatus: 'Unpaid',
            BookingSource: 'Phone',
            Status: 'Cancelled',
        }).returning();
        testReservationIds.push(res2.id);

        await db.insert(roomStaysTable).values({
            ReservationId: res2.id,
            RoomId: 2,
            CheckInDate: new Date('2099-07-12T00:00:00Z'),
            CheckOutDate: new Date('2099-07-14T00:00:00Z'),
            NumberOfGuests: 1,
            RoomSubTotal: '100.00',
            RoomTaxAmount: '10.00',
            RoomTotalAmount: '110.00',
            RoomStayStatus: 'Cancelled',
        });
    });

    afterAll(async () => {
        if (testReservationIds.length > 0) {
            await db.delete(roomStaysTable).where(inArray(roomStaysTable.ReservationId, testReservationIds));
            await db.delete(reservationsTable).where(inArray(reservationsTable.id, testReservationIds));
        }
        if (testGuestIds.length > 0) {
            await db.delete(guestsTable).where(inArray(guestsTable.id, testGuestIds));
        }
        await app.close();
    });

    it('returns stays matching date overlap range', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/reservations?from=2099-07-01&to=2099-07-31',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body).toHaveProperty('stays');
        expect(body).toHaveProperty('total');

        const found = body.stays.find((s: any) => s.reservationId === testReservationIds[0]);
        expect(found).toBeDefined();
        expect(found.guestName).toContain('Sprint7TestGuestFirstName');
        expect(found.guestPhone).toBe('555-999-7777');
        expect(found.roomNumber).toBe(room1Number);
    });

    it('excludes cancelled stays by default', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/reservations?from=2099-07-01&to=2099-07-31',
        });

        const body = JSON.parse(response.body);
        const cancelledStay = body.stays.find((s: any) => s.reservationId === testReservationIds[1]);
        expect(cancelledStay).toBeUndefined();
    });

    it('includes cancelled stays when showCancelled=true', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/reservations?from=2099-07-01&to=2099-07-31&showCancelled=true',
        });

        const body = JSON.parse(response.body);
        const cancelledStay = body.stays.find((s: any) => s.reservationId === testReservationIds[1]);
        expect(cancelledStay).toBeDefined();
        expect(cancelledStay.roomStayStatus).toBe('Cancelled');
    });

    it('filters by guest search parameter q', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/reservations?from=2099-07-01&to=2099-07-31&q=555-999-7777',
        });

        const body = JSON.parse(response.body);
        expect(body.stays.length).toBeGreaterThan(0);
        expect(body.stays[0].guestPhone).toBe('555-999-7777');
    });

    it('filters by room number', async () => {
        const response = await app.inject({
            method: 'GET',
            url: `/api/reservations?from=2099-07-01&to=2099-07-31&room=${room1Number}`,
        });

        const body = JSON.parse(response.body);
        expect(body.stays.length).toBeGreaterThan(0);
        expect(body.stays.every((s: any) => s.roomNumber === room1Number)).toBe(true);
    });
});
