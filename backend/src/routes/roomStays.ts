import { FastifyInstance, FastifyRequest } from 'fastify';
import { db } from '../db/client';
import { roomStaysTable, guestsTable, reservationsTable, roomsTable, paymentsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { validateAndParseDates } from '../utils/dateValidation';
import { hasStayOverlap } from '../availability';
import { ANONYMOUS_WALKIN_UUID } from '../constants';

interface RoomStaysId {
    id: string;
}

interface UpdateStayBody {
    firstName?: string;
    lastName?: string;
    phone?: string;
    checkInDate?: string;
    checkOutDate?: string;
    numberOfGuests?: number;
    petCount?: number;
    roomSubTotal?: string;
    roomTaxAmount?: string;
    roomTotalAmount?: string;
    priorityTier?: number;
    conditionNotes?: string;
    roomId?: number;
}

export default async function roomStaysRoutes(fastify: FastifyInstance) {
    fastify.get('/api/roomstays/:id/details', async function (request: FastifyRequest<{ Params: RoomStaysId }>, reply) {
        const roomStaysId = request.params.id;
        const [stayRow] = await db.select()
            .from(roomStaysTable)
            .leftJoin(reservationsTable, eq(roomStaysTable.ReservationId, reservationsTable.id))
            .leftJoin(guestsTable, eq(reservationsTable.GuestId, guestsTable.id))
            .leftJoin(roomsTable, eq(roomStaysTable.RoomId, roomsTable.id))
            .where(eq(roomStaysTable.id, roomStaysId));

        if (!stayRow) {
            reply.status(404).send({ message: "RoomStay not found!" });
            return;
        }

        reply.status(200).send({
            guest: stayRow.guests ? {
                id: stayRow.guests.id,
                firstName: stayRow.guests.FirstName,
                lastName: stayRow.guests.LastName,
                phone: stayRow.guests.Phone,
                email: stayRow.guests.Email
            } : null,
            stay: {
                id: stayRow.room_stays.id,
                checkInDate: stayRow.room_stays.CheckInDate,
                checkOutDate: stayRow.room_stays.CheckOutDate,
                numberOfGuests: stayRow.room_stays.NumberOfGuests,
                petCount: stayRow.room_stays.PetCount,
                roomSubTotal: stayRow.room_stays.RoomSubTotal,
                roomTaxAmount: stayRow.room_stays.RoomTaxAmount,
                roomTotalAmount: stayRow.room_stays.RoomTotalAmount,
                roomStayStatus: stayRow.room_stays.RoomStayStatus,
                roomId: stayRow.room_stays.RoomId
            },
            room: stayRow.rooms ? {
                id: stayRow.rooms.id,
                roomNumber: stayRow.rooms.RoomNumber,
                roomType: stayRow.rooms.RoomType,
                priorityTier: stayRow.rooms.PriorityTier,
                conditionNotes: stayRow.rooms.ConditionNotes,
                cleanStatus: stayRow.rooms.cleanStatus
            } : null,
            reservation: stayRow.reservations ? {
                id: stayRow.reservations.id,
                bookingSource: stayRow.reservations.BookingSource,
                paymentStatus: stayRow.reservations.PaymentStatus
            } : null,
            firstName: stayRow.guests?.FirstName,
            lastName: stayRow.guests?.LastName,
            totalAmount: stayRow.room_stays.RoomTotalAmount,
            reservationId: stayRow.room_stays.ReservationId
        });
    });

    fastify.put<{ Params: RoomStaysId; Body: UpdateStayBody }>('/api/roomstays/:id', async function (request, reply) {
        const roomStayId = request.params.id;
        const body = request.body;

        const [existing] = await db.select()
            .from(roomStaysTable)
            .leftJoin(reservationsTable, eq(roomStaysTable.ReservationId, reservationsTable.id))
            .where(eq(roomStaysTable.id, roomStayId));

        if (!existing || !existing.room_stays) {
            reply.status(404).send({ message: "Stay not found!" });
            return;
        }

        const stayStatus = existing.room_stays.RoomStayStatus;
        if (!['Confirmed', 'CheckedIn'].includes(stayStatus)) {
            reply.status(409).send({ message: `Stay with status '${stayStatus}' cannot be edited!` });
            return;
        }

        let resolvedCheckIn = existing.room_stays.CheckInDate;
        let resolvedCheckOut = existing.room_stays.CheckOutDate;

        if (body.checkInDate || body.checkOutDate) {
            const checkInStr = body.checkInDate || existing.room_stays.CheckInDate.toISOString().slice(0, 10);
            const checkOutStr = body.checkOutDate || existing.room_stays.CheckOutDate.toISOString().slice(0, 10);
            const dateCheck = validateAndParseDates(checkInStr, checkOutStr);
            if (!dateCheck.isValid) {
                reply.status(400).send({ message: dateCheck.error });
                return;
            }
            resolvedCheckIn = dateCheck.checkIn;
            resolvedCheckOut = dateCheck.checkOut;
        }

        const oldRoomId = existing.room_stays.RoomId;
        const targetRoomId = body.roomId !== undefined ? (body.roomId === null ? null : Number(body.roomId)) : oldRoomId;

        if (targetRoomId !== null) {
            if (body.roomId !== undefined && body.roomId !== oldRoomId) {
                const [targetRoom] = await db.select()
                    .from(roomsTable)
                    .where(eq(roomsTable.id, targetRoomId));

                if (!targetRoom || ['NotRented', 'OutOfOrder'].includes(targetRoom.cleanStatus)) {
                    reply.status(400).send({ message: "Invalid target room or room not available for rent!" });
                    return;
                }
            }

            const isOverlapping = await hasStayOverlap(targetRoomId, resolvedCheckIn, resolvedCheckOut, roomStayId);
            if (isOverlapping) {
                reply.status(409).send({ message: "Dates overlap with an existing stay on this room!" });
                return;
            }
        }

        if (body.priorityTier !== undefined && ![1, 2, 3].includes(Number(body.priorityTier))) {
            reply.status(400).send({ message: "PriorityTier must be 1, 2, or 3" });
            return;
        }

        const conditionNotes = body.conditionNotes !== undefined ? body.conditionNotes.slice(0, 255) : undefined;

        await db.transaction(async (tx) => {
            if (existing.reservations?.GuestId && (body.firstName !== undefined || body.lastName !== undefined || body.phone !== undefined)) {
                if (existing.reservations.GuestId === ANONYMOUS_WALKIN_UUID) {
                    const [newGuest] = await tx.insert(guestsTable).values({
                        FirstName: body.firstName ?? null,
                        LastName: body.lastName ?? null,
                        Phone: body.phone ?? null,
                        IsIdVerified: false,
                        IsDNR: false,
                    }).returning();

                    await tx.update(reservationsTable)
                        .set({ GuestId: newGuest.id })
                        .where(eq(reservationsTable.id, existing.reservations.id));
                } else {
                    const guestUpdates: any = {};
                    if (body.firstName !== undefined) guestUpdates.FirstName = body.firstName;
                    if (body.lastName !== undefined) guestUpdates.LastName = body.lastName;
                    if (body.phone !== undefined) guestUpdates.Phone = body.phone;

                    await tx.update(guestsTable)
                        .set(guestUpdates)
                        .where(eq(guestsTable.id, existing.reservations.GuestId));
                }
            }

            const stayUpdates: any = {
                CheckInDate: resolvedCheckIn,
                CheckOutDate: resolvedCheckOut,
            };
            if (body.roomId !== undefined) stayUpdates.RoomId = targetRoomId;
            if (body.numberOfGuests !== undefined) stayUpdates.NumberOfGuests = Number(body.numberOfGuests);
            if (body.petCount !== undefined) stayUpdates.PetCount = Number(body.petCount);
            if (body.roomSubTotal !== undefined) stayUpdates.RoomSubTotal = String(body.roomSubTotal);
            if (body.roomTaxAmount !== undefined) stayUpdates.RoomTaxAmount = String(body.roomTaxAmount);
            if (body.roomTotalAmount !== undefined) stayUpdates.RoomTotalAmount = String(body.roomTotalAmount);

            await tx.update(roomStaysTable)
                .set(stayUpdates)
                .where(eq(roomStaysTable.id, roomStayId));

            if (stayStatus === 'CheckedIn' && oldRoomId !== null && oldRoomId !== targetRoomId) {
                await tx.update(roomsTable)
                    .set({ cleanStatus: 'Dirty' })
                    .where(eq(roomsTable.id, oldRoomId));
            }

            if (targetRoomId !== null && (body.priorityTier !== undefined || conditionNotes !== undefined)) {
                const roomUpdates: any = {};
                if (body.priorityTier !== undefined) roomUpdates.PriorityTier = Number(body.priorityTier);
                if (conditionNotes !== undefined) roomUpdates.ConditionNotes = conditionNotes;

                await tx.update(roomsTable)
                    .set(roomUpdates)
                    .where(eq(roomsTable.id, targetRoomId));
            }
        });

        reply.status(200).send({ message: "Stay updated successfully!" });
    });

    fastify.put('/api/roomstays/:id/checkin', async function (request: FastifyRequest<{ Params: RoomStaysId }>, reply) {
        try {
            const roomStayId = request.params.id;
            let notFound = false;

            await db.transaction(async (tx) => {
                const [stay] = await tx.select()
                    .from(roomStaysTable)
                    .leftJoin(reservationsTable, eq(roomStaysTable.ReservationId, reservationsTable.id))
                    .where(
                        and(
                            eq(roomStaysTable.id, roomStayId),
                            eq(roomStaysTable.RoomStayStatus, 'Confirmed')
                        )
                    )
                if (!stay || !stay.reservations) {
                    notFound = true;
                    return;
                }
                if (stay.reservations.PaymentStatus === 'Unpaid' &&
                    ['BookingDotCom', 'Expedia', 'DirectWeb'].includes(stay.reservations?.BookingSource as string)) {
                    await tx.update(reservationsTable)
                        .set({ PaymentStatus: 'Paid' })
                        .where(eq(reservationsTable.id, stay.reservations.id));

                    await tx.insert(paymentsTable).values({
                        ReservationId: stay.reservations.id,
                        Amount: stay.room_stays.RoomTotalAmount,
                        PaymentMethod: 'VirtualCreditCard',
                        TransactionType: 'Charge',
                        PayerType: stay.reservations.BookingSource as 'Expedia' | 'BookingDotCom'
                    })
                }
                await tx.update(roomStaysTable)
                    .set({ RoomStayStatus: 'CheckedIn' })
                    .where(eq(roomStaysTable.id, roomStayId));
            });

            if (notFound) return reply.status(409).send({ message: "Stay not found or not Confirmed!" });

            reply.status(200).send({ message: 'Stay successfully checked in' });
        } catch (error) {
            reply.status(500).send({ error });
        }
    });

    fastify.put('/api/roomstays/:id/checkout', async function (request: FastifyRequest<{ Params: RoomStaysId }>, reply) {
        try {
            const roomStaysId = request.params.id;

            await db.transaction(async (tx) => {
                const rows = await tx.select()
                    .from(roomStaysTable)
                    .where(eq(roomStaysTable.id, roomStaysId))
                    .limit(1);

                if (rows.length == 0) return reply.status(404).send({ message: "RoomStay row not found!" });
                const roomId = rows[0].RoomId;
                if (roomId === null) {
                    return reply.status(400).send({ message: "Cannot check out a stay that has no room assigned!" });
                }

                await tx.update(roomStaysTable)
                    .set({ RoomStayStatus: 'CheckedOut' })
                    .where(eq(roomStaysTable.id, roomStaysId));

                await tx.update(roomsTable)
                    .set({ cleanStatus: "Dirty" })
                    .where(eq(roomsTable.id, roomId));

                reply.status(200).send({ message: "Room fully checked out!" });
            });
        } catch (error) {
            return reply.send({ error });
        }
    });

    fastify.put('/api/roomstays/:id/cancel', async function (request: FastifyRequest<{ Params: RoomStaysId }>, reply) {
        try {
            const roomStayId = request.params.id;
            let statusError: { code: number; message: string } | null = null;

            await db.transaction(async (tx) => {
                const [stayRow] = await tx.select()
                    .from(roomStaysTable)
                    .leftJoin(reservationsTable, eq(roomStaysTable.ReservationId, reservationsTable.id))
                    .where(eq(roomStaysTable.id, roomStayId));

                if (!stayRow || !stayRow.room_stays) {
                    statusError = { code: 404, message: "RoomStay not found!" };
                    return;
                }

                const currentStatus = stayRow.room_stays.RoomStayStatus;
                if (currentStatus === 'CheckedOut') {
                    statusError = { code: 409, message: "Cannot cancel stay that is already CheckedOut!" };
                    return;
                }
                if (currentStatus === 'Cancelled') {
                    statusError = { code: 409, message: "Stay is already cancelled!" };
                    return;
                }

                // 1. Soft cancel target stay
                await tx.update(roomStaysTable)
                    .set({ RoomStayStatus: 'Cancelled' })
                    .where(eq(roomStaysTable.id, roomStayId));

                // 2. Check all stays under this reservation
                const reservationId = stayRow.room_stays.ReservationId;
                const allStays = await tx.select()
                    .from(roomStaysTable)
                    .where(eq(roomStaysTable.ReservationId, reservationId));

                const allCancelled = allStays.every(s => s.RoomStayStatus === 'Cancelled');
                if (allCancelled) {
                    await tx.update(reservationsTable)
                        .set({ Status: 'Cancelled' })
                        .where(eq(reservationsTable.id, reservationId));
                }

                // 3. Mark room Dirty ONLY if stay was CheckedIn
                if (currentStatus === 'CheckedIn' && stayRow.room_stays.RoomId !== null) {
                    await tx.update(roomsTable)
                        .set({ cleanStatus: 'Dirty' })
                        .where(eq(roomsTable.id, stayRow.room_stays.RoomId));
                }
            });

            if (statusError) {
                return reply.status((statusError as any).code).send({ message: (statusError as any).message });
            }

            reply.status(200).send({ message: "Stay cancelled successfully!" });
        } catch (error) {
            return reply.status(500).send({ error });
        }
    });
}
