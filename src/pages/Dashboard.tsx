import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ListingCard } from "../components/ListingCard";
import { Badge, Button, EmptyState, Icon, Modal, StatusPill, Tabs, inputCls } from "../components/ui";
import { diffDays, fmtMoney, fmtRange, todayIso } from "../lib/utils";
import { BOOKINGS, SUITABILITY } from "../mocks/data";
import type { Booking, Review } from "../mocks/types";
import { findListing, useApp, useToasts } from "../state/store";

function useMyBookings(): Booking[] {
  const { session, myBookings } = useApp();
  return useMemo(() => {
    if (!session) return [];
    const seeded = BOOKINGS.filter((b) => b.renterId === session.id);
    return [...myBookings.filter((b) => b.renterId === session.id), ...seeded];
  }, [session, myBookings]);
}

export function RenterDashboard() {
  const { session, openAuth, published, recents, favorites } = useApp();
  const navigate = useNavigate();
  const bookings = useMyBookings();
  const [tab, setTab] = useState("upcoming");

  if (!session) {
    return (
      <main id="main" className="max-w-3xl mx-auto px-4 py-20">
        <EmptyState icon="cal" title="Sign in to see your bookings" body="Your upcoming, pending and past bookings live here."
          action={<Button onClick={openAuth}>Sign in</Button>} />
      </main>
    );
  }

  const today = todayIso();
  const upcoming = bookings.filter((b) => b.status === "confirmed" && b.end >= today);
  const pending = bookings.filter((b) => b.status === "pending");
  const past = bookings.filter((b) => b.status === "completed" || (b.status === "confirmed" && b.end < today));
  const cancelled = bookings.filter((b) => b.status === "cancelled" || b.status === "declined");
  const next = upcoming.sort((a, b) => a.start.localeCompare(b.start))[0];
  const nextListing = next ? findListing(next.listingId, published) : undefined;

  const byTab: Record<string, Booking[]> = { upcoming, pending, past, cancelled };

  return (
    <main id="main" className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-semibold mb-1">Good to see you, {session.name.split(" ")[0]}.</h1>
      <p className="text-sm text-ink-2 mb-8">{upcoming.length} upcoming · {pending.length} pending · {favorites.length} saved</p>

      {next && nextListing && (
        <section className="relative grain bg-vault text-bone rounded-2xl overflow-hidden mb-10" aria-label="Next booking">
          <div className="relative p-6 sm:p-8 grid sm:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-brass mb-2">
                Next booking · in {diffDays(today, next.start)} days
              </p>
              <h2 className="font-display text-2xl font-semibold">{nextListing.title}</h2>
              <p className="text-bone/75 text-sm mt-1">{fmtRange(next.start, next.end)} · {nextListing.neighborhood}, {nextListing.city}</p>
              <p className="font-mono text-sm mt-3 text-bone/90">Unit 3, 14 Cremer Street · gate code 4471 (demo)</p>
              <div className="flex gap-3 mt-5">
                <Button variant="brass" onClick={() => navigate("/inbox")}>Message host</Button>
                <Button variant="ghost" className="!text-bone hover:!bg-bone/10" onClick={() => navigate(`/space/${nextListing.id}`)}>View listing</Button>
              </div>
            </div>
            <img src={nextListing.photos[0]} alt="" className="hidden sm:block w-44 h-32 rounded-xl object-cover" />
          </div>
        </section>
      )}

      <Tabs
        tabs={[
          { key: "upcoming", label: "Upcoming", count: upcoming.length },
          { key: "pending", label: "Pending", count: pending.length },
          { key: "past", label: "Past", count: past.length },
          { key: "cancelled", label: "Cancelled", count: cancelled.length },
        ]}
        active={tab} onChange={setTab}
      />

      <div className="mt-6 space-y-4">
        {byTab[tab].length === 0 && (
          <EmptyState icon="cal" title={`No ${tab} bookings`} body="When you book a space it will appear here."
            action={<Button onClick={() => navigate("/search")}>Find a space</Button>} />
        )}
        {byTab[tab].map((b) => <BookingRow key={b.id} b={b} />)}
      </div>

      {recents.length > 0 && (
        <section className="mt-14" aria-label="Recently viewed">
          <h2 className="font-display text-2xl font-semibold mb-5">Recently viewed</h2>
          <div className="flex gap-5 overflow-x-auto rail pb-2">
            {recents.slice(0, 6).map((id) => {
              const l = findListing(id, published);
              return l ? <div key={id} className="w-64 shrink-0"><ListingCard listing={l} dense /></div> : null;
            })}
          </div>
        </section>
      )}
    </main>
  );
}

function BookingRow({ b }: { b: Booking }) {
  const { published, updateBooking, myBookings } = useApp();
  const push = useToasts((s) => s.push);
  const navigate = useNavigate();
  const listing = findListing(b.listingId, published);
  const isMine = myBookings.some((x) => x.id === b.id);
  const canReview = (b.status === "completed" || (b.status === "confirmed" && b.end < todayIso()));
  const hoursLeft = b.expiresAt ? Math.max(0, Math.round((new Date(b.expiresAt).getTime() - Date.now()) / 3600000)) : null;

  return (
    <article className="border hairline rounded-2xl bg-white p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
      {listing && <img src={listing.photos[0]} alt="" className="w-full sm:w-28 h-32 sm:h-20 rounded-xl object-cover" />}
      <div className="flex-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h3 className="font-display font-semibold">{listing?.title ?? "Listing"}</h3>
          <StatusPill status={b.status} />
          {b.status === "pending" && hoursLeft !== null && <Badge tone="brass"><Icon name="clock" className="w-3 h-3" /> expires in {hoursLeft}h</Badge>}
        </div>
        <p className="text-sm text-ink-3 mt-1 font-mono">{fmtRange(b.start, b.end)} · {fmtMoney(b.breakdown.total)} · {b.code}</p>
        <p className="text-xs text-ink-3 mt-0.5">{b.businessType}</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {listing && <Button variant="secondary" onClick={() => navigate(`/space/${listing.id}`)}>View space</Button>}
        {b.status === "pending" && isMine && (
          <Button variant="ghost" onClick={() => { updateBooking(b.id, { status: "cancelled" }); push("Request withdrawn"); }}>Withdraw</Button>
        )}
        {canReview && <Button onClick={() => navigate("/dashboard/reviews")}>Leave a review</Button>}
      </div>
    </article>
  );
}

/* ---------- reviews page ---------- */

export function ReviewsPage() {
  const { session, openAuth, myReviews, addReview, published } = useApp();
  const push = useToasts((s) => s.push);
  const bookings = useMyBookings();
  const [tab, setTab] = useState("write");
  const [composer, setComposer] = useState<Booking | null>(null);
  const [stars, setStars] = useState(5);
  const [cats, setCats] = useState<Record<string, number>>({});
  const [text, setText] = useState("");

  if (!session) {
    return (
      <main id="main" className="max-w-3xl mx-auto px-4 py-20">
        <EmptyState icon="star" title="Sign in to manage reviews" body="Review past bookings and see what you've written."
          action={<Button onClick={openAuth}>Sign in</Button>} />
      </main>
    );
  }

  const today = todayIso();
  const reviewedListings = new Set(myReviews.map((r) => r.listingId));
  const toWrite = bookings.filter(
    (b) => (b.status === "completed" || (b.status === "confirmed" && b.end < today)) && !reviewedListings.has(b.listingId),
  );

  const submit = () => {
    if (!composer) return;
    if (text.trim().length < 40) return push("Reviews need at least 40 characters — what should others know?");
    const review: Review = {
      id: `r-mine-${Date.now()}`,
      listingId: composer.listingId,
      author: session.name,
      avatar: session.avatar,
      date: today,
      useTag: composer.businessType,
      stars,
      text: text.trim(),
    };
    addReview(review);
    setComposer(null); setText(""); setStars(5); setCats({});
    push("Review published — thanks for helping the next renter");
    setTab("written");
  };

  const CATS = ["Accuracy", "Access", "Cleanliness", "Communication", "Location", "Value"];

  return (
    <main id="main" className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-semibold mb-6">Reviews</h1>
      <Tabs tabs={[{ key: "write", label: "To write", count: toWrite.length }, { key: "written", label: "Written", count: myReviews.length }]} active={tab} onChange={setTab} />

      {tab === "write" && (
        <div className="mt-6 space-y-4">
          {toWrite.length === 0 && <EmptyState icon="star" title="All caught up" body="Once a booking ends, you'll have 14 days to review the space here." />}
          {toWrite.map((b) => {
            const l = findListing(b.listingId, published);
            const daysLeft = Math.max(1, 14 - diffDays(b.end, today));
            return (
              <article key={b.id} className="border hairline rounded-2xl bg-white p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
                {l && <img src={l.photos[0]} alt="" className="w-full sm:w-24 h-28 sm:h-18 rounded-xl object-cover" />}
                <div className="flex-1">
                  <h3 className="font-display font-semibold">{l?.title}</h3>
                  <p className="text-sm text-ink-3 font-mono mt-0.5">{fmtRange(b.start, b.end)}</p>
                  <p className="text-xs text-brass-2 font-semibold mt-1">{daysLeft} days left to review</p>
                </div>
                <Button onClick={() => setComposer(b)}>Write review</Button>
              </article>
            );
          })}
        </div>
      )}

      {tab === "written" && (
        <div className="mt-6 space-y-5">
          {myReviews.length === 0 && <EmptyState icon="star" title="No reviews yet" body="Reviews you write appear here and on the listing." />}
          {myReviews.map((r) => {
            const l = findListing(r.listingId, published);
            return (
              <article key={r.id} className="border hairline rounded-2xl bg-white p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <Link to={`/space/${r.listingId}`} className="font-display font-semibold hover:underline">{l?.title ?? "Listing"}</Link>
                  <span className="inline-flex items-center gap-1 text-brass font-mono text-sm"><Icon name="star" className="w-4 h-4" />{r.stars}.0</span>
                </div>
                <p className="text-sm text-ink-2 mt-2 leading-relaxed">{r.text}</p>
                <p className="text-xs text-ink-3 mt-2">{r.date} · {r.useTag}</p>
              </article>
            );
          })}
        </div>
      )}

      <Modal open={composer !== null} onClose={() => setComposer(null)} title="Write a review">
        {composer && (
          <div className="space-y-5">
            <div>
              <p className="font-semibold text-sm mb-2">Overall rating</p>
              <div className="flex gap-1" role="radiogroup" aria-label="Overall rating">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} role="radio" aria-checked={stars === i} aria-label={`${i} stars`} onClick={() => setStars(i)} className="cursor-pointer">
                    <Icon name="star" className={`w-8 h-8 ${i <= stars ? "text-brass" : "text-ink/15"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {CATS.map((c) => (
                <label key={c} className="text-sm">
                  <span className="block text-ink-2 mb-1">{c}</span>
                  <select value={cats[c] ?? 5} onChange={(e) => setCats({ ...cats, [c]: Number(e.target.value) })} className={inputCls}>
                    {[5, 4, 3, 2, 1].map((v) => <option key={v} value={v}>{v} ★</option>)}
                  </select>
                </label>
              ))}
            </div>
            <label className="block text-sm">
              <span className="font-semibold">Your review</span>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className={inputCls + " mt-1.5"}
                placeholder="What should the next renter know? (40+ characters)" />
              <span className="text-xs text-ink-3 font-mono">{text.trim().length}/40 min</span>
            </label>
            <p className="text-xs text-ink-3">Booked as: <span className="font-semibold">{composer.businessType}</span> — this appears with your review. {SUITABILITY.length} categories supported.</p>
            <Button className="w-full" onClick={submit}>Publish review</Button>
          </div>
        )}
      </Modal>
    </main>
  );
}
