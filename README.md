# Botanika

![Botanika showcase](github-showcase.svg)

Botanika is a polished multi-page botanical storefront built with plain HTML, CSS, and JavaScript, backed by Firebase Auth and Firestore for lightweight realtime commerce flows.

## Highlights

- Realtime product, cart, profile, and order flows powered by Firebase
- Split customer and admin surfaces with inventory management and featured products
- Password reset, Google sign-in, and passwordless email-link sign-in support
- Base64 media uploads for product imagery and customer avatars with a 1 MB cap
- Static-hosting friendly deployment for Netlify

## Experience Map

- `index.html`: editorial landing page with featured products and brand storytelling
- `shop.html`: storefront, filters, cart drawer, and customer purchase flow
- `auth.html`: account creation, sign-in, Google auth, and magic-link entry point
- `user.html`: profile management, checkout form, and order history
- `admin.html`: product management, user visibility, and featured inventory controls

## Local Firebase Setup

1. Copy `js/firebase.config.example.js` to `js/firebase.config.js`.
2. Paste in your Firebase project values.
3. Enable these providers in Firebase Auth:
 `Email/Password`, `Google`, and `Email link (passwordless sign-in)`.
4. Create Firestore and apply security rules that allow public product reads, user-scoped carts/orders, and admin-only inventory management.

`js/firebase.config.js` stays local and is already ignored by git.

## Seeded Admin Account

The app seeds a default admin profile for first-run setup:

- Email: `admin@botanika.com`
- Password: `BotanikaAdmin!2026`

Rotate or remove that account before using the project as a real storefront.

## Media Limits

- Product uploads: 1 MB maximum
- Avatar uploads: 1 MB maximum

Uploads are stored as base64 strings in Firestore, which keeps the project serverless but makes file size limits important.

## Deployment

The current linked Netlify site is:

- `https://botanika-754.netlify.app`

If you move the site to a different domain, update `robots.txt` and `sitemap.xml` to match the final URL before publishing.
