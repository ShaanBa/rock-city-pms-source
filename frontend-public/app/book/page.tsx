"use client"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useState, useEffect } from "react"
import { siteConfig } from "@/lib/site"

interface AvailableRoomType {
    roomType: string;
    basePrice: string;
    totalCount: number;
    isSmoking: boolean;
}

interface OnlineBookingData {
    checkIn: string;
    checkOut: string;
    numberOfGuests: number;
    numberOfPets: number;
}

interface Quote {
    roomSubTotal: number
    additionalFees: number
    roomTaxAmount: number
    roomTotalAmount: number
}

interface GuestData {
    firstName: string;
    lastName: string;
    phoneNumber: string;
}

const STEPS = [
    { id: 1, label: "Dates" },
    { id: 2, label: "Room" },
    { id: 3, label: "Quote" },
    { id: 4, label: "Pay" },
] as const

const inputClassName =
    "w-full min-h-11 rounded-md border border-border-warm bg-white px-4 py-3 text-foreground transition-colors focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/30"
const primaryButtonClassName =
    "mt-2 w-full inline-flex items-center justify-center min-h-11 rounded-md bg-brand-red px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
const labelClassName = "text-sm font-semibold text-foreground/80"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

function formatStayDates(checkIn: string, checkOut: string) {
    if (!checkIn || !checkOut) return null
    const opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric", year: "numeric" }
    const inDate = new Date(`${checkIn}T12:00:00`)
    const outDate = new Date(`${checkOut}T12:00:00`)
    return `${inDate.toLocaleDateString("en-US", opts)} → ${outDate.toLocaleDateString("en-US", opts)}`
}

function smokingLabel(isSmoking: boolean) {
    return isSmoking ? "Smoking room" : "Non-smoking"
}

export default function BookPage() {
    const [step, setStep] = useState<number>(1);
    const [availableTypes, setAvailableTypes] = useState<AvailableRoomType[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [quote, setQuote] = useState<Quote | null>(null);
    const [guestData, setGuestData] = useState<GuestData>({
        firstName: '',
        lastName: '',
        phoneNumber: ''
    })

    const [createdReservationId, setCreatedReservationId] = useState<string>('')
    const [totalAmount, setTotalAmount] = useState<number>(0)
    const [formData, setFormData] = useState<OnlineBookingData>({
        checkIn: '',
        checkOut: '',
        numberOfGuests: 1,
        numberOfPets: 0
    })
    const [type, setType] = useState<AvailableRoomType>({} as AvailableRoomType)

    const [clientSecret, setClientSecret] = useState<string>('')

    useEffect(() => {
        async function postPayment() {
            try {
                setLoading(true)
                setError('')
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/intent`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        reservationId: createdReservationId,
                    })
                })
                if (!response.ok) throw new Error('Failed to create payment intent');
                const data = await response.json()
                setClientSecret(data.clientSecret)
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err))
            } finally {
                setLoading(false)
            }
        }
        if (step === 4 && totalAmount > 0 && !clientSecret) {
            postPayment()
        }
    }, [step, totalAmount, createdReservationId, clientSecret])

    async function handleCheckAvailability(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault()
        try {
            setLoading(true);
            setError('');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/availability?checkIn=${formData.checkIn}&checkOut=${formData.checkOut}`);
            if (!response.ok) throw new Error('Failed to check availability');
            const data = await response.json();
            setAvailableTypes(data.availableRooms);
            setStep(2);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateReservation(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault()
        try {
            setLoading(true);
            setError('');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/reservations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstName: guestData.firstName,
                    lastName: guestData.lastName,
                    phoneNumber: guestData.phoneNumber,
                    checkIn: formData.checkIn,
                    checkOut: formData.checkOut,
                    roomType: type.roomType,
                    numberOfGuests: formData.numberOfGuests,
                    petCount: formData.numberOfPets
                })
            })
            if (!response.ok) throw new Error('Failed to book');
            const data = await response.json()
            setCreatedReservationId(data.reservationId)
            setTotalAmount(data.roomTotalAmount)
            setClientSecret('')
            setStep(4);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
        } finally {
            setLoading(false);
        }
    }

    async function handleQuote(e: React.MouseEvent<HTMLButtonElement>, selectedRoomType: AvailableRoomType) {
        e.preventDefault()
        try {
            setLoading(true);
            setError('');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/quote?checkIn=${formData.checkIn}&checkOut=${formData.checkOut}&roomType=${selectedRoomType.roomType}&numberOfGuests=${formData.numberOfGuests}&petCount=${formData.numberOfPets}&`);
            if (!response.ok) throw new Error('Failed to get quote');
            const data = await response.json();
            setQuote(data);
            setType(selectedRoomType)
            setStep(3);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
        } finally {
            setLoading(false);
        }
    }

    const stayDates = formatStayDates(formData.checkIn, formData.checkOut)

    return (
        <main className="min-h-screen max-w-7xl mx-auto flex flex-col gap-9 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <header className="animate-fade-up flex flex-col gap-3 max-w-2xl">
                <h1 className="heading-accent font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                    Reserve Your Stay
                </h1>
                <p className="text-base md:text-lg text-text-muted leading-relaxed">
                    Book directly with us — no booking fees. Prefer to talk to someone?{" "}
                    <a href={siteConfig.phoneLink} className="font-semibold text-brand-red underline decoration-brand-red/30 underline-offset-4 transition-colors hover:text-brand-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red">
                        Call {siteConfig.phoneFormatted}
                    </a>
                </p>
            </header>

            <nav aria-label="Booking progress" className="animate-fade-up [animation-delay:100ms] w-full max-w-2xl">
                <ol className="grid grid-cols-4 w-full">
                    {STEPS.map((s, index) => {
                        const isComplete = step > s.id
                        const isCurrent = step === s.id
                        const connectorDone = step > s.id
                        return (
                            <li key={s.id} className="relative flex flex-col items-center text-center">
                                {index < STEPS.length - 1 && (
                                    <span
                                        className={[
                                            "pointer-events-none absolute top-5 left-[calc(50%+1.25rem)] h-0.5 w-[calc(100%-2.5rem)] rounded-full",
                                            connectorDone ? "bg-brand-red" : "bg-border-warm",
                                        ].join(" ")}
                                        aria-hidden="true"
                                    />
                                )}
                                <span
                                    className={[
                                            "relative z-10 flex h-10 w-10 items-center justify-center rounded-md border-2 text-sm font-bold transition-colors",
                                        isComplete || isCurrent
                                            ? "bg-brand-red border-brand-red text-white"
                                            : "bg-background border-border-warm text-text-muted",
                                    ].join(" ")}
                                    aria-current={isCurrent ? "step" : undefined}
                                >
                                    {isComplete ? (
                                        <span aria-hidden="true">✓</span>
                                    ) : (
                                        s.id
                                    )}
                                </span>
                                <span
                                    className={[
                                        "mt-2 text-xs font-semibold sm:text-sm",
                                        isCurrent || isComplete ? "text-foreground" : "text-text-muted",
                                    ].join(" ")}
                                >
                                    {s.label}
                                </span>
                            </li>
                        )
                    })}
                </ol>
            </nav>

            {error && (
                <div
                    role="alert"
                    className="animate-fade-up w-full max-w-2xl rounded-md border border-brand-red/30 bg-brand-red/5 px-5 py-4 text-sm text-foreground"
                >
                    <p className="font-semibold text-brand-red mb-1">Something went wrong</p>
                    <p className="text-text-muted">{error}</p>
                </div>
            )}

            {step === 1 && (
                <form className="animate-fade-up [animation-delay:150ms] w-full max-w-xl">
                    <div className="flex flex-col gap-5 rounded-lg border border-border-warm bg-white p-6 md:p-8">
                        <h2 className="border-b border-border-warm pb-3 font-display text-xl font-bold text-foreground">
                            Your dates & party
                        </h2>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="checkInDate" className={labelClassName}>Check-in</label>
                            <input
                                type="date"
                                id="checkInDate"
                                name="checkInDate"
                                autoComplete="off"
                                className={inputClassName}
                                value={formData.checkIn}
                                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="checkOutDate" className={labelClassName}>Check-out</label>
                            <input
                                type="date"
                                id="checkOutDate"
                                name="checkOutDate"
                                autoComplete="off"
                                className={inputClassName}
                                value={formData.checkOut}
                                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="numberOfGuests" className={labelClassName}>Number of guests</label>
                            <input
                                type="number"
                                id="numberOfGuests"
                                name="numberOfGuests"
                                min={1}
                                autoComplete="off"
                                className={inputClassName}
                                value={formData.numberOfGuests}
                                onChange={(e) => setFormData({ ...formData, numberOfGuests: +e.target.value })}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="numberOfPets" className={labelClassName}>Number of pets</label>
                            <input
                                type="number"
                                id="numberOfPets"
                                name="numberOfPets"
                                min={0}
                                autoComplete="off"
                                className={inputClassName}
                                value={formData.numberOfPets}
                                onChange={(e) => setFormData({ ...formData, numberOfPets: +e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            className={primaryButtonClassName}
                            disabled={loading || !formData.checkIn || !formData.checkOut}
                            onClick={(e) => handleCheckAvailability(e)}
                        >
                            {loading ? "Checking…" : "Check Availability"}
                        </button>
                    </div>
                </form>
            )}

            {step === 2 && (
                <div className="flex flex-col gap-6 w-full animate-fade-up">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 max-w-2xl">
                        <div>
                            <h2 className="text-lg font-display font-bold text-foreground">Choose a room type</h2>
                            {stayDates && (
                                <p className="text-sm text-text-muted mt-1">{stayDates}</p>
                            )}
                        </div>
                        <button
                            type="button"
                            className="self-start text-sm font-semibold text-brand-red underline decoration-brand-red/30 underline-offset-4 transition-colors hover:text-brand-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
                            onClick={() => { setStep(1); setError('') }}
                        >
                            ← Change dates
                        </button>
                    </div>

                    {availableTypes.length === 0 ? (
                        <div className="flex w-full max-w-xl flex-col gap-4 rounded-lg border border-border-warm bg-section-warm p-6 md:p-8">
                            <p className="text-foreground font-semibold">No rooms available for those dates.</p>
                            <p className="text-sm text-text-muted leading-relaxed">
                                Try different dates, or call the front desk — we may be able to help.
                            </p>
                            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                                <button
                                    type="button"
                                    className={primaryButtonClassName}
                                    onClick={() => { setStep(1); setError('') }}
                                >
                                    Pick New Dates
                                </button>
                                <a
                                    href={siteConfig.phoneLink}
                                    className="inline-flex min-h-11 w-full items-center justify-center px-4 py-3 text-sm font-bold text-brand-red underline decoration-brand-red/30 underline-offset-4 transition-colors hover:text-brand-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
                                >
                                    Call {siteConfig.phoneFormatted}
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                            {availableTypes.map((roomTypeInfo) => (
                                <div
                                    key={roomTypeInfo.roomType}
                                    className="flex h-full flex-col gap-3 rounded-lg border border-border-warm bg-white p-6"
                                >
                                    <h3 className="text-xl font-display font-bold text-foreground border-b border-border-warm pb-2">
                                        {roomTypeInfo.roomType}
                                    </h3>
                                    <p className="text-2xl font-black text-brand-red">
                                        {roomTypeInfo.basePrice}
                                        <span className="block text-sm font-medium text-text-muted">
                                            per night + tax
                                        </span>
                                    </p>
                                    <p className="text-sm text-text-muted">{smokingLabel(roomTypeInfo.isSmoking)}</p>
                                    <button
                                        type="button"
                                        className={primaryButtonClassName}
                                        disabled={loading}
                                        onClick={async (e) => {
                                            await handleQuote(e, roomTypeInfo)
                                        }}
                                    >
                                        {loading ? "Loading…" : "Select"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {step === 3 && (
                <div className="flex flex-col gap-6 w-full max-w-xl animate-fade-up">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                        <div>
                            <h2 className="heading-accent font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                                Quote Summary
                            </h2>
                            {type.roomType && (
                                <p className="text-sm text-text-muted mt-3">
                                    <span className="font-semibold text-foreground">{type.roomType}</span>
                                    {stayDates ? ` · ${stayDates}` : ""}
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            className="self-start text-sm font-semibold text-brand-red underline decoration-brand-red/30 underline-offset-4 transition-colors hover:text-brand-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
                            onClick={() => { setStep(2); setError('') }}
                        >
                            ← Change room
                        </button>
                    </div>

                    <div className="flex flex-col gap-3 rounded-lg border border-border-warm bg-section-warm p-6 md:p-8">
                        <p className="flex justify-between text-sm text-text-muted">
                            <span>Subtotal</span>
                            <span className="font-semibold text-foreground">${quote?.roomSubTotal.toFixed(2)}</span>
                        </p>
                        <p className="flex justify-between text-sm text-text-muted">
                            <span>Additional fees</span>
                            <span className="font-semibold text-foreground">${quote?.additionalFees.toFixed(2)}</span>
                        </p>
                        <p className="flex justify-between text-sm text-text-muted">
                            <span>Tax (13.5%)</span>
                            <span className="font-semibold text-foreground">${quote?.roomTaxAmount.toFixed(2)}</span>
                        </p>
                        <div className="border-t border-border-warm pt-3 mt-1" />
                        <p className="flex justify-between text-lg font-bold text-foreground">
                            <span>Total</span>
                            <span className="text-brand-red">${quote?.roomTotalAmount.toFixed(2)}</span>
                        </p>
                    </div>

                    <form className="w-full">
                        <div className="flex flex-col gap-5 rounded-lg border border-border-warm bg-white p-6 md:p-8">
                            <h3 className="border-b border-border-warm pb-3 font-display text-xl font-bold text-foreground">
                                Guest details
                            </h3>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="firstName" className={labelClassName}>First name</label>
                                <input
                                    className={inputClassName}
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    autoComplete="given-name"
                                    value={guestData.firstName}
                                    onChange={(e) => setGuestData({ ...guestData, firstName: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="lastName" className={labelClassName}>Last name</label>
                                <input
                                    className={inputClassName}
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    autoComplete="family-name"
                                    value={guestData.lastName}
                                    onChange={(e) => setGuestData({ ...guestData, lastName: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="phoneNumber" className={labelClassName}>Phone number</label>
                                <input
                                    className={inputClassName}
                                    type="tel"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    autoComplete="tel"
                                    value={guestData.phoneNumber}
                                    onChange={(e) => setGuestData({ ...guestData, phoneNumber: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                className={primaryButtonClassName}
                                disabled={loading || !guestData.firstName || !guestData.lastName || !guestData.phoneNumber}
                                onClick={(e) => handleCreateReservation(e)}
                            >
                                {loading ? "Creating reservation…" : "Continue to Payment"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {step === 4 && (
                <div className="flex flex-col gap-6 w-full max-w-xl animate-fade-up">
                    <div>
                        <h2 className="heading-accent font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                            Secure Payment
                        </h2>
                        <p className="text-sm text-text-muted mt-3 leading-relaxed">
                            {type.roomType && (
                                <>
                                    <span className="font-semibold text-foreground">{type.roomType}</span>
                                    {stayDates ? ` · ${stayDates}` : ""}
                                    {" · "}
                                </>
                            )}
                            Total due:{" "}
                            <span className="font-bold text-brand-red">${totalAmount.toFixed(2)}</span>
                        </p>
                        <p className="text-xs text-text-muted mt-2">
                            Your reservation is held. Complete payment below to confirm.
                        </p>
                    </div>

                    {loading && !clientSecret && (
                        <div className="rounded-lg border border-border-warm bg-white p-6 text-sm text-text-muted md:p-8">
                            Preparing secure payment…
                        </div>
                    )}

                    {clientSecret && (
                        <Elements
                            stripe={stripePromise}
                            options={{
                                clientSecret,
                                appearance: {
                                    theme: "stripe",
                                    variables: {
                                        colorPrimary: "#A63D35",
                                        colorBackground: "#FDFCFA",
                                        colorText: "#1A2332",
                                        colorDanger: "#A63D35",
                                        fontFamily: "Karla, system-ui, sans-serif",
                                        borderRadius: "12px",
                                    },
                                },
                            }}
                        >
                            <CheckOutForm />
                        </Elements>
                    )}
                </div>
            )}
        </main>
    )
}

export function CheckOutForm() {
    const stripe = useStripe()
    const elements = useElements()
    const [paying, setPaying] = useState(false)
    const [payError, setPayError] = useState('')

    async function handlePayment(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault()
        if (!stripe || !elements) return;

        setPaying(true)
        setPayError('')

        const result = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/book/success`
            }
        })

        if (result.error) {
            setPayError(result.error.message ?? "Payment failed. Please try again.")
            setPaying(false)
        }
    }

    if (!stripe || !elements) {
        return (
            <div className="rounded-lg border border-border-warm bg-white p-6 text-sm text-text-muted md:p-8">
                Loading payment form…
            </div>
        )
    }

    return (
        <form className="flex w-full flex-col gap-6 rounded-lg border border-border-warm bg-white p-6 md:p-8">
            <p className="text-sm font-semibold text-text-muted">
                Card details · Secure checkout
            </p>
            <PaymentElement />
            {payError && (
                <div role="alert" className="rounded-md border border-brand-red/20 bg-brand-red/5 px-4 py-3 text-sm text-brand-red">
                    {payError}
                </div>
            )}
            <button
                type="submit"
                className={primaryButtonClassName}
                disabled={paying || !stripe || !elements}
                onClick={handlePayment}
            >
                {paying ? "Processing…" : "Pay Now"}
            </button>
        </form>
    )
}
