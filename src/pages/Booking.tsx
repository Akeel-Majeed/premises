import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button, Field, Icon, inputCls } from "../components/ui";
import {
  CANCEL_DESC, CANCEL_LABEL, TERM_UNIT, breakdown, cx, fmtMoney, fmtRange, todayIso,
} from "../lib/utils";
import { SUITABILITY, hostOf } from "../mocks/data";
import type { Booking, Term } from "../mocks/types";
import { findListing, useApp, useToasts } from "../state/store";

function SummaryCard({ listingId, term, start, end, units }: { listingId: string; term: Term; start: string; end: string; units: number }) {
  const { published } = useApp();
  const listing = findListing(listingId, published);
  if (!listing) return null;
  const bd = breakdown(listing, term, units);
  return (
    <aside className="border hairline rounded-2xl bg-white p-5 lg:sticky lg:top-24">
      <div className="flex gap-3.5 pb-4 border-b hairline">
        <img src={listing.photos[0]} alt="" className="w-24 h-20 rounded-lg object-cover" />
        <div>
          <p className="font-display font-semibold text-sm">{listing.title}</p>
          <p className="text-xs text-ink-3 mt-0.5">{listing.neighborhood}, {listing.city}</p>
          <p className="text-xs font-mono mt-1">{fmtRange(start, end)} · {units} {TERM_UNIT[term]}{units !== 1 && "s"}</p>
        </div>
      </div>
      <dl className="text-sm space-y-2 pt-4">
        <div className="flex justify-between"><dt className="text-ink-2">Subtotal</dt><dd className="font-mono">{fmtMoney(bd.base)}</dd></div>
        {bd.discount > 0 && <div className="flex justify-between text-vault"><dt>Term discount</dt><dd className="font-mono">−{fmtMoney(bd.discount)}</dd></div>}
        <div className="flex justify-between"><dt className="text-ink-2">Cleaning fee</dt><dd className="font-mono">{fmtMoney(bd.cleaning)}</dd></div>
        <div className="flex justify-between"><dt className="text-ink-2">Service fee</dt><dd className="font-mono">{fmtMoney(bd.service)}</dd></div>
        <div className="flex justify-between font-semibold border-t hairline pt-2.5"><dt>Total</dt><dd className="font-mono">{fmtMoney(bd.total)}</dd></div>
        <div className="flex justify-between text-xs text-ink-3"><dt>Refundable deposit</dt><dd className="font-mono">{fmtMoney(bd.deposit)}</dd></div>
      </dl>
    </aside>
  );
}

export function BookingRequest() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const { published, session, addBooking } = useApp();
  const push = useToasts((s) => s.push);
  const listing = findListing(id ?? "", published);

  const term = (sp.get("term") as Term) ?? "daily";
  const start = sp.get("start") ?? todayIso();
  const end = sp.get("end") ?? start;
  const units = Number(sp.get("units") ?? 1);

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [useNote, setUseNote] = useState("");
  const [acks, setAcks] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<string[]>([]);

  const ackItems = useMemo(() => {
    if (!listing) return [];
    const items = [
      { key: "deposit", label: `I understand the ${fmtMoney(listing.deposit)} refundable deposit will be held for this booking.` },
      { key: "hours", label: `I accept the operating hours (${listing.operatingHours}).` },
      { key: "cancel", label: `I accept the ${CANCEL_LABEL[listing.cancellation]} cancellation policy.` },
    ];
    if (listing.insuranceRequired) items.unshift({ key: "insurance", label: `I will provide a certificate of public liability insurance${listing.minCoverage ? ` (minimum ${fmtMoney(listing.minCoverage)})` : ""}.` });
    if (listing.licenseRequired) items.push({ key: "license", label: "I hold (or will obtain) the business license required for my use." });
    return items;
  }, [listing]);

  if (!listing || !session) {
    return (
      <main id="main" className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-ink-2 mb-6">{!session ? "Sign in to book this space." : "Listing not found."}</p>
        <Button onClick={() => navigate(listing ? `/space/${listing.id}` : "/search")}>Go back</Button>
      </main>
    );
  }

  const bd = breakdown(listing, term, units);
  const isInstant = listing.instantBook;

  const submit = () => {
    const errs: string[] = [];
    if (!businessName.trim()) errs.push("Add your business name");
    if (!businessType) errs.push("Choose your business type");
    if (useNote.trim().length < 15) errs.push("Tell the host a little more about your intended use (15+ characters)");
    for (const a of ackItems) if (!acks[a.key]) errs.push(`Confirm: "${a.label}"`);
    setErrors(errs);
    if (errs.length) return;

    const bid = `b-${Date.now()}`;
    const booking: Booking = {
      id: bid,
      code: `PRM-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      listingId: listing.id,
      renterId: session.id,
      renterName: session.name,
      businessType: SUITABILITY.find((s) => s.key === businessType)?.label ?? businessType,
      useNote: useNote.trim(),
      term, start, end, units,
      status: "pending",
      expiresAt: new Date(Date.now() + 24 * 3600000).toISOString(),
      breakdown: bd,
      createdAt: todayIso(),
    };
    addBooking(booking);
    if (isInstant) {
      navigate(`/checkout/${bid}`);
    } else {
      push("Request sent to the host");
      navigate(`/confirmation/${bid}`);
    }
  };

  const host = hostOf(listing);

  return (
    <main id="main" className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link to={`/space/${listing.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline mb-6">
        <Icon name="chevL" className="w-4 h-4" /> Back to listing
      </Link>
      <h1 className="font-display text-3xl font-semibold mb-8">{isInstant ? "Confirm your booking" : "Request to book"}</h1>

      <div className="grid lg:grid-cols-[1fr_380px] gap-10">
        <div className="space-y-8">
          <section className="border hairline rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold mb-1">1 · Your booking</h2>
            <p className="text-sm text-ink-2 mb-3">Dates and term carry over from the listing — go back to change them.</p>
            <p className="font-mono text-sm bg-bone-2 rounded-lg px-4 py-3">
              {fmtRange(start, end)} · {units} {TERM_UNIT[term]}{units !== 1 && "s"} · {fmtMoney(listing.terms[term] ?? 0)}/{TERM_UNIT[term]}
            </p>
          </section>

          <section className="border hairline rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold">2 · Business details</h2>
            <p className="text-sm text-ink-2 -mt-2">
              {isInstant ? "Helps the host prepare the space for you." : `${host.name.split(" ")[0]} reviews these before approving.`}
            </p>
            <Field label="Business name">
              <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputCls} placeholder="e.g. Fern & Forge Ltd" />
            </Field>
            <Field label="Business type">
              <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                {SUITABILITY.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="How will you use the space?" hint="Headcount, equipment, schedule — anything relevant.">
              <textarea value={useNote} onChange={(e) => setUseNote(e.target.value)} rows={4} className={inputCls}
                placeholder={`Tell ${host.name.split(" ")[0]} how you'll use the space…`} />
            </Field>
          </section>

          <section className="border hairline rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold mb-4">3 · Requirements</h2>
            <div className="space-y-3">
              {ackItems.map((a) => (
                <label key={a.key} className="flex items-start gap-3 text-sm cursor-pointer">
                  <input type="checkbox" checked={!!acks[a.key]} onChange={(e) => setAcks({ ...acks, [a.key]: e.target.checked })} className="mt-0.5 w-4 h-4 accent-[#174a3c]" />
                  {a.label}
                </label>
              ))}
            </div>
            <p className="text-xs text-ink-3 mt-4">{CANCEL_DESC[listing.cancellation]}</p>
          </section>

          {errors.length > 0 && (
            <div role="alert" className="border border-terra/40 bg-terra/5 rounded-xl p-4 text-sm text-terra">
              <p className="font-semibold mb-1.5">Fix the following to continue:</p>
              <ul className="list-disc pl-5 space-y-1">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
            </div>
          )}

          <Button className="w-full py-3.5" onClick={submit}>
            {isInstant ? <><Icon name="bolt" className="w-4 h-4" /> Continue to payment</> : "Send request"}
          </Button>
          {!isInstant && <p className="text-center text-xs text-ink-3 -mt-4">You won't be charged unless the host approves. Requests expire after 24 hours.</p>}
        </div>

        <SummaryCard listingId={listing.id} term={term} start={start} end={end} units={units} />
      </div>
    </main>
  );
}

export function Checkout() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { myBookings, updateBooking, published } = useApp();
  const booking = myBookings.find((b) => b.id === bookingId);
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState("card");

  if (!booking) return <main id="main" className="max-w-xl mx-auto px-4 py-20 text-center text-ink-2">Booking not found.</main>;
  const listing = findListing(booking.listingId, published);

  const pay = () => {
    setPaying(true);
    setTimeout(() => {
      updateBooking(booking.id, { status: "confirmed" });
      navigate(`/confirmation/${booking.id}`);
    }, 1500);
  };

  return (
    <main id="main" className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-semibold mb-2">Checkout</h1>
      <p className="inline-flex items-center gap-2 text-sm bg-brass/10 border border-brass/40 text-brass-2 rounded-lg px-4 py-2.5 mb-8 font-medium">
        <Icon name="info" className="w-4 h-4" /> Demo prototype — no real payment is processed. Use any values.
      </p>

      <div className="grid lg:grid-cols-[1fr_380px] gap-10">
        <div className="space-y-6">
          <section className="border hairline rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Payment method</h2>
            <div className="space-y-3">
              {[["card", "Credit or debit card"], ["wallet", "Premises Wallet (demo)"]].map(([v, label]) => (
                <label key={v} className={cx("flex items-center gap-3 border rounded-xl px-4 py-3.5 text-sm font-medium cursor-pointer", method === v ? "border-vault bg-vault/5" : "border-ink/15")}>
                  <input type="radio" name="method" checked={method === v} onChange={() => setMethod(v)} className="accent-[#174a3c]" />
                  {label}
                </label>
              ))}
            </div>
            {method === "card" && (
              <div className="grid grid-cols-2 gap-4 mt-5">
                <Field label="Card number"><input className={inputCls} placeholder="4242 4242 4242 4242" inputMode="numeric" /></Field>
                <Field label="Name on card"><input className={inputCls} placeholder="M. Chen" /></Field>
                <Field label="Expiry"><input className={inputCls} placeholder="12/29" /></Field>
                <Field label="CVC"><input className={inputCls} placeholder="123" inputMode="numeric" /></Field>
              </div>
            )}
          </section>

          <section className="border hairline rounded-2xl p-6 text-sm text-ink-2 space-y-2.5">
            <h2 className="font-display text-lg font-semibold text-ink">What you're agreeing to</h2>
            <p>· <span className="font-semibold">{fmtMoney(booking.breakdown.total)}</span> charged now.</p>
            <p>· <span className="font-semibold">{fmtMoney(booking.breakdown.deposit)}</span> deposit held separately, released within 48h of checkout.</p>
            {listing && <p>· Cancellation: {CANCEL_LABEL[listing.cancellation]} — {CANCEL_DESC[listing.cancellation]}</p>}
          </section>

          <Button className="w-full py-3.5" onClick={pay} disabled={paying}>
            {paying ? "Processing…" : `Confirm and pay ${fmtMoney(booking.breakdown.total)}`}
          </Button>
        </div>

        <SummaryCard listingId={booking.listingId} term={booking.term} start={booking.start} end={booking.end} units={booking.units} />
      </div>
    </main>
  );
}

export function Confirmation() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { myBookings, published } = useApp();
  const push = useToasts((s) => s.push);
  const booking = myBookings.find((b) => b.id === bookingId);
  if (!booking) return <main id="main" className="max-w-xl mx-auto px-4 py-20 text-center text-ink-2">Booking not found.</main>;
  const listing = findListing(booking.listingId, published);
  const confirmed = booking.status === "confirmed";

  return (
    <main id="main" className="max-w-2xl mx-auto px-4 sm:px-6 py-14 text-center">
      <span className={cx("inline-flex w-16 h-16 rounded-full items-center justify-center mb-6 reveal", confirmed ? "bg-vault text-bone" : "bg-brass/15 text-brass-2")}>
        <Icon name={confirmed ? "check" : "clock"} className="w-8 h-8" />
      </span>
      <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-3">
        {confirmed ? "You're booked." : "Request sent."}
      </h1>
      <p className="text-ink-2 mb-2">
        {confirmed
          ? "The exact address and access details are now on your booking page."
          : "The host typically responds within a few hours. Your request expires in 24 hours if unanswered."}
      </p>
      <p className="font-mono text-sm bg-bone-2 inline-block rounded-lg px-4 py-2 mb-8">Booking code: {booking.code}</p>

      {listing && (
        <div className="border hairline rounded-2xl p-5 flex gap-4 items-center text-left mb-8 bg-white">
          <img src={listing.photos[0]} alt="" className="w-24 h-20 rounded-lg object-cover" />
          <div>
            <p className="font-display font-semibold">{listing.title}</p>
            <p className="text-sm text-ink-3">{fmtRange(booking.start, booking.end)} · {fmtMoney(booking.breakdown.total)}</p>
            {confirmed && <p className="text-sm font-mono mt-1 text-vault">Unit 3, 14 Cremer Street — gate code 4471 (demo)</p>}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={() => navigate("/dashboard")}>View my bookings</Button>
        <Button variant="secondary" onClick={() => push("Added to calendar (demo)")}>Add to calendar</Button>
        <Button variant="secondary" onClick={() => navigate("/inbox")}>Message host</Button>
      </div>
    </main>
  );
}
