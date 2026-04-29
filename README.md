# Simba Supermarket

> A modern, fast e-commerce experience for Rwanda's favourite supermarket.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-simba--online--v2.netlify.app-00C7B7?style=flat-square&logo=netlify)](https://simba-online-v2.netlify.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-99%25-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Backend-Firebase-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Deployed on Netlify](https://img.shields.io/badge/Deployed%20on-Netlify-00C7B7?style=flat-square&logo=netlify)](https://netlify.com/)

---

## Overview

Simba Supermarket is a full-stack web application providing an online shopping experience for Simba Supermarket in Rwanda. It is built with React and TypeScript on the frontend, powered by Google's Gemini AI, and backed by Firebase (Firestore + Auth). The app is deployed on Netlify.

---

## Features

- **Product browsing** — Browse and search the full product catalog
- **Shopping cart & orders** — Place orders with real-time status tracking
- **User accounts** — Authenticated profiles with address and order history
- **Product & branch reviews** — Leave ratings and comments (verified purchasers only for product reviews)
- **Wishlists** — Save favourite products for later
- **AI integration** — Powered by Google Gemini (`@google/genai`)
- **Maps** — Location features via React Leaflet and Google Maps
- **Promotions** — Public-facing promotional content managed by admins
- **Internationalization** — Multi-language support via `i18next`
- **Admin panel** — Inventory, suppliers, staff, purchase orders, and inventory alerts (admin-only)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4, `clsx`, `tailwind-merge` |
| Routing | React Router DOM v7 |
| AI | Google Gemini (`@google/genai`) |
| Backend / DB | Firebase v12 (Firestore, Authentication) |
| Maps | React Leaflet, `@react-google-maps/api` |
| Charts | Recharts |
| Animations | Motion |
| i18n | i18next, react-i18next |
| Dates | date-fns |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/mbishflavien/simba_2.git
cd simba_2

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Then open .env.local and add your GEMINI_API_KEY

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Your Google Gemini API key (required) |

See `.env.example` for all required variables.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run TypeScript type checking |
| `npm run clean` | Remove the `dist` directory |

---

## Project Structure

```
simba_2/
├── src/                      # Application source code
├── index.html                # HTML entry point
├── firestore.rules           # Firestore security rules (production)
├── DRAFT_firestore.rules     # Draft / work-in-progress rules
├── firebase-applet-config.json
├── firebase-blueprint.json
├── security_spec.md          # Security specification & threat model
├── metadata.json             # App metadata
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── vercel.json               # Vercel deployment configuration
└── .env.example              # Environment variable template
```

---

## Security

Security is taken seriously in this project. Firestore rules enforce strict data access controls:

- **Users** — Owners and admins only; `isAdmin` can only be set by an admin
- **Orders** — Visible to the owner or admins; status transitions are strictly controlled (e.g., users can only cancel a `pending` order)
- **Products** — Publicly readable; only admins can create, update, or delete
- **Product Reviews** — A user **must have a delivered or processing order** containing the product before they can leave a review
- **Branch Reviews** — Publicly readable; users can only submit reviews under their own identity
- **Wishlists, Suppliers, Staff, Purchase Orders** — Owner/admin scoped
- **Promotions** — Publicly readable, admin-write only

The `security_spec.md` file documents the full threat model, including a "Dirty Dozen" set of attack payloads tested against the Firestore rules (identity spoofing, rating overflow, timestamp spoofing, unpurchased reviews, anonymous spam, etc.).

---

## Deployment

The app is deployed on **Netlify**. To deploy your own instance:

1. Push the repository to GitHub
2. Import the project in [Netlify](https://netlify.com/)
3. Add the required environment variables in the Netlify project settings
4. Deploy

---

## Live Link

- **Production app**: [simba-online-v2.netlify.app](https://simba-online-v2.netlify.app/)

---

## License

This project is private. All rights reserved.
