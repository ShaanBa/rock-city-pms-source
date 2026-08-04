import { FastifyInstance, FastifyRequest } from 'fastify';
import { isAvailable } from '../availability';
import { db } from '../db/client';
import { guestsTable, reservationsTable, roomsTable, roomStaysTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { differenceInCalendarDays } from 'date-fns';
import { calculateStayPrice } from '../pricing';
import { validateAndParseDates } from '../utils/dateValidation';
import { isPublicBookingPaused, sendBookingPaused } from '../utils/bookingGate';
import type { GuestFacingRoom } from "./GuestFacingRoom"

interface AvailabilityQuery {
    checkIn: string
    checkOut: string
}

interface QuoteQuery {
    checkIn: string;
    checkOut: string;
    numberOfGuests: number;
    petCount: number;
    roomType: string;
}

interface CreateReservationBody {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    checkIn: string;
    checkOut: string;
    numberOfGuests: number;
    petCount: number;
    roomType: string;
}

export default async function publicRoutes(fastify: FastifyInstance) {
    fastify.get('/api/public/availability', {
        config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
        schema: {
            querystring: {
                type: 'object',
                additionalProperties: false,
                required: ['checkIn', 'checkOut'],
                properties: {
                    checkIn: { type: 'string', minLength: 8, maxLength: 40 },
                    checkOut: { type: 'string', minLength: 8, maxLength: 40 },
                },
            },
        },
    }, async function (request: FastifyRequest<{ Querystring: AvailabilityQuery }>, reply) {
        if (isPublicBookingPaused()) {
            sendBookingPaused(reply)
            return
        }
        const dateCheck = validateAndParseDates(request.query.checkIn, request.query.checkOut)
        if (!dateCheck.isValid) {
            reply.status(400).send({ error: dateCheck.error })
            return
        }
        let availableRooms = await isAvailable(dateCheck.checkIn, dateCheck.checkOut)
        availableRooms = availableRooms.filter(room => !room.IsSmoking);

        let groupedRooms: Record<string, typeof availableRooms> = {};
        for (const room of availableRooms) {
            if (!groupedRooms[room.RoomType]) {
                groupedRooms[room.RoomType] = [];
            }
            groupedRooms[room.RoomType].push(room);
        }


        const guestFacingRooms = Object.entries(groupedRooms).map(([type, roomInfo]) => {
            if (!roomInfo || roomInfo.length === 0) throw new Error('No rooms found!');
            return {
                roomType: type,
                basePrice: roomInfo[0].BasePrice,
                totalCount: roomInfo.length,
                isSmoking: roomInfo[0].IsSmoking,
            }
        })
        reply.send({ availableRooms: guestFacingRooms });
    }
    )

    fastify.get('/api/public/quote', {
        config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
        schema: {
            querystring: {
                type: 'object',
                additionalProperties: false,
                required: ['checkIn', 'checkOut', 'numberOfGuests', 'petCount', 'roomType'],
                properties: {
                    checkIn: { type: 'string', minLength: 8, maxLength: 40 },
                    checkOut: { type: 'string', minLength: 8, maxLength: 40 },
                    numberOfGuests: { type: 'integer', minimum: 1, maximum: 20 },
                    petCount: { type: 'integer', minimum: 0, maximum: 10 },
                    roomType: { type: 'string', minLength: 1, maxLength: 64 },
                },
            },
        },
    }, async function (request: FastifyRequest<{ Querystring: QuoteQuery }>, reply) {
        if (isPublicBookingPaused()) {
            sendBookingPaused(reply)
            return
        }
        const dateCheck = validateAndParseDates(request.query.checkIn, request.query.checkOut)
        if (!dateCheck.isValid) {
            reply.status(400).send({ error: dateCheck.error })
            return
        }

        if (isNaN(Number(request.query.petCount))) {
            reply.status(400).send({ error: 'Number of pets must be a number!' })
            return
        }

        if (isNaN(Number(request.query.numberOfGuests))) {
            reply.status(400).send({ error: 'Number of guests must be a number!' })
            return
        }

        if (!request.query.roomType) {
            reply.status(400).send({ error: 'Room Type is required!' })
            return
        }

        const [room] = await db.select()
            .from(roomsTable)
            .where(eq(roomsTable.RoomType, request.query.roomType))
            .limit(1)

        if (!room) {
            reply.status(404).send({ error: 'Room Type not found!' })
            return
        }

        let nights = differenceInCalendarDays(dateCheck.checkOut, dateCheck.checkIn)

        const { roomSubTotal, additionalFees, roomTaxAmount, roomTotalAmount } = calculateStayPrice(Number(room.BasePrice), nights, Number(request.query.petCount), 0, 0, Number(request.query.numberOfGuests), room.RoomType);

        reply.status(200).send({
            roomSubTotal,
            additionalFees,
            roomTaxAmount,
            roomTotalAmount
        })
    })

    fastify.post('/api/public/reservations', {
        bodyLimit: 16 * 1024,
        config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
        schema: {
            body: {
                type: 'object',
                additionalProperties: false,
                required: [
                    'firstName',
                    'lastName',
                    'phoneNumber',
                    'checkIn',
                    'checkOut',
                    'numberOfGuests',
                    'petCount',
                    'roomType',
                ],
                properties: {
                    firstName: { type: 'string', minLength: 1, maxLength: 100 },
                    lastName: { type: 'string', minLength: 1, maxLength: 100 },
                    phoneNumber: { type: 'string', minLength: 7, maxLength: 32 },
                    checkIn: { type: 'string', minLength: 8, maxLength: 40 },
                    checkOut: { type: 'string', minLength: 8, maxLength: 40 },
                    numberOfGuests: { type: 'integer', minimum: 1, maximum: 20 },
                    petCount: { type: 'integer', minimum: 0, maximum: 10 },
                    roomType: { type: 'string', minLength: 1, maxLength: 64 },
                },
            },
        },
    }, async function (request: FastifyRequest<{ Body: CreateReservationBody }>, reply) {
        if (isPublicBookingPaused()) {
            sendBookingPaused(reply)
            return
        }
        if (!request.body) {
            reply.status(400).send({ error: 'Request body is required!' });
            return;
        }
        const dateCheck = validateAndParseDates(request.body.checkIn, request.body.checkOut)
        if (!dateCheck.isValid) {
            reply.status(400).send({ error: dateCheck.error })
            return
        }
        let nights = differenceInCalendarDays(dateCheck.checkOut, dateCheck.checkIn);

        if (!(request.body.firstName) || !request.body.lastName) {
            reply.status(400).send({ error: 'First name and last name are required!' })
            return
        }

        if (!request.body.phoneNumber) {
            reply.status(400).send({ error: 'Phone number is required!' })
            return
        }

        if (isNaN(Number(request.body.numberOfGuests))) {
            reply.status(400).send({ error: 'Number of guests is required!' })
            return
        }

        if (isNaN(Number(request.body.petCount))) {
            reply.status(400).send({ error: 'Pet count is required!' })
            return
        }

        if (!request.body.roomType) {
            reply.status(400).send({ error: 'Room Type is required!' })
            return
        }

        let availableRooms = await isAvailable(dateCheck.checkIn, dateCheck.checkOut)
        availableRooms = availableRooms.filter(room => !room.IsSmoking);

        let [requestedRoom] = availableRooms.filter((room) => room.RoomType == request.body.roomType)

        if (requestedRoom?.RoomType != request.body.roomType) {
            reply.status(409).send({ error: "Room of this type is not available for these dates!" })
            return
        }
        try {
            const result = await db.transaction(async (tx) => {

                const [roomData] = await tx.select({
                    BasePrice: roomsTable.BasePrice,
                    RoomType: roomsTable.RoomType
                })
                    .from(roomsTable)
                    .where(eq(roomsTable.RoomType, request.body.roomType))
                    .limit(1)

                if (!roomData) {
                    throw new Error("Room not found!")
                }

                let [guest] = await tx.insert(guestsTable).values({
                    FirstName: request.body.firstName,
                    LastName: request.body.lastName,
                    Phone: request.body.phoneNumber,
                    IsIdVerified: false
                }).returning()

                let [reservation] = await tx.insert(reservationsTable).values({
                    GuestId: guest.id,
                    BookingSource: 'DirectWeb',
                    PaymentStatus: 'Unpaid',
                    Status: 'Active',
                    RequestedRoomType: request.body.roomType
                }).returning()

                const { roomSubTotal, additionalFees, roomTaxAmount, roomTotalAmount } = calculateStayPrice(Number(roomData.BasePrice), nights, Number(request.body.petCount), 0, 0, Number(request.body.numberOfGuests), roomData.RoomType);

                let [roomStay] = await tx.insert(roomStaysTable).values({
                    ReservationId: reservation.id,
                    RoomStayStatus: 'Confirmed',
                    RoomSubTotal: roomSubTotal.toFixed(2),
                    AdditionalFees: additionalFees.toFixed(2),
                    RoomTaxAmount: roomTaxAmount.toFixed(2),
                    RoomTotalAmount: roomTotalAmount.toFixed(2),
                    CheckInDate: dateCheck.checkIn,
                    CheckOutDate: dateCheck.checkOut,
                    PetCount: request.body.petCount,
                    NumberOfGuests: request.body.numberOfGuests
                }).returning()

                return { message: 'Reservation created successfully!', reservationId: reservation.id, roomTotalAmount }
            })
            reply.status(200).send(result)
        } catch (error) {
            request.log.error(error);
            const pgCode = (error as any).cause?.code ?? (error as any).code;
            if (pgCode === '23P01') {
                reply.status(409).send({ message: 'Double booking detected! Room already occupied.' })
                return
            }
            if (error instanceof Error) {
                if (error.message === 'Room not found!') {
                    reply.status(404).send({ error: error.message });
                    return;
                }

                reply.status(500).send({ error: error.message });
                return;
            }
            reply.status(500).send({ error: 'An unexpected error occurred.' });
        }
    })
}