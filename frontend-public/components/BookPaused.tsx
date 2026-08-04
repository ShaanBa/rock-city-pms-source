import Link from "next/link"
import { siteConfig } from "@/lib/site"

export default function BookPaused() {
    return (
        <main className="min-h-screen max-w-7xl mx-auto flex flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div className="animate-fade-up flex w-full max-w-2xl flex-col gap-7">
                <header className="flex flex-col gap-3">
                    <p className="text-sm font-semibold text-brand-red">
                        Online reservations
                    </p>
                    <h1 className="heading-accent font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                        Temporarily Paused
                    </h1>
                    <p className="text-base md:text-lg text-text-muted leading-relaxed">
                        We are finishing our direct booking system. To reserve a room now, please call the front desk —
                        we are happy to help and you will get our best rate.
                    </p>
                </header>

                <div className="flex flex-col gap-5 rounded-lg border border-border-warm bg-section-warm p-6 md:p-8">
                    <a
                        href={siteConfig.phoneLink}
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-brand-red px-8 py-3.5 font-bold text-white transition-colors hover:bg-brand-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
                    >
                        Call Desk: {siteConfig.phoneFormatted}
                    </a>
                    <Link
                        href="/rooms"
                        className="inline-flex min-h-11 w-full items-center justify-center px-6 py-3 text-sm font-bold text-brand-red underline decoration-brand-red/30 underline-offset-4 transition-colors hover:text-brand-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
                    >
                        View Rooms & Rates
                    </Link>
                </div>
            </div>
        </main>
    )
}
