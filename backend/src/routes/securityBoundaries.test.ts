import Fastify from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { registerApiAuthentication } from '../auth';
import paymentsRoutes from './payments';
import reservationsRoutes from './reservations';

const originalEnvironment = {
    DATABASE_URL: process.env.DATABASE_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STAFF_API_KEY: process.env.STAFF_API_KEY,
    IMPORT_API_KEY: process.env.IMPORT_API_KEY,
    PUBLIC_BOOKING_PAUSED: process.env.PUBLIC_BOOKING_PAUSED,
};

describe('route security boundaries', () => {
    beforeAll(() => {
        process.env.DATABASE_URL = 'postgresql://unused:unused@127.0.0.1:1/unused';
        process.env.STRIPE_SECRET_KEY = 'stripe-test-placeholder';
        process.env.STAFF_API_KEY = 'staff-test-key';
        process.env.IMPORT_API_KEY = 'import-test-key';
        process.env.PUBLIC_BOOKING_PAUSED = 'false';
    });

    afterAll(() => {
        for (const [key, value] of Object.entries(originalEnvironment)) {
            if (value === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = value;
            }
        }
    });

    it('rejects anonymous access before a staff reservation query runs', async () => {
        const app = Fastify({
            ajv: { customOptions: { removeAdditional: false } },
        });
        registerApiAuthentication(app);
        await app.register(reservationsRoutes);

        const response = await app.inject({
            method: 'GET',
            url: '/api/reservations/unassigned',
        });
        await app.close();

        expect(response.statusCode).toBe(401);
    });

    it('rejects an import that merely claims an unpaid booking should be paid', async () => {
        const app = Fastify();
        registerApiAuthentication(app);
        await app.register(reservationsRoutes);

        const response = await app.inject({
            method: 'POST',
            url: '/api/reservations/import',
            headers: { authorization: 'Bearer import-test-key' },
            payload: {
                guest: { id: 'guest-id' },
                reservation: {
                    id: 'reservation-id',
                    GuestId: 'guest-id',
                    BookingSource: 'DirectWeb',
                    PaymentStatus: 'Unpaid',
                    Status: 'Active',
                },
                stay: {
                    id: 'stay-id',
                    ReservationId: 'reservation-id',
                    RoomId: 1,
                    RoomStayStatus: 'Confirmed',
                    CheckInDate: '2026-09-01T00:00:00.000Z',
                    CheckOutDate: '2026-09-02T00:00:00.000Z',
                    NumberOfGuests: 1,
                    PetCount: 0,
                    AdditionalFees: '0.00',
                    DiscountAmount: '0.00',
                    RoomSubTotal: '70.00',
                    RoomTaxAmount: '10.00',
                    RoomTotalAmount: '80.00',
                },
            },
        });
        await app.close();

        expect(response.statusCode).toBe(400);
    });

    it('rejects client-supplied payment amounts at schema validation', async () => {
        const app = Fastify({
            ajv: { customOptions: { removeAdditional: false } },
        });
        await app.register(paymentsRoutes);

        const response = await app.inject({
            method: 'POST',
            url: '/api/payments/intent',
            payload: {
                reservationId: 'reservation-id',
                Amount: 1,
            },
        });
        await app.close();

        expect(response.statusCode).toBe(400);
    });
});
