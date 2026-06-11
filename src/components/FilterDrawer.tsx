import { useEffect, useMemo, useState } from "react";
import type { Listing } from "../mocks/types";
import { applyQuery, cx, type SearchQuery } from "../lib/utils";
import { Button, Icon, inputCls } from "./ui";
import { AMENITIES, SUITABILITY, VERIFIED_HOST_IDS, ZONING_TYPES } from "../mocks/data";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b hairline pb-5 mb-5">
      <legend className="font-semibold text-sm mb-3">{title}</legend>
      {children}
    </fieldset>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex items-center justify-between gap-4 py-1.5 cursor-pointer">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-ink-3">{hint}</span>}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={(e) => { e.preventDefault(); onChange(!checked); }}
        className={cx("w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer", checked ? "bg-vault" : "bg-ink/20")}
      >
        <span className={cx("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", checked ? "left-5.5" : "left-0.5")} />
      </button>
    </label>
  );
}

export function FilterDrawer({
  open, onClose, query, onApply, listings,
}: {
  open: boolean;
  onClose: () => void;
  query: SearchQuery;
  onApply: (q: SearchQuery) => void;
  listings: Listing[];
}) {
  const [local, setLocal] = useState<SearchQuery>(query);
  useEffect(() => { if (open) setLocal(query); }, [open, query]);

  const count = useMemo(() => applyQuery(listings, local, VERIFIED_HOST_IDS).length, [listings, local]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;

  const set = (patch: Partial<SearchQuery>) => setLocal({ ...local, ...patch });
  const groups = [...new Set(AMENITIES.map((a) => a.group))];

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Filters">
      <button className="absolute inset-0 bg-ink/50 cursor-default" onClick={onClose} aria-label="Close filters" />
      <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-bone shadow-2xl flex flex-col reveal">
        <div className="flex items-center justify-between px-6 py-4 border-b hairline">
          <h2 className="font-display text-lg font-semibold">Filters</h2>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-ink/5 cursor-pointer"><Icon name="x" className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <Section title={`Price range ${local.term ? `(per ${local.term === "hourly" ? "hour" : local.term === "daily" ? "day" : local.term === "weekly" ? "week" : "month"})` : "(daily equivalent)"}`}>
            <div className="flex gap-3">
              <label className="flex-1 text-xs text-ink-3">
                Min
                <input type="number" min={0} value={local.min ?? ""} placeholder="£0"
                  onChange={(e) => set({ min: e.target.value ? Number(e.target.value) : null })} className={inputCls + " mt-1"} />
              </label>
              <label className="flex-1 text-xs text-ink-3">
                Max
                <input type="number" min={0} value={local.max ?? ""} placeholder="Any"
                  onChange={(e) => set({ max: e.target.value ? Number(e.target.value) : null })} className={inputCls + " mt-1"} />
              </label>
            </div>
          </Section>

          <Section title="Size & capacity">
            <div className="flex gap-3">
              <label className="flex-1 text-xs text-ink-3">
                Min sq ft
                <input type="number" min={0} value={local.sqft ?? ""} placeholder="Any"
                  onChange={(e) => set({ sqft: e.target.value ? Number(e.target.value) : null })} className={inputCls + " mt-1"} />
              </label>
              <label className="flex-1 text-xs text-ink-3">
                Min capacity
                <input type="number" min={0} value={local.cap ?? ""} placeholder="Any"
                  onChange={(e) => set({ cap: e.target.value ? Number(e.target.value) : null })} className={inputCls + " mt-1"} />
              </label>
            </div>
          </Section>

          <Section title="Booking">
            <Toggle checked={local.instant} onChange={(v) => set({ instant: v })} label="Instant Book" hint="Confirm without waiting for approval" />
            <Toggle checked={local.verified} onChange={(v) => set({ verified: v })} label="Verified host" hint="Identity and ownership confirmed" />
            <Toggle checked={local.access} onChange={(v) => set({ access: v })} label="Accessible space" hint="Step-free entry and accessible facilities" />
          </Section>

          <Section title="Cancellation flexibility">
            <div className="flex gap-2 flex-wrap">
              {[["", "Any"], ["moderate", "Moderate or better"], ["flexible", "Flexible only"]].map(([v, label]) => (
                <button key={v} onClick={() => set({ cancel: v })}
                  className={cx("border rounded-full px-3.5 py-1.5 text-sm cursor-pointer", local.cancel === v ? "border-vault bg-vault/5 font-semibold" : "border-ink/20 hover:border-ink")}>
                  {label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Minimum rating">
            <div className="flex gap-2">
              {[[null, "Any"], [4, "4.0+"], [4.5, "4.5+"], [4.8, "4.8+"]].map(([v, label]) => (
                <button key={String(v)} onClick={() => set({ rating: v as number | null })}
                  className={cx("border rounded-full px-3.5 py-1.5 text-sm cursor-pointer", local.rating === v ? "border-vault bg-vault/5 font-semibold" : "border-ink/20 hover:border-ink")}>
                  ★ {label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Parking">
            <div className="flex gap-2 flex-wrap">
              {[["", "Any"], ["any", "Has parking"], ["garage", "Garage"], ["lot", "Lot"], ["street", "Street"]].map(([v, label]) => (
                <button key={v} onClick={() => set({ parking: v })}
                  className={cx("border rounded-full px-3.5 py-1.5 text-sm cursor-pointer", local.parking === v ? "border-vault bg-vault/5 font-semibold" : "border-ink/20 hover:border-ink")}>
                  {label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Zoning">
            <select value={local.zoning} onChange={(e) => set({ zoning: e.target.value })} className={inputCls} aria-label="Zoning type">
              <option value="">Any zoning</option>
              {ZONING_TYPES.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </Section>

          <Section title="Business suitability">
            <div className="flex gap-2 flex-wrap">
              {SUITABILITY.map((s) => (
                <button key={s.key} onClick={() => set({ suit: local.suit === s.key ? "" : s.key })}
                  className={cx("border rounded-full px-3 py-1.5 text-xs cursor-pointer", local.suit === s.key ? "border-vault bg-vault/5 font-semibold" : "border-ink/20 hover:border-ink")}>
                  {s.label}
                </button>
              ))}
            </div>
          </Section>

          {groups.map((g) => (
            <Section key={g} title={`Amenities — ${g}`}>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {AMENITIES.filter((a) => a.group === g).map((a) => (
                  <label key={a.key} className="flex items-center gap-2.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={local.amen.includes(a.key)}
                      onChange={(e) =>
                        set({ amen: e.target.checked ? [...local.amen, a.key] : local.amen.filter((x) => x !== a.key) })
                      }
                      className="w-4 h-4 accent-[#174a3c]"
                    />
                    {a.label}
                  </label>
                ))}
              </div>
            </Section>
          ))}
        </div>

        <div className="border-t hairline px-6 py-4 flex items-center gap-3 bg-bone">
          <button
            className="text-sm font-semibold underline hover:text-vault cursor-pointer"
            onClick={() => setLocal({ ...local, min: null, max: null, sqft: null, cap: null, amen: [], parking: "", access: false, instant: false, verified: false, zoning: "", suit: "", rating: null, cancel: "" })}
          >
            Clear all
          </button>
          <Button className="flex-1" onClick={() => { onApply(local); onClose(); }}>
            Show {count} {count === 1 ? "space" : "spaces"}
          </Button>
        </div>
      </div>
    </div>
  );
}
