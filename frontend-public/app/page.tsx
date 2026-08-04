import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { siteConfig } from '@/lib/site'
export const metadata: Metadata = {
  title: "Rock City Motel | Minneapolis, KS",
  description: "Affordable lodging in Minneapolis, KS near I-70 and US-81. Clean, cozy rooms with free Wi-Fi, microwave, and mini-fridge. Call us directly to book"
}
export default function Page() {
  return (
    <main className='min-h-screen max-w-7xl mx-auto flex flex-col gap-14 px-4 py-8 sm:px-6 sm:py-10 lg:px-8'>
      <section className="flex min-h-[calc(100svh-8rem)] flex-col gap-10 rounded-lg bg-brand-dark px-6 py-10 md:flex-row md:items-center md:gap-14 md:px-12 md:py-16 lg:px-16">
        <div className="flex flex-col items-start gap-6 md:w-3/5 md:gap-8">
          <h1 className="animate-fade-up text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-5xl">
            Clean, Comfortable, Cozy, and Affordable Lodging in Minneapolis, KS
          </h1>

          <p className="animate-fade-up [animation-delay:150ms] max-w-xl text-lg leading-relaxed text-white/75 md:text-xl">
            A family owned motel right off US-81 / I-135, offering a cozy stay with all the comforts a weary soul needs.
          </p>

          <div className="animate-fade-up [animation-delay:300ms] mt-2 flex w-full flex-col items-start gap-3 sm:w-auto sm:flex-row sm:items-center">
            <a href={siteConfig.phoneLink} className='inline-flex min-h-11 w-full items-center justify-center rounded-md bg-brand-red px-6 py-3.5 text-center font-bold text-white transition-colors hover:bg-brand-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark sm:w-auto'>Phone: {siteConfig.phoneFormatted}</a>
            <Link href='/book' className='inline-flex min-h-11 w-full items-center justify-center px-4 py-3 text-center font-bold text-white underline decoration-white/35 underline-offset-4 transition-colors hover:text-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark sm:w-auto'>
              Book Now
            </Link>
          </div>
        </div>

        <div className="animate-fade-up [animation-delay:200ms] relative h-[300px] w-full overflow-hidden rounded-sm border border-white/15 md:h-[480px] md:w-2/5">
          <Image src="/doors.webp" fill alt="Exterior view of Rock City Motel rooms with red doors and parking." className="object-cover object-center" sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
      </section>

      <section className="flex w-full flex-col items-start gap-8 py-4 md:py-8">
        <h2 className="animate-fade-up heading-accent max-w-2xl font-display text-3xl font-bold capitalize tracking-tight text-foreground md:text-4xl">Why guests choose the rock city motel</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full">
          <div className="animate-fade-up [animation-delay:100ms] flex flex-col gap-4 border-b border-border-warm py-6 md:border-b-0 md:pr-4">
            <h3 className="font-display text-xl font-bold text-foreground md:text-2xl">Well-Equipped Rooms</h3>
            <p className="text-sm text-text-muted leading-relaxed">King, Double, and Family layouts for solo travelers, couples, and groups. Every room is set up for a comfortable highway stop.</p>
            <Link href='/rooms' className="mt-auto text-sm font-semibold text-brand-red transition-colors hover:text-brand-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red">
              View Rooms & Rates →
            </Link>
          </div>
          <div className="animate-fade-up [animation-delay:200ms] flex flex-col gap-4 border-b border-border-warm py-6 md:border-b-0 md:border-l md:border-border-warm md:pl-8">
            <h3 className="font-display text-xl font-bold text-foreground md:text-2xl">Convenient Highway Access</h3>
            <p className="text-sm text-text-muted leading-relaxed">We are located just 20 minutes north of the I-70 junction and right off of I-135 / US-81 for easy on-and-off travel.</p>
            <Link href={'/location'} className="mt-auto text-sm font-semibold text-brand-red transition-colors hover:text-brand-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red">
              Get Directions & View Map →
            </Link>
          </div>
          <div className="animate-fade-up [animation-delay:300ms] flex flex-col gap-4 py-6 md:border-l md:border-border-warm md:pl-8">
            <h3 className="font-display text-xl font-bold text-foreground md:text-2xl">Unbeatable Value</h3>
            <p className="text-sm text-text-muted leading-relaxed">We offer the most bang for your buck in the area. Enjoy highly affordable rates, especially when booking directly through a phone call or on this website.</p>
            <Link href={'/book'} className="mt-auto text-sm font-semibold text-brand-red transition-colors hover:text-brand-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red">
              Book Now →
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}