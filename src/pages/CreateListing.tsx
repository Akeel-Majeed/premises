import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Field, Icon, inputCls } from "../components/ui";
import { cx, fmtMoney, todayIso } from "../lib/utils";
import { AMENITIES, SPACE_TYPES, SUITABILITY, ZONING_TYPES } from "../mocks/data";
import type { Listing, SpaceType, Term } from "../mocks/types";
import { findListing, useApp, useToasts } from "../state/store";

interface Form {
  spaceType: SpaceType | "";
  city: string;
  neighborhood: string;
  approximate: boolean;
  sqft: string;
  capacity: string;
  floorLevel: string;
  ceilingFt: string;
  zoning: string;
  loadingDock: boolean;
  parkingType: "none" | "street" | "lot" | "garage";
  parkingSpaces: string;
  accessibility: string[];
  amenities: string[];
  suitability: string[];
  photos: number; // count of mock photos "uploaded"
  title: string;
  description: string;
  terms: Partial<Record<Term, string>>;
  cleaningFee: string;
  deposit: string;
  minTermDays: string;
  weeklyPct: string;
  monthlyPct: string;
  instantBook: boolean;
  operatingHours: string;
  access247: boolean;
  noise: Listing["noise"];
  signage: Listing["signage"];
  fitOut: Listing["fitOut"];
  insuranceRequired: boolean;
  licenseRequired: boolean;
  cancellation: Listing["cancellation"];
}

const BLANK: Form = {
  spaceType: "", city: "", neighborhood: "", approximate: true,
  sqft: "", capacity: "", floorLevel: "0", ceilingFt: "10", zoning: ZONING_TYPES[0],
  loadingDock: false, parkingType: "none", parkingSpaces: "0", accessibility: [],
  amenities: ["wifi", "fire-safety"], suitability: [], photos: 0,
  title: "", description: "",
  terms: { daily: "" }, cleaningFee: "80", deposit: "500", minTermDays: "1",
  weeklyPct: "5", monthlyPct: "10", instantBook: false,
  operatingHours: "Mon–Sat 08:00–20:00", access247: false,
  noise: "moderate", signage: "interior", fitOut: "cosmetic",
  insuranceRequired: true, licenseRequired: false, cancellation: "moderate",
};

const STEPS = ["Space type", "Location", "Specs", "Amenities", "Photos", "Title & description", "Pricing & terms", "Rules & policies", "Review"];

function fromListing(l: Listing): Form {
  return {
    spaceType: l.spaceType, city: l.city, neighborhood: l.neighborhood, approximate: true,
    sqft: String(l.sqft), capacity: String(l.capacity), floorLevel: String(l.floorLevel), ceilingFt: String(l.ceilingFt),
    zoning: l.zoning, loadingDock: l.loadingDock, parkingType: l.parking.type, parkingSpaces: String(l.parking.spaces),
    accessibility: l.accessibility, amenities: l.amenities, suitability: l.suitability, photos: l.photos.length,
    title: l.title, description: l.description,
    terms: Object.fromEntries(Object.entries(l.terms).map(([k, v]) => [k, String(v)])),
    cleaningFee: String(l.cleaningFee), deposit: String(l.deposit), minTermDays: String(l.minTermDays),
    weeklyPct: String(l.discounts.weeklyPct), monthlyPct: String(l.discounts.monthlyPct), instantBook: l.instantBook,
    operatingHours: l.operatingHours, access247: l.access247, noise: l.noise, signage: l.signage, fitOut: l.fitOut,
    insuranceRequired: l.insuranceRequired, licenseRequired: l.licenseRequired, cancellation: l.cancellation,
  };
}

export default function CreateListing() {
  const { id } = useParams(); // present in edit mode
  const navigate = useNavigate();
  const { session, openAuth, draft, setDraft, publish, published, updateListing } = useApp();
  const push = useToasts((s) => s.push);
  const editing = useMemo(() => (id ? findListing(id, published) : undefined), [id, published]);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(() => {
    if (editing) return fromListing(editing);
    if (draft && !id) return { ...BLANK, ...(draft as Partial<Form>) };
    return BLANK;
  });
  const [resumed] = useState(() => Boolean(draft && !id));

  // autosave draft (create mode only)
  useEffect(() => {
    if (!id) setDraft(form as unknown as Record<string, unknown>);
  }, [form, id, setDraft]);

  if (!session) {
    return (
      <main id="main" className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold mb-3">Sign in to list your space</h1>
        <Button onClick={openAuth}>Sign in</Button>
      </main>
    );
  }

  const set = (patch: Partial<Form>) => setForm({ ...form, ...patch });
  const toggleArr = (key: "amenities" | "suitability" | "accessibility", v: string) =>
    set({ [key]: form[key].includes(v) ? form[key].filter((x) => x !== v) : [...form[key], v] } as Partial<Form>);

  const stepValid = (): string | null => {
    switch (step) {
      case 0: return form.spaceType ? null : "Choose a space type";
      case 1: return form.city && form.neighborhood ? null : "Add a city and neighbourhood";
      case 2: return Number(form.sqft) > 0 && Number(form.capacity) > 0 ? null : "Square footage and capacity are required";
      case 4: return form.photos >= 5 ? null : "Add at least 5 photos (mock)";
      case 5: return form.title.trim().length >= 8 && form.description.trim().length >= 60 ? null : "Title (8+ chars) and description (60+ chars) required";
      case 6: return Object.values(form.terms).some((v) => Number(v) > 0) ? null : "Set a rate for at least one term";
      default: return null;
    }
  };

  const next = () => {
    const err = stepValid();
    if (err) return push(err);
    setStep(Math.min(step + 1, STEPS.length - 1));
  };

  const doPublish = () => {
    const numTerms: Partial<Record<Term, number>> = {};
    for (const [k, v] of Object.entries(form.terms)) if (Number(v) > 0) numTerms[k as Term] = Number(v);
    const base: Listing = {
      id: editing ? editing.id : `l-user-${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      spaceType: form.spaceType as SpaceType,
      status: "active",
      hostId: session.id === "u-daniel" ? "h-daniel" : "h-daniel",
      city: form.city.trim(),
      neighborhood: form.neighborhood.trim(),
      lat: 51.523 + Math.random() * 0.04, lng: -0.08 + Math.random() * 0.05,
      photos: Array.from({ length: Math.max(form.photos, 5) }, (_, n) => `https://picsum.photos/seed/premises-user-${form.title.length + n}/1200/800`),
      hasVirtualTour: false,
      sqft: Number(form.sqft), capacity: Number(form.capacity),
      floorLevel: Number(form.floorLevel), totalFloors: Math.max(1, Number(form.floorLevel) + 1),
      ceilingFt: Number(form.ceilingFt),
      loadingDock: form.loadingDock,
      parking: { type: form.parkingType, spaces: Number(form.parkingSpaces), ev: 0 },
      accessibility: form.accessibility,
      naturalLight: 2,
      displayWindows: form.amenities.includes("display-windows"),
      zoning: form.zoning,
      suitability: form.suitability.length ? form.suitability : ["office-work"],
      amenities: form.amenities,
      terms: numTerms,
      cleaningFee: Number(form.cleaningFee) || 0,
      deposit: Number(form.deposit) || 0,
      discounts: { weeklyPct: Number(form.weeklyPct) || 0, monthlyPct: Number(form.monthlyPct) || 0 },
      minTermDays: Number(form.minTermDays) || 1,
      instantBook: form.instantBook,
      operatingHours: form.access247 ? "24/7 access" : form.operatingHours,
      access247: form.access247,
      noise: form.noise, signage: form.signage, fitOut: form.fitOut,
      insuranceRequired: form.insuranceRequired,
      minCoverage: form.insuranceRequired ? 2000000 : undefined,
      licenseRequired: form.licenseRequired,
      cancellation: form.cancellation,
      utilitiesIncluded: ["Electricity", "Water"],
      internet: form.amenities.includes("wifi") ? "Shared fibre · 300 Mbps" : "Not provided",
      furniture: form.amenities.includes("desks") ? ["Desks", "Task chairs"] : [],
      rating: editing?.rating ?? 0,
      reviewCount: editing?.reviewCount ?? 0,
      categories: editing?.categories ?? { Accuracy: 0, Access: 0, Cleanliness: 0, Communication: 0, Location: 0, Value: 0 },
      blocked: editing?.blocked ?? [],
      booked: editing?.booked ?? [],
      featured: false,
      createdAt: editing?.createdAt ?? todayIso(),
    };
    if (editing && published.some((p) => p.id === editing.id)) {
      updateListing(editing.id, base);
      push("Listing updated");
    } else {
      publish(base);
      push(editing ? "Listing updated" : "Listing published — it's live in search");
    }
    if (!id) setDraft(null);
    navigate("/host/listings");
  };

  const chip = (active: boolean) =>
    cx("border rounded-full px-3.5 py-2 text-sm cursor-pointer transition-colors", active ? "border-vault bg-vault/5 font-semibold" : "border-ink/20 hover:border-ink");

  return (
    <main id="main" className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">{editing ? `Edit · ${editing.title}` : "List your space"}</h1>
        <button className="text-sm font-semibold underline hover:text-vault cursor-pointer" onClick={() => navigate("/host/listings")}>
          Save & exit
        </button>
      </div>

      {resumed && step === 0 && (
        <p className="text-sm bg-vault/5 border border-vault/30 text-vault rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
          <Icon name="info" className="w-4 h-4" /> Resumed your saved draft — your progress autosaves as you go.
        </p>
      )}

      <div className="grid lg:grid-cols-[220px_1fr] gap-10">
        {/* progress rail */}
        <nav aria-label="Listing steps" className="hidden lg:block">
          <ol className="space-y-1 sticky top-24">
            {STEPS.map((s, i) => (
              <li key={s}>
                <button
                  onClick={() => (i <= step || editing) && setStep(i)}
                  className={cx(
                    "flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm cursor-pointer",
                    i === step ? "bg-vault text-bone font-semibold" : i < step || editing ? "text-ink hover:bg-ink/5" : "text-ink-3 cursor-not-allowed",
                  )}
                >
                  <span className={cx("w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-mono shrink-0",
                    i < step ? "bg-vault border-vault text-bone" : i === step ? "border-bone" : "border-ink/30")}>
                    {i < step ? <Icon name="check" className="w-3 h-3" /> : i + 1}
                  </span>
                  {s}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {/* mobile progress */}
        <div className="lg:hidden -mt-2">
          <p className="text-xs font-mono text-ink-3 mb-1.5">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
          <div className="h-1 bg-ink/10 rounded-full overflow-hidden">
            <div className="h-full bg-vault rounded-full transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>

        <div className="min-h-[420px]">
          {step === 0 && (
            <section aria-label="Space type">
              <h2 className="font-display text-xl font-semibold mb-5">What kind of space is it?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SPACE_TYPES.map((t) => (
                  <button key={t.key} onClick={() => set({ spaceType: t.key })}
                    className={cx("border rounded-2xl p-4 text-left hover:border-vault cursor-pointer", form.spaceType === t.key ? "border-vault bg-vault/5" : "border-ink/15")}>
                    <span className="font-display font-semibold text-sm border border-ink/25 rounded-md px-2 py-0.5 inline-block mb-2">{t.mono}</span>
                    <span className="block font-semibold text-sm">{t.label}</span>
                    <span className="block text-xs text-ink-3 mt-0.5">{t.blurb}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 1 && (
            <section aria-label="Location" className="space-y-5 max-w-md">
              <h2 className="font-display text-xl font-semibold">Where is it?</h2>
              <Field label="City"><input value={form.city} onChange={(e) => set({ city: e.target.value })} className={inputCls} placeholder="London" /></Field>
              <Field label="Neighbourhood"><input value={form.neighborhood} onChange={(e) => set({ neighborhood: e.target.value })} className={inputCls} placeholder="Shoreditch" /></Field>
              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input type="checkbox" checked={form.approximate} onChange={(e) => set({ approximate: e.target.checked })} className="w-4 h-4 accent-[#174a3c]" />
                Show only my approximate location until a booking is confirmed
              </label>
              <div className="h-40 rounded-2xl bg-[#15231e] relative overflow-hidden" aria-hidden="true">
                <Icon name="pin" className="w-8 h-8 text-brass absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                <p className="absolute bottom-2 left-3 text-[10px] font-mono text-bone/50">Drag pin to adjust (demo)</p>
              </div>
            </section>
          )}

          {step === 2 && (
            <section aria-label="Specifications" className="space-y-5">
              <h2 className="font-display text-xl font-semibold">The essentials</h2>
              <div className="grid sm:grid-cols-2 gap-5 max-w-xl">
                <Field label="Square footage"><input type="number" min={0} value={form.sqft} onChange={(e) => set({ sqft: e.target.value })} className={inputCls} placeholder="1200" /></Field>
                <Field label="Capacity (people)"><input type="number" min={0} value={form.capacity} onChange={(e) => set({ capacity: e.target.value })} className={inputCls} placeholder="20" /></Field>
                <Field label="Floor level" hint="0 = ground"><input type="number" value={form.floorLevel} onChange={(e) => set({ floorLevel: e.target.value })} className={inputCls} /></Field>
                <Field label="Ceiling height (ft)"><input type="number" min={0} value={form.ceilingFt} onChange={(e) => set({ ceilingFt: e.target.value })} className={inputCls} /></Field>
                <Field label="Zoning">
                  <select value={form.zoning} onChange={(e) => set({ zoning: e.target.value })} className={inputCls}>
                    {ZONING_TYPES.map((z) => <option key={z}>{z}</option>)}
                  </select>
                </Field>
                <Field label="Parking">
                  <select value={form.parkingType} onChange={(e) => set({ parkingType: e.target.value as Form["parkingType"] })} className={inputCls}>
                    <option value="none">None</option><option value="street">Street</option><option value="lot">Lot</option><option value="garage">Garage</option>
                  </select>
                </Field>
              </div>
              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input type="checkbox" checked={form.loadingDock} onChange={(e) => set({ loadingDock: e.target.checked })} className="w-4 h-4 accent-[#174a3c]" />
                Loading dock available
              </label>
              <div>
                <p className="font-semibold text-sm mb-2.5">Accessibility</p>
                <div className="flex flex-wrap gap-2">
                  {["Step-free entrance", "Wheelchair-accessible WC", "Passenger lift", "Accessible parking bay", "Hearing loop"].map((a) => (
                    <button key={a} onClick={() => toggleArr("accessibility", a)} className={chip(form.accessibility.includes(a))}>{a}</button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section aria-label="Amenities and suitability" className="space-y-7">
              <div>
                <h2 className="font-display text-xl font-semibold mb-5">Amenities</h2>
                {[...new Set(AMENITIES.map((a) => a.group))].map((g) => (
                  <div key={g} className="mb-5">
                    <p className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold mb-2">{g}</p>
                    <div className="flex flex-wrap gap-2">
                      {AMENITIES.filter((a) => a.group === g).map((a) => (
                        <button key={a.key} onClick={() => toggleArr("amenities", a.key)} className={chip(form.amenities.includes(a.key))}>{a.label}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold mb-2">Suitable for</h2>
                <p className="text-sm text-ink-2 mb-4">Pick every business type this space genuinely works for — renters filter on these.</p>
                <div className="flex flex-wrap gap-2">
                  {SUITABILITY.map((s) => (
                    <button key={s.key} onClick={() => toggleArr("suitability", s.key)} className={chip(form.suitability.includes(s.key))}>{s.label}</button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {step === 4 && (
            <section aria-label="Photos">
              <h2 className="font-display text-xl font-semibold mb-2">Photos</h2>
              <p className="text-sm text-ink-2 mb-5">At least 5. Lead with your widest, brightest shot. (Upload is mocked — clicking adds sample photos.)</p>
              <button
                onClick={() => set({ photos: form.photos + 1 })}
                className="w-full border-2 border-dashed border-ink/25 rounded-2xl py-12 flex flex-col items-center gap-3 text-ink-3 hover:border-vault hover:text-vault transition-colors cursor-pointer"
              >
                <Icon name="photo" className="w-8 h-8" />
                <span className="text-sm font-semibold">Drag photos here, or click to add a mock photo</span>
              </button>
              {form.photos > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-5">
                  {Array.from({ length: form.photos }, (_, i) => (
                    <div key={i} className="relative group">
                      <img src={`https://picsum.photos/seed/premises-up-${i}/300/220`} alt={`Upload ${i + 1}`} className="rounded-xl w-full h-20 object-cover" />
                      {i === 0 && <span className="absolute top-1 left-1 bg-brass text-ink text-[9px] font-bold rounded px-1.5 py-0.5">COVER</span>}
                      <button aria-label={`Remove photo ${i + 1}`} onClick={() => set({ photos: form.photos - 1 })}
                        className="absolute top-1 right-1 bg-ink/70 text-bone rounded-full p-1 opacity-0 group-hover:opacity-100 cursor-pointer">
                        <Icon name="x" className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs font-mono text-ink-3 mt-3">{form.photos}/5 minimum</p>
            </section>
          )}

          {step === 5 && (
            <section aria-label="Title and description" className="space-y-5 max-w-xl">
              <h2 className="font-display text-xl font-semibold">Tell renters what it is</h2>
              <Field label="Title" hint={`${form.title.length}/60`}>
                <input value={form.title} maxLength={60} onChange={(e) => set({ title: e.target.value })} className={inputCls} placeholder="e.g. Daylight corner studio with freight access" />
              </Field>
              <Field label="Description" hint={`${form.description.trim().length}/60 minimum — mention power capacity, loading access, what's included`}>
                <textarea rows={7} value={form.description} onChange={(e) => set({ description: e.target.value })} className={inputCls} />
              </Field>
              <div className="flex flex-wrap gap-2">
                {["Mention ceiling height", "Mention power capacity", "Mention loading access", "Mention nearby transport"].map((p) => (
                  <span key={p} className="text-xs border border-ink/15 rounded-full px-3 py-1.5 text-ink-3">{p}</span>
                ))}
              </div>
            </section>
          )}

          {step === 6 && (
            <section aria-label="Pricing and terms" className="space-y-6 max-w-xl">
              <h2 className="font-display text-xl font-semibold">Pricing & terms</h2>
              <div className="space-y-3">
                {(["hourly", "daily", "weekly", "monthly", "longTerm"] as Term[]).map((t) => {
                  const enabled = form.terms[t] !== undefined;
                  return (
                    <div key={t} className="flex items-center gap-4 border border-ink/15 rounded-xl px-4 py-3">
                      <label className="flex items-center gap-3 text-sm font-semibold flex-1 cursor-pointer">
                        <input type="checkbox" checked={enabled}
                          onChange={(e) => {
                            const terms = { ...form.terms };
                            if (e.target.checked) terms[t] = "";
                            else delete terms[t];
                            set({ terms });
                          }} className="w-4 h-4 accent-[#174a3c]" />
                        {t === "longTerm" ? "Long-term (per month)" : t[0].toUpperCase() + t.slice(1)}
                      </label>
                      {enabled && (
                        <span className="flex items-center gap-1.5">
                          <span className="text-ink-3">£</span>
                          <input type="number" min={0} value={form.terms[t]} onChange={(e) => set({ terms: { ...form.terms, [t]: e.target.value } })}
                            className="w-28 rounded-lg border border-ink/20 px-3 py-2 text-sm font-mono" aria-label={`${t} rate`} />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Cleaning fee (£)"><input type="number" min={0} value={form.cleaningFee} onChange={(e) => set({ cleaningFee: e.target.value })} className={inputCls} /></Field>
                <Field label="Refundable deposit (£)"><input type="number" min={0} value={form.deposit} onChange={(e) => set({ deposit: e.target.value })} className={inputCls} /></Field>
                <Field label="Minimum term (days)"><input type="number" min={0} value={form.minTermDays} onChange={(e) => set({ minTermDays: e.target.value })} className={inputCls} /></Field>
                <Field label="Weekly discount (%)"><input type="number" min={0} max={50} value={form.weeklyPct} onChange={(e) => set({ weeklyPct: e.target.value })} className={inputCls} /></Field>
                <Field label="Monthly discount (%)"><input type="number" min={0} max={50} value={form.monthlyPct} onChange={(e) => set({ monthlyPct: e.target.value })} className={inputCls} /></Field>
              </div>
              <label className="flex items-start gap-3 text-sm cursor-pointer border border-ink/15 rounded-xl p-4">
                <input type="checkbox" checked={form.instantBook} onChange={(e) => set({ instantBook: e.target.checked })} className="mt-0.5 w-4 h-4 accent-[#174a3c]" />
                <span>
                  <span className="font-semibold flex items-center gap-1.5"><Icon name="bolt" className="w-4 h-4 text-vault" /> Enable Instant Book</span>
                  <span className="block text-xs text-ink-3 mt-1">Renters book without waiting for approval. You can still set requirements.</span>
                </span>
              </label>
            </section>
          )}

          {step === 7 && (
            <section aria-label="Rules and policies" className="space-y-5 max-w-xl">
              <h2 className="font-display text-xl font-semibold">Rules & policies</h2>
              <Field label="Operating hours">
                <input value={form.operatingHours} onChange={(e) => set({ operatingHours: e.target.value })} className={inputCls} disabled={form.access247} />
              </Field>
              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input type="checkbox" checked={form.access247} onChange={(e) => set({ access247: e.target.checked })} className="w-4 h-4 accent-[#174a3c]" />
                24/7 access
              </label>
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Noise">
                  <select value={form.noise} onChange={(e) => set({ noise: e.target.value as Form["noise"] })} className={inputCls}>
                    <option value="quiet">Quiet building</option><option value="moderate">Moderate OK</option><option value="industrialOk">Industrial OK</option>
                  </select>
                </Field>
                <Field label="Signage">
                  <select value={form.signage} onChange={(e) => set({ signage: e.target.value as Form["signage"] })} className={inputCls}>
                    <option value="none">No signage</option><option value="interior">Interior only</option><option value="exterior">Exterior allowed</option><option value="storefront">Full storefront</option>
                  </select>
                </Field>
                <Field label="Fit-out permissions">
                  <select value={form.fitOut} onChange={(e) => set({ fitOut: e.target.value as Form["fitOut"] })} className={inputCls}>
                    <option value="none">No alterations</option><option value="cosmetic">Cosmetic only</option><option value="light">Light fit-out</option><option value="full">Full fit-out</option>
                  </select>
                </Field>
                <Field label="Cancellation policy">
                  <select value={form.cancellation} onChange={(e) => set({ cancellation: e.target.value as Form["cancellation"] })} className={inputCls}>
                    <option value="flexible">Flexible</option><option value="moderate">Moderate</option><option value="strict">Strict</option><option value="contract">Long-term contract</option>
                  </select>
                </Field>
              </div>
              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input type="checkbox" checked={form.insuranceRequired} onChange={(e) => set({ insuranceRequired: e.target.checked })} className="w-4 h-4 accent-[#174a3c]" />
                Require public liability insurance (£2m minimum)
              </label>
              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input type="checkbox" checked={form.licenseRequired} onChange={(e) => set({ licenseRequired: e.target.checked })} className="w-4 h-4 accent-[#174a3c]" />
                Require a relevant business license
              </label>
            </section>
          )}

          {step === 8 && (
            <section aria-label="Review and publish">
              <h2 className="font-display text-xl font-semibold mb-2">Ready to {editing ? "save" : "publish"}?</h2>
              <p className="text-sm text-ink-2 mb-6">Here's how your listing card will look in search.</p>
              <div className="max-w-xs border hairline rounded-2xl p-3 bg-white">
                <img src={`https://picsum.photos/seed/premises-up-0/600/450`} alt="Cover" className="rounded-xl aspect-[4/3] object-cover w-full" />
                <p className="font-display font-semibold mt-3">{form.title || "Untitled space"}</p>
                <p className="text-sm text-ink-3">{form.neighborhood || "—"}, {form.city || "—"}</p>
                <p className="font-mono text-xs text-ink-2 mt-1">{Number(form.sqft).toLocaleString() || 0} sq ft · Cap {form.capacity || 0}</p>
                <p className="mt-1.5">
                  <span className="font-display font-semibold">{fmtMoney(Number(Object.values(form.terms).find((v) => Number(v) > 0) ?? 0))}</span>
                  <span className="text-sm text-ink-3"> /{Object.keys(form.terms).find((k) => Number(form.terms[k as Term]) > 0) === "longTerm" ? "mo" : Object.keys(form.terms).find((k) => Number(form.terms[k as Term]) > 0)?.replace("hourly", "hr").replace("daily", "day").replace("weekly", "wk").replace("monthly", "mo")}</span>
                </p>
              </div>
              <div className="flex gap-3 mt-8">
                <Button onClick={doPublish}>{editing ? "Save changes" : "Publish listing"}</Button>
                {!editing && <Button variant="secondary" onClick={() => { push("Saved as draft — resume any time"); navigate("/host/listings"); }}>Save as draft</Button>}
              </div>
            </section>
          )}

          {/* nav */}
          <div className="flex justify-between mt-10 pt-6 border-t hairline">
            <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
              <Icon name="chevL" className="w-4 h-4" /> Back
            </Button>
            {step < STEPS.length - 1 && (
              <Button onClick={next}>Next <Icon name="chevR" className="w-4 h-4" /></Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
