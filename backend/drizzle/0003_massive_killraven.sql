CREATE TYPE "public"."RoomStayStatus" AS ENUM('Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled');--> statement-breakpoint
CREATE TABLE "room_stays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ReservationId" uuid NOT NULL,
	"RoomId" integer NOT NULL,
	"CheckInDate" timestamp with time zone NOT NULL,
	"CheckOutDate" timestamp with time zone NOT NULL,
	"NumberOfGuests" integer NOT NULL,
	"PetCount" integer DEFAULT 0 NOT NULL,
	"AdditionalFees" numeric(10, 2) DEFAULT '0' NOT NULL,
	"DiscountAmount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"RoomSubTotal" numeric(10, 2) NOT NULL,
	"RoomTaxAmount" numeric(10, 2) NOT NULL,
	"RoomTotalAmount" numeric(10, 2) NOT NULL,
	"RoomStayStatus" "RoomStayStatus" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "RoomNumber" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "room_stays" ADD CONSTRAINT "room_stays_ReservationId_reservations_id_fk" FOREIGN KEY ("ReservationId") REFERENCES "public"."reservations"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "room_stays" ADD CONSTRAINT "room_stays_RoomId_rooms_id_fk" FOREIGN KEY ("RoomId") REFERENCES "public"."rooms"("id") ON DELETE restrict ON UPDATE restrict;