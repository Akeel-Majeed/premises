import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Badge, BarChart, Button, Donut, EmptyState, Icon, Modal, Sparkline, StatusPill, inputCls,
} from "../components/ui";
import { cx, fmtMoney, fmtRange, plural, todayIso } from "../lib/utils";
import { BOOKINGS, HOSTS, LISTINGS, REVIEWS } from "../mocks/data";
import type { Booking, Listing } from "../mocks/types";
import { useApp, useToasts } from "../state/store";

/** Daniel's seed listings + anything the user published. */
export function useHostListings(): Listing[] {
  const { published } = useApp();
  return useMemo(() => [...published, ...LISTINGS.filter((l) => l.hostId === "h-daniel")], [published]);
}

export function useHostRequests(): Booking[] {
  const { decisions } = useApp();
  return useMemo(
    () =>
      BOOKINGS.filter((b) => b.id.startsWith("b-d")).map((b) =>
        decisions[b.id] ? { ...b, status: decisions[b.id] } : b,
      ),
    [decisions],
  );
}

export function HostGuard({ children }: { children: React.ReactNode }) {
  const { session, openAuth } = useApp();
  if (!session) {
    return (
      <main id="main" className="max-w-3xl mx-auto px-4 py-20">
        <EmptyState icon="grid" title="Sign in to host" body="Manage listings, calendars and booking requests from your hosting dashboard."
          action={<Button onClick={openAuth}>Sign in</Button>} />
      </main>
    );
  }
  return <>{children}</>;
}

/* ---------- overview ---------- */

export function HostOverview() {
  const { session } = useApp();
  const listings = useHostListings();
  const requests = useHostRequests();
  const navigate = useNavigate();
  const pending = requests.filter((r) => r.status === "pending");
  const upcoming = requests.filter((r) => r.status === "confirmed" && r.end >= todayIso());
  const earnings = requests.filter((r) => r.status === "completed" || r.status === "confirmed").reduce((a, b) => a + b.breakdown.base, 0);
  const avgRating = listings.reduce((a, l) => a + l.rating, 0) / Math.max(listings.length, 1);

  return (
    <main id="main" className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-semibold mb-1">Welcome back, {session?.name.split(" ")[0]}.</h1>
      <p className="text-sm text-ink-2 mb-8">Here's how your spaces are doing today.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: "This month's earnings", value: fmtMoney(earnings), delta: "+12% vs last month" },
          { label: "Occupancy", value: "64%", delta: "+5 pts" },
          { label: "Pending requests", value: String(pending.length), delta: pending.length ? "needs action" : "all clear" },
          { label: "Average rating", value: avgRating.toFixed(2), delta: `${plural(listings.length, "listing")}` },
        ].map((s, i) => (
          <div key={s.label} className="reveal border hairline rounded-2xl bg-white p-5" style={{ animationDelay: `${i * 50}ms` }}>
            <p className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold">{s.label}</p>
            <p className="font-display text-3xl font-semibold mt-1.5">{s.value}</p>
            <p className="text-xs text-vault mt-1">{s.delta}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <section aria-label="Action needed">
          <h2 className="font-display text-xl font-semibold mb-4">Action needed</h2>
          {pending.length === 0 ? (
            <p className="text-sm text-ink-2 border hairline rounded-2xl p-6 bg-white">Nothing waiting on you. Nicely done.</p>
          ) : (
            <div className="space-y-3">
              {pending.map((r) => (
                <button key={r.id} onClick={() => navigate("/host/requests")}
                  className="w-full flex items-center gap-4 border hairline rounded-2xl bg-white p-4 text-left hover:border-vault cursor-pointer">
                  <span className="w-10 h-10 rounded-full bg-brass/15 text-brass-2 flex items-center justify-center shrink-0"><Icon name="clock" className="w-5 h-5" /></span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-sm">{r.renterName} — {r.businessType}</span>
                    <span className="block text-xs text-ink-3 mt-0.5 font-mono">{fmtRange(r.start, r.end)} · {fmtMoney(r.breakdown.base)}</span>
                  </span>
                  <Icon name="chevR" className="w-4 h-4 text-ink-3" />
                </button>
              ))}
            </div>
          )}

          <h2 className="font-display text-xl font-semibold mt-8 mb-4">This week</h2>
          <div className="space-y-3">
            {upcoming.slice(0, 3).map((r) => {
              const l = listings.find((x) => x.id === r.listingId) ?? LISTINGS.find((x) => x.id === r.listingId);
              return (
                <div key={r.id} className="flex items-center gap-4 border hairline rounded-2xl bg-white p-4">
                  <img src={l?.photos[0]} alt="" className="w-14 h-11 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{l?.title}</p>
                    <p className="text-xs text-ink-3 font-mono">{fmtRange(r.start, r.end)} · {r.renterName} · {r.businessType}</p>
                  </div>
                  <StatusPill status={r.status} />
                </div>
              );
            })}
            {upcoming.length === 0 && <p className="text-sm text-ink-2 border hairline rounded-2xl p-6 bg-white">No bookings starting this week.</p>}
          </div>
        </section>

        <aside>
          <h2 className="font-display text-xl font-semibold mb-4">Last 30 days</h2>
          <div className="border hairline rounded-2xl bg-white p-5">
            <p className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold mb-2">Earnings trend (demo)</p>
            <Sparkline data={[420, 380, 560, 510, 740, 620, 880, 790, 940, 860, 1100, 1240]} />
            <div className="h-px bg-ink/10 my-4" />
            <Link to="/host/insights" className="text-sm font-semibold text-vault hover:underline">Full insights →</Link>
          </div>
          <Button className="w-full mt-5" onClick={() => navigate("/host/listings/new")}>
            <Icon name="plus" className="w-4 h-4" /> Create a new listing
          </Button>
        </aside>
      </div>
    </main>
  );
}

/* ---------- listings manager ---------- */

export function HostListings() {
  const listings = useHostListings();
  const { updateListing, published } = useApp();
  const push = useToasts((s) => s.push);
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState<Listing | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [localStatus, setLocalStatus] = useState<Record<string, Listing["status"]>>({});

  const statusOf = (l: Listing) => localStatus[l.id] ?? l.status;
  const setStatus = (l: Listing, s: Listing["status"]) => {
    if (published.some((p) => p.id === l.id)) updateListing(l.id, { status: s });
    else setLocalStatus({ ...localStatus, [l.id]: s });
    push(s === "active" ? "Listing is live" : "Listing snoozed — hidden from search");
  };

  return (
    <main id="main" className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-3xl font-semibold">Your listings</h1>
        <Button onClick={() => navigate("/host/listings/new")}><Icon name="plus" className="w-4 h-4" /> Create listing</Button>
      </div>

      {listings.length === 0 ? (
        <EmptyState icon="grid" title="Your dashboard comes alive with your first listing"
          body="List an office floor, a storefront, a warehouse bay — it takes about 20 minutes."
          action={<Button onClick={() => navigate("/host/listings/new")}>Create your first listing</Button>} />
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <article key={l.id} className="border hairline rounded-2xl bg-white p-4 flex flex-col sm:flex-row gap-4 sm:items-center">
              <img src={l.photos[0]} alt="" className="w-full sm:w-28 h-32 sm:h-20 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="font-display font-semibold">{l.title}</h2>
                  <StatusPill status={statusOf(l)} />
                </div>
                <p className="text-xs text-ink-3 font-mono mt-1">
                  {l.sqft.toLocaleString()} sq ft · {l.neighborhood}, {l.city} · ★ {l.rating.toFixed(2)} ({l.reviewCount})
                </p>
                <p className="text-xs text-ink-2 mt-1">
                  Views <span className="font-mono">{(l.id.length * 137) % 900 + 120}</span> · Saves <span className="font-mono">{(l.id.length * 37) % 80 + 8}</span> · Occupancy <span className="font-mono">{(l.id.length * 29) % 40 + 45}%</span>
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary" onClick={() => navigate(`/host/listings/${l.id}/edit`)}><Icon name="edit" className="w-4 h-4" /> Edit</Button>
                <Button variant="secondary" onClick={() => navigate(`/host/calendar?listing=${l.id}`)}><Icon name="cal" className="w-4 h-4" /> Calendar</Button>
                <Button variant="ghost" onClick={() => navigate(`/space/${l.id}`)}>Preview</Button>
                {statusOf(l) === "active"
                  ? <Button variant="ghost" onClick={() => setStatus(l, "snoozed")}>Snooze</Button>
                  : <Button variant="ghost" onClick={() => setStatus(l, "active")}>Activate</Button>}
                <Button variant="ghost" className="!text-terra" onClick={() => { setConfirmDelete(l); setConfirmText(""); }}>
                  <Icon name="trash" className="w-4 h-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Delete listing?">
        {confirmDelete && (
          <div className="space-y-4">
            <p className="text-sm text-ink-2">
              This permanently removes <span className="font-semibold">{confirmDelete.title}</span> and its calendar. Type <span className="font-mono font-semibold">DELETE</span> to confirm.
            </p>
            <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className={inputCls} aria-label="Type DELETE to confirm" />
            <Button variant="danger" className="w-full" disabled={confirmText !== "DELETE"}
              onClick={() => { setStatus(confirmDelete, "draft"); setConfirmDelete(null); push("Listing removed (demo: marked as draft)"); }}>
              Delete listing
            </Button>
          </div>
        )}
      </Modal>
    </main>
  );
}

/* ---------- requests ---------- */

export function HostRequests() {
  const requests = useHostRequests();
  const { decide } = useApp();
  const push = useToasts((s) => s.push);
  const [declining, setDeclining] = useState<Booking | null>(null);
  const [reason, setReason] = useState("dates");
  const listings = useHostListings();
  const pending = requests.filter((r) => r.status === "pending");
  const decided = requests.filter((r) => r.status !== "pending");

  const approve = (r: Booking) => {
    const l = listings.find((x) => x.id === r.listingId);
    const conflict = l && [r.start].some((d) => l.booked.includes(d));
    decide(r.id, "confirmed");
    push(conflict ? "Approved — note: dates overlap an existing hold, double-check your calendar" : "Request approved — renter notified");
  };

  return (
    <main id="main" className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-semibold mb-2">Booking requests</h1>
      <p className="text-sm text-ink-2 mb-8">Respond within 24 hours to keep your response rate high.</p>

      {pending.length === 0 ? (
        <EmptyState icon="check" title="No pending requests" body="New requests appear here, with the renter's business details and intended use." />
      ) : (
        <div className="space-y-4">
          {pending.map((r) => {
            const l = listings.find((x) => x.id === r.listingId);
            const hoursLeft = r.expiresAt ? Math.max(0, Math.round((new Date(r.expiresAt).getTime() - Date.now()) / 3600000)) : 24;
            const payout = r.breakdown.base - r.breakdown.discount - Math.round(r.breakdown.base * 0.03);
            return (
              <article key={r.id} className="border hairline rounded-2xl bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={`https://i.pravatar.cc/80?u=${r.renterId}`} alt="" className="w-11 h-11 rounded-full" />
                    <div>
                      <p className="font-semibold">{r.renterName}</p>
                      <p className="text-xs text-ink-3">{r.businessType}</p>
                    </div>
                  </div>
                  <Badge tone="brass"><Icon name="clock" className="w-3 h-3" /> responds in {hoursLeft}h</Badge>
                </div>
                <p className="text-sm text-ink-2 mt-3 leading-relaxed border-l-2 border-ink/10 pl-3 italic">"{r.useNote}"</p>
                <p className="text-sm font-mono mt-3 bg-bone-2 rounded-lg px-3.5 py-2.5">
                  {l?.title} · {fmtRange(r.start, r.end)} · your payout {fmtMoney(payout)}
                </p>
                <div className="flex gap-2.5 mt-4">
                  <Button onClick={() => approve(r)}><Icon name="check" className="w-4 h-4" /> Approve</Button>
                  <Button variant="secondary" onClick={() => setDeclining(r)}>Decline</Button>
                  <Link to="/inbox" className="inline-flex items-center text-sm font-semibold underline hover:text-vault ml-auto">Message first</Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {decided.length > 0 && (
        <section className="mt-12" aria-label="Decided requests">
          <h2 className="font-display text-xl font-semibold mb-4">Recent decisions</h2>
          <div className="space-y-2.5">
            {decided.map((r) => {
              const l = listings.find((x) => x.id === r.listingId);
              return (
                <div key={r.id} className="flex items-center gap-4 border hairline rounded-xl bg-white px-4 py-3 text-sm">
                  <span className="flex-1 min-w-0 truncate">{r.renterName} · {l?.title}</span>
                  <span className="font-mono text-xs text-ink-3">{fmtRange(r.start, r.end)}</span>
                  <StatusPill status={r.status} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Modal open={declining !== null} onClose={() => setDeclining(null)} title="Decline request">
        <div className="space-y-3">
          {[["dates", "Dates aren't available"], ["use", "Use isn't suitable for this space"], ["other", "Other"]].map(([v, label]) => (
            <label key={v} className={cx("flex items-center gap-3 border rounded-xl px-4 py-3 text-sm font-medium cursor-pointer", reason === v ? "border-vault bg-vault/5" : "border-ink/15")}>
              <input type="radio" checked={reason === v} onChange={() => setReason(v)} className="accent-[#174a3c]" /> {label}
            </label>
          ))}
          <textarea rows={3} placeholder="Optional message to the renter…" className={inputCls} aria-label="Message to renter" />
          <Button variant="danger" className="w-full" onClick={() => { if (declining) decide(declining.id, "declined"); setDeclining(null); push("Request declined — renter notified"); }}>
            Decline request
          </Button>
        </div>
      </Modal>
    </main>
  );
}

/* ---------- earnings ---------- */

export function HostEarnings() {
  const requests = useHostRequests();
  const listings = useHostListings();
  const push = useToasts((s) => s.push);
  const done = requests.filter((r) => r.status === "completed" || r.status === "confirmed");

  return (
    <main id="main" className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-semibold mb-2">Earnings</h1>
      <p className="text-sm text-ink-2 mb-8">All figures are mock data for this prototype.</p>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="border hairline rounded-2xl bg-white p-6">
          <p className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold mb-4">Monthly earnings</p>
          <BarChart data={[1840, 2210, 1620, 2840, 3120, 2460]} labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]} />
        </div>
        <div className="border hairline rounded-2xl bg-white p-6">
          <p className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold mb-4">Earnings by listing</p>
          <Donut segments={listings.slice(0, 4).map((l, i) => ({
            label: l.title.length > 22 ? l.title.slice(0, 20) + "…" : l.title,
            value: 40 - i * 8,
            color: ["#174a3c", "#c98e2d", "#2a6b58", "#c24e2a"][i],
          }))} />
        </div>
      </div>

      <section className="border hairline rounded-2xl bg-white overflow-hidden" aria-label="Payout history">
        <div className="flex items-center justify-between px-6 py-4 border-b hairline">
          <h2 className="font-display text-lg font-semibold">Payout history</h2>
          <button className="text-sm font-semibold underline hover:text-vault cursor-pointer" onClick={() => push("CSV export (demo)")}>Export CSV</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-ink-3 border-b hairline">
              <th className="px-6 py-3 font-semibold">Booking</th>
              <th className="px-6 py-3 font-semibold hidden sm:table-cell">Dates</th>
              <th className="px-6 py-3 font-semibold text-right">Payout</th>
            </tr>
          </thead>
          <tbody>
            {done.map((r) => {
              const l = listings.find((x) => x.id === r.listingId);
              return (
                <tr key={r.id} className="border-b hairline last:border-0">
                  <td className="px-6 py-3.5">{r.renterName} · <span className="text-ink-3">{l?.title}</span></td>
                  <td className="px-6 py-3.5 font-mono text-xs hidden sm:table-cell">{fmtRange(r.start, r.end)}</td>
                  <td className="px-6 py-3.5 font-mono text-right">{fmtMoney(r.breakdown.base - Math.round(r.breakdown.base * 0.03))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </main>
  );
}

/* ---------- insights ---------- */

export function HostInsights() {
  const listings = useHostListings();
  const [sel, setSel] = useState(listings[0]?.id ?? "");
  const l = listings.find((x) => x.id === sel) ?? listings[0];
  if (!l) return <main id="main" className="max-w-5xl mx-auto px-4 py-12"><EmptyState icon="grid" title="No listings yet" body="Insights appear once you have a listing." /></main>;

  const h = (n: number) => ((l.id.length * n * 131) % 700) + 80;
  const funnel = [
    { label: "Impressions", value: h(11) * 6 },
    { label: "Views", value: h(11) },
    { label: "Saves", value: Math.round(h(11) * 0.18) },
    { label: "Requests", value: Math.round(h(11) * 0.07) },
    { label: "Bookings", value: Math.round(h(11) * 0.04) },
  ];

  return (
    <main id="main" className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-3xl font-semibold">Insights</h1>
        <select value={sel} onChange={(e) => setSel(e.target.value)} className={inputCls + " !w-auto"} aria-label="Choose listing">
          {listings.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
        </select>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="border hairline rounded-2xl bg-white p-6" aria-label="Conversion funnel">
          <p className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold mb-5">Last 30 days — funnel (demo)</p>
          <div className="space-y-3">
            {funnel.map((f, i) => (
              <div key={f.label} className="flex items-center gap-3 text-sm">
                <span className="w-24 text-ink-2">{f.label}</span>
                <span className="flex-1 h-6 bg-ink/5 rounded overflow-hidden">
                  <span className="block h-full bg-vault rounded" style={{ width: `${100 - i * 22}%`, opacity: 1 - i * 0.13 }} />
                </span>
                <span className="font-mono w-14 text-right">{f.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <section className="border hairline rounded-2xl bg-white p-6">
            <p className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold mb-2">Review score trend</p>
            <Sparkline data={[4.4, 4.5, 4.4, 4.6, 4.7, 4.7, 4.8, l.rating]} className="text-brass" />
            <p className="text-sm text-ink-2 mt-2">Currently <span className="font-mono font-semibold">★ {l.rating.toFixed(2)}</span> across {plural(l.reviewCount, "review")}.</p>
          </section>
          <section className="border border-brass/40 bg-brass/5 rounded-2xl p-6">
            <p className="font-semibold text-sm flex items-center gap-2 mb-1"><Icon name="info" className="w-4 h-4 text-brass-2" /> Ranking tip</p>
            <p className="text-sm text-ink-2">Listings with 10+ photos get <span className="font-semibold">2.3×</span> more views. {l.title} has {l.photos.length} — consider adding detail shots of access and power.</p>
          </section>
          <section className="border hairline rounded-2xl bg-white p-6">
            <p className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold mb-2">Response rate</p>
            <p className="font-display text-4xl font-semibold">{HOSTS[0].responseRatePct}%</p>
            <p className="text-sm text-ink-2 mt-1">Replying within an hour keeps you in the "Established Host" tier.</p>
          </section>
        </div>
      </div>

      <p className="text-xs text-ink-3 mt-8">Recent reviews mentioning this listing: {REVIEWS.filter((r) => r.listingId === l.id).length}. All analytics are mocked.</p>
    </main>
  );
}
