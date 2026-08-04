import { siteConfig } from "@/lib/site"
import type { Metadata } from "next"
import Image from "next/image"

export const metadata: Metadata = {
    title: "Contact Us",
    description: "Get in touch with the Rock City Motel front desk. Call for reservations, check our 24/7 hours, late arrival night bell info, and check-in times"
}

export default function ContactPage() {
    return (
        <main className="min-h-screen max-w-7xl mx-auto flex flex-col gap-12 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div className="flex w-full max-w-3xl flex-col items-start gap-8">
                <h1 className="animate-fade-up heading-accent font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                    Contact Us
                </h1>

                {/* Front desk photo — small, humanizing */}
                <div className="animate-fade-up [animation-delay:50ms] relative h-[240px] w-full overflow-hidden rounded-lg sm:h-[320px]">
                    <Image src="/office.webp" fill alt="Rock City Motel office as the customer sees it when they walk in" className="object-cover object-center" sizes="(max-width: 768px) 100vw, 40vw" />
                </div>

                <div className="animate-fade-up [animation-delay:100ms] grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                    {/* Phone & Email card */}
                    <div className="flex flex-col gap-5 rounded-lg border border-border-warm bg-white p-6">
                        <div>
                            <span className="mb-1 block text-sm font-semibold text-text-muted">
                                Desk Phone
                            </span>
                            <a href={siteConfig.phoneLink} className="text-xl font-bold text-foreground underline decoration-border-warm underline-offset-4 transition-colors hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red">
                                {siteConfig.phoneFormatted}
                            </a>
                        </div>
                        <div>
                            <span className="mb-1 block text-sm font-semibold text-text-muted">
                                Email
                            </span>
                            <a href={siteConfig.emailLink} className="break-all text-lg font-bold text-foreground underline decoration-border-warm underline-offset-4 transition-colors hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red">
                                {siteConfig.email}
                            </a>
                        </div>
                    </div>

                    {/* Address card */}
                    <div className="rounded-lg border border-border-warm bg-white p-6">
                        <span className="mb-2 block text-sm font-semibold text-text-muted">
                            Motel Location
                        </span>
                        <div className="text-lg font-bold text-foreground leading-snug">
                            {siteConfig.address.street}<br />
                            {siteConfig.address.city}, {siteConfig.address.state}, {siteConfig.address.zip}
                        </div>
                    </div>
                </div>

                <a
                    href={siteConfig.phoneLink}
                    className="animate-fade-up [animation-delay:150ms] inline-flex min-h-11 w-full items-center justify-center rounded-md bg-brand-red px-8 py-3.5 text-center font-bold text-white transition-colors hover:bg-brand-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
                >
                    Call Desk: {siteConfig.phoneFormatted}
                </a>

                {/* Operations & Policies banner */}
                <div className="animate-fade-up [animation-delay:200ms] flex w-full flex-col gap-5 rounded-lg bg-section-warm p-6 text-sm text-text-muted md:p-8">
                    <div>
                        <span className="mb-2 block text-base font-bold text-foreground">Front Desk Hours</span>
                        <p>Open 24/7. For late night arrivals, please ring the night bell next to the lobby door.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border-warm">
                        <div>
                            <span className="mb-1 block text-sm font-semibold text-foreground">Check-in</span>
                            <p className="font-medium text-foreground">2:00 PM</p>
                        </div>
                        <div>
                            <span className="mb-1 block text-sm font-semibold text-foreground">Checkout</span>
                            <p className="font-medium text-foreground">11:00 AM</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}