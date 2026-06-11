import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useApp, useToasts } from "../state/store";
import { Icon, Modal } from "./ui";
import { cx } from "../lib/utils";
import { PERSONAS } from "../mocks/data";

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="Premises home">
      <span className="w-8 h-8 rounded-lg bg-vault text-bone font-display font-bold flex items-center justify-center text-lg leading-none">P</span>
      <span className="font-display font-bold text-xl tracking-tight hidden sm:block">Premises</span>
    </Link>
  );
}

export function Header() {
  const { session, openAuth, signOut, setMode, favorites } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const loc = useLocation();
  const isHostMode = session?.mode === "host";
  const push = useToasts((s) => s.push);

  return (
    <header className="sticky top-0 z-50 bg-bone/90 backdrop-blur border-b hairline">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <Logo />

        {!isHostMode && !loc.pathname.startsWith("/search") && loc.pathname !== "/" && (
          <button
            onClick={() => navigate("/search")}
            className="hidden md:flex items-center gap-3 border border-ink/15 rounded-full pl-4 pr-1.5 py-1.5 text-sm text-ink-2 hover:shadow-md transition-shadow cursor-pointer"
          >
            Search spaces…
            <span className="w-7 h-7 rounded-full bg-vault text-bone flex items-center justify-center">
              <Icon name="search" className="w-3.5 h-3.5" />
            </span>
          </button>
        )}

        {isHostMode && (
          <nav className="hidden md:flex items-center gap-1 ml-2" aria-label="Host navigation">
            {[
              ["/host", "Today"],
              ["/host/listings", "Listings"],
              ["/host/calendar", "Calendar"],
              ["/host/requests", "Requests"],
              ["/inbox", "Inbox"],
              ["/host/insights", "Insights"],
            ].map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/host"}
                className={({ isActive }) =>
                  cx("px-3 py-1.5 rounded-full text-sm font-medium", isActive ? "bg-vault text-bone" : "text-ink-2 hover:bg-ink/5")
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="flex-1" />

        {!isHostMode && (
          <Link to={session ? "/host/listings/new" : "#"} onClick={(e) => { if (!session) { e.preventDefault(); openAuth(); } }}
            className="hidden md:block text-sm font-semibold text-ink-2 hover:text-ink px-3 py-2 rounded-full hover:bg-ink/5">
            List your space
          </Link>
        )}

        {session && (
          <button
            onClick={() => {
              const next = isHostMode ? "renter" : "host";
              setMode(next);
              navigate(next === "host" ? "/host" : "/");
              push(next === "host" ? "Switched to hosting" : "Switched to renting");
            }}
            className="hidden sm:block text-sm font-semibold text-vault hover:underline px-2 cursor-pointer"
          >
            {isHostMode ? "Switch to renting" : "Switch to hosting"}
          </button>
        )}

        {!isHostMode && (
          <Link to="/favorites" aria-label={`Saved spaces (${favorites.length})`} className="relative p-2 rounded-full hover:bg-ink/5 hidden sm:block">
            <Icon name="heart" className="w-5 h-5 text-ink-2" />
            {favorites.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-terra text-bone text-[10px] font-bold rounded-full w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center">{favorites.length}</span>
            )}
          </Link>
        )}

        <Link to="/inbox" aria-label="Inbox" className="p-2 rounded-full hover:bg-ink/5 hidden sm:block">
          <Icon name="msg" className="w-5 h-5 text-ink-2" />
        </Link>

        <div className="relative">
          <button
            onClick={() => (session ? setMenuOpen(!menuOpen) : openAuth())}
            className="flex items-center gap-2 border border-ink/15 rounded-full p-1 pl-3 hover:shadow-md transition-shadow cursor-pointer"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Icon name="menu" className="w-4 h-4 text-ink-2" />
            {session ? (
              <img src={session.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <span className="w-7 h-7 rounded-full bg-ink/10 flex items-center justify-center"><Icon name="user" className="w-4 h-4 text-ink-2" /></span>
            )}
          </button>
          {menuOpen && session && (
            <div role="menu" className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border hairline py-2 text-sm reveal" onMouseLeave={() => setMenuOpen(false)}>
              <p className="px-4 py-2 font-semibold border-b hairline">{session.name}</p>
              {[
                ["/dashboard", "My bookings"],
                ["/favorites", "Saved spaces"],
                ["/compare", "Compare"],
                ["/inbox", "Inbox"],
                ["/dashboard/reviews", "Reviews"],
                ["/account", "Account settings"],
                ["/help", "Help centre"],
              ].map(([to, label]) => (
                <Link key={to} to={to} role="menuitem" className="block px-4 py-2 hover:bg-bone-2" onClick={() => setMenuOpen(false)}>{label}</Link>
              ))}
              <button role="menuitem" className="block w-full text-left px-4 py-2 hover:bg-bone-2 text-terra cursor-pointer" onClick={() => { signOut(); setMenuOpen(false); navigate("/"); }}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function AuthModal() {
  const { authOpen, closeAuth, signIn } = useApp();
  const push = useToasts((s) => s.push);
  return (
    <Modal open={authOpen} onClose={closeAuth} title="Sign in to Premises">
      <p className="text-sm text-ink-2 mb-5">
        This is a frontend prototype — pick a demo persona. No real account is created.
      </p>
      <div className="space-y-3">
        {(Object.keys(PERSONAS) as Array<keyof typeof PERSONAS>).map((k) => {
          const p = PERSONAS[k];
          return (
            <button
              key={k}
              onClick={() => { signIn(k); push(`Signed in as ${p.name}`); }}
              className="w-full flex items-center gap-4 border border-ink/15 rounded-xl p-4 hover:border-vault hover:bg-vault/5 transition-colors text-left cursor-pointer"
            >
              <img src={p.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
              <span>
                <span className="block font-semibold">{p.name}</span>
                <span className="block text-sm text-ink-3">{p.mode === "renter" ? "Renter — searching for space" : "Host — 6 listings"}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

export function Footer() {
  const cols = [
    { title: "Discover", links: [["Offices", "/search?type=office"], ["Retail units", "/search?type=retail"], ["Warehouses", "/search?type=warehouse"], ["Studios", "/search?type=studio"], ["Event venues", "/search?type=event"]] },
    { title: "Hosting", links: [["List your space", "/host/listings/new"], ["Hosting dashboard", "/host"], ["Calendar", "/host/calendar"], ["Insights", "/host/insights"]] },
    { title: "Support", links: [["Help centre", "/help"], ["Cancellation policies", "/policies/cancellation"], ["Trust & safety", "/help"]] },
    { title: "Company", links: [["Terms", "/terms"], ["Privacy", "/privacy"], ["About", "/help"]] },
  ];
  return (
    <footer className="bg-ink text-bone mt-20 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2 md:col-span-1">
          <span className="font-display font-bold text-2xl">Premises</span>
          <p className="text-sm text-bone/60 mt-3 leading-relaxed">Commercial space, on your terms. A frontend prototype — all data is mocked.</p>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h3 className="font-semibold text-sm mb-3 text-bone/90">{c.title}</h3>
            <ul className="space-y-2">
              {c.links.map(([label, to]) => (
                <li key={label}><Link to={to} className="text-sm text-bone/60 hover:text-bone hover:underline">{label}</Link></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-bone/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center gap-4 text-xs text-bone/50">
          <span>© 2026 Premises (demo)</span>
          <span className="font-mono">EN · GBP £</span>
          <span className="ml-auto">Built as a frontend-only prototype — no real bookings or payments.</span>
        </div>
      </div>
    </footer>
  );
}

export function MobileBottomNav() {
  const { session } = useApp();
  const isHost = session?.mode === "host";
  const items = isHost
    ? [
        ["/host", "Today", "home"],
        ["/host/calendar", "Calendar", "cal"],
        ["/host/listings", "Listings", "grid"],
        ["/inbox", "Inbox", "msg"],
        ["/account", "Menu", "user"],
      ]
    : [
        ["/", "Explore", "search"],
        ["/favorites", "Saved", "heart"],
        ["/dashboard", "Bookings", "cal"],
        ["/inbox", "Inbox", "msg"],
        ["/account", "Profile", "user"],
      ];
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-bone border-t hairline" aria-label="Primary">
      <ul className="flex">
        {items.map(([to, label, icon]) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === "/" || to === "/host"}
              className={({ isActive }) =>
                cx("flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold", isActive ? "text-vault" : "text-ink-3")
              }
            >
              {({ isActive }) => (
                <>
                  <Icon name={icon} className="w-5 h-5" />
                  {label}
                  <span className={cx("w-1 h-1 rounded-full", isActive ? "bg-vault" : "bg-transparent")} />
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function CompareTray() {
  const { compare, clearCompare } = useApp();
  const loc = useLocation();
  if (compare.length === 0 || loc.pathname === "/compare") return null;
  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[60] reveal">
      <div className="flex items-center gap-3 bg-ink text-bone rounded-full pl-4 pr-2 py-2 shadow-xl">
        <Icon name="compare" className="w-4 h-4 text-brass" />
        <Link to="/compare" className="text-sm font-semibold hover:underline">
          Compare · {compare.length}
        </Link>
        <button onClick={clearCompare} aria-label="Clear comparison" className="p-1.5 rounded-full hover:bg-bone/10 cursor-pointer">
          <Icon name="x" className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
