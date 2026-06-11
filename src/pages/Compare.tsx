import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, EmptyState, Icon, RatingInline } from "../components/ui";
import { CANCEL_LABEL, cx, fmtMoney, headlinePrice, normDaily } from "../lib/utils";
import { AMENITIES } from "../mocks/data";
import type { Listing } from "../mocks/types";
import { findListing, useApp } from "../state/store";

export default function Compare() {
  const { compare, toggleCompare, published } = useApp();
  const navigate = useNavigate();
  const [diffOnly, setDiffOnly] = useState(false);
  const listings = compare.map((id) => findListing(id, published)).filter(Boolean) as Listing[];

  if (listings.length === 0) {
    return (
      <main id="main" className="max-w-3xl mx-auto px-4 py-20">
        <EmptyState icon="compare" title="Nothing to compare yet"
          body="Add spaces from search results or your saved list using the compare button — up to four at a time."
          action={<Button onClick={() => navigate("/search")}>Browse spaces</Button>} />
      </main>
    );
  }

  const best = (vals: number[], invert = false) => {
    const target = invert ? Math.min(...vals) : Math.max(...vals);
    return vals.map((v) => v === target && vals.filter((x) => x === target).length < vals.length);
  };

  const dailyPrices = listings.map(normDaily);
  const perSqft = listings.map((l, i) => dailyPrices[i] / l.sqft);

  interface Row { label: string; values: (string | number | boolean)[]; highlight?: boolean[]; }
  const essentialRows: Row[] = [
    { label: "Price (daily equiv.)", values: dailyPrices.map(fmtMoney), highlight: best(dailyPrices, true) },
    { label: "Price per sq ft / day", values: perSqft.map((v) => `£${v.toFixed(2)}`), highlight: best(perSqft, true) },
    { label: "Square footage", values: listings.map((l) => l.sqft.toLocaleString() + " sq ft"), highlight: best(listings.map((l) => l.sqft)) },
    { label: "Capacity", values: listings.map((l) => `${l.capacity} people`), highlight: best(listings.map((l) => l.capacity)) },
    { label: "Floor", values: listings.map((l) => (l.floorLevel === 0 ? "Ground" : `Floor ${l.floorLevel}`)) },
    { label: "Ceiling height", values: listings.map((l) => `${l.ceilingFt} ft`), highlight: best(listings.map((l) => l.ceilingFt)) },
  ];
  const logisticsRows: Row[] = [
    { label: "Loading dock", values: listings.map((l) => l.loadingDock) },
    { label: "Parking", values: listings.map((l) => (l.parking.type === "none" ? false : `${l.parking.type} (${l.parking.spaces})`)) },
    { label: "Freight elevator", values: listings.map((l) => l.amenities.includes("freight-elevator")) },
    { label: "24/7 access", values: listings.map((l) => l.access247) },
    { label: "Zoning", values: listings.map((l) => l.zoning) },
  ];
  const termRows: Row[] = [
    { label: "Instant Book", values: listings.map((l) => l.instantBook) },
    { label: "Min term", values: listings.map((l) => (l.minTermDays <= 1 ? "None" : `${l.minTermDays} days`)) },
    { label: "Deposit", values: listings.map((l) => fmtMoney(l.deposit)), highlight: best(listings.map((l) => l.deposit), true) },
    { label: "Cancellation", values: listings.map((l) => CANCEL_LABEL[l.cancellation]) },
    { label: "Rating", values: listings.map((l) => `★ ${l.rating.toFixed(2)} (${l.reviewCount})`), highlight: best(listings.map((l) => l.rating)) },
  ];

  const amenityKeys = AMENITIES.filter((a) => listings.some((l) => l.amenities.includes(a.key)));
  const amenityRows: Row[] = amenityKeys.map((a) => ({
    label: a.label,
    values: listings.map((l) => l.amenities.includes(a.key)),
  }));

  const isDiff = (r: Row) => new Set(r.values.map(String)).size > 1;
  const filterRows = (rows: Row[]) => (diffOnly ? rows.filter(isDiff) : rows);

  const renderCell = (v: string | number | boolean, hl?: boolean) => {
    if (typeof v === "boolean")
      return v
        ? <Icon name="check" className="w-4 h-4 text-vault mx-auto" />
        : <span className="text-ink-3/60 block text-center">—</span>;
    return <span className={cx("block text-center font-mono text-xs sm:text-sm", hl && "text-brass-2 font-semibold")}>{v}</span>;
  };

  const section = (title: string, rows: Row[]) => {
    const visible = filterRows(rows);
    if (visible.length === 0) return null;
    return (
      <tbody key={title}>
        <tr>
          <th colSpan={listings.length + 1} className="frozen-col text-left font-display font-semibold text-base pt-7 pb-2 bg-bone">{title}</th>
        </tr>
        {visible.map((r) => (
          <tr key={r.label} className="border-t hairline">
            <th scope="row" className="frozen-col text-left text-sm font-medium text-ink-2 py-3 pr-4 min-w-40">{r.label}</th>
            {r.values.map((v, i) => (
              <td key={i} className="py-3 px-3 min-w-36">{renderCell(v, r.highlight?.[i])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  };

  return (
    <main id="main" className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-3xl font-semibold">Compare spaces</h1>
        <label className="flex items-center gap-2.5 text-sm font-medium cursor-pointer">
          <input type="checkbox" checked={diffOnly} onChange={(e) => setDiffOnly(e.target.checked)} className="w-4 h-4 accent-[#174a3c]" />
          Show differences only
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="frozen-col min-w-40" aria-label="Attribute" />
              {listings.map((l) => (
                <th key={l.id} className="px-3 pb-4 min-w-36 align-top">
                  <div className="relative">
                    <img src={l.photos[0]} alt="" className="w-full h-24 object-cover rounded-xl" />
                    <button onClick={() => toggleCompare(l.id)} aria-label={`Remove ${l.title} from comparison`}
                      className="absolute top-1.5 right-1.5 bg-bone/90 rounded-full p-1.5 hover:bg-bone cursor-pointer">
                      <Icon name="x" className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="font-display font-semibold text-sm mt-2 leading-snug">{l.title}</p>
                  <p className="text-xs text-ink-3 font-normal">{l.neighborhood}</p>
                  <p className="text-sm mt-1 font-normal">
                    <span className="font-display font-semibold">{fmtMoney(headlinePrice(l).amount)}</span>
                    <span className="text-ink-3 text-xs"> {headlinePrice(l).suffix}</span>
                  </p>
                  <div className="mt-0.5"><RatingInline rating={l.rating} /></div>
                  <Link to={`/space/${l.id}`} className="inline-block mt-2 text-xs font-semibold text-vault underline">View space</Link>
                </th>
              ))}
            </tr>
          </thead>
          {section("Essentials", essentialRows)}
          {section("Logistics", logisticsRows)}
          {section("Terms & trust", termRows)}
          {section("Amenities", amenityRows)}
        </table>
      </div>
      <p className="text-xs text-ink-3 mt-6"><span className="text-brass-2 font-semibold">Brass values</span> mark the best figure in each numeric row.</p>
    </main>
  );
}
