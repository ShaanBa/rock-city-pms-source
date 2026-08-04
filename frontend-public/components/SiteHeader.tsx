"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { siteConfig } from "@/lib/site"

const navItems = [
    { href: "/rooms", label: "Rooms" },
    { href: "/location", label: "Location" },
    { href: "/amenities", label: "Amenities" },
    { href: "/book", label: "Reservations" },
    { href: "/contact", label: "Contact" },
] as const

export default function SiteHeader() {
    const pathname = usePathname()
    const [menuOpen, setMenuOpen] = useState(false)

    function linkClass(href: string) {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href))
        return [
            "nav-link min-h-11 inline-flex items-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-4",
            active ? "font-bold text-brand-red" : "font-semibold text-foreground/70",
        ].join(" ")
    }

    return (
        <header className="w-full border-b border-border-warm bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-row justify-between items-center gap-4 py-3 sm:py-4">
                <Link href="/" className="shrink-0" onClick={() => setMenuOpen(false)}>
                    <Image
                        src="/rockcitymotellogo.webp"
                        alt="Rock City Motel Logo"
                        width={240}
                        height={80}
                        className="h-12 sm:h-14 w-auto"
                        priority
                    />
                </Link>

                <nav className="hidden md:block" aria-label="Main">
                    <ul className="flex flex-row items-center gap-6 lg:gap-8">
                        {navItems.map((item) => (
                            <li key={item.href}>
                                <Link href={item.href} className={linkClass(item.href)}>
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="flex items-center gap-2 md:hidden">
                    <a
                        href={siteConfig.phoneLink}
                        className="inline-flex min-h-11 items-center justify-center px-3 text-sm font-bold text-brand-red transition-colors hover:text-brand-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
                        aria-label={`Call desk ${siteConfig.phoneFormatted}`}
                    >
                        Call
                    </a>
                    <button
                        type="button"
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border-warm bg-white text-foreground transition-colors hover:border-brand-red/40 hover:bg-section-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
                        aria-expanded={menuOpen}
                        aria-controls="mobile-nav"
                        onClick={() => setMenuOpen((open) => !open)}
                    >
                        <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
                        <span aria-hidden="true" className="relative block h-4 w-5">
                            <span
                                className={[
                                    "absolute left-0 top-0 block h-0.5 w-5 bg-foreground transition-transform",
                                    menuOpen ? "top-1.5 rotate-45" : "",
                                ].join(" ")}
                            />
                            <span
                                className={[
                                    "absolute left-0 top-1.5 block h-0.5 w-5 bg-foreground transition-opacity",
                                    menuOpen ? "opacity-0" : "",
                                ].join(" ")}
                            />
                            <span
                                className={[
                                    "absolute left-0 top-3 block h-0.5 w-5 bg-foreground transition-transform",
                                    menuOpen ? "top-1.5 -rotate-45" : "",
                                ].join(" ")}
                            />
                        </span>
                    </button>
                </div>
            </div>

            {menuOpen && (
                <nav
                    id="mobile-nav"
                    className="border-t border-border-warm bg-background md:hidden"
                    aria-label="Mobile"
                >
                    <ul className="max-w-7xl mx-auto flex flex-col px-4 py-3">
                        {navItems.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`${linkClass(item.href)} w-full py-3 border-b border-border-warm last:border-b-0`}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                        <li className="pt-3">
                            <a
                                href={siteConfig.phoneLink}
                                className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-brand-red px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
                            >
                                Call Desk: {siteConfig.phoneFormatted}
                            </a>
                        </li>
                    </ul>
                </nav>
            )}
        </header>
    )
}
