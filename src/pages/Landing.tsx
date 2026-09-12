import { Link } from "react-router-dom";
import { Icon } from "../components/ui";

const DISCUSSIONS = "https://github.com/Akeel-Majeed/premises/discussions";

/* Schedule of areas: the table a commercial agent hands you, used here as the feature list. */
const SCHEDULE = [
  { use: "Offices", area: "200 to 12,000 sq ft", term: "Month or longer", note: "Desks, private suites, whole floors" },
  { use: "Retail units", area: "400 to 5,000 sq ft", term: "Day, week or year", note: "High street, arcade, pop-up" },
  { use: "Warehouses", area: "2,000 to 60,000 sq ft", term: "Month or longer", note: "Loading dock, racking, yard" },
  { use: "Studios", area: "300 to 4,000 sq ft", term: "Hour or day", note: "Photo, sound, dance, maker" },
  { use: "Event venues", area: "500 to 8,000 sq ft", term: "Hour or day", note: "Halls, galleries, rooftops" },
  { use: "Storage", area: "50 to 2,000 sq ft", term: "Week or month", note: "Secure, climate controlled" },
];

/* Dimension line: a ruled span with end ticks and a measurement in the middle. */
function Dim({ label, vertical = false }: { label: string; vertical?: boolean }) {
  if (vertical) {
    return (
      <div className="hidden lg:flex flex-col items-center gap-2 text-brass/80" aria-hidden="true">
        <span className="w-3 border-t border-current" />
        <span className="flex-1 border-l border-current" />
        <span className="font-mono text-[10px] tracking-widest [writing-mode:vertical-rl] rotate-180 py-2">{label}</span>
        <span className="flex-1 border-l border-current" />
        <span className="w-3 border-t border-current" />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-brass/80" aria-hidden="true">
      <span className="h-3 border-l border-current" />
      <span className="flex-1 border-t border-current" />
      <span className="font-mono text-[10px] tracking-widest px-2">{label}</span>
      <span className="flex-1 border-t border-current" />
      <span className="h-3 border-l border-current" />
    </div>
  );
}

export default function Landing() {
  return (
    <main id="main">
      {/* Discussions, top of page */}
      <div className="bg-brass text-ink">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <Icon name="msg" className="w-4 h-4 shrink-0" />
          <span className="font-semibold">Premises is built in the open.</span>
          <a href={DISCUSSIONS} target="_blank" rel="noopener" className="underline underline-offset-4 hover:no-underline font-semibold">
            Read and post in Discussions
          </a>
        </div>
      </div>

      {/* Hero: the headline set inside a measured plot */}
      <section className="relative grain bg-vault-2 text-bone overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-bone) 1px, transparent 1px), linear-gradient(90deg, var(--color-bone) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-20 sm:pt-20 sm:pb-28">
          <div className="flex gap-6 lg:gap-10">
            <Dim label="FITS YOUR TERM" vertical />
            <div className="flex-1">
              <Dim label="AVAILABLE NOW" />
              <div className="border border-bone/25 px-5 py-10 sm:px-10 sm:py-14 mt-6">
                <h1 className="reveal font-display text-4xl sm:text-6xl lg:text-[4.5rem] font-semibold leading-[1.02] max-w-[17ch]">
                  Every business starts with a room it can afford.
                </h1>
                <p className="reveal text-bone/75 text-lg leading-relaxed max-w-[58ch] mt-7" style={{ animationDelay: "80ms" }}>
                  Premises lists offices, retail units, warehouses, studios and venues from hosts who
                  answer the same day. Book an hour to try a space, or a decade to grow into one.
                </p>
                <div className="reveal flex flex-wrap gap-3 mt-9" style={{ animationDelay: "160ms" }}>
                  <Link to="/search" className="bg-brass text-ink font-semibold px-6 py-3 hover:bg-bone transition-colors">
                    Browse spaces
                  </Link>
                  <a
                    href={DISCUSSIONS}
                    target="_blank"
                    rel="noopener"
                    className="border border-bone/40 text-bone font-semibold px-6 py-3 hover:bg-bone hover:text-ink transition-colors"
                  >
                    Join the discussion
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule of areas */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="font-display text-3xl sm:text-4xl font-semibold max-w-[20ch]">
          What you can rent, and for how long
        </h2>
        <p className="text-ink-2 mt-4 max-w-[62ch] leading-relaxed">
          Commercial listings carry the numbers that decide a deal. Floor area, term, access and
          price per unit of time sit on every card before you click into it.
        </p>
        <div className="mt-10 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[36rem]">
            <thead>
              <tr className="border-b border-ink/25">
                <th className="font-mono text-[11px] tracking-widest font-medium text-ink-3 pb-3 pr-6">USE</th>
                <th className="font-mono text-[11px] tracking-widest font-medium text-ink-3 pb-3 pr-6">FLOOR AREA</th>
                <th className="font-mono text-[11px] tracking-widest font-medium text-ink-3 pb-3 pr-6">SHORTEST TERM</th>
                <th className="font-mono text-[11px] tracking-widest font-medium text-ink-3 pb-3">TYPICALLY INCLUDES</th>
              </tr>
            </thead>
            <tbody>
              {SCHEDULE.map((r) => (
                <tr key={r.use} className="border-b border-ink/10 align-baseline">
                  <td className="font-display font-semibold text-lg py-4 pr-6 whitespace-nowrap">{r.use}</td>
                  <td className="font-mono text-sm text-ink-2 py-4 pr-6 whitespace-nowrap">{r.area}</td>
                  <td className="text-sm text-ink-2 py-4 pr-6 whitespace-nowrap">{r.term}</td>
                  <td className="text-sm text-ink-2 py-4">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Discussions, middle of page */}
      <section className="bg-vault text-bone">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 items-start">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-tight max-w-[18ch]">
              The roadmap is a conversation, not an announcement
            </h2>
            <p className="text-bone/75 mt-5 leading-relaxed max-w-[58ch]">
              Premises is an open prototype. What gets built next comes from people describing the
              space they were trying to rent and could not find. Bring a rough idea, a bug, or a
              question about how any of it works.
            </p>
            <a
              href={DISCUSSIONS}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 bg-brass text-ink font-semibold px-6 py-3 mt-8 hover:bg-bone transition-colors"
            >
              <Icon name="msg" className="w-4 h-4" />
              Open GitHub Discussions
            </a>
          </div>
          <ul className="space-y-4 lg:border-l border-bone/25 lg:pl-10">
            {[
              ["Ask", "How pricing, terms or the mock booking flow are meant to work."],
              ["Propose", "A space type, filter or host tool the prototype is missing."],
              ["Report", "Anything that behaves oddly, with the steps that caused it."],
            ].map(([kind, what]) => (
              <li key={kind}>
                <span className="font-display font-semibold text-lg">{kind}</span>
                <p className="text-sm text-bone/70 leading-relaxed mt-1">{what}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Two sides of a lease */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid md:grid-cols-2 gap-10 md:gap-0">
        <div className="md:pr-12">
          <h2 className="font-display text-2xl font-semibold">If you need space</h2>
          <p className="text-ink-2 mt-3 leading-relaxed max-w-[46ch]">
            Filter by area, term and what the room actually has in it. Compare shortlisted spaces
            side by side, message the host, then book instantly or send a request.
          </p>
          <Link to="/search" className="inline-block font-semibold text-vault underline underline-offset-4 hover:no-underline mt-5">
            Start searching
          </Link>
        </div>
        <div className="md:pl-12 md:border-l border-ink/15">
          <h2 className="font-display text-2xl font-semibold">If you have space</h2>
          <p className="text-ink-2 mt-3 leading-relaxed max-w-[46ch]">
            List a unit in eight steps, block out the dates you need it back, and set a different
            price for the days that are worth more. Approve requests or let good tenants book direct.
          </p>
          <Link to="/host/listings/new" className="inline-block font-semibold text-vault underline underline-offset-4 hover:no-underline mt-5">
            List your space
          </Link>
        </div>
      </section>

      {/* Closing */}
      <section className="bg-bone-2 border-y border-ink/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 flex flex-wrap items-center gap-6">
          <p className="font-display text-2xl font-semibold max-w-[24ch]">
            Have a look around, then tell us what is missing.
          </p>
          <div className="flex flex-wrap gap-3 sm:ml-auto">
            <Link to="/search" className="bg-vault text-bone font-semibold px-6 py-3 hover:bg-vault-2 transition-colors">
              Browse spaces
            </Link>
            <a href={DISCUSSIONS} target="_blank" rel="noopener" className="border border-ink/30 font-semibold px-6 py-3 hover:bg-ink hover:text-bone transition-colors">
              Join the discussion
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
