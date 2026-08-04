import { FastifyInstance, FastifyRequest } from 'fastify';
import Stripe from 'stripe';
import { db } from '../db/client';
import { guestsTable, paymentsTable, reservationsTable, roomStaysTable } from '../db/schema';
import { and, eq } from 'drizzle-orm';
import { isPublicBookingPaused, sendBookingPaused } from '../utils/bookingGate';
import { notifyStaffOnBooking } from '../utils/notifyStaffOnBooking';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

interface PaymentIntentRequest {
    reservationId: string;
}

export default async function paymentsRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: PaymentIntentRequest }>('/api/payments/intent', {
        bodyLimit: 8 * 1024,
        config: {
            rateLimit: {
                max: Number(process.env.PAYMENT_RATE_LIMIT_MAX) || 20,
                timeWindow: '1 minute',
            },
        },
        schema: {
            body: {
                type: 'object',
                additionalProperties: false,
                required: ['reservationId'],
                properties: {
                    reservationId: { type: 'string', minLength: 1, maxLength: 64 },
                },
            },
        },
    }, async function (request, reply) {
        if (isPublicBookingPaused()) {
            sendBookingPaused(reply)
            return
        }
        const reservationId = request.body.reservationId;

        const [booking] = await db.select({
            paymentStatus: reservationsTable.PaymentStatus,
            bookingSource: reservationsTable.BookingSource,
            reservationStatus: reservationsTable.Status,
            stayStatus: roomStaysTable.RoomStayStatus,
            totalAmount: roomStaysTable.RoomTotalAmount,
        })
            .from(reservationsTable)
            .innerJoin(roomStaysTable, eq(roomStaysTable.ReservationId, reservationsTable.id))
            .where(and(
                eq(reservationsTable.id, reservationId),
                eq(reservationsTable.BookingSource, 'DirectWeb'),
            ))
            .limit(1);

        if (!booking) {
            return reply.status(404).send({ error: 'Reservation not found' });
        }
        if (
            booking.paymentStatus !== 'Unpaid'
            || booking.reservationStatus !== 'Active'
            || booking.stayStatus !== 'Confirmed'
        ) {
            return reply.status(409).send({ error: 'Reservation is not payable' });
        }

        const amount = Math.round(Number(booking.totalAmount) * 100);
        if (!Number.isSafeInteger(amount) || amount < 50) {
            request.log.error({ reservationId }, 'Reservation has an invalid payable amount');
            return reply.status(500).send({ error: 'Reservation total is invalid' });
        }

        const paymentIntent = await stripe.paymentIntents.create(
            {
                amount: amount,
                currency: 'usd',
                metadata: { reservationId }
            },
            {
                idempotencyKey: `reservation-payment-${reservationId}`,
            }
        );
        return reply.send({
            clientSecret: paymentIntent.client_secret
        });
    });

    fastify.post('/api/webhooks/stripe', { config: { rawBody: true } }, async function (request, reply) {
        try {
            const sig = request.headers['stripe-signature'];
            if (!sig) {
                return reply.status(400).send({ error: 'Missing stripe-signature header' });
            }
            const event = stripe.webhooks.constructEvent(request.rawBody as string, sig as string, process.env.STRIPE_WEBHOOK_SECRET as string);
            if (event.type === 'payment_intent.succeeded') {
                const paymentIntent = event.data.object as any;
                const paymentIntentId = paymentIntent.id;
                const existing = await db.select()
                    .from(paymentsTable)
                    .where(eq(paymentsTable.StripeChargeId, paymentIntentId));
                if (existing.length > 0) {
                    return reply.status(200).send({ received: true });
                }
                const reservationId = paymentIntent.metadata?.reservationId;
                if (!reservationId) {
                    return reply.status(400).send({ error: 'Missing metadata.reservationId on PaymentIntent' });
                }
                const [reservation] = await db.select()
                    .from(reservationsTable)
                    .where(eq(reservationsTable.id, reservationId));
                if (!reservation) {
                    return reply.status(400).send({ error: `Reservation not found: ${reservationId}` });
                }
                await db.update(reservationsTable)
                    .set({ PaymentStatus: 'Paid' })
                    .where(eq(reservationsTable.id, reservationId));

                await db.insert(paymentsTable)
                    .values({
                        ReservationId: reservationId,
                        Amount: (paymentIntent.amount / 100).toString(),
                        TransactionType: 'Charge',
                        PaymentMethod: 'Stripe',
                        PayerType: 'Guest',
                        StripeChargeId: paymentIntentId,
                    });

                const [bookingDetails] = await db.select()
                    .from(reservationsTable)
                    .innerJoin(guestsTable, eq(reservationsTable.GuestId, guestsTable.id))
                    .innerJoin(roomStaysTable, eq(reservationsTable.id, roomStaysTable.ReservationId))
                    .where(eq(reservationsTable.id, reservationId))

                if (bookingDetails && bookingDetails.reservations.BookingSource === 'DirectWeb') {
                    try {
                        const first = bookingDetails.guests?.FirstName || ""
                        const last = bookingDetails.guests?.LastName || ""
                        const fullname = `${first} ${last}`.trim() || "Guest"
                        await notifyStaffOnBooking(fullname, bookingDetails.reservations.RequestedRoomType ?? 'Unknown', bookingDetails.room_stays.CheckInDate, bookingDetails.room_stays.CheckOutDate)
                    } catch (error) {
                        request.log.error(error);
                    }
                }
            }
        } catch (error) {
            request.log.error(error);
            return reply.status(400).send({ error: 'Webhook signature verification failed' });
        }

        return reply.status(200).send({ received: true });
    });
}
