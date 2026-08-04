import { siteConfig } from "@/lib/site"
export default function SiteFooter() {
    return (
        <footer className="mt-auto bg-brand-dark py-12">
            <div className="max-w-4xl mx-auto flex flex-col items-center gap-7 px-4 text-center sm:px-6 lg:px-8">
                <a href={siteConfig.phoneLink} className='inline-flex min-h-11 w-full items-center justify-center rounded-md bg-brand-red px-8 py-3.5 text-center font-bold text-white transition-colors hover:bg-brand-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark sm:w-auto'>
                    Call Desk: {siteConfig.phoneFormatted}
                </a>
                <address className="space-y-2 text-sm not-italic text-white/70">
                    <div>
                        You can email us at{" "}
                        <a href={siteConfig.emailLink} className="font-semibold text-white underline decoration-white/30 underline-offset-4 transition-colors hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                            {siteConfig.email}
                        </a>
                    </div>
                    <div className="font-medium text-white/80">{siteConfig.address.full}</div>
                    <div className="pt-3 text-xs text-white/50">
                        © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
                    </div>
                </address>
            </div>
        </footer>
    )
}