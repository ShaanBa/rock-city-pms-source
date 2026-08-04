# Security policy

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability or include guest,
credential, payment, or infrastructure data in a report.

Send a private report through GitHub's private vulnerability reporting feature.
If that feature is unavailable, use the business contact listed on the public
website and request a secure reporting channel without including exploit
details in the first message.

Include the affected component, impact, reproduction conditions, and a minimal
proof of concept. Please allow reasonable time for investigation before public
disclosure.

## Deployment boundary

The checked-in configuration is for development. A production deployment must:

- configure independent `STAFF_API_KEY` and `IMPORT_API_KEY` values;
- restrict `CORS_ALLOWED_ORIGINS` to exact deployed origins;
- keep the Vite staff dashboard on a trusted network;
- use TLS at every internet-facing boundary;
- store all credentials outside Git;
- apply database least privilege, backups, monitoring, and network controls;
- retain Stripe webhook signature verification and server-authoritative prices.

Publishing the source does not make example credentials or defaults safe for
production.

## Supported versions

Security fixes are applied to the current `main` branch only.
