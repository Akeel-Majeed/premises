import type { Booking, Faq, Host, Listing, Review, SpaceType, Term, Thread } from "./types";
import { addDays, breakdown, todayIso } from "../lib/utils";

/* Deterministic PRNG so the "marketplace" is identical every load. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260611);
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const chance = (p: number) => rnd() < p;
const round5 = (n: number) => Math.round(n / 5) * 5;

/* ---------- registries ---------- */

export const AMENITIES: { key: string; label: string; group: string }[] = [
  { key: "wifi", label: "Wi-Fi", group: "Connectivity & AV" },
  { key: "conference", label: "Conference equipment", group: "Connectivity & AV" },
  { key: "projector", label: "Projector", group: "Connectivity & AV" },
  { key: "sound", label: "Sound system", group: "Connectivity & AV" },
  { key: "private-entrance", label: "Private entrance", group: "Access & Logistics" },
  { key: "loading-bay", label: "Loading bay", group: "Access & Logistics" },
  { key: "freight-elevator", label: "Freight elevator", group: "Access & Logistics" },
  { key: "passenger-elevator", label: "Passenger elevator", group: "Access & Logistics" },
  { key: "parking", label: "Parking", group: "Access & Logistics" },
  { key: "ev-charging", label: "EV charging", group: "Access & Logistics" },
  { key: "wheelchair", label: "Wheelchair access", group: "Access & Logistics" },
  { key: "storage", label: "Storage", group: "Access & Logistics" },
  { key: "meeting-rooms", label: "Meeting rooms", group: "Workspace & Furnishings" },
  { key: "reception", label: "Reception area", group: "Workspace & Furnishings" },
  { key: "desks", label: "Desks", group: "Workspace & Furnishings" },
  { key: "chairs", label: "Chairs", group: "Workspace & Furnishings" },
  { key: "shelving", label: "Shelving", group: "Workspace & Furnishings" },
  { key: "kitchenette", label: "Kitchenette", group: "Workspace & Furnishings" },
  { key: "restrooms", label: "Restrooms", group: "Workspace & Furnishings" },
  { key: "hvac", label: "HVAC", group: "Climate & Power" },
  { key: "industrial-power", label: "Industrial power (3-phase)", group: "Climate & Power" },
  { key: "water", label: "Water access", group: "Climate & Power" },
  { key: "ventilation", label: "Ventilation", group: "Climate & Power" },
  { key: "natural-light", label: "Natural light", group: "Climate & Power" },
  { key: "cameras", label: "Security cameras", group: "Safety & Security" },
  { key: "alarm", label: "Alarm system", group: "Safety & Security" },
  { key: "fire-safety", label: "Fire safety equipment", group: "Safety & Security" },
  { key: "display-windows", label: "Display windows", group: "Retail" },
];

export const SUITABILITY: { key: string; label: string }[] = [
  { key: "office-work", label: "Office work" },
  { key: "retail", label: "Retail" },
  { key: "popup", label: "Pop-up shop" },
  { key: "event", label: "Event" },
  { key: "photoshoot", label: "Photoshoot" },
  { key: "filming", label: "Filming" },
  { key: "storage", label: "Storage" },
  { key: "warehouse", label: "Warehouse" },
  { key: "fitness", label: "Fitness" },
  { key: "beauty", label: "Beauty / wellness" },
  { key: "medical", label: "Medical" },
  { key: "food-prep", label: "Food preparation" },
  { key: "workshop", label: "Workshop" },
  { key: "education", label: "Education / training" },
  { key: "coworking", label: "Coworking" },
  { key: "showroom", label: "Showroom" },
  { key: "light-industrial", label: "Light industrial" },
];

export const SPACE_TYPES: { key: SpaceType; label: string; mono: string; blurb: string }[] = [
  { key: "office", label: "Office", mono: "Of", blurb: "Private floors & suites" },
  { key: "retail", label: "Retail", mono: "Re", blurb: "High-street units" },
  { key: "warehouse", label: "Warehouse", mono: "Wh", blurb: "Storage & distribution" },
  { key: "studio", label: "Studio", mono: "St", blurb: "Daylight & production" },
  { key: "coworking", label: "Coworking", mono: "Cw", blurb: "Desks & floors" },
  { key: "popup", label: "Pop-up", mono: "Pu", blurb: "Short-term shopfronts" },
  { key: "event", label: "Event venue", mono: "Ev", blurb: "Halls & galleries" },
  { key: "storage", label: "Storage", mono: "Sg", blurb: "Lock-ups & dry stores" },
  { key: "medical", label: "Medical suite", mono: "Md", blurb: "Clinics & practice rooms" },
  { key: "industrial", label: "Industrial", mono: "In", blurb: "Workshops & light industry" },
];

export const ZONING_TYPES = [
  "Commercial — Office (E)",
  "Commercial — Retail (E)",
  "Mixed-Use",
  "Industrial (B2/B8)",
  "Special — Events (Sui Generis)",
  "Medical (E/D1)",
];

/* ---------- cities ---------- */

const CITIES = [
  { name: "London", nbhds: ["Shoreditch", "Hackney Wick", "Soho", "Bermondsey", "Camden", "Peckham"], lat: 51.523, lng: -0.08 },
  { name: "Manchester", nbhds: ["Northern Quarter", "Ancoats", "Deansgate", "Salford"], lat: 53.482, lng: -2.24 },
  { name: "Bristol", nbhds: ["Stokes Croft", "Old Market", "Harbourside"], lat: 51.455, lng: -2.592 },
  { name: "Leeds", nbhds: ["Holbeck", "Kirkstall", "City Centre"], lat: 53.798, lng: -1.548 },
];

/* ---------- type config ---------- */

interface TypeCfg {
  daily: [number, number];
  sqft: [number, number];
  capPerSqft: number;
  names: string[];
  suit: string[];
  zoning: string;
  terms: Term[];
  amen: string[]; // strongly-likely amenities
}

const TYPE_CFG: Record<SpaceType, TypeCfg> = {
  office: {
    daily: [180, 520], sqft: [600, 4500], capPerSqft: 0.02,
    names: ["The Ledger Building", "Meridian Works", "The Counting House", "Eastlight, Fourth Floor"],
    suit: ["office-work", "coworking", "education"],
    zoning: "Commercial — Office (E)",
    terms: ["daily", "weekly", "monthly", "longTerm"],
    amen: ["wifi", "desks", "chairs", "meeting-rooms", "hvac", "kitchenette", "restrooms", "passenger-elevator", "natural-light"],
  },
  retail: {
    daily: [220, 680], sqft: [400, 2800], capPerSqft: 0.03,
    names: ["The Glasshouse", "Cornerstone Unit", "The Arcade Front", "Number 44 High Street"],
    suit: ["retail", "popup", "showroom"],
    zoning: "Commercial — Retail (E)",
    terms: ["daily", "weekly", "monthly"],
    amen: ["display-windows", "wifi", "hvac", "cameras", "alarm", "restrooms", "shelving", "natural-light"],
  },
  warehouse: {
    daily: [260, 750], sqft: [3000, 18000], capPerSqft: 0.008,
    names: ["Brickyard Depot", "The Goods Yard", "Bay Eleven", "Crossdock South"],
    suit: ["warehouse", "storage", "light-industrial", "filming"],
    zoning: "Industrial (B2/B8)",
    terms: ["weekly", "monthly", "longTerm"],
    amen: ["loading-bay", "industrial-power", "fire-safety", "cameras", "ventilation", "parking", "storage"],
  },
  studio: {
    daily: [140, 420], sqft: [500, 2200], capPerSqft: 0.025,
    names: ["Northlight Studio", "The Daylight Room", "Brick & Beam Studio", "The Cyclorama"],
    suit: ["photoshoot", "filming", "event", "workshop"],
    zoning: "Mixed-Use",
    terms: ["hourly", "daily"],
    amen: ["natural-light", "wifi", "sound", "restrooms", "kitchenette", "private-entrance", "hvac"],
  },
  coworking: {
    daily: [35, 90], sqft: [1500, 8000], capPerSqft: 0.03,
    names: ["The Commons Floor", "Foundry Desks", "The Atrium Club", "Deskworks Exchange"],
    suit: ["coworking", "office-work", "education"],
    zoning: "Commercial — Office (E)",
    terms: ["daily", "monthly"],
    amen: ["wifi", "desks", "chairs", "meeting-rooms", "kitchenette", "reception", "hvac", "restrooms", "projector"],
  },
  popup: {
    daily: [180, 540], sqft: [300, 1500], capPerSqft: 0.04,
    names: ["The Shopfront", "White Box, High Street", "The Corner Pop", "Gallery Forty-Two"],
    suit: ["popup", "retail", "event", "showroom"],
    zoning: "Commercial — Retail (E)",
    terms: ["daily", "weekly"],
    amen: ["display-windows", "wifi", "natural-light", "cameras", "restrooms"],
  },
  event: {
    daily: [420, 1400], sqft: [1800, 9000], capPerSqft: 0.06,
    names: ["The Turbine Hall Annex", "The Vaults", "Pillar Hall", "The Botany Room"],
    suit: ["event", "filming", "photoshoot", "education"],
    zoning: "Special — Events (Sui Generis)",
    terms: ["hourly", "daily"],
    amen: ["sound", "projector", "restrooms", "kitchenette", "reception", "wifi", "fire-safety", "hvac", "chairs"],
  },
  storage: {
    daily: [25, 80], sqft: [200, 2500], capPerSqft: 0.005,
    names: ["LockBay 12", "The Dry Store", "Archive Row", "Unit K, Self-Stack"],
    suit: ["storage", "warehouse"],
    zoning: "Industrial (B2/B8)",
    terms: ["monthly", "longTerm"],
    amen: ["cameras", "alarm", "fire-safety", "storage", "parking"],
  },
  medical: {
    daily: [200, 560], sqft: [350, 1800], capPerSqft: 0.015,
    names: ["The Practice Rooms", "Suite Three, Harley Annex", "The Consulting House", "Westgate Clinic Rooms"],
    suit: ["medical", "beauty", "office-work"],
    zoning: "Medical (E/D1)",
    terms: ["daily", "monthly", "longTerm"],
    amen: ["wifi", "hvac", "reception", "restrooms", "wheelchair", "alarm", "water", "fire-safety"],
  },
  industrial: {
    daily: [180, 620], sqft: [1500, 12000], capPerSqft: 0.01,
    names: ["Unit 7, Phoenix Works", "The Press Floor", "Ironside Sheds", "The Mill Bay"],
    suit: ["light-industrial", "workshop", "warehouse", "food-prep"],
    zoning: "Industrial (B2/B8)",
    terms: ["monthly", "longTerm", "weekly"],
    amen: ["industrial-power", "ventilation", "water", "loading-bay", "fire-safety", "parking", "storage"],
  },
};

/* ---------- hosts ---------- */

export const HOSTS: Host[] = [
  { id: "h-daniel", name: "Daniel Okafor", avatar: "https://i.pravatar.cc/150?img=12", verified: true, established: true, since: "2021", responseRatePct: 98, responseTime: "within an hour", bio: "Former commercial surveyor. I manage a small portfolio of characterful workspaces across East London and Manchester — I like tenants who are building something." },
  { id: "h-priya", name: "Priya Shah", avatar: "https://i.pravatar.cc/150?img=47", verified: true, established: true, since: "2019", responseRatePct: 99, responseTime: "within an hour", bio: "Architect turned operator. Daylight-first studios and galleries, kept simple and spotless." },
  { id: "h-marcus", name: "Marcus Webb", avatar: "https://i.pravatar.cc/150?img=53", verified: true, established: false, since: "2023", responseRatePct: 91, responseTime: "within a few hours", bio: "Family logistics business — we let out the bays and yards we don't use." },
  { id: "h-elena", name: "Elena Petrova", avatar: "https://i.pravatar.cc/150?img=32", verified: true, established: true, since: "2020", responseRatePct: 96, responseTime: "within 2 hours", bio: "I run three coworking floors and a pop-up arcade. Ask me anything about footfall." },
  { id: "h-tom", name: "Tom Hardwick", avatar: "https://i.pravatar.cc/150?img=15", verified: false, established: false, since: "2024", responseRatePct: 84, responseTime: "within a day", bio: "New to hosting — listing the workshop my joinery moved out of." },
  { id: "h-aisha", name: "Aisha Bello", avatar: "https://i.pravatar.cc/150?img=21", verified: true, established: true, since: "2018", responseRatePct: 97, responseTime: "within an hour", bio: "Clinic-grade rooms for practitioners. CQC-ready, hygienic, calm." },
  { id: "h-sofia", name: "Sofia Marchetti", avatar: "https://i.pravatar.cc/150?img=44", verified: true, established: false, since: "2022", responseRatePct: 93, responseTime: "within 3 hours", bio: "Event spaces with soul — exposed brick, good acoustics, better lighting." },
  { id: "h-james", name: "James Liu", avatar: "https://i.pravatar.cc/150?img=60", verified: true, established: true, since: "2020", responseRatePct: 95, responseTime: "within 2 hours", bio: "Industrial units and maker spaces. Three-phase power and honest service charges." },
];

/* ---------- listings ---------- */

const DESC_OPENERS = [
  "A genuinely flexible space in one of the city's most active commercial pockets.",
  "Recently refurbished with original features kept where they earn their place.",
  "Practical, well-kept and ready to trade from day one.",
  "Quietly impressive — the kind of space clients remember.",
];
const DESC_MID = [
  "The layout is open and adaptable, with services run to the perimeter so you can configure the floor your way.",
  "Access is straightforward, with step-free entry from the street and goods access at the rear.",
  "You'll share the building with a small community of established businesses — friendly, professional, low-drama.",
  "Power, data and water are all in place; the unit has been used continuously and everything works.",
];
const DESC_CLOSE = [
  "Viewings are easy to arrange — message me and I'll usually confirm the same day.",
  "I host carefully: response times are quick and the building is managed hands-on.",
  "Happy to talk through fit-out plans, term lengths or anything in between.",
  "Long-term tenants get priority on renewals and first refusal on adjacent units.",
];

const today = todayIso();

function makeListing(i: number): Listing {
  const typeIdx = i % SPACE_TYPES.length;
  const spaceType = SPACE_TYPES[typeIdx].key;
  const cfg = TYPE_CFG[spaceType];
  const city = CITIES[i % CITIES.length];
  const nbhd = pick(city.nbhds);
  const host = HOSTS[i < 6 ? 0 : 1 + (i % 7)];
  const id = `l-${i}`;

  const sqft = round5(int(cfg.sqft[0], cfg.sqft[1]));
  const daily = round5(int(cfg.daily[0], cfg.daily[1]));
  const terms: Partial<Record<Term, number>> = {};
  for (const t of cfg.terms) {
    if (t === "hourly") terms.hourly = Math.max(15, round5(daily / 6));
    if (t === "daily") terms.daily = daily;
    if (t === "weekly") terms.weekly = round5(daily * 4.6);
    if (t === "monthly") terms.monthly = round5(daily * 19);
    if (t === "longTerm") terms.longTerm = round5(daily * 17);
  }

  const amenities = new Set<string>(cfg.amen.filter(() => chance(0.85)));
  for (const a of AMENITIES) if (chance(0.18)) amenities.add(a.key);
  amenities.add("fire-safety");

  const blocked: string[] = [];
  for (let b = 0; b < int(4, 8); b++) blocked.push(addDays(today, int(2, 85)));
  const booked: string[] = [];
  const spanStart = int(5, 50);
  for (let d = 0; d < int(3, 6); d++) booked.push(addDays(today, spanStart + d));
  for (let b = 0; b < int(2, 5); b++) booked.push(addDays(today, int(2, 85)));

  const rating = Math.round((4.2 + rnd() * 0.78) * 100) / 100;
  const parkType = pick(["none", "street", "lot", "garage"] as const);
  const floorLevel = spaceType === "warehouse" || spaceType === "industrial" || spaceType === "storage" ? 0 : int(0, 4);

  return {
    id,
    title: cfg.names[Math.floor(i / SPACE_TYPES.length) % cfg.names.length],
    description: `${pick(DESC_OPENERS)} ${pick(DESC_MID)} ${pick(DESC_MID)} ${pick(DESC_CLOSE)}`,
    spaceType,
    status: "active",
    hostId: host.id,
    city: city.name,
    neighborhood: nbhd,
    lat: city.lat + (rnd() - 0.5) * 0.06,
    lng: city.lng + (rnd() - 0.5) * 0.09,
    photos: Array.from({ length: 6 }, (_, n) => `https://picsum.photos/seed/premises-${id}-${n}/1200/800`),
    hasVirtualTour: chance(0.4),
    sqft,
    capacity: Math.max(2, Math.round(sqft * cfg.capPerSqft)),
    floorLevel,
    totalFloors: Math.max(1, floorLevel + int(0, 3)),
    ceilingFt: spaceType === "warehouse" || spaceType === "industrial" ? int(14, 28) : int(8, 14),
    loadingDock: ["warehouse", "industrial", "storage"].includes(spaceType) ? chance(0.8) : chance(0.1),
    parking: { type: parkType, spaces: parkType === "none" ? 0 : int(1, 20), ev: parkType === "garage" || parkType === "lot" ? int(0, 4) : 0 },
    accessibility: [
      ...(chance(0.7) ? ["Step-free entrance"] : []),
      ...(chance(0.5) ? ["Wheelchair-accessible WC"] : []),
      ...(floorLevel > 0 && chance(0.7) ? ["Passenger lift"] : []),
      ...(chance(0.3) ? ["Accessible parking bay"] : []),
    ],
    naturalLight: pick([1, 2, 3] as const),
    displayWindows: amenities.has("display-windows"),
    zoning: cfg.zoning,
    suitability: cfg.suit.filter(() => chance(0.9)).concat(chance(0.3) ? [pick(SUITABILITY).key] : []),
    amenities: [...amenities],
    terms,
    cleaningFee: round5(int(40, 180)),
    deposit: round5(daily * int(2, 5)),
    discounts: { weeklyPct: int(0, 8), monthlyPct: int(5, 15) },
    minTermDays: cfg.terms.includes("hourly") ? 0 : cfg.terms[0] === "monthly" ? 30 : int(1, 3),
    instantBook: chance(0.45),
    operatingHours: chance(0.3) ? "24/7 access" : `Mon–Sat ${pick(["07:00", "08:00", "06:00"])}–${pick(["20:00", "22:00", "23:00"])}`,
    access247: chance(0.3),
    noise: ["warehouse", "industrial"].includes(spaceType) ? "industrialOk" : pick(["quiet", "moderate"] as const),
    signage: spaceType === "retail" || spaceType === "popup" ? pick(["exterior", "storefront"] as const) : pick(["none", "interior", "exterior"] as const),
    fitOut: pick(["none", "cosmetic", "light", "full"] as const),
    insuranceRequired: chance(0.6),
    minCoverage: chance(0.6) ? pick([1000000, 2000000, 5000000]) : undefined,
    licenseRequired: ["medical", "industrial"].includes(spaceType) ? chance(0.7) : chance(0.2),
    cancellation: pick(["flexible", "moderate", "strict", "contract"] as const),
    utilitiesIncluded: ["Electricity", "Water", ...(chance(0.6) ? ["Heating"] : []), ...(chance(0.4) ? ["Waste collection"] : [])],
    internet: amenities.has("wifi") ? pick(["Dedicated fibre · 900 Mbps", "Shared fibre · 300 Mbps", "Dedicated line · 1 Gbps"]) : "Not provided",
    furniture: amenities.has("desks") ? ["Desks", "Task chairs", ...(chance(0.5) ? ["Meeting table"] : [])] : chance(0.3) ? ["Shelving units"] : [],
    rating,
    reviewCount: 0, // filled after reviews generated
    categories: Object.fromEntries(
      ["Accuracy", "Access", "Cleanliness", "Communication", "Location", "Value"].map((c) => [c, Math.round((4.1 + rnd() * 0.9) * 10) / 10]),
    ),
    blocked: [...new Set(blocked)],
    booked: [...new Set(booked)],
    featured: false,
    createdAt: addDays(today, -int(10, 700)),
  };
}

export const LISTINGS: Listing[] = Array.from({ length: 40 }, (_, i) => makeListing(i));
LISTINGS
  .slice()
  .sort((a, b) => b.rating - a.rating)
  .slice(0, 8)
  .forEach((l) => (l.featured = true));

/* ---------- reviews ---------- */

const REVIEWER_NAMES = [
  "Nadia Hassan", "Oren Blas", "Lucy Trent", "Kwame Mensah", "Hana Sato", "Pete Kowalski",
  "Rosa Marin", "Dev Patel", "Ingrid Larsen", "Sam Okoye", "Tara Bishop", "Felix Stone",
  "Mona Ali", "Jack Turner", "Yuki Mori", "Leo Grant",
];
const REVIEW_TEXTS = [
  "Exactly as listed. Load-in was painless and the host had the space ready before we arrived.",
  "Great light, honest photos, quick responses. We extended our booking twice.",
  "The building is well looked after and the neighbours were friendly. Would book again for our next campaign.",
  "Solid value for the area. Wi-Fi was genuinely fast, which never happens.",
  "Host walked us through access and alarm codes the day before — zero friction on the morning.",
  "A couple of quirks with the heating, but the host sorted it within the hour.",
  "Perfect for our pop-up. Footfall was better than expected and the storefront signage permission sealed it.",
  "Clean, secure, and the loading bay made our fit-out week so much easier.",
  "We shot two days here. Power was stable, blackout worked, and parking saved us on kit transport.",
  "Professional setup all round. Deposit returned within 48 hours of checkout.",
];

export const REVIEWS: Review[] = [];
let rid = 0;
for (const l of LISTINGS) {
  const count = int(3, 12);
  for (let i = 0; i < count; i++) {
    const stars = chance(0.75) ? 5 : chance(0.7) ? 4 : 3;
    REVIEWS.push({
      id: `r-${rid++}`,
      listingId: l.id,
      author: pick(REVIEWER_NAMES),
      avatar: `https://i.pravatar.cc/80?img=${int(1, 70)}`,
      date: addDays(today, -int(5, 400)),
      useTag: SUITABILITY.find((s) => s.key === pick(l.suitability))?.label ?? "Office work",
      stars,
      text: pick(REVIEW_TEXTS),
      hostResponse: chance(0.25)
        ? { text: "Thanks for taking such good care of the space — you're welcome back any time.", date: addDays(today, -int(1, 4)) }
        : undefined,
    });
  }
  l.reviewCount = count;
}

/* ---------- seeded bookings ---------- */

function mkBooking(
  id: string, listingId: string, renterId: string, renterName: string, businessType: string,
  useNote: string, term: Term, startOffset: number, units: number,
  status: Booking["status"], expiresHrs?: number,
): Booking {
  const l = LISTINGS.find((x) => x.id === listingId)!;
  const start = addDays(today, startOffset);
  const days = term === "hourly" ? 0 : term === "daily" ? units : term === "weekly" ? units * 7 : units * 30;
  return {
    id, code: `PRM-${id.toUpperCase().replace("b-", "")}${int(100, 999)}`,
    listingId, renterId, renterName, businessType, useNote, term, start,
    end: addDays(start, Math.max(days, 0)), units, status,
    expiresAt: expiresHrs ? new Date(Date.now() + expiresHrs * 3600000).toISOString() : undefined,
    breakdown: breakdown(l, term, units),
    createdAt: addDays(today, Math.min(startOffset - 2, -1)),
  };
}

/** Maya's bookings (renter persona) + incoming requests on Daniel's listings (host persona). */
export const BOOKINGS: Booking[] = [
  mkBooking("b-m1", "l-2", "u-maya", "Maya Chen", "Photoshoot", "Editorial shoot for spring lookbook, crew of 8.", "daily", 12, 3, "confirmed"),
  mkBooking("b-m2", "l-7", "u-maya", "Maya Chen", "Pop-up shop", "Four-week ceramics pop-up with weekend workshops.", "monthly", 25, 1, "confirmed"),
  mkBooking("b-m3", "l-11", "u-maya", "Maya Chen", "Office work", "Quarterly offsite for our 12-person studio.", "daily", 40, 2, "pending", 20),
  mkBooking("b-m4", "l-5", "u-maya", "Maya Chen", "Event", "Product launch evening, 60 guests.", "daily", -30, 1, "completed"),
  mkBooking("b-m5", "l-9", "u-maya", "Maya Chen", "Photoshoot", "Catalogue shoot, small crew.", "daily", -75, 2, "completed"),
  // Incoming for Daniel (host of l-0..l-5)
  mkBooking("b-d1", "l-0", "u-nadia", "Nadia Hassan", "Education / training", "Weekly evening coding bootcamp, 18 students, Tues & Thurs.", "monthly", 14, 3, "pending", 22),
  mkBooking("b-d2", "l-1", "u-oren", "Oren Blas", "Pop-up shop", "Vintage eyewear pop-up. We've run six of these — happy to share references.", "weekly", 9, 2, "pending", 9),
  mkBooking("b-d3", "l-3", "u-lucy", "Lucy Trent", "Filming", "Two-day interview shoot, small lighting rig, no set builds.", "daily", 6, 2, "pending", 31),
  mkBooking("b-d4", "l-2", "u-kwame", "Kwame Mensah", "Photoshoot", "Brand campaign, crew of 10.", "daily", 18, 2, "confirmed"),
  mkBooking("b-d5", "l-4", "u-hana", "Hana Sato", "Office work", "Design team residency.", "monthly", 3, 2, "confirmed"),
  mkBooking("b-d6", "l-0", "u-pete", "Pete Kowalski", "Coworking", "Desk block for contractors.", "monthly", -65, 2, "completed"),
  mkBooking("b-d7", "l-5", "u-rosa", "Rosa Marin", "Event", "Charity auction evening.", "daily", -20, 1, "completed"),
];

/* ---------- seeded message threads ---------- */

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000).toISOString();

export const THREADS: Thread[] = [
  {
    id: "t-1", listingId: "l-11", otherName: "Elena Petrova", otherAvatar: "https://i.pravatar.cc/150?img=32", status: "request",
    messages: [
      { from: "me", text: "Hi Elena — before I confirm, is the meeting room bookable on the day or does it need reserving ahead?", at: hoursAgo(26) },
      { from: "them", text: "Hi Maya! It's first-come on the day, but for an offsite I'd block it out for you in advance — just tell me which hours.", at: hoursAgo(24) },
      { from: "me", text: "Perfect — 10:00 to 16:00 both days would be ideal. Request sent!", at: hoursAgo(23) },
    ],
  },
  {
    id: "t-2", listingId: "l-2", otherName: "Daniel Okafor", otherAvatar: "https://i.pravatar.cc/150?img=12", status: "booked",
    messages: [
      { from: "them", text: "Booking confirmed — exact address and access codes are in your booking page. Freight lift is on the right past the gate.", at: hoursAgo(80) },
      { from: "me", text: "Brilliant, thanks Daniel. We'll arrive around 07:30 for load-in.", at: hoursAgo(78) },
      { from: "them", text: "No problem, I'll make sure the bay is clear from 07:00.", at: hoursAgo(70) },
    ],
  },
  {
    id: "t-3", listingId: "l-19", otherName: "Sofia Marchetti", otherAvatar: "https://i.pravatar.cc/150?img=44", status: "inquiry",
    messages: [
      { from: "me", text: "Hello! Is the sound system suitable for a live acoustic set, or PA only?", at: hoursAgo(50) },
      { from: "them", text: "It handles live sets well — two monitors, a small desk, and the room itself is kind to acoustics. Come hear it before you book if you like.", at: hoursAgo(44) },
    ],
  },
];

/* ---------- FAQ ---------- */

export const FAQS: Faq[] = [
  { id: "f-1", category: "Booking", q: "What's the difference between Instant Book and Request to Book?", a: "Instant Book confirms your dates immediately at checkout. Request to Book sends your dates and business details to the host, who has 24 hours to approve. You're not charged until a request is approved." },
  { id: "f-2", category: "Booking", q: "When do I get the exact address?", a: "Listings show an approximate location until your booking is confirmed. The exact address, access instructions and any codes appear on your booking page once confirmed." },
  { id: "f-3", category: "Booking", q: "Can I extend a booking?", a: "Yes — open the booking from your dashboard and choose 'Request extension'. If the calendar is free, hosts usually approve within hours." },
  { id: "f-4", category: "Payments", q: "How do deposits work?", a: "Deposits are refundable and held separately from the booking total. They're released within 48 hours of checkout, less any agreed deductions." },
  { id: "f-5", category: "Payments", q: "What is the service fee?", a: "A 12% service fee on the booking subtotal covers payment protection, support and platform costs. It's always itemised before you pay." },
  { id: "f-6", category: "Policies", q: "What insurance do I need?", a: "Many hosts require public liability insurance (typically £1m–£5m coverage). The requirement and minimum coverage are listed under Rules & policies on every listing." },
  { id: "f-7", category: "Policies", q: "How do cancellation tiers work?", a: "Flexible: full refund up to 24h before. Moderate: full refund up to 5 days before, then 50%. Strict: 50% up to 14 days before, then non-refundable. Long-term contracts follow their notice period." },
  { id: "f-8", category: "Hosting", q: "How long does it take to list a space?", a: "Most hosts publish in under 20 minutes. You'll need photos, dimensions, pricing and your rules. Drafts save automatically so you can finish later." },
  { id: "f-9", category: "Hosting", q: "Can I require approval for every booking?", a: "Yes — leave Instant Book off and every booking arrives as a request you can approve, decline, or discuss first." },
  { id: "f-10", category: "Hosting", q: "How do payouts work?", a: "Payouts release 24 hours after a booking starts, to your chosen payout method. Long-term bookings pay out monthly." },
  { id: "f-11", category: "Trust & Safety", q: "What does the Verified Host badge mean?", a: "Verified hosts have confirmed their identity, ownership or right to let the space, and contact details." },
  { id: "f-12", category: "Trust & Safety", q: "What if the space isn't as described?", a: "Report it within 24 hours of your start time with photos. If we confirm a material difference, you'll be rebooked or fully refunded." },
];

/* ---------- helpers ---------- */

export function hostOf(l: Listing): Host {
  return HOSTS.find((h) => h.id === l.hostId) ?? HOSTS[0];
}

export const VERIFIED_HOST_IDS = new Set(HOSTS.filter((h) => h.verified).map((h) => h.id));

export const PERSONAS = {
  maya: { id: "u-maya", name: "Maya Chen", avatar: "https://i.pravatar.cc/150?img=5", mode: "renter" as const },
  daniel: { id: "u-daniel", name: "Daniel Okafor", avatar: "https://i.pravatar.cc/150?img=12", mode: "host" as const },
};
