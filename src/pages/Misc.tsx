import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ListingCard } from "../components/ListingCard";
import { Accordion, Badge, Button, EmptyState, Field, Icon, inputCls } from "../components/ui";
import { cx } from "../lib/utils";
import { FAQS, HOSTS, LISTINGS } from "../mocks/data";
import { useApp, useToasts } from "../state/store";

/* ---------- public host profile ---------- */

export function HostProfile() {
  const { hostId } = useParams();
  const host = HOSTS.find((h) => h.id === hostId);
  const navigate = useNavigate();
  if (!host) {
    return <main id="main" className="max-w-3xl mx-auto px-4 py-20"><EmptyState icon="user" title="Host not found" body="This profile may have been removed." action={<Button onClick={() => navigate("/search")}>Browse spaces</Button>} /></main>;
  }
  const listings = LISTINGS.filter((l) => l.hostId === host.id && l.status === "active");
  return (
    <main id="main" className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid lg:grid-cols-[320px_1fr] gap-10">
        <aside className="border hairline rounded-2xl bg-white p-6 text-center h-fit lg:sticky lg:top-24">
          <span className="relative inline-block">
            <img src={host.avatar} alt={host.name} className="w-24 h-24 rounded-full object-cover" />
            {host.verified && <Icon name="verify" className="w-7 h-7 text-vault absolute -bottom-1 -right-1" />}
          </span>
          <h1 className="font-display text-2xl font-semibold mt-3">{host.name}</h1>
          {host.established && <Badge tone="brass">Established Host</Badge>}
          <dl className="grid grid-cols-3 gap-2 mt-5 text-center">
            {[["Listings", String(listings.length)], ["Response", `${host.responseRatePct}%`], ["Since", host.since]].map(([k, v]) => (
              <div key={k} className="border-t hairline pt-3">
                <dd className="font-display font-semibold text-lg">{v}</dd>
                <dt className="text-[10px] uppercase tracking-wider text-ink-3">{k}</dt>
              </div>
            ))}
          </dl>
        </aside>
        <div>
          <h2 className="font-display text-xl font-semibold mb-2">About {host.name.split(" ")[0]}</h2>
          <p className="text-ink-2 leading-relaxed mb-8 max-w-xl">{host.bio}</p>
          <h2 className="font-display text-xl font-semibold mb-5">{host.name.split(" ")[0]}'s spaces</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-8">
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </div>
      </div>
    </main>
  );
}

/* ---------- account settings ---------- */

const SECTIONS = ["Profile", "Notifications", "Payments", "Security", "Preferences"];

export function Account() {
  const { session, openAuth, signOut } = useApp();
  const push = useToasts((s) => s.push);
  const navigate = useNavigate();
  const [section, setSection] = useState("Profile");
  const [notif, setNotif] = useState<Record<string, boolean>>({ "email-bookings": true, "email-messages": true, "email-marketing": false, "push-bookings": true, "push-messages": true, "push-marketing": false });

  if (!session) {
    return <main id="main" className="max-w-3xl mx-auto px-4 py-20"><EmptyState icon="user" title="Sign in to manage your account" body="Profile, notifications and preferences live here." action={<Button onClick={openAuth}>Sign in</Button>} /></main>;
  }

  return (
    <main id="main" className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-semibold mb-8">Account settings</h1>
      <div className="grid lg:grid-cols-[220px_1fr] gap-10">
        <nav aria-label="Settings sections" className="flex lg:flex-col gap-1 overflow-x-auto rail">
          {SECTIONS.map((s) => (
            <button key={s} onClick={() => setSection(s)}
              className={cx("shrink-0 text-left px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer", section === s ? "bg-vault text-bone" : "text-ink-2 hover:bg-ink/5")}>
              {s}
            </button>
          ))}
          <button onClick={() => { signOut(); navigate("/"); }} className="shrink-0 text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-terra hover:bg-terra/5 cursor-pointer lg:mt-4">
            Sign out
          </button>
        </nav>

        <div className="max-w-xl">
          {section === "Profile" && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <img src={session.avatar} alt="" className="w-16 h-16 rounded-full object-cover" />
                <Button variant="secondary" onClick={() => push("Photo upload (demo)")}>Change photo</Button>
              </div>
              <Field label="Full name"><input defaultValue={session.name} className={inputCls} /></Field>
              <Field label="Business name"><input placeholder="e.g. Fern & Forge Ltd" className={inputCls} /></Field>
              <Field label="Bio" hint="Hosts approve complete profiles 40% faster.">
                <textarea rows={4} className={inputCls} placeholder="What do you do, and what kind of spaces do you book?" />
              </Field>
              <Button onClick={() => push("Profile saved")}>Save profile</Button>
            </div>
          )}
          {section === "Notifications" && (
            <div className="space-y-1">
              {[["bookings", "Booking updates"], ["messages", "New messages"], ["marketing", "Tips & marketing"]].map(([key, label]) => (
                <div key={key} className="flex items-center justify-between border-b hairline py-4">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="flex gap-5">
                    {["email", "push"].map((ch) => (
                      <label key={ch} className="flex items-center gap-2 text-xs text-ink-3 cursor-pointer">
                        <input type="checkbox" checked={notif[`${ch}-${key}`]} onChange={(e) => setNotif({ ...notif, [`${ch}-${key}`]: e.target.checked })} className="w-4 h-4 accent-[#174a3c]" />
                        {ch}
                      </label>
                    ))}
                  </span>
                </div>
              ))}
              <Button className="mt-5" onClick={() => push("Notification preferences saved")}>Save</Button>
            </div>
          )}
          {section === "Payments" && (
            <div className="space-y-4">
              <div className="border hairline rounded-xl p-4 flex items-center gap-4 bg-white">
                <span className="font-mono text-sm">•••• 4242</span>
                <span className="text-xs text-ink-3">Visa · expires 12/29</span>
                <Badge tone="vault">Default</Badge>
              </div>
              <Button variant="secondary" onClick={() => push("Add payment method (demo)")}>Add payment method</Button>
              {session.mode === "host" && (
                <div className="border hairline rounded-xl p-4 bg-white mt-6">
                  <p className="text-sm font-semibold mb-1">Payout method</p>
                  <p className="text-sm text-ink-2 font-mono">Bank •••• 8841 — payouts within 24h of booking start</p>
                </div>
              )}
              <p className="text-xs text-ink-3">Demo only — no real payment data is stored.</p>
            </div>
          )}
          {section === "Security" && (
            <div className="space-y-5">
              <Field label="Current password"><input type="password" className={inputCls} /></Field>
              <Field label="New password"><input type="password" className={inputCls} /></Field>
              <Button onClick={() => push("Password updated (demo)")}>Update password</Button>
              <div className="border hairline rounded-xl p-4 bg-white text-sm">
                <p className="font-semibold mb-2">Recent activity (demo)</p>
                <p className="text-ink-2 font-mono text-xs">London, UK · Chrome · today 09:12<br />London, UK · Mobile · yesterday 18:45</p>
              </div>
            </div>
          )}
          {section === "Preferences" && (
            <div className="space-y-5">
              <Field label="Currency"><select className={inputCls}><option>GBP £</option><option>EUR €</option><option>USD $</option></select></Field>
              <Field label="Units"><select className={inputCls}><option>Square feet</option><option>Square metres</option></select></Field>
              <Field label="Language"><select className={inputCls}><option>English (UK)</option></select></Field>
              <Button onClick={() => push("Preferences saved")}>Save</Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/* ---------- help / FAQ ---------- */

export function Help() {
  const [q, setQ] = useState("");
  const push = useToasts((s) => s.push);
  const cats = [...new Set(FAQS.map((f) => f.category))];
  const filtered = FAQS.filter((f) => (f.q + f.a).toLowerCase().includes(q.toLowerCase()));
  return (
    <main id="main">
      <section className="bg-vault text-bone grain relative">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center relative">
          <h1 className="font-display text-4xl font-semibold mb-6">How can we help?</h1>
          <div className="relative">
            <Icon name="search" className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search deposits, cancellation, insurance…"
              className="w-full rounded-full pl-12 pr-5 py-4 text-ink bg-bone text-sm focus:outline-none focus:ring-2 focus:ring-brass" aria-label="Search help articles" />
          </div>
        </div>
      </section>
      <div className="max-w-3xl mx-auto px-4 py-12">
        {q && <p className="text-sm text-ink-2 mb-4" aria-live="polite">{filtered.length} matching {filtered.length === 1 ? "article" : "articles"}</p>}
        {(q ? ["Results"] : cats).map((cat) => (
          <section key={cat} className="mb-10" aria-label={cat}>
            <h2 className="font-display text-xl font-semibold mb-2">{cat}</h2>
            {(q ? filtered : FAQS.filter((f) => f.category === cat)).map((f) => (
              <Accordion key={f.id} title={f.q}>{f.a}</Accordion>
            ))}
            {q && filtered.length === 0 && <EmptyState icon="search" title="No articles found" body="Try different words, or contact support below." />}
          </section>
        ))}
        <div className="border hairline rounded-2xl p-6 bg-white text-center">
          <h2 className="font-display text-lg font-semibold mb-1">Still stuck?</h2>
          <p className="text-sm text-ink-2 mb-4">Our (demo) support team replies within a day.</p>
          <Button onClick={() => push("Support request sent (demo)")}>Contact support</Button>
        </div>
      </div>
    </main>
  );
}

/* ---------- policy pages ---------- */

export function PolicyPage({ kind }: { kind: "terms" | "privacy" | "cancellation" }) {
  const content = {
    terms: {
      title: "Terms of Service",
      sections: [
        ["1. The platform", "Premises is a marketplace connecting renters with hosts of commercial spaces. This demo version operates entirely with mock data; nothing on it constitutes a real offer, booking, or payment."],
        ["2. Bookings", "Bookings are agreements between renter and host. Instant Book confirms immediately; requests require host approval within 24 hours. Hosts set their own rules, insurance and license requirements, which renters must satisfy before their start date."],
        ["3. Fees", "A 12% service fee applies to renter subtotals and a 3% processing fee to host payouts. All fees are itemised before checkout."],
        ["4. Deposits", "Deposits are held separately and released within 48 hours of checkout, less agreed deductions documented with evidence."],
        ["5. Conduct", "Spaces must be used only for the declared business purpose and within the listing's zoning and operating rules."],
      ],
    },
    privacy: {
      title: "Privacy Policy",
      sections: [
        ["1. What we collect", "In this prototype, everything you enter stays in your browser's localStorage. No data leaves your machine."],
        ["2. What we don't collect", "No analytics, cookies, or trackers are used in the demo."],
        ["3. Your controls", "Clear your browser storage to reset the prototype entirely."],
      ],
    },
    cancellation: {
      title: "Cancellation Policies",
      sections: [
        ["Flexible", "Full refund up to 24 hours before the booking starts. After that, the first day/period is non-refundable."],
        ["Moderate", "Full refund up to 5 days before the start. Between 5 days and start, 50% refund excluding fees."],
        ["Strict", "50% refund up to 14 days before the start. Non-refundable inside 14 days."],
        ["Long-term contract", "Governed by the signed agreement. Standard notice period is 30 days unless otherwise stated; deposits follow the contract terms."],
      ],
    },
  }[kind];

  return (
    <main id="main" className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid lg:grid-cols-[220px_1fr] gap-10">
      <nav aria-label="On this page" className="hidden lg:block">
        <ol className="sticky top-24 space-y-2 text-sm border-l hairline pl-4">
          {content.sections.map(([h]) => (
            <li key={h}><a href={`#${h.replace(/\W+/g, "-")}`} className="text-ink-3 hover:text-ink">{h}</a></li>
          ))}
        </ol>
      </nav>
      <article>
        <h1 className="font-display text-4xl font-semibold mb-2">{content.title}</h1>
        <p className="font-mono text-xs text-ink-3 mb-10">Last updated 11 June 2026 · Demo document</p>
        {content.sections.map(([h, body]) => (
          <section key={h} id={h.replace(/\W+/g, "-")} className="mb-8">
            <h2 className="font-display text-xl font-semibold mb-2">{h}</h2>
            <p className="text-ink-2 leading-relaxed text-[15px]">{body}</p>
          </section>
        ))}
      </article>
    </main>
  );
}

/* ---------- 404 ---------- */

export function NotFound() {
  return (
    <main id="main" className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="inline-block border-2 border-dashed border-ink/25 rounded-2xl p-8 mb-8" aria-hidden="true">
        <p className="font-mono text-xs text-ink-3 mb-2">FLOOR PLAN 404</p>
        <div className="grid grid-cols-3 gap-1.5 w-36 mx-auto">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className={cx("h-9 rounded-sm", i === 4 ? "bg-transparent border border-dashed border-ink/30" : "bg-ink/10")} />
          ))}
        </div>
      </div>
      <h1 className="font-display text-4xl font-semibold mb-3">This space doesn't exist — yet.</h1>
      <p className="text-ink-2 mb-8">The page you're looking for was moved, unlisted, or never built.</p>
      <div className="flex gap-3 justify-center">
        <Link to="/" className="bg-vault text-bone rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-vault-2">Go home</Link>
        <Link to="/search" className="border border-ink/25 rounded-lg px-5 py-2.5 text-sm font-semibold hover:border-ink">Browse spaces</Link>
      </div>
    </main>
  );
}
