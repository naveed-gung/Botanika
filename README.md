# Botanika

![Botanika showcase](github-showcase.svg)

Botanika is a polished multi-page botanical storefront built with plain HTML, CSS, and JavaScript, backed by Firebase Auth and Firestore for lightweight realtime commerce flows.

This repository is a college project built to stay fully zero-funded, so the app uses Cloud Firestore only and does not depend on Firebase Storage.

## Highlights

- Realtime product, cart, profile, and order flows powered by Firebase
- Split customer and admin surfaces with inventory management and featured products
- Password reset, Google sign-in, and passwordless email-link sign-in support
- Base64 media uploads for product imagery and customer avatars with a 1 MB cap
- Static-hosting friendly deployment for Netlify
- Structured as a college submission with a public storefront, admin surface, and account area

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
4. Create Firestore and publish the included `firestore.rules` file so public product reads, user-scoped carts/orders, and admin-only inventory management can work.

`js/firebase.config.js` stays local and is already ignored by git.

Firebase Storage is intentionally not used in this project.

## Admin Setup

This version does not auto-seed an admin from the browser.

Create a normal account first, then set `isAdmin: true` on that user document in Firestore to unlock the admin dashboard.

That keeps the project compatible with Firestore rules and avoids unsafe browser-side seeding.

## Media Limits

- Product uploads: 1 MB maximum
- Avatar uploads: 1 MB maximum

Uploads are stored as base64 strings in Firestore, which keeps the project serverless but makes file size limits important.

## Deployment

The current linked Netlify site is:

- `https://botanika-754.netlify.app`

If you move the site to a different domain, update `robots.txt` and `sitemap.xml` to match the final URL before publishing.
