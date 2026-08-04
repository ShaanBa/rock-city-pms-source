-- Custom SQL migration file, put your code below! --
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "room_stays"
ADD CONSTRAINT "no_overlapping_active_stays" EXCLUDE USING gist (
    "RoomId"
    WITH
        =,
        tstzrange (
            "CheckInDate",
            "CheckOutDate",
            '[)'
        )
    WITH
        &&
)
WHERE (
        "RoomStayStatus" NOT IN ('Cancelled', 'CheckedOut')
    )