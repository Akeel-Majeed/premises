import type { Breakdown, Cancellation, Listing, Term } from "../mocks/types";

/* ---------- money ---------- */

export function fmtMoney(n: number): string {
  return "£" + Math.round(n).toLocaleString("en-GB");
}

export const TERM_SUFFIX: Record<Term, string> = {
  hourly: "/hr",
  daily: "/day",
  weekly: "/wk",
  monthly: "/mo",
  longTerm: "/mo",
};

export const TERM_LABEL: Record<Term, string> = {
  hourly: "Hourly",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  longTerm: "Long-term",
};

export const TERM_UNIT: Record<Term, string> = {
  hourly: "hour",
  daily: "day",
  weekly: "week",
  monthly: "month",
  longTerm: "month",
};

export const SERVICE_FEE_PCT = 12;

export function breakdown(l: Listing, term: Term, units: number): Breakdown {
  const rate = l.terms[term] ?? 0;
  const base = rate * units;
  let discountPct = 0;
  if (term === "weekly") discountPct = l.discounts.weeklyPct;
  if (term === "monthly" || term === "longTerm") discountPct = l.discounts.monthlyPct;
  const discount = Math.round((base * discountPct) / 100);
  const cleaning = term === "hourly" ? Math.round(l.cleaningFee / 2) : l.cleaningFee;
  const service = Math.round(((base - discount) * SERVICE_FEE_PCT) / 100);
  return {
    base,
    discount,
    cleaning,
    service,
    total: base - discount + cleaning + service,
    deposit: l.deposit,
  };
}

/** Normalised daily-equivalent price, for sorting/filters across terms. */
export function normDaily(l: Listing): number {
  if (l.terms.daily) return l.terms.daily;
  if (l.terms.hourly) return l.terms.hourly * 8;
  if (l.terms.weekly) return Math.round(l.terms.weekly / 5);
  if (l.terms.monthly) return Math.round(l.terms.monthly / 22);
  if (l.terms.longTerm) return Math.round(l.terms.longTerm / 22);
  return 0;
}

/** Headline price + suffix for a listing given an optional preferred term. */
export function headlinePrice(l: Listing, term?: Term | null): { amount: number; suffix: string } {
  if (term && l.terms[term]) return { amount: l.terms[term]!, suffix: TERM_SUFFIX[term] };
  const order: Term[] = ["daily", "monthly", "hourly", "weekly", "longTerm"];
  for (const t of order) {
    if (l.terms[t]) return { amount: l.terms[t]!, suffix: TERM_SUFFIX[t] };
  }
  return { amount: 0, suffix: "" };
}

/* ---------- dates ---------- */

export function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return iso(new Date());
}

export function addDays(isoDate: string, n: number): string {
  const d = new Date(isoDate + "T12:00:00");
  d.setDate(d.getDate() + n);
  return iso(d);
}

export function diffDays(a: string, b: string): number {
  return Math.round((new Date(b + "T12:00:00").getTime() - new Date(a + "T12:00:00").getTime()) / 86400000);
}

export function fmtDate(isoDate: string): string {
  return new Date(isoDate + "T12:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function fmtDateLong(isoDate: string): string {
  return new Date(isoDate + "T12:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fmtRange(start: string, end: string): string {
  return `${fmtDate(start)} – ${fmtDate(end)}`;
}

/* ---------- labels ---------- */

export const CANCEL_LABEL: Record<Cancellation, string> = {
  flexible: "Flexible",
  moderate: "Moderate",
  strict: "Strict",
  contract: "Long-term contract",
};

export const CANCEL_DESC: Record<Cancellation, string> = {
  flexible: "Full refund up to 24 hours before the booking starts.",
  moderate: "Full refund up to 5 days before; 50% refund after that.",
  strict: "50% refund up to 14 days before; non-refundable after.",
  contract: "Governed by the signed term agreement; notice period applies.",
};

export const NOISE_LABEL = {
  quiet: "Quiet building — low noise only",
  moderate: "Moderate noise permitted",
  industrialOk: "Industrial noise levels OK",
} as const;

export const FITOUT_LABEL = {
  none: "No alterations",
  cosmetic: "Cosmetic changes only",
  light: "Light fit-out allowed",
  full: "Full fit-out / customisation allowed",
} as const;

export const SIGNAGE_LABEL = {
  none: "No signage",
  interior: "Interior signage only",
  exterior: "Exterior signage allowed",
  storefront: "Full storefront signage",
} as const;

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ---------- search query ---------- */

export interface SearchQuery {
  q: string;
  type: string;
  term: Term | "";
  min: number | null;
  max: number | null;
  sqft: number | null;
  cap: number | null;
  amen: string[];
  parking: string;
  access: boolean;
  instant: boolean;
  verified: boolean;
  zoning: string;
  suit: string;
  rating: number | null;
  cancel: string;
  sort: string;
  start: string;
  end: string;
}

export function parseQuery(sp: URLSearchParams): SearchQuery {
  const num = (k: string) => (sp.get(k) ? Number(sp.get(k)) : null);
  return {
    q: sp.get("q") ?? "",
    type: sp.get("type") ?? "",
    term: (sp.get("term") as Term) ?? "",
    min: num("min"),
    max: num("max"),
    sqft: num("sqft"),
    cap: num("cap"),
    amen: sp.get("amen")?.split(",").filter(Boolean) ?? [],
    parking: sp.get("parking") ?? "",
    access: sp.get("access") === "1",
    instant: sp.get("instant") === "1",
    verified: sp.get("verified") === "1",
    zoning: sp.get("zoning") ?? "",
    suit: sp.get("suit") ?? "",
    rating: num("rating"),
    cancel: sp.get("cancel") ?? "",
    sort: sp.get("sort") ?? "recommended",
    start: sp.get("start") ?? "",
    end: sp.get("end") ?? "",
  };
}

export function queryToParams(q: Partial<SearchQuery>): URLSearchParams {
  const sp = new URLSearchParams();
  const set = (k: string, v: unknown) => {
    if (v === "" || v == null || v === false) return;
    if (Array.isArray(v)) {
      if (v.length) sp.set(k, v.join(","));
      return;
    }
    sp.set(k, v === true ? "1" : String(v));
  };
  set("q", q.q);
  set("type", q.type);
  set("term", q.term);
  set("min", q.min);
  set("max", q.max);
  set("sqft", q.sqft);
  set("cap", q.cap);
  set("amen", q.amen);
  set("parking", q.parking);
  set("access", q.access);
  set("instant", q.instant);
  set("verified", q.verified);
  set("zoning", q.zoning);
  set("suit", q.suit);
  set("rating", q.rating);
  set("cancel", q.cancel);
  if (q.sort && q.sort !== "recommended") sp.set("sort", q.sort);
  set("start", q.start);
  set("end", q.end);
  return sp;
}

export function applyQuery(listings: Listing[], q: SearchQuery, verifiedHostIds: Set<string>): Listing[] {
  let out = listings.filter((l) => l.status === "active");
  if (q.q) {
    const needle = q.q.toLowerCase();
    out = out.filter(
      (l) =>
        l.city.toLowerCase().includes(needle) ||
        l.neighborhood.toLowerCase().includes(needle) ||
        l.title.toLowerCase().includes(needle),
    );
  }
  if (q.type) out = out.filter((l) => l.spaceType === q.type);
  if (q.term) out = out.filter((l) => l.terms[q.term as Term] != null);
  const priceOf = (l: Listing) => (q.term ? l.terms[q.term as Term]! : normDaily(l));
  if (q.min != null) out = out.filter((l) => priceOf(l) >= q.min!);
  if (q.max != null) out = out.filter((l) => priceOf(l) <= q.max!);
  if (q.sqft != null) out = out.filter((l) => l.sqft >= q.sqft!);
  if (q.cap != null) out = out.filter((l) => l.capacity >= q.cap!);
  if (q.amen.length) out = out.filter((l) => q.amen.every((a) => l.amenities.includes(a)));
  if (q.parking) out = out.filter((l) => (q.parking === "any" ? l.parking.type !== "none" : l.parking.type === q.parking));
  if (q.access) out = out.filter((l) => l.accessibility.length >= 2);
  if (q.instant) out = out.filter((l) => l.instantBook);
  if (q.verified) out = out.filter((l) => verifiedHostIds.has(l.hostId));
  if (q.zoning) out = out.filter((l) => l.zoning.toLowerCase().includes(q.zoning.toLowerCase()));
  if (q.suit) out = out.filter((l) => l.suitability.includes(q.suit));
  if (q.rating != null) out = out.filter((l) => l.rating >= q.rating!);
  if (q.cancel === "flexible") out = out.filter((l) => l.cancellation === "flexible");
  if (q.cancel === "moderate") out = out.filter((l) => l.cancellation === "flexible" || l.cancellation === "moderate");
  if (q.start && q.end) {
    out = out.filter((l) => {
      let d = q.start;
      while (d <= q.end) {
        if (l.blocked.includes(d) || l.booked.includes(d)) return false;
        d = addDays(d, 1);
      }
      return true;
    });
  }
  return sortListings(out, q.sort, q.term || null);
}

export function sortListings(listings: Listing[], sort: string, term: Term | null): Listing[] {
  const arr = [...listings];
  const price = (l: Listing) => (term && l.terms[term] ? l.terms[term]! : normDaily(l));
  switch (sort) {
    case "priceAsc":
      return arr.sort((a, b) => price(a) - price(b));
    case "priceDesc":
      return arr.sort((a, b) => price(b) - price(a));
    case "rating":
      return arr.sort((a, b) => b.rating - a.rating);
    case "sqft":
      return arr.sort((a, b) => b.sqft - a.sqft);
    case "newest":
      return arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    default:
      // recommended: rating weighted by review volume, instant-book boost
      return arr.sort(
        (a, b) =>
          b.rating * Math.log(b.reviewCount + 2) +
          (b.instantBook ? 0.4 : 0) -
          (a.rating * Math.log(a.reviewCount + 2) + (a.instantBook ? 0.4 : 0)),
      );
  }
}
