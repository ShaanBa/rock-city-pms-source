import { uuid, text, timestamp } from "drizzle-orm/pg-core";
import { boolean, decimal } from "drizzle-orm/pg-core";
import { integer, pgEnum, pgTable, varchar } from "drizzle-orm/pg-core"

export const cleanStatusEnum = pgEnum('CleanStatus', ['Clean', 'Dirty', 'OutOfOrder', 'NotRented'])
export const roomsTable = pgTable("rooms", {
    id: integer().primaryKey(),
    RoomNumber: integer().unique().notNull(),
    RoomType: varchar({ length: 255 }).notNull(),
    BasePrice: decimal("BasePrice", {
        precision: 10,
        scale: 2,
    }).notNull(),
    IsSmoking: boolean().notNull(),
    cleanStatus: cleanStatusEnum('CleanStatus').notNull(),
    PriorityTier: integer().notNull(),
    ConditionNotes: varchar({ length: 255 }),
})

export const guestsTable = pgTable("guests", {
    id: uuid().defaultRandom().primaryKey(),
    FirstName: varchar({ length: 255 }),
    LastName: varchar({ length: 255 }),
    Address: varchar({ length: 255 }),
    Phone: varchar({ length: 255 }),
    Email: varchar({ length: 255 }),
    LicensePlate: varchar({ length: 255 }),
    VehicleMake: varchar({ length: 255 }),
    IsIdVerified: boolean().notNull().default(false),
    StripeCustomerId: varchar({ length: 255 }),
    IsDNR: boolean().notNull().default(false),
    AdminNotes: text(),
})

export const paymentStatusEnum = pgEnum('PaymentStatus', ['Unpaid', 'Partial', 'Paid'])
export const bookingSourceEnum = pgEnum('BookingSource', ['DirectWeb', 'WalkIn', 'Phone', 'Expedia', 'BookingDotCom'])
export const reservationStatusEnum = pgEnum('ReservationStatus', ['Active', 'Completed', 'Cancelled'])
export const reservationsTable = pgTable("reservations", {
    id: uuid().defaultRandom().primaryKey(),
    GuestId: uuid().references(() => guestsTable.id, {
        onDelete: "restrict",
        onUpdate: "restrict",
    }).notNull(),
    GroupName: varchar({ length: 255 }),
    PaymentStatus: paymentStatusEnum('PaymentStatus').notNull(),
    BookingSource: bookingSourceEnum('BookingSource').notNull(),
    Status: reservationStatusEnum('ReservationStatus').notNull(),
    OtaConfirmedNumber: varchar({ length: 255 }),
    VccReference: varchar({ length: 255 }),
    RequestedRoomType: varchar({ length: 255 })
})

export const roomStayStatusEnum = pgEnum('RoomStayStatus', ['Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'])
export const roomStaysTable = pgTable("room_stays", {
    id: uuid().defaultRandom().primaryKey(),
    ReservationId: uuid().references(() => reservationsTable.id, {
        onDelete: "restrict",
        onUpdate: "restrict",
    }).notNull(),
    RoomId: integer().references(() => roomsTable.id, {
        onDelete: "restrict",
        onUpdate: "restrict",
    }),
    CheckInDate: timestamp({ withTimezone: true }).notNull(),
    CheckOutDate: timestamp({ withTimezone: true }).notNull(),
    NumberOfGuests: integer().notNull(),
    PetCount: integer().notNull().default(0),
    AdditionalFees: decimal("AdditionalFees", {
        precision: 10,
        scale: 2,
    }).notNull().default("0"),
    DiscountAmount: decimal("DiscountAmount", {
        precision: 10,
        scale: 2,
    }).notNull().default("0"),
    RoomSubTotal: decimal("RoomSubTotal", {
        precision: 10,
        scale: 2,
    }).notNull(),
    RoomTaxAmount: decimal("RoomTaxAmount", {
        precision: 10,
        scale: 2,
    }).notNull(),
    RoomTotalAmount: decimal("RoomTotalAmount", {
        precision: 10,
        scale: 2,
    }).notNull(),
    RoomStayStatus: roomStayStatusEnum('RoomStayStatus').notNull(),
})


export const transactionTypeEnum = pgEnum('TransactionType', ['Charge', 'Refund'])
export const paymentMethodEnum = pgEnum('PaymentMethod', ['Stripe', 'PhysicalCreditCard', 'VirtualCreditCard', 'Cash'])
export const payerTypeEnum = pgEnum('PayerType', ['Guest', 'Expedia', 'BookingDotCom', 'OtherCorporate'])
export const paymentsTable = pgTable('payments', {
    id: uuid().defaultRandom().primaryKey(),
    ReservationId: uuid().references(() => reservationsTable.id, {
        onDelete: "restrict",
        onUpdate: "restrict",
    }).notNull(),
    Amount: decimal("Amount", {
        precision: 10,
        scale: 2,
    }).notNull(),
    TransactionType: transactionTypeEnum('TransactionType').notNull(),
    PaymentMethod: paymentMethodEnum('PaymentMethod').notNull(),
    PayerType: payerTypeEnum('PayerType').notNull(),
    StripeChargeId: varchar({ length: 255 }),
    Timestamp: timestamp({ withTimezone: true }).notNull().defaultNow(),
})