import { siteConfig } from "@/lib/site"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Location & Directions",
    description: 'Find us easily in Minneapolis, KS right off US-81. Get driving directions from I-70, view landmarks like Dollar General, and plan your stop'
}

export default function LocationPage() {
    return (
        <main className="min-h-screen max-w-7xl mx-auto flex flex-col gap-12 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div className="flex w-full max-w-6xl flex-col items-start gap-8">
                <h1 className="animate-fade-up heading-accent font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                    Location & Directions
                </h1>

                <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 lg:gap-10">
                    {/* Directions Copy Box */}
                    <div className="animate-fade-up [animation-delay:100ms] flex flex-col gap-6">
                        <div className="rounded-lg border border-border-warm bg-white p-6">
                            <span className="mb-2 block text-sm font-semibold text-brand-red">
                                Physical Address
                            </span>
                            <div className="text-lg font-bold text-foreground">
                                {siteConfig.address.street}<br />
                                {siteConfig.address.city}, {siteConfig.address.state}, {siteConfig.address.zip}
                            </div>
                        </div>

                        <div className="flex flex-col gap-5 rounded-lg bg-section-warm p-6 text-sm text-text-muted">
                            <div>
                                <span className="mb-2 block text-base font-bold text-foreground">
                                    Highway Directions
                                </span>
                                <p className="leading-relaxed">
                                    We are located directly on <strong>K-106</strong>, just off <strong>US-81 / I-135</strong>.{" "}
                                    If you are traveling on <strong>I-70</strong>, we are approximately a <strong>20 minute</strong> drive north.
                                </p>
                            </div>
                            <div className="border-t border-border-warm pt-4">
                                <span className="mb-2 block text-base font-bold text-foreground">
                                    Nearby Reference Points
                                </span>
                                <p className="leading-relaxed">
                                    Look for us right next door to the local <strong>Dollar General</strong> (one door down)
                                    and adjacent to the liquor store.
                                </p>
                            </div>
                        </div>

                        <a
                            href={siteConfig.googleMapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-brand-red px-6 py-3.5 text-center font-bold text-white transition-colors hover:bg-brand-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
                        >
                            Open in Google Maps App
                        </a>
                    </div>

                    {/* Styled Map Container */}
                    <div className="animate-fade-up [animation-delay:200ms] h-[380px] w-full overflow-hidden rounded-lg border border-border-warm md:h-full md:min-h-[500px]">
                        <iframe
                            src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2809.3183030435503!2d-97.695976!3d39.118082199999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x87bd297d3002ccdf%3A0xb6961374980e471b!2sRock%20City%20Motel!5e1!3m2!1sen!2sus!4v1782858642918!5m2!1sen!2sus'
                            className="w-full h-full border-0"
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                        ></iframe>
                    </div>
                </div>
            </div>
        </main>
    )
}