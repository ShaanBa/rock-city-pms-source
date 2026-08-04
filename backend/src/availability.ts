import { db } from './db/client'
import {roomsTable, roomStaysTable} from './db/schema'
import { inArray, and, notExists, eq, gt, lt, ne } from 'drizzle-orm';

export async function hasStayOverlap(roomId: number, requestedCheckIn: Date, requestedCheckOut: Date, excludeStayId?: string): Promise<boolean> {
    const conditions = [
        eq(roomStaysTable.RoomId, roomId),
        inArray(roomStaysTable.RoomStayStatus, ['Confirmed', 'CheckedIn']),
        lt(roomStaysTable.CheckInDate, requestedCheckOut),
        gt(roomStaysTable.CheckOutDate, requestedCheckIn),
    ];

    if (excludeStayId) {
        conditions.push(ne(roomStaysTable.id, excludeStayId));
    }

    const overlappingStays = await db.select()
        .from(roomStaysTable)
        .where(and(...conditions))
        .limit(1);

    return overlappingStays.length > 0;
}

export async function isAvailable(requestedCheckIn: Date, requestedCheckOut: Date) {
    const availableRooms = await db.select()
    .from(roomsTable)
    .where(
        and(
            inArray(roomsTable.cleanStatus, ['Clean', 'Dirty' ]),
            notExists(
                db.select()
                .from(roomStaysTable)
                .where(
                    and(
                        eq(roomsTable.id, roomStaysTable.RoomId),
                        inArray(roomStaysTable.RoomStayStatus, ['Confirmed', 'CheckedIn']),
                        lt(roomStaysTable.CheckInDate, requestedCheckOut),
                        gt(roomStaysTable.CheckOutDate, requestedCheckIn),
                    )
                )
            )
        )
    ).orderBy(roomsTable.PriorityTier)
    return availableRooms; 
}