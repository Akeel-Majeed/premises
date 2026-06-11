import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { Listing, Term } from "../mocks/types";
import { cx, fmtMoney, headlinePrice } from "../lib/utils";
import { Icon, RatingInline } from "./ui";

/**
 * Stylised offline "map" — a dark, blueprint-toned street abstraction with
 * price pins projected from listing coordinates. Stands in for a tile map
 * so the prototype works with zero network dependencies.
 */
export function MarketMap({
  listings, activeId, onActive, selectedId, onSelect, term,
}: {
  listings: Listing[];
  activeId: string | null;
  onActive: (id: string | null) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  term?: Term | null;
}) {
  const bounds = useMemo(() => {
    if (listings.length === 0) return { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1 };
    const lats = listings.map((l) => l.lat);
    const lngs = listings.map((l) => l.lng);
    const pad = 0.012;
    return {
      minLat: Math.min(...lats) - pad,
      maxLat: Math.max(...lats) + pad,
      minLng: Math.min(...lngs) - pad,
      maxLng: Math.max(...lngs) + pad,
    };
  }, [listings]);

  const project = (l: Listing) => ({
    x: ((l.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng || 1)) * 92 + 4,
    y: (1 - (l.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat || 1)) * 88 + 6,
  });

  const selected = listings.find((l) => l.id === selectedId) ?? null;

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#101b17]" role="region" aria-label="Map of search results">
      {/* abstract street grid */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <pattern id="blocks" width="14" height="14" patternUnits="userSpaceOnUse">
            <rect width="14" height="14" fill="#101b17" />
            <rect x="1" y="1" width="12" height="12" fill="#15231e" rx="1" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#blocks)" />
        {/* arterial roads */}
        <path d="M0 30 Q 40 24 100 36" stroke="#23362f" strokeWidth="2.5" fill="none" />
        <path d="M0 64 Q 55 72 100 60" stroke="#23362f" strokeWidth="2" fill="none" />
        <path d="M28 0 Q 34 50 24 100" stroke="#23362f" strokeWidth="2" fill="none" />
        <path d="M70 0 Q 64 55 76 100" stroke="#23362f" strokeWidth="2.5" fill="none" />
        {/* river */}
        <path d="M0 84 Q 30 76 52 86 T 100 80 L 100 100 L 0 100 Z" fill="#0c2420" opacity="0.9" />
        <text x="3" y="97" fill="#2e4a40" fontSize="3" fontFamily="monospace">PREMISES DEMO MAP — not to scale</text>
      </svg>

      {/* price pins */}
      {listings.map((l) => {
        const { x, y } = project(l);
        const price = headlinePrice(l, term);
        const active = activeId === l.id || selectedId === l.id;
        return (
          <button
            key={l.id}
            style={{ left: `${x}%`, top: `${y}%` }}
            onMouseEnter={() => onActive(l.id)}
            onMouseLeave={() => onActive(null)}
            onClick={() => onSelect(selectedId === l.id ? null : l.id)}
            aria-label={`${l.title}, ${fmtMoney(price.amount)}${price.suffix}, rated ${l.rating}`}
            className={cx(
              "absolute -translate-x-1/2 -translate-y-full pin-drop rounded-full px-2.5 py-1 text-xs font-mono font-semibold shadow-lg transition-all cursor-pointer whitespace-nowrap",
              active ? "bg-brass text-ink scale-110 z-20" : "bg-bone text-ink hover:scale-105 z-10",
            )}
          >
            {fmtMoney(price.amount)}
          </button>
        );
      })}

      {/* pin card popover */}
      {selected && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-80 z-30 reveal">
          <div className="bg-bone rounded-xl shadow-2xl overflow-hidden">
            <div className="relative">
              <img src={selected.photos[0]} alt="" className="w-full h-32 object-cover" />
              <button
                onClick={() => onSelect(null)}
                aria-label="Close preview"
                className="absolute top-2 right-2 bg-bone/90 rounded-full p-1.5 cursor-pointer"
              >
                <Icon name="x" className="w-3.5 h-3.5" />
              </button>
            </div>
            <Link to={`/space/${selected.id}`} className="block p-3.5 hover:bg-bone-2">
              <div className="flex justify-between gap-2 items-start">
                <h3 className="font-display font-semibold text-sm">{selected.title}</h3>
                <RatingInline rating={selected.rating} />
              </div>
              <p className="text-xs text-ink-3 mt-0.5">{selected.neighborhood}, {selected.city} · {selected.sqft.toLocaleString()} sq ft</p>
              <p className="mt-1 text-sm">
                <span className="font-display font-semibold">{fmtMoney(headlinePrice(selected, term).amount)}</span>
                <span className="text-ink-3"> {headlinePrice(selected, term).suffix}</span>
              </p>
            </Link>
          </div>
        </div>
      )}

      {listings.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="bg-bone/95 rounded-xl px-5 py-3 text-sm font-medium">No spaces in this area — widen your search.</p>
        </div>
      )}
    </div>
  );
}
