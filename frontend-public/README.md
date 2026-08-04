# Public website

Next.js website for marketing pages and the direct-booking flow.

Copy `.env.example` to `.env.local`, then provide the public API URL, a Stripe publishable test key, and the booking pause flag.

```bash
npm ci
npm run dev
```

The booking API remains responsible for availability, authoritative pricing, reservation creation, and payment-intent amounts. Never put Stripe secret or webhook keys in this package.

Quality checks:

```bash
npm run lint
npm run build
```
