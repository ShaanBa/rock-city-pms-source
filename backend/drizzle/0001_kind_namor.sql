CREATE TABLE "guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"FirstName" varchar(255),
	"LastName" varchar(255),
	"Address" varchar(255),
	"Phone" varchar(255),
	"Email" varchar(255),
	"LicensePlate" varchar(255),
	"VehicleMake" varchar(255),
	"IsIdVerified" boolean DEFAULT false NOT NULL,
	"StripeCustomerId" varchar(255),
	"IsDNR" boolean DEFAULT false NOT NULL,
	"AdminNotes" text
);
