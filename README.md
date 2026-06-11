# Premises

An Airbnb-style marketplace for renting and listing **commercial spaces** — offices, retail units, warehouses, studios, coworking floors, pop-ups, event venues, storage, medical suites and light-industrial units.

**Frontend-only prototype.** No backend, no APIs, no database, no real payments. All marketplace data is generated deterministically in `src/mocks/data.ts` (40 listings, 8 hosts, 300+ reviews, seeded bookings and message threads). Everything you do as a user — favourites, collections, compare, bookings, messages, published listings, calendar blocks, price overrides — persists in `localStorage` under `premises:*`.

## Run it

```sh
bun install
bun run dev        # http://localhost:5173
bun run build      # typecheck + production build
```

## Try the demo flows

Sign in from the avatar menu and pick a persona:

- **Maya Chen (renter)** — search with filters and the map, open a listing, pick dates, Instant Book or Request to Book, walk the mock checkout, save/compare spaces, message hosts, leave reviews on past bookings.
- **Daniel Okafor (host)** — host dashboard with pending requests to approve/decline, listings manager, the 8-step create-listing flow (drafts autosave), calendar blocking + per-day price overrides, mock earnings and insights.

Use **Switch to hosting / renting** in the header to flip modes on one account.

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · React Router 7 · Zustand (persisted)

Design system: Fraunces (display) / Schibsted Grotesk (body) / Spline Sans Mono (data), bone-paper background, Vault Green + Brass palette, offline blueprint-style map (no tile servers — works fully offline).
