import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { RangeCalendar } from "../components/Calendar";
import { CompareButton, FavButton, ListingCard } from "../components/ListingCard";
import {
  Accordion, Badge, Breadcrumbs, Button, EmptyState, Icon, Modal, NumStepper, RatingInline, Stars, inputCls,
} from "../components/ui";
import {
  CANCEL_DESC, CANCEL_LABEL, FITOUT_LABEL, NOISE_LABEL, SIGNAGE_LABEL, TERM_LABEL, TERM_SUFFIX, TERM_UNIT,
  breakdown, cx, diffDays, fmtMoney, plural,
} from "../lib/utils";
import { AMENITIES, REVIEWS, SPACE_TYPES, SUITABILITY, hostOf } from "../mocks/data";
import type { Term } from "../mocks/types";
import { findListing, useAllListings, useApp, useToasts } from "../state/store";

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { published, pushRecent, session, openAuth, appendMessage } = useApp();
  const push = useToasts((s) => s.push);
  const all = useAllListings();
  const listing = findListing(id ?? "", published);

  const [lightbox, setLightbox] = useState<number | null>(null);
  const [tourOpen, setTourOpen] = useState(false);
  const [amenOpen, setAmenOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [descMore, setDescMore] = useState(false);

  // booking widget state
  const terms = useMemo(() => (listing ? (Object.keys(listing.terms) as Term[]) : []), [listing]);
  const [term, setTerm] = useState<Term>("daily");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [units, setUnits] = useState(1);

  useEffect(() => {
    if (listing) {
      pushRecent(listing.id);
      setTerm((Object.keys(listing.terms) as Term[])[0] ?? "daily");
      setStart(""); setEnd(""); setUnits(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (!listing) return;
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => ((i ?? 0) + 1) % listing.photos.length);
      if (e.key === "ArrowLeft") setLightbox((i) => ((i ?? 0) - 1 + listing.photos.length) % listing.photos.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox, listing]);

  if (!listing) {
    return (
      <main id="main" className="max-w-3xl mx-auto px-4 py-20">
        <EmptyState
          icon="pin"
          title="This space isn't available"
          body="It may have been unlisted or snoozed by its host. Browse similar spaces instead."
          action={<Button onClick={() => navigate("/search")}>Browse spaces</Button>}
        />
      </main>
    );
  }

  const host = hostOf(listing);
  const reviews = REVIEWS.filter((r) => r.listingId === listing.id);
  const typeLabel = SPACE_TYPES.find((t) => t.key === listing.spaceType)?.label ?? listing.spaceType;
  const similar = all.filter((l) => l.id !== listing.id && (l.spaceType === listing.spaceType || l.city === listing.city)).slice(0, 4);

  const effUnits = term === "daily" && start && end ? Math.max(1, diffDays(start, end)) : units;
  const bd = breakdown(listing, term, effUnits);
  const canBook = term === "daily" || term === "hourly" ? Boolean(start && (term === "hourly" || end)) : Boolean(start);

  const goBook = () => {
    if (!session) return openAuth();
    const params = new URLSearchParams({ term, start, end: end || start, units: String(effUnits) });
    navigate(`/space/${listing.id}/book?${params.toString()}`);
  };

  const sendMessage = () => {
    if (!session) return openAuth();
    if (msgText.trim().length < 5) return push("Add a little more detail for the host");
    const tid = `t-new-${listing.id}`;
    appendMessage(tid, { from: "me", text: msgText.trim(), at: new Date().toISOString() });
    setTimeout(() => {
      useApp.getState().appendMessage(tid, {
        from: "them",
        text: `Hi ${session.name.split(" ")[0]} — thanks for getting in touch about ${listing.title}. Yes, happy to talk details or arrange a viewing. What dates are you considering?`,
        at: new Date().toISOString(),
      });
    }, 2500);
    setMsgOpen(false);
    setMsgText("");
    push("Message sent — hosts usually reply within hours", "Open inbox", () => navigate("/inbox"));
  };

  const spec = [
    ["Area", `${listing.sqft.toLocaleString()} sq ft`],
    ["Capacity", `${listing.capacity} people`],
    ["Floor", listing.floorLevel === 0 ? "Ground" : `${listing.floorLevel} of ${listing.totalFloors}`],
    ["Ceiling", `${listing.ceilingFt} ft`],
    ["Loading dock", listing.loadingDock ? "Yes" : "No"],
    ["Parking", listing.parking.type === "none" ? "None" : `${listing.parking.type} · ${listing.parking.spaces} spaces${listing.parking.ev ? ` · ${listing.parking.ev} EV` : ""}`],
    ["Zoning", listing.zoning],
    ["Internet", listing.internet],
  ];

  return (
    <main id="main" className="max-w-7xl mx-auto px-4 sm:px-6 pb-28 lg:pb-12">
      <div className="pt-5 pb-3">
        <Breadcrumbs items={[{ label: listing.city, to: `/search?q=${listing.city}` }, { label: listing.neighborhood, to: `/search?q=${listing.neighborhood}` }, { label: typeLabel }]} />
      </div>

      {/* title block */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-4xl font-semibold">{listing.title}</h1>
          <p className="flex items-center gap-2.5 mt-1.5 text-sm flex-wrap">
            <RatingInline rating={listing.rating} count={listing.reviewCount} />
            {host.established && <Badge tone="brass"><Icon name="verify" className="w-3 h-3" /> Established Host</Badge>}
            <span className="text-ink-2">{listing.neighborhood}, {listing.city}</span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => push("Share link copied (demo)")} className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-full hover:bg-ink/5 cursor-pointer">
            <Icon name="share" className="w-4 h-4" /> Share
          </button>
          <CompareButton id={listing.id} className="!bg-transparent hover:!bg-ink/5" />
          <FavButton id={listing.id} className="!bg-transparent hover:!bg-ink/5" />
        </div>
      </div>

      {/* gallery */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-72 sm:h-[440px] relative">
        <button className="col-span-4 sm:col-span-2 row-span-2 cursor-pointer" onClick={() => setLightbox(0)} aria-label="Open photo gallery">
          <img src={listing.photos[0]} alt={`${listing.title} main photo`} className="w-full h-full object-cover hover:opacity-95" />
        </button>
        {listing.photos.slice(1, 4).map((p, i) => (
          <button key={i} className="hidden sm:block cursor-pointer" onClick={() => setLightbox(i + 1)} aria-label={`Open photo ${i + 2}`}>
            <img src={p} alt="" className="w-full h-full object-cover hover:opacity-95" />
          </button>
        ))}
        <button onClick={() => setTourOpen(true)} className="hidden sm:flex relative cursor-pointer items-center justify-center" aria-label="Open virtual tour">
          <img src={listing.photos[4]} alt="" className="w-full h-full object-cover blur-[2px] absolute inset-0" />
          <span className="relative z-10 bg-ink/75 text-bone rounded-full px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5">
            <Icon name="tour" className="w-4 h-4" /> 3D Tour
          </span>
        </button>
        <button onClick={() => setLightbox(0)} className="absolute bottom-3 right-3 bg-bone rounded-full px-4 py-2 text-xs font-semibold shadow-lg hover:bg-white cursor-pointer flex items-center gap-1.5">
          <Icon name="photo" className="w-4 h-4" /> Show all {listing.photos.length} photos
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-10 mt-8">
        {/* left column */}
        <div>
          {/* host strip */}
          <div className="flex items-center gap-4 pb-6 border-b hairline">
            <img src={host.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
            <div className="flex-1">
              <p className="font-semibold">Hosted by <Link to={`/profile/${host.id}`} className="underline hover:text-vault">{host.name}</Link></p>
              <p className="text-sm text-ink-3">Hosting since {host.since} · Responds {host.responseTime}</p>
            </div>
            {host.verified && <Badge tone="vault"><Icon name="verify" className="w-3 h-3" /> Verified</Badge>}
          </div>

          {/* spec sheet */}
          <section className="py-6 border-b hairline" aria-label="Specifications">
            <h2 className="font-display text-xl font-semibold mb-4">Spec sheet</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
              {spec.map(([k, v]) => (
                <div key={k} className="border-l-2 border-ink/10 pl-3">
                  <dt className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold">{k}</dt>
                  <dd className="font-mono text-sm mt-0.5 capitalize">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* description */}
          <section className="py-6 border-b hairline">
            <p className={cx("text-[15px] leading-relaxed text-ink-2", !descMore && "line-clamp-3")}>{listing.description}</p>
            <button className="text-sm font-semibold underline mt-2 hover:text-vault cursor-pointer" onClick={() => setDescMore(!descMore)}>
              {descMore ? "Show less" : "Show more"}
            </button>
          </section>

          {/* suitability */}
          <section className="py-6 border-b hairline" aria-label="Suitable for">
            <h2 className="font-display text-xl font-semibold mb-4">Suitable for</h2>
            <div className="flex flex-wrap gap-2">
              {listing.suitability.map((s) => (
                <Link key={s} to={`/search?suit=${s}`} className="border border-ink/20 rounded-full px-3.5 py-1.5 text-sm hover:border-vault hover:text-vault">
                  {SUITABILITY.find((x) => x.key === s)?.label ?? s}
                </Link>
              ))}
            </div>
          </section>

          {/* amenities */}
          <section className="py-6 border-b hairline" aria-label="Amenities">
            <h2 className="font-display text-xl font-semibold mb-4">What this space offers</h2>
            <ul className="grid sm:grid-cols-2 gap-2.5">
              {listing.amenities.slice(0, 10).map((a) => (
                <li key={a} className="flex items-center gap-2.5 text-sm">
                  <Icon name="check" className="w-4 h-4 text-vault" />
                  {AMENITIES.find((x) => x.key === a)?.label ?? a}
                </li>
              ))}
            </ul>
            {listing.amenities.length > 10 && (
              <Button variant="secondary" className="mt-5" onClick={() => setAmenOpen(true)}>
                Show all {listing.amenities.length} amenities
              </Button>
            )}
          </section>

          {/* rules & policies */}
          <section className="py-6 border-b hairline" aria-label="Rules and policies">
            <h2 className="font-display text-xl font-semibold mb-2">Rules & policies</h2>
            <Accordion title="Operating hours & access" defaultOpen>
              <p>{listing.operatingHours}{listing.access247 && " · 24/7 access available"}</p>
            </Accordion>
            <Accordion title="Noise & signage">
              <p>{NOISE_LABEL[listing.noise]}.<br />{SIGNAGE_LABEL[listing.signage]}.</p>
            </Accordion>
            <Accordion title="Fit-out & customisation">
              <p>{FITOUT_LABEL[listing.fitOut]}.</p>
            </Accordion>
            <Accordion title="Insurance & licensing">
              <p>
                {listing.insuranceRequired
                  ? <>Public liability insurance required{listing.minCoverage ? ` (minimum ${fmtMoney(listing.minCoverage)} coverage)` : ""}. A certificate of insurance must be provided before your start date.</>
                  : "No insurance certificate required for short bookings."}
                <br />
                {listing.licenseRequired ? "A relevant business license is required for this use class." : "No business license required."}
              </p>
            </Accordion>
            <Accordion title="Utilities & furniture">
              <p>
                Included: {listing.utilitiesIncluded.join(", ")}.<br />
                {listing.furniture.length ? `Furniture & equipment: ${listing.furniture.join(", ")}.` : "Space is let unfurnished."}
              </p>
            </Accordion>
            <Accordion title={`Cancellation — ${CANCEL_LABEL[listing.cancellation]}`}>
              <p>{CANCEL_DESC[listing.cancellation]}</p>
            </Accordion>
            <Accordion title="Deposit & cleaning">
              <p>
                Refundable deposit: <span className="font-mono">{fmtMoney(listing.deposit)}</span>, released within 48 hours of checkout.<br />
                Cleaning fee: <span className="font-mono">{fmtMoney(listing.cleaningFee)}</span> per booking — leave the space broom-clean.
              </p>
            </Accordion>
          </section>

          {/* availability */}
          <section className="py-6 border-b hairline" aria-label="Availability">
            <h2 className="font-display text-xl font-semibold mb-4">Availability</h2>
            <RangeCalendar
              start={start}
              end={end}
              onChange={(s, e) => { setStart(s); setEnd(e); }}
              blocked={new Set(listing.blocked)}
              booked={new Set(listing.booked)}
              minDays={listing.minTermDays > 1 ? listing.minTermDays : 1}
            />
          </section>

          {/* location */}
          <section className="py-6 border-b hairline" aria-label="Location">
            <h2 className="font-display text-xl font-semibold mb-4">Where you'll be</h2>
            <div className="relative h-64 rounded-2xl overflow-hidden bg-[#101b17]">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <rect width="100" height="100" fill="#15231e" />
                <path d="M0 40 Q 50 30 100 45" stroke="#23362f" strokeWidth="2" fill="none" />
                <path d="M30 0 Q 40 50 35 100" stroke="#23362f" strokeWidth="2" fill="none" />
                <path d="M70 0 Q 60 60 80 100" stroke="#23362f" strokeWidth="1.5" fill="none" />
              </svg>
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 block">
                <span className="block w-24 h-24 rounded-full bg-vault-3/30 border border-vault-3/60 animate-pulse" />
                <Icon name="pin" className="w-7 h-7 text-brass absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
              </span>
            </div>
            <p className="text-sm text-ink-2 mt-3">
              {listing.neighborhood}, {listing.city} — exact address shared after your booking is confirmed.
            </p>
          </section>

          {/* reviews */}
          <section className="py-6 border-b hairline" aria-label="Reviews">
            <h2 className="font-display text-xl font-semibold mb-1 flex items-center gap-2">
              <Icon name="star" className="w-5 h-5 text-brass" />
              {listing.rating.toFixed(2)} · {plural(listing.reviewCount, "review")}
            </h2>
            <dl className="grid sm:grid-cols-2 gap-x-10 gap-y-2.5 my-5">
              {Object.entries(listing.categories).map(([cat, v]) => (
                <div key={cat} className="flex items-center gap-3 text-sm">
                  <dt className="w-32 text-ink-2">{cat}</dt>
                  <dd className="flex-1 flex items-center gap-2">
                    <span className="flex-1 h-1 bg-ink/10 rounded-full overflow-hidden">
                      <span className="block h-full bg-vault rounded-full" style={{ width: `${(v / 5) * 100}%` }} />
                    </span>
                    <span className="font-mono text-xs w-8">{v.toFixed(1)}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="grid sm:grid-cols-2 gap-6">
              {reviews.slice(0, 4).map((r) => <ReviewCard key={r.id} r={r} />)}
            </div>
            {reviews.length > 4 && (
              <Button variant="secondary" className="mt-6" onClick={() => setReviewsOpen(true)}>
                Show all {reviews.length} reviews
              </Button>
            )}
          </section>

          {/* host card */}
          <section className="py-6" aria-label="About the host">
            <div className="border hairline rounded-2xl p-6 grid sm:grid-cols-[auto_1fr] gap-6">
              <div className="text-center">
                <span className="relative inline-block">
                  <img src={host.avatar} alt={host.name} className="w-20 h-20 rounded-full object-cover" />
                  {host.verified && <Icon name="verify" className="w-6 h-6 text-vault absolute -bottom-1 -right-1" />}
                </span>
                <p className="font-display font-semibold mt-2">{host.name}</p>
                {host.established && <p className="text-xs text-brass-2 font-semibold">Established Host</p>}
              </div>
              <div>
                <dl className="flex gap-8 text-sm mb-3 font-mono">
                  <div><dt className="text-[11px] uppercase text-ink-3">Response rate</dt><dd>{host.responseRatePct}%</dd></div>
                  <div><dt className="text-[11px] uppercase text-ink-3">Responds</dt><dd>{host.responseTime}</dd></div>
                  <div><dt className="text-[11px] uppercase text-ink-3">Hosting since</dt><dd>{host.since}</dd></div>
                </dl>
                <p className="text-sm text-ink-2 leading-relaxed mb-4">{host.bio}</p>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => (session ? setMsgOpen(true) : openAuth())}>
                    <Icon name="msg" className="w-4 h-4" /> Message {host.name.split(" ")[0]}
                  </Button>
                  <Link to={`/profile/${host.id}`} className="inline-flex items-center text-sm font-semibold underline hover:text-vault">View profile</Link>
                </div>
              </div>
            </div>
            <button className="text-xs text-ink-3 underline mt-4 hover:text-terra cursor-pointer" onClick={() => push("Thanks — our team will review this listing (demo)")}>
              Report this listing
            </button>
          </section>
        </div>

        {/* booking card */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 border hairline rounded-2xl shadow-xl bg-white p-6">
            <BookingWidget
              terms={terms} term={term} setTerm={setTerm}
              start={start} end={end} setStart={setStart} setEnd={setEnd}
              units={units} setUnits={setUnits} effUnits={effUnits}
              listing={listing} bd={bd} canBook={canBook} goBook={goBook}
              onMessage={() => (session ? setMsgOpen(true) : openAuth())}
            />
          </div>
        </aside>
      </div>

      {/* similar spaces */}
      {similar.length > 0 && (
        <section className="mt-12" aria-label="Similar spaces">
          <h2 className="font-display text-2xl font-semibold mb-5">Similar spaces</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-8">
            {similar.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      {/* mobile sticky bar */}
      <div className="lg:hidden fixed bottom-16 inset-x-0 z-40 bg-bone border-t hairline px-4 py-3 flex items-center justify-between gap-4">
        <p>
          <span className="font-display font-semibold text-lg">{fmtMoney(listing.terms[term] ?? 0)}</span>
          <span className="text-sm text-ink-3"> {TERM_SUFFIX[term]}</span>
        </p>
        <Button onClick={goBook} disabled={!canBook} className="flex-1 max-w-52">
          {listing.instantBook ? <><Icon name="bolt" className="w-4 h-4" /> Instant Book</> : "Request to Book"}
        </Button>
      </div>

      {/* lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-[85] bg-ink/95 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Photo gallery">
          <button onClick={() => setLightbox(null)} aria-label="Close gallery" className="absolute top-5 right-5 text-bone p-2 hover:bg-bone/10 rounded-full cursor-pointer">
            <Icon name="x" className="w-6 h-6" />
          </button>
          <button onClick={() => setLightbox((lightbox - 1 + listing.photos.length) % listing.photos.length)} aria-label="Previous photo" className="absolute left-4 text-bone p-3 hover:bg-bone/10 rounded-full cursor-pointer">
            <Icon name="chevL" className="w-6 h-6" />
          </button>
          <figure className="max-w-5xl w-full px-16">
            <img src={listing.photos[lightbox]} alt={`Photo ${lightbox + 1} of ${listing.photos.length}`} className="w-full max-h-[78vh] object-contain rounded-lg" />
            <figcaption className="text-center text-bone/70 font-mono text-sm mt-4">{lightbox + 1} / {listing.photos.length}</figcaption>
          </figure>
          <button onClick={() => setLightbox((lightbox + 1) % listing.photos.length)} aria-label="Next photo" className="absolute right-4 text-bone p-3 hover:bg-bone/10 rounded-full cursor-pointer">
            <Icon name="chevR" className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* virtual tour modal */}
      <Modal open={tourOpen} onClose={() => setTourOpen(false)} title="Virtual tour" wide>
        <div className="relative rounded-xl overflow-hidden">
          <img src={listing.photos[4]} alt="Virtual tour preview" className="w-full h-80 object-cover" />
          <div className="absolute inset-0 bg-ink/40 flex flex-col items-center justify-center text-bone gap-3">
            <Icon name="tour" className="w-10 h-10" />
            <p className="font-display font-semibold text-lg">360° tour coming soon</p>
            <p className="text-sm text-bone/75 max-w-xs text-center">This is a placeholder — in the full product you'd pan and walk through the space here.</p>
          </div>
        </div>
      </Modal>

      {/* all amenities modal */}
      <Modal open={amenOpen} onClose={() => setAmenOpen(false)} title="All amenities" wide>
        {[...new Set(AMENITIES.filter((a) => listing.amenities.includes(a.key)).map((a) => a.group))].map((g) => (
          <div key={g} className="mb-6">
            <h3 className="font-semibold text-sm mb-3">{g}</h3>
            <ul className="grid sm:grid-cols-2 gap-2.5">
              {AMENITIES.filter((a) => a.group === g && listing.amenities.includes(a.key)).map((a) => (
                <li key={a.key} className="flex items-center gap-2.5 text-sm">
                  <Icon name="check" className="w-4 h-4 text-vault" /> {a.label}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Modal>

      {/* all reviews modal */}
      <Modal open={reviewsOpen} onClose={() => setReviewsOpen(false)} title={`${reviews.length} reviews`} wide>
        <div className="space-y-6">
          {reviews.map((r) => <ReviewCard key={r.id} r={r} />)}
        </div>
      </Modal>

      {/* message host modal */}
      <Modal open={msgOpen} onClose={() => setMsgOpen(false)} title={`Message ${host.name.split(" ")[0]}`}>
        <p className="text-sm text-ink-2 mb-4">Ask about access, fit-out, insurance, viewings — anything you need before booking.</p>
        <textarea
          value={msgText}
          onChange={(e) => setMsgText(e.target.value)}
          rows={5}
          placeholder={`Hi ${host.name.split(" ")[0]}, I'm interested in ${listing.title}…`}
          className={inputCls}
          aria-label="Message to host"
        />
        <Button className="mt-4 w-full" onClick={sendMessage}>Send message</Button>
      </Modal>
    </main>
  );
}

/* ---------- booking widget ---------- */

function BookingWidget(props: {
  terms: Term[]; term: Term; setTerm: (t: Term) => void;
  start: string; end: string; setStart: (s: string) => void; setEnd: (s: string) => void;
  units: number; setUnits: (n: number) => void; effUnits: number;
  listing: NonNullable<ReturnType<typeof findListing>>;
  bd: ReturnType<typeof breakdown>; canBook: boolean; goBook: () => void; onMessage: () => void;
}) {
  const { terms, term, setTerm, start, end, setStart, setEnd, units, setUnits, effUnits, listing, bd, canBook, goBook, onMessage } = props;
  const isCalendarTerm = term === "daily";
  return (
    <div>
      <p className="mb-4">
        <span className="font-display text-3xl font-semibold">{fmtMoney(listing.terms[term] ?? 0)}</span>
        <span className="text-ink-3"> {TERM_SUFFIX[term]}</span>
      </p>

      {terms.length > 1 && (
        <div className="flex border border-ink/15 rounded-lg overflow-hidden mb-4" role="tablist" aria-label="Rental term">
          {terms.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={term === t}
              onClick={() => setTerm(t)}
              className={cx("flex-1 py-2 text-xs font-semibold cursor-pointer", term === t ? "bg-vault text-bone" : "hover:bg-ink/5")}
            >
              {TERM_LABEL[t]}
            </button>
          ))}
        </div>
      )}

      {isCalendarTerm ? (
        <div className="border border-ink/15 rounded-lg p-3 mb-4">
          <RangeCalendar
            start={start} end={end}
            onChange={(s, e) => { setStart(s); setEnd(e); }}
            blocked={new Set(listing.blocked)} booked={new Set(listing.booked)}
            months={1} minDays={Math.max(1, listing.minTermDays)}
          />
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          <label className="block text-sm">
            <span className="font-semibold">Start date</span>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls + " mt-1"} min={new Date().toISOString().slice(0, 10)} />
          </label>
          <div className="flex items-center justify-between border border-ink/15 rounded-lg px-3.5 py-2.5">
            <span className="text-sm font-semibold">{TERM_UNIT[term][0].toUpperCase() + TERM_UNIT[term].slice(1)}s</span>
            <NumStepper value={units} onChange={setUnits} min={1} max={term === "hourly" ? 12 : 24} label={`number of ${TERM_UNIT[term]}s`} />
          </div>
        </div>
      )}

      {/* pricing breakdown */}
      <dl className="text-sm space-y-2 border-t hairline pt-4" aria-live="polite">
        <div className="flex justify-between">
          <dt className="text-ink-2 underline decoration-dotted">{fmtMoney(listing.terms[term] ?? 0)} × {effUnits} {TERM_UNIT[term]}{effUnits !== 1 && "s"}</dt>
          <dd className="font-mono">{fmtMoney(bd.base)}</dd>
        </div>
        {bd.discount > 0 && (
          <div className="flex justify-between text-vault">
            <dt>Term discount</dt>
            <dd className="font-mono">−{fmtMoney(bd.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-ink-2">Cleaning fee</dt>
          <dd className="font-mono">{fmtMoney(bd.cleaning)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-2">Service fee (12%)</dt>
          <dd className="font-mono">{fmtMoney(bd.service)}</dd>
        </div>
        <div className="flex justify-between font-semibold border-t hairline pt-2.5">
          <dt>Total</dt>
          <dd className="font-mono">{fmtMoney(bd.total)}</dd>
        </div>
        <div className="flex justify-between text-ink-3 text-xs">
          <dt>Refundable deposit (held separately)</dt>
          <dd className="font-mono">{fmtMoney(bd.deposit)}</dd>
        </div>
      </dl>

      <Button className="w-full mt-5" onClick={goBook} disabled={!canBook}>
        {listing.instantBook ? <><Icon name="bolt" className="w-4 h-4" /> Instant Book</> : "Request to Book"}
      </Button>
      <p className="text-center text-xs text-ink-3 mt-2.5">
        {listing.instantBook ? "Confirmed immediately at checkout" : "You won't be charged yet"}
      </p>
      <button onClick={onMessage} className="block mx-auto text-sm font-semibold underline mt-3 hover:text-vault cursor-pointer">
        Message host first
      </button>
      <p className="text-xs text-ink-3 mt-4 border-t hairline pt-3">
        Cancellation: <span className="font-semibold">{CANCEL_LABEL[listing.cancellation]}</span> — {CANCEL_DESC[listing.cancellation]}
      </p>
    </div>
  );
}

/* ---------- review card ---------- */

export function ReviewCard({ r }: { r: (typeof REVIEWS)[number] }) {
  const [more, setMore] = useState(false);
  return (
    <article className="text-sm">
      <div className="flex items-center gap-3 mb-2">
        <img src={r.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
        <div>
          <p className="font-semibold">{r.author}</p>
          <p className="text-xs text-ink-3">{new Date(r.date + "T12:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" })} · <span className="text-vault font-medium">{r.useTag}</span></p>
        </div>
      </div>
      <Stars value={r.stars} />
      <p className={cx("text-ink-2 mt-1.5 leading-relaxed", !more && "line-clamp-3")}>{r.text}</p>
      {r.text.length > 140 && (
        <button className="text-xs font-semibold underline mt-1 cursor-pointer" onClick={() => setMore(!more)}>{more ? "Show less" : "Show more"}</button>
      )}
      {r.hostResponse && (
        <div className="mt-3 ml-4 pl-3 border-l-2 border-ink/10">
          <p className="text-xs font-semibold text-ink-3 mb-1">Response from host</p>
          <p className="text-ink-2 text-xs leading-relaxed">{r.hostResponse.text}</p>
        </div>
      )}
    </article>
  );
}
