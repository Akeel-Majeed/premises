import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListingCard } from "../components/ListingCard";
import { Button, EmptyState, Icon, Modal, inputCls } from "../components/ui";
import { cx } from "../lib/utils";
import { findListing, useApp, useToasts } from "../state/store";

export default function Favorites() {
  const { session, openAuth, favorites, collections, addCollection, toggleInCollection, removeCollection, published, compare, toggleCompare } = useApp();
  const push = useToasts((s) => s.push);
  const navigate = useNavigate();
  const [active, setActive] = useState<string>("all");
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [organizing, setOrganizing] = useState<string | null>(null); // listing being added to collections

  if (!session) {
    return (
      <main id="main" className="max-w-3xl mx-auto px-4 py-20">
        <EmptyState icon="heart" title="Sign in to see saved spaces" body="Your saved spaces and collections live in your account."
          action={<Button onClick={openAuth}>Sign in</Button>} />
      </main>
    );
  }

  const activeIds = active === "all" ? favorites : collections.find((c) => c.id === active)?.ids ?? [];
  const listings = activeIds.map((id) => findListing(id, published)).filter(Boolean);

  return (
    <main id="main" className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">Saved spaces</h1>
          <p className="text-sm text-ink-2 mt-1">Organise shortlists into collections, then compare side by side.</p>
        </div>
        <Button variant="secondary" onClick={() => setNewOpen(true)}><Icon name="plus" className="w-4 h-4" /> New collection</Button>
      </div>

      {/* collection tabs */}
      <div className="flex gap-2 overflow-x-auto rail pb-2 mb-8">
        <button onClick={() => setActive("all")}
          className={cx("shrink-0 rounded-full px-4 py-2 text-sm font-semibold border cursor-pointer", active === "all" ? "bg-vault text-bone border-vault" : "border-ink/20 hover:border-ink")}>
          All saved <span className="font-mono text-xs ml-1">{favorites.length}</span>
        </button>
        {collections.map((c) => (
          <span key={c.id} className="shrink-0 flex items-center">
            <button onClick={() => setActive(c.id)}
              className={cx("rounded-full px-4 py-2 text-sm font-semibold border cursor-pointer", active === c.id ? "bg-vault text-bone border-vault" : "border-ink/20 hover:border-ink")}>
              {c.name} <span className="font-mono text-xs ml-1">{c.ids.length}</span>
            </button>
            {active === c.id && (
              <button aria-label={`Delete collection ${c.name}`} onClick={() => { removeCollection(c.id); setActive("all"); push("Collection deleted"); }}
                className="ml-1 p-1.5 text-ink-3 hover:text-terra cursor-pointer"><Icon name="trash" className="w-4 h-4" /></button>
            )}
          </span>
        ))}
      </div>

      {listings.length === 0 ? (
        <EmptyState icon="heart" title={active === "all" ? "Nothing saved yet" : "This collection is empty"}
          body="Tap the heart on any space to save it here, then group your shortlist into collections."
          action={<Button onClick={() => navigate("/search")}>Browse spaces</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-8">
          {listings.map((l) => (
            <div key={l!.id}>
              <ListingCard listing={l!} />
              <div className="flex gap-2 mt-2">
                <button onClick={() => setOrganizing(l!.id)} className="text-xs font-semibold underline hover:text-vault cursor-pointer">Add to collection</button>
                <button onClick={() => { if (!compare.includes(l!.id) && compare.length >= 4) return push("Compare is full (4 max)"); toggleCompare(l!.id); }}
                  className="text-xs font-semibold underline hover:text-vault cursor-pointer ml-auto">
                  {compare.includes(l!.id) ? "Remove from compare" : "Compare"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {compare.length >= 2 && (
        <div className="text-center mt-10">
          <Button onClick={() => navigate("/compare")}><Icon name="compare" className="w-4 h-4" /> Compare selected ({compare.length})</Button>
        </div>
      )}

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="New collection">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Q3 pop-up shortlist" className={inputCls} aria-label="Collection name" />
        <Button className="w-full mt-4" onClick={() => {
          if (!newName.trim()) return;
          const id = addCollection(newName.trim());
          setActive(id); setNewName(""); setNewOpen(false);
          push("Collection created");
        }}>Create</Button>
      </Modal>

      <Modal open={organizing !== null} onClose={() => setOrganizing(null)} title="Add to collection">
        {collections.length === 0 && <p className="text-sm text-ink-2 mb-4">No collections yet — create one first.</p>}
        <div className="space-y-2">
          {collections.map((c) => (
            <label key={c.id} className="flex items-center gap-3 border border-ink/15 rounded-xl px-4 py-3 text-sm font-medium cursor-pointer hover:border-vault">
              <input type="checkbox" checked={organizing ? c.ids.includes(organizing) : false}
                onChange={() => organizing && toggleInCollection(c.id, organizing)} className="w-4 h-4 accent-[#174a3c]" />
              {c.name}
            </label>
          ))}
        </div>
        <Button variant="secondary" className="w-full mt-4" onClick={() => { setOrganizing(null); setNewOpen(true); }}>
          <Icon name="plus" className="w-4 h-4" /> New collection
        </Button>
      </Modal>
    </main>
  );
}
