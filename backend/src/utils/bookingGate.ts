import type { FastifyReply } from "fastify"

export function isPublicBookingPaused(): boolean {
    return process.env.PUBLIC_BOOKING_PAUSED === "true"
}

export function sendBookingPaused(reply: FastifyReply) {
    reply.status(503).send({
        error: "Online booking is temporarily unavailable. Please call the front desk.",
        phone: "785-392-2165",
    })
}
