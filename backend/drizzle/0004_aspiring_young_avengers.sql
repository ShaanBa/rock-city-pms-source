CREATE TYPE "public"."PayerType" AS ENUM('Guest', 'Expedia', 'BookingDotCom', 'OtherCorporate');--> statement-breakpoint
CREATE TYPE "public"."PaymentMethod" AS ENUM('Stripe', 'PhysicalCreditCard', 'VirtualCreditCard', 'Cash');--> statement-breakpoint
CREATE TYPE "public"."TransactionType" AS ENUM('Charge', 'Refund');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ReservationId" uuid NOT NULL,
	"Amount" numeric(10, 2) NOT NULL,
	"TransactionType" "TransactionType" NOT NULL,
	"PaymentMethod" "PaymentMethod" NOT NULL,
	"PayerType" "PayerType" NOT NULL,
	"StripeChargeId" varchar(255),
	"Timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_ReservationId_reservations_id_fk" FOREIGN KEY ("ReservationId") REFERENCES "public"."reservations"("id") ON DELETE restrict ON UPDATE restrict;