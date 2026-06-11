export type Term = "hourly" | "daily" | "weekly" | "monthly" | "longTerm";

export type SpaceType =
  | "office"
  | "retail"
  | "warehouse"
  | "studio"
  | "coworking"
  | "popup"
  | "event"
  | "storage"
  | "medical"
  | "industrial";

export type Cancellation = "flexible" | "moderate" | "strict" | "contract";

export interface Listing {
  id: string;
  title: string;
  description: string;
  spaceType: SpaceType;
  status: "active" | "snoozed" | "draft";
  hostId: string;
  city: string;
  neighborhood: string;
  lat: number;
  lng: number;
  photos: string[];
  hasVirtualTour: boolean;
  sqft: number;
  capacity: number;
  floorLevel: number;
  totalFloors: number;
  ceilingFt: number;
  loadingDock: boolean;
  parking: { type: "none" | "street" | "lot" | "garage"; spaces: number; ev: number };
  accessibility: string[];
  naturalLight: 1 | 2 | 3;
  displayWindows: boolean;
  zoning: string;
  suitability: string[];
  amenities: string[];
  terms: Partial<Record<Term, number>>;
  cleaningFee: number;
  deposit: number;
  discounts: { weeklyPct: number; monthlyPct: number };
  minTermDays: number;
  instantBook: boolean;
  operatingHours: string;
  access247: boolean;
  noise: "quiet" | "moderate" | "industrialOk";
  signage: "none" | "interior" | "exterior" | "storefront";
  fitOut: "none" | "cosmetic" | "light" | "full";
  insuranceRequired: boolean;
  minCoverage?: number;
  licenseRequired: boolean;
  cancellation: Cancellation;
  utilitiesIncluded: string[];
  internet: string;
  furniture: string[];
  rating: number;
  reviewCount: number;
  categories: Record<string, number>;
  blocked: string[];
  booked: string[];
  featured: boolean;
  createdAt: string;
}

export interface Host {
  id: string;
  name: string;
  avatar: string;
  verified: boolean;
  established: boolean;
  since: string;
  responseRatePct: number;
  responseTime: string;
  bio: string;
}

export interface Review {
  id: string;
  listingId: string;
  author: string;
  avatar: string;
  date: string;
  useTag: string;
  stars: number;
  text: string;
  hostResponse?: { text: string; date: string };
}

export interface Breakdown {
  base: number;
  discount: number;
  cleaning: number;
  service: number;
  total: number;
  deposit: number;
}

export interface Booking {
  id: string;
  code: string;
  listingId: string;
  renterId: string;
  renterName: string;
  businessType: string;
  useNote: string;
  term: Term;
  start: string; // ISO date
  end: string; // ISO date
  units: number;
  status: "pending" | "confirmed" | "declined" | "cancelled" | "completed";
  expiresAt?: string;
  breakdown: Breakdown;
  createdAt: string;
}

export interface ThreadMessage {
  from: "me" | "them";
  text: string;
  at: string;
}

export interface Thread {
  id: string;
  listingId: string;
  otherName: string;
  otherAvatar: string;
  status: "inquiry" | "request" | "booked";
  messages: ThreadMessage[];
}

export interface Faq {
  id: string;
  category: string;
  q: string;
  a: string;
}
