import type { Metadata } from "next"
import BookPaused from "@/components/BookPaused"
import { isBookingPaused } from "@/lib/booking"

export const metadata: Metadata = {
    title: "Book Your Stay",
    description:
        "Reserve your stay directly with Rock City Motel. Choose dates, pick a room type, and pay online — or call the front desk.",
}

export default function BookLayout({
    children,
}: {
    children: React.ReactNode
}) {
    if (isBookingPaused()) {
        return <BookPaused />
    }
    return children
}
