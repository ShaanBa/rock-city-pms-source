import { db } from "./client";
import { guestsTable, reservationsTable, roomStaysTable } from "./schema";
import { addDays } from "date-fns";

async function main() {
    console.log("=== Creating Paid, Unassigned Web Booking ===");
    try {
        const [guest] = await db.insert(guestsTable).values({
            FirstName: "Jane",
            LastName: "Doe",
            Phone: "785-555-9876",
            Email: "jane.doe@example.com",
            IsIdVerified: false,
        }).returning();
        console.log(`Created Guest: ${guest.FirstName} ${guest.LastName} (${guest.id})`);

        const [reservation] = await db.insert(reservationsTable).values({
            GuestId: guest.id,
            BookingSource: "DirectWeb",
            PaymentStatus: "Paid",
            Status: "Active",
            RequestedRoomType: "King",
        }).returning();
        console.log(`Created Paid DirectWeb Reservation: ${reservation.id}`);

        const checkIn = new Date();
        const checkOut = addDays(checkIn, 2);

        const [roomStay] = await db.insert(roomStaysTable).values({
            ReservationId: reservation.id,
            RoomStayStatus: "Confirmed",
            RoomSubTotal: "140.97",
            AdditionalFees: "0.00",
            RoomTaxAmount: "19.03",
            RoomTotalAmount: "160.00",
            CheckInDate: checkIn,
            CheckOutDate: checkOut,
            PetCount: 0,
            NumberOfGuests: 2,
        }).returning();
        console.log(`Created Unassigned RoomStay (${roomStay.id}) from ${checkIn.toISOString().slice(0, 10)} to ${checkOut.toISOString().slice(0, 10)}`);
        
        console.log("\nSuccess! Unassigned booking created.");
        process.exit(0);
    } catch (error) {
        console.error("Failed to create test booking:", error);
        process.exit(1);
    }
}

main();
