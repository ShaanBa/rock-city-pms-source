import { FastifyInstance, FastifyRequest } from 'fastify';
import { db } from '../db/client';
import { roomsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { differenceInCalendarDays } from 'date-fns';
import { calculateStayPrice } from '../pricing';
import { validateAndParseDates } from '../utils/dateValidation';

interface AnonStay {
    roomId: number;
    checkInDate: string;
    checkOutDate: string;
    numberOfGuests: number;
    petCount: number;
    additionalFees: number;
    discountAmount: number;
    paymentMethod: 'Cash' | 'PhysicalCreditCard';
}

export default async function pricingRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: AnonStay }>('/api/pricing/calculate', async function (request, reply) {
        const dateCheck = validateAndParseDates(request.body.checkInDate, request.body.checkOutDate);
        if (!dateCheck.isValid) {
            reply.status(400).send({ error: dateCheck.error });
            return;
        }
        const roomId = request.body.roomId;
        const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, roomId));
        const basePrice = room.BasePrice;
        let extraFees = request.body.additionalFees;

        const numberOfGuests = request.body.numberOfGuests;

        const nights = differenceInCalendarDays(dateCheck.checkOut, dateCheck.checkIn);

        const petCount = request.body.petCount;

        const discount = request.body.discountAmount;

        const { roomSubTotal, additionalFees, roomTaxAmount, roomTotalAmount } = calculateStayPrice(Number(basePrice), nights, petCount, extraFees, discount, numberOfGuests, room.RoomType);

        reply.status(200).send({ roomSubTotal, additionalFees, roomTaxAmount, roomTotalAmount });
    });
}
