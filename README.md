# Simba Supermarket

A modern e-commerce web app for Simba Supermarket, Rwanda's favourite supermarket.

Customers can browse the catalogue, manage a cart and wishlist, place orders, find
branches on a map and chat with an AI shopping assistant. Admins manage products and orders.

## Features

- Product catalogue with categories, product pages and reviews
- Cart, wishlist and order history
- Firebase Authentication (email/password and Google)
- Branch locator with maps and branch reviews
- AI assistant, product categorisation and catalogue generation (Gemini, server-side)
- Admin dashboard
- Multilingual UI (i18next)

## Tech stack

React + Vite + Tailwind CSS, Express server (`server.ts`), Firebase Auth & Firestore,
Google Gemini (`@google/genai`), Leaflet / Google Maps, Recharts.

## Getting started

```bash
npm install
cp .env.example .env    # then fill in the keys below
npm run dev             # http://localhost:3000
```

### Environment variables

| Variable | Used for |
|---|---|
| `GEMINI_API_KEY` | Server-side AI endpoints |
| `VITE_GOOGLE_MAPS_API_KEY` | Branch map |
| `VITE_FIREBASE_*` | Firebase project config (API key, auth domain, project, app, Firestore DB, storage, messaging) |

## API

| Endpoint | Purpose |
|---|---|
| `POST /api/ai/chat` | Shopping assistant chat |
| `POST /api/ai/categorize` | Suggest a category for a product |
| `POST /api/ai/generate-products` | Generate catalogue entries |

## Security

Firestore access rules live in [`firestore.rules`](firestore.rules); the threat model and
test payloads are documented in [`security_spec.md`](security_spec.md).

## Scripts

`npm run dev` · `npm run build` · `npm run start` · `npm run lint`
