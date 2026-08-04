import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import roomsRoutes from './rooms';
import { db } from '../db/client';
import { roomsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

describe('PUT /api/rooms/:id (cleanStatus & room details)', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = Fastify();
        app.register(roomsRoutes);
        await app.ready();
    });

    afterEach(async () => {
        // Reset after every test — prevents OutOfOrder/NotRented bleeding into availability.test.ts
        await db.update(roomsTable).set({ cleanStatus: 'Clean', PriorityTier: 1, ConditionNotes: null }).where(eq(roomsTable.id, 1));
    });

    afterAll(async () => {
        await app.close();
    });

    it('updates cleanStatus to OutOfOrder', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: '/api/rooms/1',
            payload: { cleanStatus: 'OutOfOrder' },
        });
        expect(response.statusCode).toBe(200);

        const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, 1));
        expect(room.cleanStatus).toBe('OutOfOrder');
    });

    it('updates cleanStatus to NotRented', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: '/api/rooms/1',
            payload: { cleanStatus: 'NotRented' },
        });
        expect(response.statusCode).toBe(200);

        const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, 1));
        expect(room.cleanStatus).toBe('NotRented');
    });

    it('rejects invalid cleanStatus string with 400', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: '/api/rooms/1',
            payload: { cleanStatus: 'InvalidStatus' },
        });
        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.message).toContain('Invalid cleanStatus');
    });

    it('updates priorityTier, conditionNotes, and cleanStatus together', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: '/api/rooms/1',
            payload: { priorityTier: 2, conditionNotes: 'AC noisy', cleanStatus: 'Clean' },
        });
        expect(response.statusCode).toBe(200);

        const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, 1));
        expect(room.PriorityTier).toBe(2);
        expect(room.ConditionNotes).toBe('AC noisy');
        expect(room.cleanStatus).toBe('Clean');
    });
});
