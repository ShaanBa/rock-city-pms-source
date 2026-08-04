import Fastify from "fastify";
import rawBody from 'fastify-raw-body';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import roomsRoutes from "./routes/rooms";
import reservationsRoutes from "./routes/reservations";
import roomStaysRoutes from "./routes/roomStays";
import paymentsRoutes from "./routes/payments";
import pricingRoutes from "./routes/pricing";
import publicRoutes from "./routes/public";
import { registerApiAuthentication } from "./auth";

const port = Number(process.env.PORT) || 3000

const fastify = Fastify({
    logger: true,
    bodyLimit: Number(process.env.REQUEST_BODY_LIMIT_BYTES) || 64 * 1024,
    ajv: {
        customOptions: {
            removeAdditional: false,
        },
    },
});

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

fastify.register(cors, {
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});

fastify.register(rateLimit, {
    global: true,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',
});

fastify.register(rawBody, {
    field: 'rawBody',
    global: true,
    encoding: 'utf8',
    runFirst: true
});

registerApiAuthentication(fastify);

fastify.register(roomsRoutes);
fastify.register(reservationsRoutes);
fastify.register(roomStaysRoutes);
fastify.register(paymentsRoutes);
fastify.register(pricingRoutes);
fastify.register(publicRoutes);

fastify.get('/health', function (request, reply) {
    reply.send({ "ok": true });
});

const start = async () => {
    await fastify.listen({ port, host: '0.0.0.0' }, (err, address) => {
        if (err) throw err;
        console.log(`Server listening on ${address}`);
    });
};

start();