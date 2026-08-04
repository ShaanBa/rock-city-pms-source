CREATE TYPE "public"."CleanStatus" AS ENUM('Clean', 'Dirty', 'OutOfOrder', 'NotRented');--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" integer PRIMARY KEY NOT NULL,
	"RoomNumber" integer,
	"RoomType" varchar(255) NOT NULL,
	"BasePrice" numeric(10, 2) NOT NULL,
	"IsSmoking" boolean NOT NULL,
	"CleanStatus" "CleanStatus" NOT NULL,
	"PriorityTier" integer NOT NULL,
	"ConditionNotes" varchar(255),
	CONSTRAINT "rooms_RoomNumber_unique" UNIQUE("RoomNumber")
);
