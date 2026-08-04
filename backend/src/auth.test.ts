import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { registerApiAuthentication } from './auth';

const originalStaffKey = process.env.STAFF_API_KEY;
const originalImportKey = process.env.IMPORT_API_KEY;

function buildTestApp() {
    const app = Fastify();
    registerApiAuthentication(app);
    app.get('/health', async () => ({ ok: true }));
    app.get('/api/public/availability', async () => ({ availableRooms: [] }));
    app.get('/api/rooms', async () => ({ rooms: [] }));
    app.post('/api/reservations/import', async () => ({ imported: true }));
    return app;
}

describe('API authentication', () => {
    beforeEach(() => {
        process.env.STAFF_API_KEY = 'staff-test-key';
        process.env.IMPORT_API_KEY = 'import-test-key';
    });

    afterEach(() => {
        process.env.STAFF_API_KEY = originalStaffKey;
        process.env.IMPORT_API_KEY = originalImportKey;
    });

    it('keeps deliberately public routes anonymous', async () => {
        const app = buildTestApp();
        const health = await app.inject({ method: 'GET', url: '/health' });
        const availability = await app.inject({ method: 'GET', url: '/api/public/availability' });
        await app.close();

        expect(health.statusCode).toBe(200);
        expect(availability.statusCode).toBe(200);
    });

    it('rejects anonymous staff API requests', async () => {
        const app = buildTestApp();
        const response = await app.inject({ method: 'GET', url: '/api/rooms' });
        await app.close();

        expect(response.statusCode).toBe(401);
        expect(response.headers['www-authenticate']).toBe('Bearer');
    });

    it('accepts the configured staff API key', async () => {
        const app = buildTestApp();
        const response = await app.inject({
            method: 'GET',
            url: '/api/rooms',
            headers: { authorization: 'Bearer staff-test-key' },
        });
        await app.close();

        expect(response.statusCode).toBe(200);
    });

    it('requires the separate import key for reservation imports', async () => {
        const app = buildTestApp();
        const staffResponse = await app.inject({
            method: 'POST',
            url: '/api/reservations/import',
            headers: { authorization: 'Bearer staff-test-key' },
        });
        const importResponse = await app.inject({
            method: 'POST',
            url: '/api/reservations/import',
            headers: { authorization: 'Bearer import-test-key' },
        });
        await app.close();

        expect(staffResponse.statusCode).toBe(401);
        expect(importResponse.statusCode).toBe(200);
    });

    it('fails closed when a protected tier has no configured key', async () => {
        delete process.env.STAFF_API_KEY;
        const app = buildTestApp();
        const response = await app.inject({ method: 'GET', url: '/api/rooms' });
        await app.close();

        expect(response.statusCode).toBe(503);
    });
});
