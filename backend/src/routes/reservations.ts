import { FastifyInstance, FastifyRequest } from 'fastify';
import { db } from '../db/client';
import { reservationsTable, roomsTable, roomStaysTable, paymentsTable, guestsTable } from '../db/schema';
import { eq, and, lt, lte, gte, inArray, isNull, ne, or, ilike, desc, sql } from 'drizzle-orm';
import { isAvailable } from '../availability';
import { ANONYMOUS_WALKIN_UUID } from '../constants';
import { differenceInCalendarDays } from 'date-fns';
import { calculateStayPrice } from '../pricing';
import { computeFolioTotals } from '../folio';
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

interface PhoneRoomStay {
    roomId: number,
    numberOfGuests: number,
    petCount: number,
    additionalFees: number,
    discountAmount: number,
    checkInDate?: string,
    checkOutDate?: string
}

interface PhoneReservation {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    checkInDate: string;
    checkOutDate: string;
    rooms: PhoneRoomStay[]
    paymentMethod: 'Cash' | 'PhysicalCreditCard'
}

interface WalkInReservation {
    checkInDate: string;
    checkOutDate: string;
    rooms: PhoneRoomStay[]
    paymentMethod: 'Cash' | 'PhysicalCreditCard'
}

interface OtaReservation {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    checkInDate: string;
    checkOutDate: string;
    paymentMethod: 'Cash' | 'PhysicalCreditCard';
    otaSource: 'Expedia' | 'BookingDotCom'
    otaConfirmed: string
    vccConfirmed: string
    groupName: string
    rooms: OtaRoomStay[]
}

interface OtaRoomStay {
    roomId: number,
    numberOfGuests: number,
    petCount: number,
    checkInDate?: string,
    checkOutDate?: string,
    roomTaxAmount: number,
    roomTotalAmount: number
}

interface ReservationsQuerystring {
    from?: string;
    to?: string;
    source?: string;
    status?: string;
    showCancelled?: string | boolean;
    room?: string;
    q?: string;
    limit?: string | number;
    offset?: string | number;
}

export default async function reservationsRoutes(fastify: FastifyInstance) {
    fastify.get<{ Querystring: ReservationsQuerystring }>('/api/reservations', async function (request, reply) {
        const {
            from,
            to,
            source,
            status,
            showCancelled,
            room,
            q,
            limit = 50,
            offset = 0
        } = request.query;

        const now = new Date();
        const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        defaultFrom.setHours(0, 0, 0, 0);

        const defaultTo = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        defaultTo.setHours(23, 59, 59, 999);

        const fromDate = from ? new Date(from.includes('T') ? from : from + 'T00:00:00') : defaultFrom;
        const toDate = to ? new Date(to.includes('T') ? to : to + 'T23:59:59') : defaultTo;

        const conditions: any[] = [
            lte(roomStaysTable.CheckInDate, toDate),
            gte(roomStaysTable.CheckOutDate, fromDate)
        ];

        if (source) {
            conditions.push(eq(reservationsTable.BookingSource, source as any));
        }

        if (status) {
            conditions.push(eq(roomStaysTable.RoomStayStatus, status as any));
        } else {
            const isShowCancelled = showCancelled === 'true' || showCancelled === true;
            if (!isShowCancelled) {
                conditions.push(ne(roomStaysTable.RoomStayStatus, 'Cancelled'));
            }
        }

        if (room) {
            const roomNum = Number(room);
            if (!isNaN(roomNum)) {
                conditions.push(eq(roomsTable.RoomNumber, roomNum));
            }
        }

        if (q && q.trim() !== '') {
            const searchTerm = `%${q.trim()}%`;
            conditions.push(
                or(
                    ilike(guestsTable.FirstName, searchTerm),
                    ilike(guestsTable.LastName, searchTerm),
                    ilike(guestsTable.Phone, searchTerm)
                )
            );
        }

        const whereClause = and(...conditions);

        const limitNum = Math.max(1, Number(limit) || 50);
        const offsetNum = Math.max(0, Number(offset) || 0);

        const staysRows = await db.select()
            .from(roomStaysTable)
            .leftJoin(reservationsTable, eq(roomStaysTable.ReservationId, reservationsTable.id))
            .leftJoin(guestsTable, eq(reservationsTable.GuestId, guestsTable.id))
            .leftJoin(roomsTable, eq(roomStaysTable.RoomId, roomsTable.id))
            .where(whereClause)
            .orderBy(desc(roomStaysTable.CheckInDate))
            .limit(limitNum)
            .offset(offsetNum);

        const countResult = await db.select({ total: sql<number>`count(*)::int` })
            .from(roomStaysTable)
            .leftJoin(reservationsTable, eq(roomStaysTable.ReservationId, reservationsTable.id))
            .leftJoin(guestsTable, eq(reservationsTable.GuestId, guestsTable.id))
            .leftJoin(roomsTable, eq(roomStaysTable.RoomId, roomsTable.id))
            .where(whereClause);

        const total = countResult[0]?.total || 0;

        const stays = staysRows.map(row => {
            const firstName = row.guests?.FirstName || '';
            const lastName = row.guests?.LastName || '';
            const fullName = `${firstName} ${lastName}`.trim();
            const guestName = fullName || 'Walk-In';

            return {
                stayId: row.room_stays.id,
                reservationId: row.room_stays.ReservationId,
                guestName,
                guestPhone: row.guests?.Phone || '',
                roomNumber: row.rooms?.RoomNumber ?? null,
                checkIn: row.room_stays.CheckInDate.toISOString(),
                checkOut: row.room_stays.CheckOutDate.toISOString(),
                bookingSource: row.reservations?.BookingSource || 'WalkIn',
                paymentStatus: row.reservations?.PaymentStatus || 'Unpaid',
                roomStayStatus: row.room_stays.RoomStayStatus,
                roomTotalAmount: row.room_stays.RoomTotalAmount
            };
        });

        reply.status(200).send({ stays, total });
    });
    fastify.get('/api/reservations/:id/folio', async function (request: FastifyRequest<{ Params: { id: string } }>, reply) {
        const reservationId = request.params.id;
        const [reservationData] = await db.select()
            .from(reservationsTable)
            .where(eq(reservationsTable.id, reservationId));

        if (!reservationData) {
            return reply.status(404).send({ message: 'Reservation not found' });
        }

        const stays = await db.select()
            .from(roomStaysTable)
            .leftJoin(roomsTable, eq(roomStaysTable.RoomId, roomsTable.id))
            .where(eq(roomStaysTable.ReservationId, reservationId));

        const payments = await db.select()
            .from(paymentsTable)
            .where(eq(paymentsTable.ReservationId, reservationId));

        const { folioTotal, paidTotal, balanceDue } = computeFolioTotals(
            stays.map((row) => row.room_stays),
            payments
        );

        reply.status(200).send({
            reservation: {
                id: reservationData.id,
                GroupName: reservationData.GroupName,
                PaymentStatus: reservationData.PaymentStatus,
                BookingSource: reservationData.BookingSource,
                Status: reservationData.Status,
            },
            stays: stays.map((stay) => ({
                roomNumber: stay.rooms?.RoomNumber,
                checkIn: stay.room_stays.CheckInDate,
                checkOut: stay.room_stays.CheckOutDate,
                roomTotalAmount: stay.room_stays.RoomTotalAmount,
                roomStayStatus: stay.room_stays.RoomStayStatus,
                id: stay.room_stays.id
            })),
            payments: payments.map(payment => ({
                id: payment.id,
                Amount: payment.Amount,
                TransactionType: payment.TransactionType,
                PaymentMethod: payment.PaymentMethod,
                PayerType: payment.PayerType,
                Timestamp: payment.Timestamp,
            })),
            folioTotal: folioTotal.toFixed(2),
            paidTotal: paidTotal.toFixed(2),
            balanceDue: balanceDue.toFixed(2)
        });
    });

    fastify.post<{ Body: PhoneReservation }>('/api/reservations/phone', async function (request, reply) {
        const rooms = request.body.rooms;
        if (rooms.length <= 0) return reply.status(400).send({ message: "No room stays!" })
        for (const room of rooms) {
            if (room.roomId === 0) {
                reply.status(400).send({ message: "No room selected!" })
                return
            }
        }
        if (rooms.map((room) => room.roomId).length !== new Set(rooms.map((room) => room.roomId)).size) return reply.status(400).send({ message: "Multiple bookings for same room!" })
        const dateCheck = validateAndParseDates(request.body.checkInDate, request.body.checkOutDate);
        if (!dateCheck.isValid) {
            reply.status(400).send({ message: dateCheck.error });
            return;
        }
        const checkInDate = dateCheck.checkIn;
        const checkOutDate = dateCheck.checkOut;

        const roomsWithDates: any[] = [];
        for (const room of rooms) {
            let resolvedCheckIn = checkInDate;
            let resolvedCheckOut = checkOutDate;
            if (room.checkInDate || room.checkOutDate) {
                const roomCheck = validateAndParseDates(
                    room.checkInDate ?? request.body.checkInDate,
                    room.checkOutDate ?? request.body.checkOutDate
                );
                if (!roomCheck.isValid) {
                    reply.status(400).send({ message: roomCheck.error });
                    return;
                }
                resolvedCheckIn = roomCheck.checkIn;
                resolvedCheckOut = roomCheck.checkOut;
            }
            roomsWithDates.push({ ...room, resolvedCheckIn, resolvedCheckOut });
        }

        for (const room of roomsWithDates) {
            const roomsAvail = await isAvailable(room.resolvedCheckIn, room.resolvedCheckOut)
            if (!roomsAvail.find(r => r.id === room.roomId)) return reply.status(409).send({ message: "Room is not available!" })
        }
        const firstName = request.body.firstName;
        const lastName = request.body.lastName;
        const phoneNumber = request.body.phoneNumber;


        const paymentMethod = request.body.paymentMethod;
        try {
            await db.transaction(async (tx) => {
                const [guest] = await tx.insert(guestsTable).values({
                    FirstName: firstName,
                    LastName: lastName,
                    Phone: phoneNumber,
                    IsIdVerified: false,
                }).returning();

                const [reservation] = await tx.insert(reservationsTable).values({
                    GuestId: guest.id,
                    PaymentStatus: 'Unpaid',
                    BookingSource: 'Phone',
                    Status: 'Active'
                }).returning();

                let totalAmount = 0;

                for (const room of roomsWithDates) {
                    const [roomData] = await tx.select().from(roomsTable).where(eq(roomsTable.id, room.roomId));
                    if (!roomData) throw new Error("Room row not found!")
                    const basePrice = Number(roomData.BasePrice)
                    const roomType = roomData.RoomType
                    const { roomSubTotal, additionalFees, roomTaxAmount, roomTotalAmount } = calculateStayPrice(basePrice, differenceInCalendarDays(room.resolvedCheckOut, room.resolvedCheckIn), room.petCount, room.additionalFees, room.discountAmount, room.numberOfGuests, roomType);
                    totalAmount += roomTotalAmount
                    await tx.insert(roomStaysTable).values({
                        ReservationId: reservation.id,
                        RoomId: room.roomId,
                        CheckInDate: room.resolvedCheckIn,
                        CheckOutDate: room.resolvedCheckOut,
                        NumberOfGuests: room.numberOfGuests,
                        PetCount: room.petCount,
                        AdditionalFees: additionalFees.toString(),
                        DiscountAmount: room.discountAmount.toString(),
                        RoomSubTotal: roomSubTotal.toString(),
                        RoomTaxAmount: roomTaxAmount.toString(),
                        RoomTotalAmount: roomTotalAmount.toString(),
                        RoomStayStatus: 'Confirmed'

                    })
                }
                reply.status(200).send({ message: "Phone booking successfully created!", reservationId: reservation.id, roomTotalAmount: totalAmount });
            });
        } catch (error) {
            const pgCode = (error as any).cause?.code ?? (error as any).code;
            if (pgCode === '23P01') {
                reply.status(409).send({ message: 'Double booking detected! Room already occupied.' })
                return
            }
            if (error instanceof Error) {
                if (error.message === "Room row not found!") {
                    reply.status(404).send({ message: error.message });
                    return
                }
            }

            reply.send({ error })
        }
    });

    fastify.post<{ Body: WalkInReservation }>('/api/reservations/walkin', async function (request, reply) {
        const rooms = request.body.rooms;
        if (rooms.length <= 0) return reply.status(400).send({ message: "No room stays!" })
        for (const room of rooms) {
            if (room.roomId === 0) {
                reply.status(400).send({ message: "No room selected!" })
                return
            }
        }
        if (rooms.map((room) => room.roomId).length !== new Set(rooms.map((room) => room.roomId)).size) return reply.status(400).send({ message: "Multiple bookings for same room!" })
        const dateCheck = validateAndParseDates(request.body.checkInDate, request.body.checkOutDate);
        if (!dateCheck.isValid) {
            reply.status(400).send({ message: dateCheck.error });
            return;
        }
        const checkInDate = dateCheck.checkIn;
        const checkOutDate = dateCheck.checkOut;

        const roomsWithDates: any[] = [];
        for (const room of rooms) {
            let resolvedCheckIn = checkInDate;
            let resolvedCheckOut = checkOutDate;
            if (room.checkInDate || room.checkOutDate) {
                const roomCheck = validateAndParseDates(
                    room.checkInDate ?? request.body.checkInDate,
                    room.checkOutDate ?? request.body.checkOutDate
                );
                if (!roomCheck.isValid) {
                    reply.status(400).send({ message: roomCheck.error });
                    return;
                }
                resolvedCheckIn = roomCheck.checkIn;
                resolvedCheckOut = roomCheck.checkOut;
            }
            roomsWithDates.push({ ...room, resolvedCheckIn, resolvedCheckOut });
        }

        for (const room of roomsWithDates) {
            const roomsAvail = await isAvailable(room.resolvedCheckIn, room.resolvedCheckOut)
            if (!roomsAvail.find(r => r.id === room.roomId)) return reply.status(409).send({ message: "Room is not available!" })
        }
        const paymentMethod = request.body.paymentMethod;
        try {
            await db.transaction(async (tx) => {
                const [reservation] = await tx.insert(reservationsTable).values({
                    GuestId: ANONYMOUS_WALKIN_UUID,
                    PaymentStatus: 'Paid',
                    BookingSource: 'WalkIn',
                    Status: 'Active'
                }).returning();

                let totalAmount = 0;

                for (const room of roomsWithDates) {
                    const [roomData] = await tx.select().from(roomsTable).where(eq(roomsTable.id, room.roomId));
                    if (!roomData) throw new Error("Room row not found!")
                    const basePrice = Number(roomData.BasePrice)
                    const roomType = roomData.RoomType
                    const { roomSubTotal, additionalFees, roomTaxAmount, roomTotalAmount } = calculateStayPrice(basePrice, differenceInCalendarDays(room.resolvedCheckOut, room.resolvedCheckIn), room.petCount, room.additionalFees, room.discountAmount, room.numberOfGuests, roomType);
                    totalAmount += roomTotalAmount
                    await tx.insert(roomStaysTable).values({
                        ReservationId: reservation.id,
                        RoomId: room.roomId,
                        CheckInDate: room.resolvedCheckIn,
                        CheckOutDate: room.resolvedCheckOut,
                        NumberOfGuests: room.numberOfGuests,
                        PetCount: room.petCount,
                        AdditionalFees: additionalFees.toString(),
                        DiscountAmount: room.discountAmount.toString(),
                        RoomSubTotal: roomSubTotal.toString(),
                        RoomTaxAmount: roomTaxAmount.toString(),
                        RoomTotalAmount: roomTotalAmount.toString(),
                        RoomStayStatus: 'CheckedIn'

                    })
                }

                const payment = await tx.insert(paymentsTable).values({
                    ReservationId: reservation.id,
                    Amount: totalAmount.toString(),
                    TransactionType: 'Charge',
                    PaymentMethod: paymentMethod,
                    PayerType: 'Guest'
                });
                reply.status(200).send({ message: "Walk in booking successfully created!", reservationId: reservation.id, roomTotalAmount: totalAmount });
            });
        } catch (error) {
            const pgCode = (error as any).cause?.code ?? (error as any).code;
            if (pgCode === '23P01') {
                reply.status(409).send({ message: 'Double booking detected! Room already occupied.' })
                return
            }
            if (error instanceof Error) {
                if (error.message === "Room row not found!") {
                    reply.status(404).send({ message: error.message });
                    return
                }
            }

            reply.send({ error })
        }
    });


    fastify.get('/api/reservations/manifest', async function (request: FastifyRequest<{ Querystring: { date: string } }>, reply) {
        const date = request.query.date;
        const rawStays = await db.select()
            .from(roomStaysTable)
            .leftJoin(roomsTable, eq(roomStaysTable.RoomId, roomsTable.id))
            .leftJoin(reservationsTable, eq(roomStaysTable.ReservationId, reservationsTable.id))
            .leftJoin(guestsTable, eq(reservationsTable.GuestId, guestsTable.id))
            .where(
                and(
                    lte(roomStaysTable.CheckInDate, new Date(date + 'T00:00:00')),
                    gte(roomStaysTable.CheckOutDate, new Date(date + 'T00:00:00')),
                    inArray(roomStaysTable.RoomStayStatus, ['Confirmed', 'CheckedIn', 'CheckedOut'])
                )
            )

        const arrivals = rawStays.filter(
            (stay) =>
                (stay.room_stays.CheckInDate.toISOString().slice(0, 10) === date) && (stay.room_stays.RoomStayStatus === 'Confirmed')
        )

        const departures = rawStays.filter(
            (stay) =>
                (stay.room_stays.CheckOutDate.toISOString().slice(0, 10) === date) && (stay.room_stays.RoomStayStatus === 'CheckedIn')
        )

        const inHouse = rawStays.filter(
            (stay) =>
                (stay.room_stays.CheckInDate.toISOString().slice(0, 10) <= date) && (stay.room_stays.CheckOutDate.toISOString().slice(0, 10) > date) && (stay.room_stays.RoomStayStatus === 'CheckedIn')
        )

        reply.status(200).send({ arrivals, departures, inHouse })
    }
    )

    fastify.post<{ Body: OtaReservation }>('/api/reservations/ota', async function (request, reply) {
        const rooms = request.body.rooms;
        if (rooms.length <= 0) return reply.status(400).send({ message: "No room stays!" })
        for (const room of rooms) {
            if (room.roomId === 0) {
                reply.status(400).send({ message: "No room selected!" })
                return
            }
        }
        if (rooms.map((room) => room.roomId).length !== new Set(rooms.map((room) => room.roomId)).size) return reply.status(400).send({ message: "Multiple bookings for same room!" })
        const dateCheck = validateAndParseDates(request.body.checkInDate, request.body.checkOutDate);
        if (!dateCheck.isValid) {
            reply.status(400).send({ message: dateCheck.error });
            return;
        }
        const checkInDate = dateCheck.checkIn;
        const checkOutDate = dateCheck.checkOut;

        const roomsWithDates: any[] = [];
        for (const room of rooms) {
            let resolvedCheckIn = checkInDate;
            let resolvedCheckOut = checkOutDate;
            if (room.checkInDate || room.checkOutDate) {
                const roomCheck = validateAndParseDates(
                    room.checkInDate ?? request.body.checkInDate,
                    room.checkOutDate ?? request.body.checkOutDate
                );
                if (!roomCheck.isValid) {
                    reply.status(400).send({ message: roomCheck.error });
                    return;
                }
                resolvedCheckIn = roomCheck.checkIn;
                resolvedCheckOut = roomCheck.checkOut;
            }
            roomsWithDates.push({ ...room, resolvedCheckIn, resolvedCheckOut });
        }

        for (const room of roomsWithDates) {
            const roomsAvail = await isAvailable(room.resolvedCheckIn, room.resolvedCheckOut)
            if (!roomsAvail.find(r => r.id === room.roomId)) return reply.status(409).send({ message: "Room is not available!" })
        }
        const firstName = request.body.firstName;
        const lastName = request.body.lastName;
        const phoneNumber = request.body.phoneNumber;
        const paymentMethod = request.body.paymentMethod;

        try {
            await db.transaction(async (tx) => {
                const [guest] = await tx.insert(guestsTable).values({
                    FirstName: firstName,
                    LastName: lastName,
                    Phone: phoneNumber,
                    IsIdVerified: false,
                }).returning();

                const [reservation] = await tx.insert(reservationsTable).values({
                    GuestId: guest.id,
                    PaymentStatus: 'Unpaid',
                    BookingSource: request.body.otaSource,
                    Status: 'Active',
                    OtaConfirmedNumber: request.body.otaConfirmed,
                    VccReference: request.body.vccConfirmed,
                    GroupName: request.body.groupName
                }).returning();

                let totalAmount = 0;

                for (const room of roomsWithDates) {
                    const [roomData] = await tx.select().from(roomsTable).where(eq(roomsTable.id, room.roomId));
                    if (!roomData) throw new Error("Room row not found!")
                    const roomType = roomData.RoomType
                    const roomSubTotal = room.roomTotalAmount - room.roomTaxAmount
                    const nights = differenceInCalendarDays(room.resolvedCheckOut, room.resolvedCheckIn)
                    const petFee = room.petCount * (15 * nights);
                    totalAmount += room.roomTotalAmount + petFee
                    await tx.insert(roomStaysTable).values({
                        ReservationId: reservation.id,
                        RoomId: room.roomId,
                        CheckInDate: room.resolvedCheckIn,
                        CheckOutDate: room.resolvedCheckOut,
                        NumberOfGuests: room.numberOfGuests,
                        PetCount: room.petCount,
                        AdditionalFees: petFee.toString(),
                        DiscountAmount: '0',
                        RoomSubTotal: roomSubTotal.toString(),
                        RoomTaxAmount: room.roomTaxAmount.toString(),
                        RoomTotalAmount: (room.roomTotalAmount + petFee).toString(),
                        RoomStayStatus: 'Confirmed'
                    })
                }
                reply.status(200).send({ message: "Ota booking successfully created!", reservationId: reservation.id, roomTotalAmount: totalAmount.toString() });
            });
        } catch (error) {
            const pgCode = (error as any).cause?.code ?? (error as any).code;
            if (pgCode === '23P01') {
                reply.status(409).send({ message: 'Double booking detected! Room already occupied.' })
                return
            }
            reply.send({ error });
        }
    });

    fastify.get('/api/reservations/unassigned', async function (request, reply) {
        const unassignedOnlineBookings = await db.select()
            .from(roomStaysTable)
            .leftJoin(reservationsTable, eq(roomStaysTable.ReservationId, reservationsTable.id))
            .leftJoin(guestsTable, eq(reservationsTable.GuestId, guestsTable.id))
            .where(
                and(
                    isNull(roomStaysTable.RoomId), eq(reservationsTable.BookingSource, 'DirectWeb'), eq(reservationsTable.PaymentStatus, 'Paid')
                ))
        return unassignedOnlineBookings
    })

    interface DirectReservationRouteOptions {
        Body: {
            roomId: number;
        }

        Params: {
            reservationId: string;
        }
    }
    fastify.post<DirectReservationRouteOptions>('/api/reservations/:reservationId/assign-room', async function (request, reply) {
        const reservationId = request.params.reservationId
        const roomId = request.body.roomId

        const [onlineReservation] = await db.select()
            .from(reservationsTable)
            .where(eq(reservationsTable.id, reservationId))

        if (!onlineReservation) {
            reply.status(404).send({ message: "Reservation not found!" })
            return
        }

        const [unassignedRoomStay] = await db.select()
            .from(roomStaysTable)
            .where(eq(roomStaysTable.ReservationId, onlineReservation.id))

        if (!unassignedRoomStay) {
            reply.status(404).send({ message: "Room stay not found!" })
            return
        }

        let checkInDate = unassignedRoomStay.CheckInDate
        let checkOutDate = unassignedRoomStay.CheckOutDate

        const [room] = await db.select()
            .from(roomsTable)
            .where(and(
                eq(roomsTable.id, roomId),
                eq(roomsTable.RoomType, onlineReservation.RequestedRoomType!)
            ))

        if (!room) {
            reply.status(404).send({ message: "Room is not of the requested type!" })
            return
        }

        const availableRooms = await isAvailable(checkInDate, checkOutDate)
        for (const r of availableRooms) {
            if (r.id === roomId) {
                await db.update(roomStaysTable)
                    .set({
                        RoomId: roomId
                    })
                    .where(eq(roomStaysTable.id, unassignedRoomStay.id))


                reply.status(200).send({ message: "Room assigned successfully!" })
                return
            }
        }

        reply.status(409).send({ message: "Room is not available!" })
    })

    interface ImportReservationBody {
        guest: Record<string, unknown>;
        reservation: Record<string, unknown>;
        stay: Record<string, unknown>;
    }

    fastify.post<{ Body: ImportReservationBody }>('/api/reservations/import', {
        bodyLimit: 32 * 1024,
        config: {
            rateLimit: {
                max: Number(process.env.IMPORT_RATE_LIMIT_MAX) || 30,
                timeWindow: '1 minute',
            },
        },
        schema: {
            body: {
                type: 'object',
                additionalProperties: false,
                required: ['guest', 'reservation', 'stay'],
                properties: {
                    guest: { type: 'object' },
                    reservation: { type: 'object' },
                    stay: { type: 'object' },
                },
            },
        },
    }, async function (request, reply) {
        const { guest, reservation, stay } = request.body;
        const guestId = String(guest.id ?? '');
        const reservationId = String(reservation.id ?? '');
        const stayId = String(stay.id ?? '');
        const checkInDate = new Date(String(stay.CheckInDate ?? ''));
        const checkOutDate = new Date(String(stay.CheckOutDate ?? ''));
        const numberOfGuests = Number(stay.NumberOfGuests);
        const petCount = Number(stay.PetCount ?? 0);
        const monetaryValues = [
            stay.AdditionalFees,
            stay.DiscountAmount,
            stay.RoomSubTotal,
            stay.RoomTaxAmount,
            stay.RoomTotalAmount,
        ].map(value => Number(value));

        if (
            !guestId
            || !reservationId
            || !stayId
            || reservation.GuestId !== guestId
            || stay.ReservationId !== reservationId
            || reservation.BookingSource !== 'DirectWeb'
            || reservation.PaymentStatus !== 'Paid'
            || reservation.Status !== 'Active'
            || stay.RoomStayStatus !== 'Confirmed'
            || !Number.isInteger(stay.RoomId)
            || Number(stay.RoomId) <= 0
            || !Number.isInteger(numberOfGuests)
            || numberOfGuests < 1
            || numberOfGuests > 20
            || !Number.isInteger(petCount)
            || petCount < 0
            || petCount > 10
            || monetaryValues.some(value => !Number.isFinite(value) || value < 0)
            || Number.isNaN(checkInDate.valueOf())
            || Number.isNaN(checkOutDate.valueOf())
            || checkOutDate <= checkInDate
        ) {
            return reply.status(400).send({ error: 'Invalid reservation import payload' });
        }

        await db.transaction(async (tx) => {
            await tx.insert(guestsTable).values({
                id: guestId,
                FirstName: typeof guest.FirstName === 'string' ? guest.FirstName : null,
                LastName: typeof guest.LastName === 'string' ? guest.LastName : null,
                Phone: typeof guest.Phone === 'string' ? guest.Phone : null,
                Email: typeof guest.Email === 'string' ? guest.Email : null,
                IsIdVerified: guest.IsIdVerified === true,
            }).onConflictDoNothing();

            await tx.insert(reservationsTable).values({
                id: reservationId,
                GuestId: guestId,
                BookingSource: 'DirectWeb',
                PaymentStatus: 'Paid',
                Status: 'Active',
                RequestedRoomType: typeof reservation.RequestedRoomType === 'string' ? reservation.RequestedRoomType : null,
                GroupName: typeof reservation.GroupName === 'string' ? reservation.GroupName : null,
                OtaConfirmedNumber: typeof reservation.OtaConfirmedNumber === 'string' ? reservation.OtaConfirmedNumber : null,
                VccReference: typeof reservation.VccReference === 'string' ? reservation.VccReference : null,
            }).onConflictDoNothing();

            await tx.insert(roomStaysTable).values({
                id: stayId,
                ReservationId: reservationId,
                RoomId: Number(stay.RoomId),
                CheckInDate: checkInDate,
                CheckOutDate: checkOutDate,
                NumberOfGuests: numberOfGuests,
                PetCount: petCount,
                AdditionalFees: String(stay.AdditionalFees ?? '0.00'),
                DiscountAmount: String(stay.DiscountAmount ?? '0.00'),
                RoomSubTotal: String(stay.RoomSubTotal ?? '0.00'),
                RoomTaxAmount: String(stay.RoomTaxAmount ?? '0.00'),
                RoomTotalAmount: String(stay.RoomTotalAmount ?? '0.00'),
                RoomStayStatus: 'Confirmed',
            }).onConflictDoNothing();
        });

        reply.status(200).send({ message: "Reservation imported successfully!" });
    });
}
