import { useState } from "react";
import { Link } from "react-router-dom";
import type { Listing, Term } from "../mocks/types";
import { cx, fmtMoney, headlinePrice, plural } from "../lib/utils";
import { Icon, RatingInline } from "./ui";
import { useApp, useToasts } from "../state/store";
import { SPACE_TYPES, VERIFIED_HOST_IDS } from "../mocks/data";

export function FavButton({ id, className = "" }: { id: string; className?: string }) {
  const { session, openAuth, toggleFav, favorites } = useApp();
  const push = useToasts((s) => s.push);
  const saved = favorites.includes(id);
  return (
    <button
      aria-label={saved ? "Remove from saved" : "Save this space"}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!session) return openAuth();
        const nowSaved = toggleFav(id);
        push(nowSaved ? "Saved to your spaces" : "Removed from saved", nowSaved ? undefined : "Undo", nowSaved ? undefined : () => toggleFav(id));
      }}
      className={cx("p-2 rounded-full bg-bone/85 hover:bg-bone transition-colors cursor-pointer", className)}
    >
      <Icon name="heart" className={cx("w-4 h-4 transition-transform active:scale-125", saved ? "text-terra" : "text-ink-2")} />
    </button>
  );
}

export function CompareButton({ id, className = "" }: { id: string; className?: string }) {
  const { compare, toggleCompare } = useApp();
  const push = useToasts((s) => s.push);
  const inCompare = compare.includes(id);
  return (
    <button
      aria-label={inCompare ? "Remove from comparison" : "Add to comparison"}
      aria-pressed={inCompare}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!inCompare && compare.length >= 4) return push("You can compare up to 4 spaces");
        toggleCompare(id);
        if (!inCompare) push("Added to comparison");
      }}
      className={cx(
        "p-2 rounded-full transition-colors cursor-pointer",
        inCompare ? "bg-vault text-bone" : "bg-bone/85 hover:bg-bone text-ink-2",
        className,
      )}
    >
      <Icon name="compare" className="w-4 h-4" />
    </button>
  );
}

export function ListingCard({
  listing, term, onHover, dense = false,
}: { listing: Listing; term?: Term | null; onHover?: (id: string | null) => void; dense?: boolean }) {
  const [idx, setIdx] = useState(0);
  const price = headlinePrice(listing, term);
  const typeLabel = SPACE_TYPES.find((t) => t.key === listing.spaceType)?.label ?? listing.spaceType;
  const verified = VERIFIED_HOST_IDS.has(listing.hostId);

  return (
    <article
      className="group relative"
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-bone-2 border hairline">
        <img
          src={listing.photos[idx]}
          alt={`${listing.title} — ${typeLabel} in ${listing.neighborhood}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
        {/* carousel controls */}
        {listing.photos.length > 1 && (
          <>
            <button
              aria-label="Previous photo"
              onClick={(e) => { e.preventDefault(); setIdx((idx - 1 + listing.photos.length) % listing.photos.length); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-bone/90 items-center justify-center hidden group-hover:flex hover:scale-105 cursor-pointer z-10"
            >
              <Icon name="chevL" className="w-3.5 h-3.5" />
            </button>
            <button
              aria-label="Next photo"
              onClick={(e) => { e.preventDefault(); setIdx((idx + 1) % listing.photos.length); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-bone/90 items-center justify-center hidden group-hover:flex hover:scale-105 cursor-pointer z-10"
            >
              <Icon name="chevR" className="w-3.5 h-3.5" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1" aria-hidden="true">
              {listing.photos.slice(0, 5).map((_, i) => (
                <span key={i} className={cx("w-1.5 h-1.5 rounded-full", i === idx % 5 ? "bg-bone" : "bg-bone/50")} />
              ))}
            </div>
          </>
        )}
        <div className="absolute top-2 right-2 flex gap-1.5 z-10">
          <CompareButton id={listing.id} />
          <FavButton id={listing.id} />
        </div>
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className="bg-ink/80 text-bone text-[11px] font-semibold rounded-full px-2.5 py-1">{typeLabel}</span>
          {listing.featured && <span className="bg-brass text-ink text-[11px] font-semibold rounded-full px-2.5 py-1">Featured</span>}
        </div>
      </div>

      <Link to={`/space/${listing.id}`} className="block pt-3 focus-visible:outline-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-[15px] leading-snug">
            {listing.title}
          </h3>
          <RatingInline rating={listing.rating} />
        </div>
        <p className="text-sm text-ink-3 mt-0.5">{listing.neighborhood}, {listing.city}</p>
        {!dense && (
          <p className="font-mono text-xs text-ink-2 mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span>{listing.sqft.toLocaleString()} sq ft</span>
            <span aria-hidden="true">·</span>
            <span>Cap {listing.capacity}</span>
            <span aria-hidden="true">·</span>
            <span>{listing.floorLevel === 0 ? "Ground" : `Floor ${listing.floorLevel}`}</span>
          </p>
        )}
        <p className="mt-1.5 flex items-center gap-2 flex-wrap">
          <span className="font-display font-semibold">{fmtMoney(price.amount)}</span>
          <span className="text-sm text-ink-3">{price.suffix}</span>
          {listing.instantBook && (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-vault">
              <Icon name="bolt" className="w-3 h-3" /> Instant
            </span>
          )}
          {verified && (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-ink-3">
              <Icon name="verify" className="w-3 h-3 text-vault" /> Verified host
            </span>
          )}
        </p>
        {dense && <span className="sr-only">{plural(listing.reviewCount, "review")}</span>}
      </Link>
    </article>
  );
}
