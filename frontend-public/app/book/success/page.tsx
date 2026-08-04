import { siteConfig } from "@/lib/site"
import Link from "next/link"

export default function SuccessPage() {
    return (
        <main className="min-h-screen max-w-7xl mx-auto flex flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div className="animate-fade-up flex w-full max-w-2xl flex-col gap-7">
                <header className="flex flex-col gap-3">
                    <p className="text-sm font-semibold text-brand-red">
                        Reservation confirmed
                    </p>
                    <h1 className="heading-accent font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                        You&apos;re Booked!
                    </h1>
                    <p className="text-base md:text-lg text-text-muted leading-relaxed">
                        You will receive a call detailing which room has been assigned to you as soon as possible.
                    </p>
                </header>

                <div className="flex flex-col gap-5 rounded-lg border border-border-warm bg-white p-6 md:p-8">
                    <div className="rounded-md bg-section-warm p-5 text-sm leading-relaxed text-text-muted">
                        <p className="font-semibold text-foreground mb-1">What happens next</p>
                        <p>
                            The front desk will call to confirm your room assignment. Check-in is at{" "}
                            <span className="font-semibold text-foreground">2:00 PM</span>.
                            For late arrivals, ring the night bell by the lobby door.
                        </p>
                    </div>

                    <div>
                        <span className="mb-1 block text-sm font-semibold text-text-muted">
                            Questions?
                        </span>
                        <a
                            href={siteConfig.phoneLink}
                            className="text-lg font-bold text-foreground underline decoration-border-warm underline-offset-4 transition-colors hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
                        >
                            Call the desk at {siteConfig.phoneFormatted}
                        </a>
                    </div>
                </div>

                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                    <a
                        href={siteConfig.phoneLink}
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-brand-red px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 sm:w-auto"
                    >
                        Call Desk: {siteConfig.phoneFormatted}
                    </a>
                    <Link
                        href="/"
                        className="inline-flex min-h-11 w-full items-center justify-center px-3 py-3 text-sm font-bold text-brand-red underline decoration-brand-red/30 underline-offset-4 transition-colors hover:text-brand-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 sm:w-auto"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </main>
    )
}
