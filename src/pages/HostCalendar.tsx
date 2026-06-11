import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { monthDays, monthLabel } from "../components/Calendar";
import { Button, EmptyState, Icon, inputCls } from "../components/ui";
import { cx, fmtDateLong, fmtMoney, headlinePrice, todayIso } from "../lib/utils";
import { useApp, useToasts } from "../state/store";
import { useHostListings } from "./Host";

const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function HostCalendar() {
  const listings = useHostListings();
  const [sp, setSp] = useSearchParams();
  const sel = sp.get("listing") ?? listings[0]?.id ?? "";
  const listing = listings.find((l) => l.id === sel) ?? listings[0];
  const { blockedOverrides, toggleBlocked, priceOverrides, setPriceOverride } = useApp();
  const push = useToasts((s) => s.push);
  const now = new Date();
  const [offset, setOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");

  const view = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const cells = useMemo(() => monthDays(view.getFullYear(), view.getMonth()), [view]);

  if (!listing) {
    return (
      <main id="main" className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState icon="cal" title="No listings to manage" body="Create a listing first — its calendar will appear here." />
      </main>
    );
  }

  const overrides = priceOverrides[listing.id] ?? {};
  const extraBlocked = new Set(blockedOverrides[listing.id] ?? []);
  const seedBlocked = new Set(listing.blocked);
  const booked = new Set(listing.booked);
  const basePrice = headlinePrice(listing).amount;
  const today = todayIso();

  const stateOf = (d: string) => {
    if (booked.has(d)) return "booked";
    // a seed-blocked day can be re-opened via override toggle; an open day can be blocked
    const seedB = seedBlocked.has(d);
    const togg = extraBlocked.has(d);
    if (seedB !== togg) return "blocked";
    return "open";
  };

  const dayPrice = (d: string) => overrides[d] ?? basePrice;

  const selectDay = (d: string) => {
    setSelectedDay(d === selectedDay ? null : d);
    setPriceInput(String(overrides[d] ?? ""));
  };

  return (
    <main id="main" className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-3xl font-semibold">Calendar</h1>
        <select
          value={listing.id}
          onChange={(e) => { setSp({ listing: e.target.value }); setSelectedDay(null); }}
          className={inputCls + " !w-auto"}
          aria-label="Choose listing"
        >
          {listings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <section className="border hairline rounded-2xl bg-white p-5" aria-label="Availability calendar">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setOffset(offset - 1)} aria-label="Previous month" className="p-2 rounded-full hover:bg-ink/5 cursor-pointer">
              <Icon name="chevL" className="w-4 h-4" />
            </button>
            <p className="font-display font-semibold">{monthLabel(view.getFullYear(), view.getMonth())}</p>
            <button onClick={() => setOffset(offset + 1)} aria-label="Next month" className="p-2 rounded-full hover:bg-ink/5 cursor-pointer">
              <Icon name="chevR" className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-[11px] text-ink-3 font-mono mb-1.5">
            {DOW.map((w) => <span key={w}>{w}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) =>
              d === null ? <span key={i} /> : (
                <button
                  key={d}
                  onClick={() => selectDay(d)}
                  disabled={d < today}
                  aria-label={`${d}: ${stateOf(d)}, ${fmtMoney(dayPrice(d))}`}
                  className={cx(
                    "aspect-square rounded-lg border text-left p-1.5 flex flex-col justify-between transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed",
                    selectedDay === d ? "border-ink ring-2 ring-brass" : "border-ink/10 hover:border-ink/40",
                    stateOf(d) === "booked" && "bg-vault/15",
                    stateOf(d) === "blocked" && "bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(22,20,15,0.07)_4px,rgba(22,20,15,0.07)_8px)]",
                  )}
                >
                  <span className="text-[11px] font-mono">{Number(d.slice(8))}</span>
                  <span className="text-[9px] sm:text-[10px] font-mono leading-none">
                    {stateOf(d) === "booked" ? (
                      <span className="text-vault font-semibold">BKD</span>
                    ) : stateOf(d) === "blocked" ? (
                      <span className="text-ink-3">—</span>
                    ) : (
                      <span className={cx(overrides[d] != null && "text-brass-2 font-semibold")}>{fmtMoney(dayPrice(d))}</span>
                    )}
                  </span>
                </button>
              ),
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-5 text-[11px] text-ink-3">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-vault/15 border border-ink/10 inline-block" /> Booked</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-ink/10 inline-block bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(22,20,15,0.15)_2px,rgba(22,20,15,0.15)_4px)]" /> Blocked</span>
            <span className="flex items-center gap-1.5"><span className="text-brass-2 font-mono font-semibold">£—</span> Custom price</span>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="border hairline rounded-2xl bg-white p-5">
            {selectedDay ? (
              <>
                <p className="font-display font-semibold mb-1">{fmtDateLong(selectedDay)}</p>
                <p className="text-xs text-ink-3 mb-4 capitalize">Status: {stateOf(selectedDay)}</p>
                {stateOf(selectedDay) === "booked" ? (
                  <p className="text-sm text-ink-2">This day is booked — manage it from your requests page.</p>
                ) : (
                  <div className="space-y-4">
                    <Button
                      variant={stateOf(selectedDay) === "blocked" ? "primary" : "secondary"}
                      className="w-full"
                      onClick={() => {
                        toggleBlocked(listing.id, selectedDay);
                        push(stateOf(selectedDay) === "blocked" ? "Day reopened" : "Day blocked");
                      }}
                    >
                      {stateOf(selectedDay) === "blocked" ? "Open this day" : "Block this day"}
                    </Button>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" htmlFor="override">Custom price for this day</label>
                      <div className="flex gap-2">
                        <input id="override" type="number" min={0} value={priceInput} onChange={(e) => setPriceInput(e.target.value)}
                          placeholder={String(basePrice)} className={inputCls} />
                        <Button onClick={() => {
                          const v = priceInput ? Number(priceInput) : null;
                          setPriceOverride(listing.id, selectedDay, v);
                          push(v ? `Price set to ${fmtMoney(v)} for ${fmtDateLong(selectedDay)}` : "Custom price removed");
                        }}>Set</Button>
                      </div>
                      {overrides[selectedDay] && (
                        <button className="text-xs underline text-ink-3 mt-2 hover:text-terra cursor-pointer"
                          onClick={() => { setPriceOverride(listing.id, selectedDay, null); setPriceInput(""); push("Custom price removed"); }}>
                          Reset to base price ({fmtMoney(basePrice)})
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-ink-2">Select a day to block it, reopen it, or set a custom price.</p>
            )}
          </div>

          <div className="border hairline rounded-2xl bg-white p-5 space-y-3">
            <p className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold">Bulk tools (demo)</p>
            <Button variant="secondary" className="w-full" onClick={() => push("Weekend pricing rule applied: +20% Fri–Sat (demo)")}>Weekend pricing +20%</Button>
            <Button variant="secondary" className="w-full" onClick={() => push("Seasonal adjustment applied: +10% Jul–Aug (demo)")}>Seasonal adjustment</Button>
            <Button variant="ghost" className="w-full" onClick={() => push("External calendar sync is a demo placeholder")}>Connect external calendar</Button>
          </div>
        </aside>
      </div>
    </main>
  );
}
