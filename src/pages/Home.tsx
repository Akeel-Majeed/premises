import { Link } from "react-router-dom";
import { SearchPill } from "../components/SearchPill";
import { ListingCard } from "../components/ListingCard";
import { Icon } from "../components/ui";
import { SPACE_TYPES } from "../mocks/data";
import { useAllListings, useApp } from "../state/store";
import { findListing } from "../state/store";

export default function Home() {
  const listings = useAllListings();
  const { recents, published, session, openAuth } = useApp();
  const featured = listings.filter((l) => l.featured).slice(0, 8);
  const recentListings = recents.map((id) => findListing(id, published)).filter(Boolean).slice(0, 8);

  return (
    <main id="main">
      {/* Hero */}
      <section className="relative grain bg-vault-2 text-bone overflow-hidden">
        <div
          className="absolute inset-0 opacity-25 bg-cover bg-center"
          style={{ backgroundImage: "url(https://picsum.photos/seed/premises-hero/1920/1080)" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-vault-2/60 via-vault-2/40 to-vault-2" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <p className="reveal font-mono text-xs tracking-[0.25em] uppercase text-brass mb-5" style={{ animationDelay: "0ms" }}>
            Offices · Retail · Warehouses · Studios · Venues
          </p>
          <h1 className="reveal font-display text-4xl sm:text-6xl lg:text-7xl font-semibold leading-[1.05] max-w-3xl mb-4" style={{ animationDelay: "60ms" }}>
            Space for what you're building.
          </h1>
          <p className="reveal text-bone/75 max-w-xl mb-10 text-lg" style={{ animationDelay: "120ms" }}>
            Rent commercial space by the hour, the day, or the decade — from hosts who answer fast.
          </p>
          <div className="reveal text-ink" style={{ animationDelay: "180ms" }}>
            <SearchPill />
          </div>
        </div>
      </section>

      {/* Category rail */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10" aria-label="Browse by space type">
        <div className="flex gap-3 overflow-x-auto rail pb-2">
          {SPACE_TYPES.map((t, i) => (
            <Link
              key={t.key}
              to={`/search?type=${t.key}`}
              className="reveal shrink-0 border border-ink/15 rounded-2xl px-4 py-3.5 hover:border-vault hover:bg-vault/5 transition-colors min-w-36"
              style={{ animationDelay: `${i * 35}ms` }}
            >
              <span className="font-display font-semibold text-sm border border-ink/25 rounded-md px-2 py-0.5 inline-block mb-2">{t.mono}</span>
              <span className="block font-semibold text-sm">{t.label}</span>
              <span className="block text-xs text-ink-3 mt-0.5">{t.blurb}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Browse by term */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6" aria-label="Browse by rental term">
        <h2 className="font-display text-2xl font-semibold mb-5">Rent on your terms</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { term: "hourly", title: "By the hour", body: "Photoshoots, filming, meetings and one-night events.", img: "term-hour" },
            { term: "daily", title: "By the day", body: "Pop-ups, productions and short residencies.", img: "term-day" },
            { term: "monthly", title: "Monthly", body: "Offices, studios and clinics without a long lease.", img: "term-month" },
            { term: "longTerm", title: "Long-term", body: "Warehouses and retail units, 6 months and up.", img: "term-long" },
          ].map((c) => (
            <Link key={c.term} to={`/search?term=${c.term}`} className="group relative rounded-2xl overflow-hidden border hairline">
              <img src={`https://picsum.photos/seed/premises-${c.img}/600/420`} alt="" className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
              <div className="absolute bottom-0 p-4 text-bone">
                <h3 className="font-display font-semibold text-lg">{c.title}</h3>
                <p className="text-xs text-bone/75 mt-0.5">{c.body}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10" aria-label="Featured spaces">
        <div className="flex items-end justify-between mb-5">
          <h2 className="font-display text-2xl font-semibold">Featured spaces</h2>
          <Link to="/search" className="text-sm font-semibold text-vault hover:underline">View all spaces →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-8">
          {featured.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      </section>

      {/* Recently viewed */}
      {recentListings.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6" aria-label="Recently viewed">
          <h2 className="font-display text-2xl font-semibold mb-5">Recently viewed</h2>
          <div className="flex gap-5 overflow-x-auto rail pb-2">
            {recentListings.map((l) => (
              <div key={l!.id} className="w-64 shrink-0"><ListingCard listing={l!} dense /></div>
            ))}
          </div>
        </section>
      )}

      {/* Host CTA */}
      <section className="relative grain bg-vault text-bone mt-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 grid lg:grid-cols-2 gap-10 items-center relative">
          <div>
            <h2 className="font-display text-3xl sm:text-5xl font-semibold leading-tight mb-4">
              Your square footage is someone's next chapter.
            </h2>
            <p className="text-bone/75 mb-8 max-w-md">
              List an office floor, a storefront, a warehouse bay — set your rules, your prices, your terms.
            </p>
            <Link
              to={session ? "/host/listings/new" : "#"}
              onClick={(e) => { if (!session) { e.preventDefault(); openAuth(); } }}
              className="inline-flex items-center gap-2 bg-brass text-ink font-semibold rounded-full px-6 py-3.5 hover:bg-bone transition-colors"
            >
              Start listing <Icon name="chevR" className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-bone/5 border border-bone/15 rounded-2xl p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-brass mb-4">Earnings estimate (demo)</p>
            <p className="font-display text-5xl font-semibold">£2,460<span className="text-xl text-bone/60"> /month</span></p>
            <p className="text-sm text-bone/70 mt-2">for a 1,200 sq ft studio in Hackney Wick, booked 14 days a month</p>
            <div className="mt-5 h-px bg-bone/15" />
            <ul className="mt-4 space-y-2 text-sm text-bone/80">
              <li className="flex gap-2 items-center"><Icon name="check" className="w-4 h-4 text-brass" /> Free to list — fees only when you earn</li>
              <li className="flex gap-2 items-center"><Icon name="check" className="w-4 h-4 text-brass" /> You approve every booking (or enable Instant Book)</li>
              <li className="flex gap-2 items-center"><Icon name="check" className="w-4 h-4 text-brass" /> Deposits and insurance requirements built in</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-2 lg:grid-cols-4 gap-8" aria-label="Why Premises">
        {[
          { icon: "verify", title: "Verified hosts", body: "Identity and right-to-let checks on every verified badge." },
          { icon: "info", title: "Transparent pricing", body: "Every fee itemised before you commit. No surprises." },
          { icon: "cal", title: "Flexible terms", body: "From two hours to two years, with clear cancellation tiers." },
          { icon: "msg", title: "Direct messaging", body: "Talk to hosts before you book — viewings welcome." },
        ].map((t) => (
          <div key={t.title}>
            <span className="w-10 h-10 rounded-xl bg-vault/10 text-vault flex items-center justify-center mb-3">
              <Icon name={t.icon} className="w-5 h-5" />
            </span>
            <h3 className="font-semibold text-sm mb-1">{t.title}</h3>
            <p className="text-xs text-ink-2 leading-relaxed">{t.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
