# Botanika

Botanika is a responsive multi-page plant storefront built with plain HTML, CSS, and JavaScript, using Firebase Auth and Firestore as a lightweight backend.

## What It Includes

- Firebase-backed auth, profile management, carts, products, and orders
- Admin dashboard with realtime inventory updates and inventory filters
- Customer account page with profile editing, password reset, checkout, and order history
- Base64 image uploads for admin products and customer avatars
- Static hosting friendly structure for Netlify deployment

## Pages

- `index.html`: landing page and featured products
- `shop.html`: storefront and cart drawer
- `auth.html`: login and registration
- `user.html`: customer dashboard, checkout, and order history
- `admin.html`: admin inventory and user management

## Firebase Setup

1. Copy `js/firebase.config.example.js` to `js/firebase.config.js`.
2. Replace the placeholder config with your Firebase project values.
3. Enable Email/Password authentication in Firebase Auth.
4. Create a Firestore database in production or test mode.

`js/firebase.config.js` is ignored by git and should stay local.

## Default Admin Account

The app seeds a default admin account:

- Email: `admin@botanika.com`
- Password: `BotanikaAdmin!2026`

Change or remove these credentials before using the site in production.

## Image Limits

- Product uploads: 1 MB max
- Profile avatar uploads: 1 MB max

Uploaded images are stored as base64 strings in Firestore.

## Deployment

This project is configured for static deployment on Netlify. If you deploy to a different URL, update `robots.txt` and `sitemap.xml` to match the final production domain.
