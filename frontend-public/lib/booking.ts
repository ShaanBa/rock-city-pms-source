/** When true, /book shows pause screen and public API rejects booking routes. */
export function isBookingPaused(): boolean {
    return process.env.NEXT_PUBLIC_BOOKING_PAUSED === "true"
}
