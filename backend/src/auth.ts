import { timingSafeEqual } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

type AuthTier = 'public' | 'staff' | 'import';

function authTierFor(request: FastifyRequest): AuthTier {
    if (request.method === 'OPTIONS') return 'public';

    const path = request.url.split('?', 1)[0];
    if (
        path === '/health'
        || path.startsWith('/api/public/')
        || (request.method === 'POST' && path === '/api/payments/intent')
        || (request.method === 'POST' && path === '/api/webhooks/stripe')
    ) {
        return 'public';
    }

    if (request.method === 'POST' && path === '/api/reservations/import') {
        return 'import';
    }

    return path.startsWith('/api/') ? 'staff' : 'public';
}

function bearerToken(request: FastifyRequest): string | undefined {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) return undefined;
    return authorization.slice('Bearer '.length).trim();
}

function securelyEqual(actual: string | undefined, expected: string): boolean {
    if (!actual) return false;
    const actualBuffer = Buffer.from(actual);
    const expectedBuffer = Buffer.from(expected);
    return actualBuffer.length === expectedBuffer.length
        && timingSafeEqual(actualBuffer, expectedBuffer);
}

async function rejectUnauthorized(
    request: FastifyRequest,
    reply: FastifyReply,
    environmentVariable: 'STAFF_API_KEY' | 'IMPORT_API_KEY',
) {
    const expected = process.env[environmentVariable];
    if (!expected) {
        request.log.error(`${environmentVariable} is not configured`);
        return reply.status(503).send({ error: 'Protected API is not configured' });
    }

    if (!securelyEqual(bearerToken(request), expected)) {
        return reply
            .header('WWW-Authenticate', 'Bearer')
            .status(401)
            .send({ error: 'Unauthorized' });
    }
}

export function registerApiAuthentication(fastify: FastifyInstance) {
    fastify.addHook('onRequest', async (request, reply) => {
        const tier = authTierFor(request);
        if (tier === 'staff') {
            return rejectUnauthorized(request, reply, 'STAFF_API_KEY');
        }
        if (tier === 'import') {
            return rejectUnauthorized(request, reply, 'IMPORT_API_KEY');
        }
    });
}

export const authInternals = { authTierFor, securelyEqual };
