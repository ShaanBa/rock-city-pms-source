CREATE TYPE "public"."BookingSource" AS ENUM('DirectWeb', 'WalkIn', 'Phone', 'Expedia', 'BookingDotCom');--> statement-breakpoint
CREATE TYPE "public"."PaymentStatus" AS ENUM('Unpaid', 'Partial', 'Paid');--> statement-breakpoint
CREATE TYPE "public"."ReservationStatus" AS ENUM('Active', 'Completed', 'Cancelled');--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"GuestId" uuid NOT NULL,
	"GroupName" varchar(255),
	"PaymentStatus" "PaymentStatus" NOT NULL,
	"BookingSource" "BookingSource" NOT NULL,
	"ReservationStatus" "ReservationStatus" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_GuestId_guests_id_fk" FOREIGN KEY ("GuestId") REFERENCES "public"."guests"("id") ON DELETE restrict ON UPDATE restrict;