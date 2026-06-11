import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FilterDrawer } from "../components/FilterDrawer";
import { ListingCard } from "../components/ListingCard";
import { MarketMap } from "../components/MarketMap";
import { SearchPill } from "../components/SearchPill";
import { EmptyState, Icon, SkeletonGrid } from "../components/ui";
import { applyQuery, cx, parseQuery, queryToParams, type SearchQuery } from "../lib/utils";
import { SPACE_TYPES, SUITABILITY, VERIFIED_HOST_IDS } from "../mocks/data";
import { useAllListings } from "../state/store";

const SORTS = [
  ["recommended", "Recommended"],
  ["priceAsc", "Price: low to high"],
  ["priceDesc", "Price: high to low"],
  ["rating", "Top rated"],
  ["sqft", "Largest"],
  ["newest", "Newest"],
] as const;

const PAGE = 12;

export default function Search() {
  const [sp, setSp] = useSearchParams();
  const query = useMemo(() => parseQuery(sp), [sp]);
  const all = useAllListings();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [mobileMap, setMobileMap] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [loading, setLoading] = useState(true);

  const results = useMemo(() => applyQuery(all, query, VERIFIED_HOST_IDS), [all, query]);

  // brief skeleton flash on each query change for realistic "fetch" feel
  useEffect(() => {
    setLoading(true);
    setLimit(PAGE);
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [query]);

  const apply = (q: SearchQuery) => setSp(queryToParams(q), { replace: false });

  /** Zero-result relaxation suggestions: which single filter removal yields results? */
  const relaxations = useMemo(() => {
    if (results.length > 0) return [];
    const out: { label: string; q: SearchQuery; count: number }[] = [];
    const tryRelax = (label: string, patch: Partial<SearchQuery>) => {
      const q2 = { ...query, ...patch };
      const n = applyQuery(all, q2, VERIFIED_HOST_IDS).length;
      if (n > 0) out.push({ label, q: q2, count: n });
    };
    if (query.amen.length) tryRelax("Remove amenity filters", { amen: [] });
    if (query.max != null) tryRelax("Remove max price", { max: null });
    if (query.min != null) tryRelax("Remove min price", { min: null });
    if (query.sqft != null) tryRelax("Remove size minimum", { sqft: null });
    if (query.instant) tryRelax("Include request-to-book", { instant: false });
    if (query.type) tryRelax("Any space type", { type: "" });
    if (query.term) tryRelax("Any rental term", { term: "" });
    if (query.q) tryRelax("Search everywhere", { q: "" });
    if (query.suit) tryRelax("Any business type", { suit: "" });
    if (query.rating != null) tryRelax("Any rating", { rating: null });
    return out.slice(0, 4);
  }, [results.length, query, all]);

  const activeChips: { label: string; patch: Partial<SearchQuery> }[] = [];
  if (query.type) activeChips.push({ label: SPACE_TYPES.find((t) => t.key === query.type)?.label ?? query.type, patch: { type: "" } });
  if (query.term) activeChips.push({ label: query.term === "longTerm" ? "Long-term" : query.term[0].toUpperCase() + query.term.slice(1), patch: { term: "" } });
  if (query.min != null || query.max != null) activeChips.push({ label: `£${query.min ?? 0}–${query.max ?? "any"}`, patch: { min: null, max: null } });
  if (query.sqft != null) activeChips.push({ label: `${query.sqft.toLocaleString()}+ sq ft`, patch: { sqft: null } });
  if (query.cap != null) activeChips.push({ label: `Cap ${query.cap}+`, patch: { cap: null } });
  if (query.instant) activeChips.push({ label: "⚡ Instant Book", patch: { instant: false } });
  if (query.verified) activeChips.push({ label: "Verified host", patch: { verified: false } });
  if (query.suit) activeChips.push({ label: SUITABILITY.find((s) => s.key === query.suit)?.label ?? query.suit, patch: { suit: "" } });
  query.amen.forEach((a) => activeChips.push({ label: a.replace(/-/g, " "), patch: { amen: query.amen.filter((x) => x !== a) } }));

  const visible = results.slice(0, limit);
  const where = query.q || "all cities";

  return (
    <main id="main" className="max-w-[1600px] mx-auto px-4 sm:px-6">
      <div className="py-5 max-w-3xl mx-auto">
        <SearchPill key={sp.toString()} initial={{ q: query.q, type: query.type, term: query.term, start: query.start, end: query.end }} />
      </div>

      {/* chip row */}
      <div className="flex items-center gap-2 overflow-x-auto rail pb-3 border-b hairline">
        <button
          onClick={() => setFiltersOpen(true)}
          className="shrink-0 flex items-center gap-2 border border-ink/25 rounded-full px-4 py-2 text-sm font-semibold hover:border-ink cursor-pointer"
        >
          <Icon name="filter" className="w-4 h-4" /> Filters
          {activeChips.length > 0 && <span className="bg-vault text-bone rounded-full text-[10px] px-1.5 py-0.5 font-mono">{activeChips.length}</span>}
        </button>
        {activeChips.map((c, i) => (
          <button
            key={i}
            onClick={() => apply({ ...query, ...c.patch })}
            className="shrink-0 flex items-center gap-1.5 bg-vault/10 text-vault rounded-full px-3.5 py-2 text-sm font-medium hover:bg-vault/20 cursor-pointer capitalize"
          >
            {c.label} <Icon name="x" className="w-3 h-3" />
          </button>
        ))}
        <div className="flex-1" />
        <label className="shrink-0 flex items-center gap-2 text-sm">
          <span className="text-ink-3 hidden sm:inline">Sort</span>
          <select
            value={query.sort}
            onChange={(e) => apply({ ...query, sort: e.target.value })}
            className="border border-ink/20 rounded-full px-3 py-2 text-sm bg-bone font-medium cursor-pointer"
            aria-label="Sort results"
          >
            {SORTS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
        </label>
        <button
          onClick={() => setShowMap(!showMap)}
          className="shrink-0 hidden lg:flex items-center gap-2 border border-ink/25 rounded-full px-4 py-2 text-sm font-semibold hover:border-ink cursor-pointer"
          aria-pressed={showMap}
        >
          <Icon name={showMap ? "list" : "map"} className="w-4 h-4" /> {showMap ? "Hide map" : "Show map"}
        </button>
      </div>

      <p className="text-sm text-ink-2 py-4" aria-live="polite">
        <span className="font-semibold font-mono">{results.length}</span> {results.length === 1 ? "space" : "spaces"} in <span className="capitalize">{where}</span>
        {query.start && query.end && <> · {query.start} → {query.end}</>}
      </p>

      <div className={cx("grid gap-6 pb-12", showMap ? "lg:grid-cols-[1fr_45%]" : "")}>
        {/* results column */}
        <div className={cx(mobileMap && "hidden lg:block")}>
          {loading ? (
            <SkeletonGrid n={6} />
          ) : results.length === 0 ? (
            <EmptyState
              icon="search"
              title="No spaces match those filters"
              body="Try relaxing one of your filters — here's what would open up:"
              action={
                <div className="flex flex-col gap-2">
                  {relaxations.map((r) => (
                    <button key={r.label} onClick={() => apply(r.q)} className="border border-vault text-vault rounded-full px-4 py-2 text-sm font-semibold hover:bg-vault/5 cursor-pointer">
                      {r.label} — {r.count} {r.count === 1 ? "space" : "spaces"}
                    </button>
                  ))}
                </div>
              }
            />
          ) : (
            <>
              <div className={cx("grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-8", !showMap && "lg:grid-cols-4")}>
                {visible.map((l) => (
                  <div key={l.id} className={cx("rounded-xl transition-shadow", activeId === l.id && "ring-2 ring-brass ring-offset-2 ring-offset-bone")}>
                    <ListingCard listing={l} term={query.term || null} onHover={setActiveId} />
                  </div>
                ))}
              </div>
              {limit < results.length && (
                <div className="text-center mt-10">
                  <button onClick={() => setLimit(limit + PAGE)} className="border border-ink rounded-full px-6 py-3 text-sm font-semibold hover:bg-ink hover:text-bone transition-colors cursor-pointer">
                    Show more ({results.length - limit} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* map column */}
        {showMap && (
          <div className={cx("lg:sticky lg:top-20 h-[420px] lg:h-[calc(100vh-6rem)]", !mobileMap && "hidden lg:block")}>
            <MarketMap
              listings={results}
              activeId={activeId}
              onActive={setActiveId}
              selectedId={selectedId}
              onSelect={setSelectedId}
              term={query.term || null}
            />
          </div>
        )}
      </div>

      {/* mobile map/list flip */}
      <button
        onClick={() => setMobileMap(!mobileMap)}
        className="lg:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-ink text-bone rounded-full px-5 py-3 text-sm font-semibold shadow-xl flex items-center gap-2 cursor-pointer"
      >
        <Icon name={mobileMap ? "list" : "map"} className="w-4 h-4" />
        {mobileMap ? "List" : "Map"}
      </button>

      <FilterDrawer open={filtersOpen} onClose={() => setFiltersOpen(false)} query={query} onApply={apply} listings={all} />
    </main>
  );
}
