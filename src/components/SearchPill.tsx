import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import type { Term } from "../mocks/types";
import { TERM_LABEL, cx, fmtDate, queryToParams } from "../lib/utils";
import { Icon } from "./ui";
import { RangeCalendar } from "./Calendar";
import { SPACE_TYPES } from "../mocks/data";

const LOCATIONS = [
  "Shoreditch, London", "Hackney Wick, London", "Soho, London", "Bermondsey, London", "Camden, London", "Peckham, London",
  "Northern Quarter, Manchester", "Ancoats, Manchester", "Deansgate, Manchester", "Salford, Manchester",
  "Stokes Croft, Bristol", "Old Market, Bristol", "Harbourside, Bristol",
  "Holbeck, Leeds", "Kirkstall, Leeds", "City Centre, Leeds",
  "London", "Manchester", "Bristol", "Leeds",
];

type Segment = "where" | "type" | "when" | "term" | null;

export function SearchPill({ initial }: { initial?: { q?: string; type?: string; term?: string; start?: string; end?: string } }) {
  const [open, setOpen] = useState<Segment>(null);
  const [q, setQ] = useState(initial?.q ?? "");
  const [type, setType] = useState(initial?.type ?? "");
  const [term, setTerm] = useState<Term | "">((initial?.term as Term) ?? "");
  const [start, setStart] = useState(initial?.start ?? "");
  const [end, setEnd] = useState(initial?.end ?? "");
  const [panelStyle, setPanelStyle] = useState<{ left: number; top: number; width: number; maxHeight: number } | null>(null);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updatePanelPosition = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const top = rect.bottom + 12;
    setPanelStyle({
      left: rect.left,
      top,
      width: rect.width,
      maxHeight: Math.max(240, window.innerHeight - top - 16),
    });
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedPill = ref.current?.contains(target);
      const clickedPanel = panelRef.current?.contains(target);
      if (!clickedPill && !clickedPanel) setOpen(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPanelStyle(null);
      return;
    }
    updatePanelPosition();
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, updatePanelPosition]);

  const go = () => {
    setOpen(null);
    navigate(`/search?${queryToParams({ q, type, term: term || "", start, end }).toString()}`);
  };

  const seg = (key: Segment, label: string, value: string, placeholder: string) => (
    <button
      onClick={() => setOpen(open === key ? null : key)}
      className={cx(
        "flex-1 min-w-0 text-left px-5 py-3 rounded-full transition-colors cursor-pointer",
        open === key ? "bg-white shadow-lg" : "hover:bg-ink/5",
      )}
      aria-expanded={open === key}
    >
      <span className="block text-[11px] font-bold uppercase tracking-wide text-ink-2">{label}</span>
      <span className={cx("block text-sm truncate", value ? "text-ink font-medium" : "text-ink-3")}>{value || placeholder}</span>
    </button>
  );

  const suggestions = LOCATIONS.filter((l) => l.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
  const dropdown = open && panelStyle && typeof document !== "undefined" && createPortal(
    <div
      ref={panelRef}
      className="fixed bg-white rounded-2xl shadow-2xl border hairline p-5 z-[100] reveal overflow-y-auto"
      style={{
        left: panelStyle.left,
        top: panelStyle.top,
        width: panelStyle.width,
        maxHeight: panelStyle.maxHeight,
      }}
    >
      {open === "where" && (
        <div>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder="Try 'Shoreditch' or 'Manchester'"
            className="w-full rounded-lg border border-ink/20 px-4 py-3 text-sm mb-3 focus:border-vault focus:outline-none"
            aria-label="Location"
          />
          <ul className="grid sm:grid-cols-2 gap-1">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-bone-2 text-sm flex items-center gap-2.5 cursor-pointer"
                  onClick={() => { setQ(s); setOpen("type"); }}
                >
                  <Icon name="pin" className="w-4 h-4 text-ink-3" /> {s}
                </button>
              </li>
            ))}
            {suggestions.length === 0 && <li className="text-sm text-ink-3 px-3 py-2">No matching areas — try a city name.</li>}
          </ul>
        </div>
      )}
      {open === "type" && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            className={cx("border rounded-xl p-3 text-sm font-medium hover:border-vault cursor-pointer", !type ? "border-vault bg-vault/5" : "border-ink/15")}
            onClick={() => { setType(""); setOpen("when"); }}
          >
            Any type
          </button>
          {SPACE_TYPES.map((t) => (
            <button
              key={t.key}
              className={cx("border rounded-xl p-3 text-left hover:border-vault cursor-pointer", type === t.key ? "border-vault bg-vault/5" : "border-ink/15")}
              onClick={() => { setType(t.key); setOpen("when"); }}
            >
              <span className="font-display font-semibold text-xs border border-ink/20 rounded px-1.5 py-0.5 inline-block mb-1.5">{t.mono}</span>
              <span className="block text-sm font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      )}
      {open === "when" && (
        <RangeCalendar
          start={start}
          end={end}
          onChange={(s, e) => { setStart(s); setEnd(e); if (s && e) setOpen("term"); }}
          blocked={new Set()}
          booked={new Set()}
          months={2}
        />
      )}
      {open === "term" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(["", "hourly", "daily", "weekly", "monthly", "longTerm"] as const).map((t) => (
            <button
              key={t || "any"}
              className={cx("border rounded-xl p-4 text-left hover:border-vault cursor-pointer", term === t ? "border-vault bg-vault/5" : "border-ink/15")}
              onClick={() => { setTerm(t); }}
            >
              <span className="block font-semibold text-sm">{t ? TERM_LABEL[t] : "Any term"}</span>
              <span className="block text-xs text-ink-3 mt-0.5">
                {t === "hourly" && "Shoots, events, meetings"}
                {t === "daily" && "Pop-ups, productions"}
                {t === "weekly" && "Short residencies"}
                {t === "monthly" && "Offices, studios"}
                {t === "longTerm" && "Leases 6 months +"}
                {t === "" && "Show everything"}
              </span>
            </button>
          ))}
          <button onClick={go} className="col-span-2 sm:col-span-3 bg-vault text-bone rounded-xl py-3 font-semibold hover:bg-vault-2 cursor-pointer">
            Search spaces
          </button>
        </div>
      )}
    </div>,
    document.body,
  );

  return (
    <div ref={ref} className="relative max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-bone border border-ink/10 rounded-3xl sm:rounded-full shadow-xl p-1.5 gap-1">
        {seg("where", "Where", q, "City or neighbourhood")}
        <span className="hidden sm:block w-px h-8 bg-ink/10" aria-hidden="true" />
        {seg("type", "Space type", SPACE_TYPES.find((t) => t.key === type)?.label ?? "", "Any type")}
        <span className="hidden sm:block w-px h-8 bg-ink/10" aria-hidden="true" />
        {seg("when", "When", start ? (end ? `${fmtDate(start)} – ${fmtDate(end)}` : fmtDate(start)) : "", "Add dates")}
        <span className="hidden sm:block w-px h-8 bg-ink/10" aria-hidden="true" />
        {seg("term", "Term", term ? TERM_LABEL[term as Term] : "", "Any term")}
        <button
          onClick={go}
          className="shrink-0 bg-vault hover:bg-vault-2 text-bone rounded-full sm:w-12 sm:h-12 py-3 sm:py-0 flex items-center justify-center gap-2 font-semibold transition-colors cursor-pointer"
          aria-label="Search"
        >
          <Icon name="search" className="w-5 h-5" />
          <span className="sm:hidden">Search spaces</span>
        </button>
      </div>
      {dropdown}
    </div>
  );
}
