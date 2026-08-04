# Contributor guidance

- Keep production credentials, database dumps, guest data, and private deployment runbooks out of Git.
- Treat `backend/` staff routes as authenticated; do not add anonymous access outside `/api/public/*`, payment-intent creation, the signed Stripe webhook, and health.
- Payment totals must be calculated and verified on the server.
- Keep `frontend/` on a trusted staff network even when bearer tokens are configured.
- Run the package-specific typecheck, tests, lint, and build commands documented in the root README before submitting changes.
- Do not change repository licensing or visibility without owner approval.
