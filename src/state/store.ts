import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Booking, Listing, Review, ThreadMessage } from "../mocks/types";
import { LISTINGS, PERSONAS } from "../mocks/data";

export interface Session {
  id: string;
  name: string;
  avatar: string;
  mode: "renter" | "host";
}

export interface Collection {
  id: string;
  name: string;
  ids: string[];
}

interface AppState {
  session: Session | null;
  authOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  signIn: (persona: keyof typeof PERSONAS) => void;
  signOut: () => void;
  setMode: (m: "renter" | "host") => void;

  favorites: string[];
  toggleFav: (id: string) => boolean;
  collections: Collection[];
  addCollection: (name: string) => string;
  toggleInCollection: (cid: string, lid: string) => void;
  removeCollection: (cid: string) => void;

  compare: string[];
  toggleCompare: (id: string) => void;
  clearCompare: () => void;

  recents: string[];
  pushRecent: (id: string) => void;

  myBookings: Booking[];
  addBooking: (b: Booking) => void;
  updateBooking: (id: string, patch: Partial<Booking>) => void;

  decisions: Record<string, "confirmed" | "declined">;
  decide: (id: string, s: "confirmed" | "declined") => void;

  myMessages: Record<string, ThreadMessage[]>;
  appendMessage: (tid: string, m: ThreadMessage) => void;

  myReviews: Review[];
  addReview: (r: Review) => void;

  published: Listing[];
  publish: (l: Listing) => void;
  updateListing: (id: string, patch: Partial<Listing>) => void;

  draft: Record<string, unknown> | null;
  setDraft: (d: Record<string, unknown> | null) => void;

  blockedOverrides: Record<string, string[]>;
  toggleBlocked: (lid: string, date: string) => void;
  priceOverrides: Record<string, Record<string, number>>;
  setPriceOverride: (lid: string, date: string, price: number | null) => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      session: null,
      authOpen: false,
      openAuth: () => set({ authOpen: true }),
      closeAuth: () => set({ authOpen: false }),
      signIn: (persona) => set({ session: { ...PERSONAS[persona] }, authOpen: false }),
      signOut: () => set({ session: null }),
      setMode: (mode) => set((s) => (s.session ? { session: { ...s.session, mode } } : {})),

      favorites: [],
      toggleFav: (id) => {
        const has = get().favorites.includes(id);
        set((s) => ({
          favorites: has ? s.favorites.filter((f) => f !== id) : [...s.favorites, id],
          collections: has
            ? s.collections.map((c) => ({ ...c, ids: c.ids.filter((i) => i !== id) }))
            : s.collections,
        }));
        return !has;
      },
      collections: [],
      addCollection: (name) => {
        const id = `c-${Date.now()}`;
        set((s) => ({ collections: [...s.collections, { id, name, ids: [] }] }));
        return id;
      },
      toggleInCollection: (cid, lid) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === cid
              ? { ...c, ids: c.ids.includes(lid) ? c.ids.filter((i) => i !== lid) : [...c.ids, lid] }
              : c,
          ),
        })),
      removeCollection: (cid) => set((s) => ({ collections: s.collections.filter((c) => c.id !== cid) })),

      compare: [],
      toggleCompare: (id) =>
        set((s) => ({
          compare: s.compare.includes(id)
            ? s.compare.filter((c) => c !== id)
            : s.compare.length >= 4
              ? s.compare
              : [...s.compare, id],
        })),
      clearCompare: () => set({ compare: [] }),

      recents: [],
      pushRecent: (id) =>
        set((s) => ({ recents: [id, ...s.recents.filter((r) => r !== id)].slice(0, 20) })),

      myBookings: [],
      addBooking: (b) => set((s) => ({ myBookings: [b, ...s.myBookings] })),
      updateBooking: (id, patch) =>
        set((s) => ({ myBookings: s.myBookings.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),

      decisions: {},
      decide: (id, st) => set((s) => ({ decisions: { ...s.decisions, [id]: st } })),

      myMessages: {},
      appendMessage: (tid, m) =>
        set((s) => ({ myMessages: { ...s.myMessages, [tid]: [...(s.myMessages[tid] ?? []), m] } })),

      myReviews: [],
      addReview: (r) => set((s) => ({ myReviews: [r, ...s.myReviews] })),

      published: [],
      publish: (l) => set((s) => ({ published: [l, ...s.published] })),
      updateListing: (id, patch) =>
        set((s) => ({ published: s.published.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),

      draft: null,
      setDraft: (draft) => set({ draft }),

      blockedOverrides: {},
      toggleBlocked: (lid, date) =>
        set((s) => {
          const cur = s.blockedOverrides[lid] ?? [];
          return {
            blockedOverrides: {
              ...s.blockedOverrides,
              [lid]: cur.includes(date) ? cur.filter((d) => d !== date) : [...cur, date],
            },
          };
        }),
      priceOverrides: {},
      setPriceOverride: (lid, date, price) =>
        set((s) => {
          const cur = { ...(s.priceOverrides[lid] ?? {}) };
          if (price == null) delete cur[date];
          else cur[date] = price;
          return { priceOverrides: { ...s.priceOverrides, [lid]: cur } };
        }),
    }),
    {
      name: "premises:app",
      partialize: (s) => ({
        session: s.session,
        favorites: s.favorites,
        collections: s.collections,
        compare: s.compare,
        recents: s.recents,
        myBookings: s.myBookings,
        decisions: s.decisions,
        myMessages: s.myMessages,
        myReviews: s.myReviews,
        published: s.published,
        draft: s.draft,
        blockedOverrides: s.blockedOverrides,
        priceOverrides: s.priceOverrides,
      }),
    },
  ),
);

/** All listings visible in the marketplace: seed + user-published. */
export function useAllListings(): Listing[] {
  const published = useApp((s) => s.published);
  return [...published, ...LISTINGS];
}

export function findListing(id: string, published: Listing[]): Listing | undefined {
  return published.find((l) => l.id === id) ?? LISTINGS.find((l) => l.id === id);
}

/* ---------- toasts (not persisted) ---------- */

export interface Toast {
  id: number;
  msg: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastState {
  toasts: Toast[];
  push: (msg: string, actionLabel?: string, onAction?: () => void) => void;
  dismiss: (id: number) => void;
}

let toastId = 0;
export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (msg, actionLabel, onAction) => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, msg, actionLabel, onAction }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 5000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
