import { FastifyInstance, FastifyRequest } from 'fastify';
import { db } from '../db/client';
import { roomsTable, roomStaysTable } from '../db/schema';
import { eq, and, or, sql } from 'drizzle-orm';
import { isAvailable } from '../availability';
import { format } from 'date-fns';
import { isHouseKeepingDue } from '../housekeeping';
import { validateAndParseDates } from '../utils/dateValidation';

// We have to define our typescript interfaces here too!
interface RoomId {
    id: string;
}

interface StayTime {
    checkInDate: string;
    checkOutDate: string;
}

export default async function roomsRoutes(fastify: FastifyInstance) {
    fastify.get('/api/rooms', async function (request, reply) {
        const rooms = await db.select()
            .from(roomsTable)
            .leftJoin(roomStaysTable, and(
                eq(roomsTable.id, roomStaysTable.RoomId),
                or(
                    eq(roomStaysTable.RoomStayStatus, "CheckedIn"),
                    and(
                        eq(roomStaysTable.RoomStayStatus, "Confirmed"),
                        sql`DATE(${roomStaysTable.CheckInDate}) <= CURRENT_DATE`,
                        sql`DATE(${roomStaysTable.CheckOutDate}) > CURRENT_DATE`
                    )
                )
            )
            );

        const roomsWithHK = rooms.map((room) => {
            if (room.room_stays?.RoomStayStatus === 'CheckedIn') {
                const realCheckIn = new Date(format(room.room_stays.CheckInDate, 'yyyy-MM-dd') + 'T00:00:00');
                const realCheckOut = new Date(format(room.room_stays.CheckOutDate, 'yyyy-MM-dd') + 'T00:00:00');
                const today = new Date(format(new Date(), 'yyyy-MM-dd') + 'T00:00:00');
                const housekeepingDue = isHouseKeepingDue(realCheckIn, realCheckOut, today);
                return { ...room, housekeepingDue };
            } else {
                return { ...room, housekeepingDue: false };
            }
        });

        reply.status(200).send(roomsWithHK);
    });

    fastify.get('/api/rooms/available', async function (request: FastifyRequest<{ Querystring: StayTime }>, reply) {
        const dateCheck = validateAndParseDates(request.query.checkInDate, request.query.checkOutDate);
        if (!dateCheck.isValid) {
            reply.status(400).send({ error: dateCheck.error });
            return;
        }
        const availableRooms = await isAvailable(dateCheck.checkIn, dateCheck.checkOut);
        reply.send({ availableRooms });
    });

    fastify.put('/api/rooms/:id/clean', async function (request: FastifyRequest<{ Params: RoomId }>, reply) {
        const roomId = request.params.id;

        await db.update(roomsTable)
            .set(({ cleanStatus: 'Clean' }))
            .where(eq(roomsTable.id, +roomId));

        reply.status(200).send({ message: "Room fully cleaned out!" });
    });

    fastify.put('/api/rooms/:id/dirty', async function (request: FastifyRequest<{ Params: RoomId }>, reply) {
        const roomId = request.params.id;

        await db.update(roomsTable)
            .set(({ cleanStatus: 'Dirty' }))
            .where(eq(roomsTable.id, +roomId));

        reply.status(200).send({ message: "Room marked dirty!" });
    });

    fastify.put<{ Params: RoomId; Body: { priorityTier?: number; conditionNotes?: string; cleanStatus?: string } }>('/api/rooms/:id', async function (request, reply) {
        const roomId = Number(request.params.id);
        const { priorityTier, conditionNotes, cleanStatus } = request.body;

        if (isNaN(roomId)) {
            reply.status(400).send({ message: "Invalid room ID!" });
            return;
        }

        const updates: any = {};
        if (priorityTier !== undefined) {
            if (![1, 2, 3].includes(Number(priorityTier))) {
                reply.status(400).send({ message: "PriorityTier must be 1, 2, or 3" });
                return;
            }
            updates.PriorityTier = Number(priorityTier);
        }

        if (conditionNotes !== undefined) {
            updates.ConditionNotes = conditionNotes.slice(0, 255);
        }

        if (cleanStatus !== undefined) {
            const validStatuses = ['Clean', 'Dirty', 'OutOfOrder', 'NotRented'];
            if (!validStatuses.includes(cleanStatus)) {
                reply.status(400).send({ message: "Invalid cleanStatus! Must be Clean, Dirty, OutOfOrder, or NotRented" });
                return;
            }
            updates.cleanStatus = cleanStatus;
        }

        if (Object.keys(updates).length === 0) {
            reply.status(400).send({ message: "No fields to update!" });
            return;
        }

        await db.update(roomsTable)
            .set(updates)
            .where(eq(roomsTable.id, roomId));

        reply.status(200).send({ message: "Room details updated successfully!" });
    });
}

