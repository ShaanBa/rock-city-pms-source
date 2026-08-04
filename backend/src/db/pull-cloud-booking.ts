/**
 * Optional recovery tool: copy a paid DirectWeb booking from a cloud DB to a LAN DB.
 *
 * Run on the LAN server (local DATABASE_URL = on-site Postgres).
 * Pass the cloud connection string only for this command (do not commit).
 *
 * Usage:
 *   $env:CLOUD_DATABASE_URL="postgresql://..."; npx tsx src/db/pull-cloud-booking.ts <reservation-uuid>
 *
 * Find the reservation id in payment metadata or the cloud reservations table.
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import {
    guestsTable,
    reservationsTable,
    roomStaysTable,
} from './schema';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const cloudUrl = process.env.CLOUD_DATABASE_URL;
const localUrl = process.env.DATABASE_URL;
const reservationId = process.argv[2];

if (!cloudUrl) {
    console.error('Missing CLOUD_DATABASE_URL (cloud Postgres connection string).');
    process.exit(1);
}
if (!localUrl) {
    console.error('Missing DATABASE_URL in root .env (LAN database).');
    process.exit(1);
}
if (!reservationId) {
    console.error('Usage: npx tsx src/db/pull-cloud-booking.ts <reservation-uuid>');
    process.exit(1);
}

async function main() {
    const cloudPool = new Pool({ connectionString: cloudUrl });
    const localPool = new Pool({ connectionString: localUrl });
    const cloudDb = drizzle(cloudPool);
    const localDb = drizzle(localPool);

    const [row] = await cloudDb
        .select()
        .from(reservationsTable)
        .leftJoin(guestsTable, eq(reservationsTable.GuestId, guestsTable.id))
        .leftJoin(roomStaysTable, eq(roomStaysTable.ReservationId, reservationsTable.id))
        .where(eq(reservationsTable.id, reservationId));

    if (!row?.reservations || !row.guests || !row.room_stays) {
        console.error('Not found on cloud DB (need reservation + guest + room_stay).');
        process.exit(1);
    }

    const { guests: guest, reservations: reservation, room_stays: stay } = row;

    if (!stay.RoomId) {
        console.error('Room stay has no RoomId on cloud — assign on Web Assign first, then re-run.');
        process.exit(1);
    }

    console.log(`Pulling: ${guest.FirstName} ${guest.LastName} → room id ${stay.RoomId}`);

    await localDb.transaction(async (tx) => {
        await tx.insert(guestsTable).values({
            id: guest.id,
            FirstName: guest.FirstName,
            LastName: guest.LastName,
            Phone: guest.Phone,
            Email: guest.Email,
            IsIdVerified: guest.IsIdVerified ?? false,
        }).onConflictDoNothing();

        await tx.insert(reservationsTable).values({
            id: reservation.id,
            GuestId: guest.id,
            BookingSource: 'DirectWeb',
            PaymentStatus: 'Paid',
            Status: reservation.Status,
            RequestedRoomType: reservation.RequestedRoomType,
            GroupName: reservation.GroupName,
            OtaConfirmedNumber: reservation.OtaConfirmedNumber,
            VccReference: reservation.VccReference,
        }).onConflictDoNothing();

        await tx.insert(roomStaysTable).values({
            id: stay.id,
            ReservationId: reservation.id,
            RoomId: stay.RoomId,
            CheckInDate: stay.CheckInDate,
            CheckOutDate: stay.CheckOutDate,
            NumberOfGuests: stay.NumberOfGuests,
            PetCount: stay.PetCount,
            AdditionalFees: stay.AdditionalFees,
            DiscountAmount: stay.DiscountAmount,
            RoomSubTotal: stay.RoomSubTotal,
            RoomTaxAmount: stay.RoomTaxAmount,
            RoomTotalAmount: stay.RoomTotalAmount,
            RoomStayStatus: stay.RoomStayStatus,
        }).onConflictDoNothing();
    });

    console.log('Done — refresh the staff dashboard.');
    await cloudPool.end();
    await localPool.end();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
