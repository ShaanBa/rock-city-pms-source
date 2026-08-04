import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
    title: "Amenities",
    description: "View our guest features including free high-speed Wi-Fi, on-site parking, pet-friendly rooms, and in-room amenities like microwaves and mini-fridges"
}

export default function AmenitiesPage() {
    return (
        <main className="min-h-screen max-w-7xl mx-auto flex flex-col gap-16 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            {/* On-Site Amenities */}
            <div className="flex flex-col gap-6 items-start w-full">
                <h1 className="animate-fade-up heading-accent font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                    Motel Amenities
                </h1>

                {/* Main amenities photo — wide establishing shot */}
                <div className="animate-fade-up [animation-delay:50ms] relative h-[280px] w-full overflow-hidden rounded-lg md:h-[420px]">
                    <Image src="/amenities.webp" fill alt="Room amenities including mini-fridge, microwave, and TV" className="object-cover object-center" sizes="(max-width: 768px) 100vw, 80vw" />
                </div>

                {/* Detail gallery — smaller secondary shots */}
                <div className="animate-fade-up [animation-delay:100ms] grid w-full grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-sm sm:aspect-[3/4]">
                        <Image src="/sink.webp" fill alt="Sink with towels on the wall rack with tissue papers" className="object-cover" sizes="33vw" />
                    </div>
                    <div className="relative aspect-[16/10] overflow-hidden rounded-sm sm:aspect-[3/4]">
                        <Image src="/coffee.webp" fill alt="Coffee Machine with coffee packs, cups, and straws" className="object-cover" sizes="33vw" />
                    </div>
                    <div className="relative aspect-[3/4] overflow-hidden rounded-sm">
                        <Image src="/bath.webp" fill alt="Clean toilet and tub with shampoo, conditioner, and soap." className="object-cover object-bottom" sizes="33vw" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
                    {[
                        "Free High-Speed Wi-Fi",
                        "Free On-Site Parking",
                        "24-Hour Front Desk Support",
                        "Pet-Friendly Rooms ($15/night)",
                        "Direct Access to Rock City Park",
                        "Ice Machine Available",
                        "Housekeeping (on request)",
                        "In-Room Air Conditioning",
                        "Microwave in Every Room",
                        "Mini-Fridge in Every Room",
                        "Coffee Maker in Every Room"
                    ].map((amenity, i) => (
                        <div key={i} className="animate-fade-up flex items-center gap-3 rounded-md border border-border-warm bg-white p-4 transition-colors hover:bg-section-warm" style={{ animationDelay: `${i * 50}ms` }}>
                            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-red/50"></span>
                            <span className="text-sm font-medium text-foreground/80">{amenity}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Nearby Amenities */}
            <div className="flex flex-col gap-6 items-start w-full">
                <h2 className="animate-fade-up heading-accent max-w-2xl font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                    Nearby Conveniences & Access
                </h2>

                <div className="animate-fade-up [animation-delay:100ms] grid w-full grid-cols-1 gap-7 rounded-lg bg-section-warm p-6 sm:grid-cols-2 md:p-8">
                    <div>
                        <span className="mb-3 block text-base font-bold text-foreground">Right Next Door</span>
                        <ul className="space-y-2 text-sm text-text-muted">
                            <li className="flex items-center gap-2">
                                <span className="text-brand-red font-bold">·</span>
                                Dollar General (one door down)
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-brand-red font-bold">·</span>
                                Liquor store (directly adjacent)
                            </li>
                        </ul>
                    </div>
                    <div>
                        <span className="mb-3 block text-base font-bold text-foreground">Downtown Minneapolis</span>
                        <ul className="space-y-2 text-sm text-text-muted">
                            <li className="flex items-center gap-2">
                                <span className="text-brand-red font-bold">·</span>
                                {"Casey's Gas Station"}
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-brand-red font-bold">·</span>
                                The Farm & The Odd Fellow Coffee Shop
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-brand-red font-bold">·</span>
                                Fajitas Mexican Restaurant
                            </li>
                        </ul>
                    </div>
                    <div className="sm:col-span-2 pt-4 border-t border-border-warm">
                        <span className="mb-3 block text-base font-bold text-foreground">Highway & City Access</span>
                        <ul className="space-y-2 text-sm text-text-muted">
                            <li className="flex items-center gap-2">
                                <span className="text-brand-red font-bold">·</span>
                                Located directly on K-106, right off US-81 / I-135
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-brand-red font-bold">·</span>
                                20 minutes from I-70 highway exit
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-brand-red font-bold">·</span>
                                30 minutes to Salina (major shopping & dining)
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-brand-red font-bold">·</span>
                                40 minutes to Concordia
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </main>
    )
}