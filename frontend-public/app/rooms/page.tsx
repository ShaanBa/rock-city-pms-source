import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
export const metadata: Metadata = {
    title: "Rooms & Rates",
    description: 'View nightly pricing and configurations for our King, Double, and Family rooms. Clean and comfortable rooms for solo travelers and families alike'
}

export default function RoomsPage() {
    return (
        <main className="min-h-screen max-w-7xl mx-auto flex flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div className="flex w-full flex-col items-start gap-7">
                <h1 className="animate-fade-up heading-accent font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                    Our Rooms
                </h1>

                {/* Standard Amenities Banner */}
                <div className="animate-fade-up [animation-delay:100ms] flex w-full flex-col justify-between gap-4 rounded-lg bg-section-warm p-5 text-sm text-text-muted sm:flex-row sm:items-center">
                    <div>
                        <span className="mb-1 block text-sm font-bold text-foreground">Standard in All Rooms</span>
                        <p>Wi-Fi, cable TV, microwave, mini-fridge, and coffee maker in every room. <Link href="/amenities" className="font-semibold text-brand-red underline decoration-brand-red/30 underline-offset-4 transition-colors hover:text-brand-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red">Full amenity list →</Link></p>
                    </div>
                </div>

                {/* Rooms Grid */}
                <div className="mt-2 grid w-full grid-cols-1 gap-6 md:grid-cols-3">
                    {/* King Room */}
                    <div className="animate-fade-up [animation-delay:150ms] flex h-full flex-col overflow-hidden rounded-lg border border-border-warm bg-white">
                        <div className="relative h-[240px] w-full">
                            <Image src="/king.webp" fill alt="King room with king bed and TV" className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                        </div>
                        <div className="flex flex-col gap-4 p-6">
                            <h3 className="font-display text-2xl font-bold text-foreground">King Room</h3>
                            <ul className="text-sm text-text-muted space-y-2">
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-brand-red/50"></span>
                                    1 comfortable King bed
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-brand-red/50"></span>
                                    Perfect for couples or solo travelers
                                </li>
                            </ul>
                        </div>
                        <div className="mt-auto border-t border-border-warm bg-section-warm/60 px-6 py-5 text-3xl font-black text-brand-red">
                            $80<span className="block text-sm font-medium text-text-muted">per night + tax</span>
                        </div>
                    </div>

                    {/* Double Room */}
                    <div className="animate-fade-up [animation-delay:250ms] flex h-full flex-col overflow-hidden rounded-lg border border-border-warm bg-white">
                        <div className="relative h-[240px] w-full">
                            <Image src="/double.webp" fill alt="Double room with 2 queen beds and TV" className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                        </div>
                        <div className="flex flex-col gap-4 p-6">
                            <h3 className="font-display text-2xl font-bold text-foreground">Double Room</h3>
                            <ul className="text-sm text-text-muted space-y-2">
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-brand-red/50"></span>
                                    2 Queen size beds
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-brand-red/50"></span>
                                    Rate is for 1 person
                                </li>
                                <li className="flex items-center gap-2 text-text-muted/70">
                                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/20"></span>
                                    +$5 per additional guest
                                </li>
                            </ul>
                        </div>
                        <div className="mt-auto border-t border-border-warm bg-section-warm/60 px-6 py-5 text-3xl font-black text-brand-red">
                            $75<span className="block text-sm font-medium text-text-muted">per night + tax</span>
                        </div>
                    </div>

                    {/* Family Room */}
                    <div className="animate-fade-up [animation-delay:350ms] flex h-full flex-col overflow-hidden rounded-lg border border-border-warm bg-white">
                        <div className="relative h-[240px] w-full">
                            <Image src="/family.webp" fill alt="Family Room with 3 queen beds and TV" className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                        </div>
                        <div className="flex flex-col gap-4 p-6">
                            <h3 className="font-display text-2xl font-bold text-foreground">Family Room</h3>
                            <ul className="text-sm text-text-muted space-y-2">
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-brand-red/50"></span>
                                    3 Queen size beds
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-brand-red/50"></span>
                                    Rate is for 3 guests
                                </li>
                                <li className="flex items-center gap-2 text-text-muted/70">
                                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/20"></span>
                                    +$5 per additional guest
                                </li>
                            </ul>
                        </div>
                        <div className="mt-auto border-t border-border-warm bg-section-warm/60 px-6 py-5 text-3xl font-black text-brand-red">
                            $130<span className="block text-sm font-medium text-text-muted">per night + tax</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}