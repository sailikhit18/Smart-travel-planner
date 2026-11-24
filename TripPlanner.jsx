import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Compass, Pencil, Plus, Printer, RefreshCw, Trash2, Wallet } from 'lucide-react';
import { useTrips } from '../context/TripContext';
import { NoTrip, Modal, PageHeader, Stat } from '../components/ui';
import ExpenseForm from '../components/ExpenseForm';
import { categoryIcon } from '../components/CategoryTabs';
import { SLOTS, BUDGET_CATEGORIES } from '../data/constants';
import { addDays, daysBetween, formatDate } from '../utils/dates';
import { inr, uid } from '../utils/format';
import { generateItinerary } from '../services/itineraryGenerator';

export default function TripPlanner() {
  const t = useTrips();
  const trip = t.activeTrip;
  const [editingTrip, setEditingTrip] = useState(false);
  const [customFor, setCustomFor] = useState(null); // {day, slot}
  const [spendFor, setSpendFor] = useState(null); // itinerary item
  const [openItem, setOpenItem] = useState(null);
  const [busy, setBusy] = useState(false);

  const days = trip ? daysBetween(trip.startDate, trip.endDate) : 0;
  const spentByItem = useMemo(() => {
    const m = {};
    trip?.expenses.forEach((e) => e.itemId && (m[e.itemId] = (m[e.itemId] || 0) + e.amount));
    return m;
  }, [trip]);

  if (!trip) return <NoTrip />;

  const estTotal = trip.itinerary.reduce((a, i) => a + (Number(i.estCost) || 0), 0);

  const regenerate = async () => {
    if (!window.confirm('Regenerate the itinerary? Your current plan will be replaced.')) return;
    setBusy(true);
    const items = await generateItinerary(trip);
    t.setItinerary(trip.id, items);
    setBusy(false);
  };

  return (
    <div>
      <PageHeader
        title={`${trip.destination} itinerary`}
        sub={`${formatDate(trip.startDate)} – ${formatDate(trip.endDate)} · ${days} day${days > 1 ? 's' : ''} · ${trip.travellers} traveller${trip.travellers > 1 ? 's' : ''} · ${trip.tripType}`}
      >
        <button className="btn-ghost btn-sm" onClick={() => setEditingTrip(true)}><Pencil size={14} /> Edit trip</button>
        <button className="btn-ghost btn-sm" onClick={regenerate} disabled={busy}><RefreshCw size={14} className={busy ? 'animate-spin' : ''} /> Regenerate</button>
        <Link to="/explore" className="btn-primary btn-sm"><Compass size={14} /> Find places</Link>
        <button className="btn-ghost btn-sm" onClick={() => window.print()}><Printer size={14} /> Export PDF</button>
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Stops planned" value={trip.itinerary.length} />
        <Stat label="Estimated cost" value={inr(estTotal)} sub="Planned, not guaranteed" />
        <Stat label="Actual spent" value={inr(trip.expenses.reduce((a, e) => a + e.amount, 0))} />
        <Stat label="Budget" value={inr(trip.budget.total)} sub={<Link to="/budget" className="underline">Open budget</Link>} />
      </div>

      {trip.itinerary.length === 0 && (
        <div className="card mb-6 p-6 text-sm text-ink-soft">
          Your itinerary is empty. Use <strong>Regenerate</strong> for a draft, or <Link to="/explore" className="font-semibold underline">Explore</Link> to add places yourself.
        </div>
      )}

      <div className="space-y-6">
        {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
          const dayItems = trip.itinerary.filter((x) => x.day === day);
          const dayCost = dayItems.reduce((a, x) => a + (Number(x.estCost) || 0), 0);
          return (
            <section key={day} className="card p-5" aria-label={`Day ${day}`}>
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-sand-100 pb-3">
                <h2 className="text-2xl font-bold">
                  Day {day} <span className="text-base font-normal text-ink-soft">· {formatDate(addDays(trip.startDate, day - 1), { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                </h2>
                <span className="text-sm font-semibold text-ink-soft">Est. {inr(dayCost)}</span>
              </div>

              <div className="space-y-5">
                {SLOTS.map((slot) => {
                  const items = dayItems.filter((x) => x.slot === slot.id);
                  if (!items.length && slot.id === 'stay') return null;
                  return (
                    <div key={slot.id}>
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-lagoon-700">{slot.label}</h3>
                        <button className="no-print text-xs font-semibold text-ink-soft hover:text-lagoon-700" onClick={() => setCustomFor({ day, slot: slot.id })}>
                          <Plus size={12} className="mr-0.5 inline" /> Add custom
                        </button>
                      </div>
                      {items.length === 0 && <p className="rounded-lg border border-dashed border-sand-300 px-3 py-2 text-xs text-ink-mute">Nothing planned.</p>}
                      <ul className="space-y-2">
                        {items.map((it) => {
                          const spent = spentByItem[it.id] || 0;
                          const open = openItem === it.id;
                          return (
                            <li key={it.id} className="rounded-xl border border-sand-200 bg-sand-50 p-3">
                              <div className="flex items-start gap-3">
                                <span className="text-xl" aria-hidden>{categoryIcon(it.place.category)}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold leading-snug">{it.place.name}</div>
                                  <div className="text-xs text-ink-soft">
                                    {[it.place.cuisine, it.place.address].filter(Boolean).join(' · ')}
                                  </div>
                                  {it.note && <div className="mt-1 text-xs italic text-ink-soft">“{it.note}”</div>}
                                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                    <span>Est: <strong>{inr(it.estCost)}</strong></span>
                                    <span className={spent ? 'font-semibold text-lagoon-700' : 'text-ink-mute'}>Actual: {spent ? inr(spent) : 'not recorded'}</span>
                                  </div>
                                </div>
                                <div className="no-print flex shrink-0 flex-col gap-1 sm:flex-row">
                                  <button className="btn-ghost btn-sm !px-2" aria-label="Move up" onClick={() => t.reorderItineraryItem(trip.id, it.id, -1)}><ArrowUp size={14} /></button>
                                  <button className="btn-ghost btn-sm !px-2" aria-label="Move down" onClick={() => t.reorderItineraryItem(trip.id, it.id, 1)}><ArrowDown size={14} /></button>
                                </div>
                              </div>
                              <div className="no-print mt-2 flex flex-wrap gap-2">
                                <button className="btn-primary btn-sm" onClick={() => setSpendFor(it)}><Wallet size={13} /> Record actual spend</button>
                                <button className="btn-ghost btn-sm" onClick={() => setOpenItem(open ? null : it.id)}>{open ? 'Close' : 'Edit / move'}</button>
                                <button className="btn-danger btn-sm" aria-label={`Remove ${it.place.name}`} onClick={() => t.removeItineraryItem(trip.id, it.id)}><Trash2 size={13} /></button>
                              </div>
                              {open && (
                                <div className="no-print mt-3 grid gap-3 border-t border-sand-200 pt-3 sm:grid-cols-4">
                                  <div>
                                    <label className="label">Day</label>
                                    <select className="input" value={it.day} onChange={(e) => t.updateItineraryItem(trip.id, it.id, { day: Number(e.target.value) })}>
                                      {Array.from({ length: days }, (_, k) => <option key={k} value={k + 1}>Day {k + 1}</option>)}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="label">Time</label>
                                    <select className="input" value={it.slot} onChange={(e) => t.updateItineraryItem(trip.id, it.id, { slot: e.target.value })}>
                                      {SLOTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="label">Est. cost (₹)</label>
                                    <input type="number" min="0" className="input" value={it.estCost}
                                      onChange={(e) => t.updateItineraryItem(trip.id, it.id, { estCost: Number(e.target.value) })} />
                                  </div>
                                  <div>
                                    <label className="label">Note</label>
                                    <input className="input" value={it.note || ''} onChange={(e) => t.updateItineraryItem(trip.id, it.id, { note: e.target.value })} />
                                  </div>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {editingTrip && <EditTripModal trip={trip} onClose={() => setEditingTrip(false)} />}
      {customFor && <CustomItemModal ctx={customFor} trip={trip} onClose={() => setCustomFor(null)} />}
      {spendFor && (
        <ExpenseForm
          trip={trip}
          initial={{
            description: spendFor.place.name,
            category: spendFor.budgetCategory,
            amount: '',
            date: addDays(trip.startDate, spendFor.day - 1),
          }}
          onSave={(exp) => t.addExpense(trip.id, { ...exp, itemId: spendFor.id })}
          onClose={() => setSpendFor(null)}
        />
      )}
    </div>
  );
}

function EditTripModal({ trip, onClose }) {
  const { updateTrip, setTravellerNames, setItinerary } = useTrips();
  const [f, setF] = useState({ destination: trip.destination, startDate: trip.startDate, endDate: trip.endDate, travellers: trip.travellers });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const save = (e) => {
    e.preventDefault();
    if (!f.destination.trim()) return setErr('Destination is required.');
    if (f.endDate < f.startDate) return setErr('End date must be on or after the start date.');
    const newDays = daysBetween(f.startDate, f.endDate);
    if (newDays > 14) return setErr('Trips are limited to 14 days.');
    updateTrip(trip.id, { destination: f.destination.trim(), startDate: f.startDate, endDate: f.endDate });
    // keep items inside the new date range
    if (trip.itinerary.some((i) => i.day > newDays)) setItinerary(trip.id, trip.itinerary.map((i) => ({ ...i, day: Math.min(i.day, newDays) })));
    const n = Math.max(1, Number(f.travellers) || 1);
    if (n !== trip.travellers) {
      const names = Array.from({ length: n }, (_, i) => trip.travellerNames[i] || `Traveller ${i + 1}`);
      setTravellerNames(trip.id, names);
    }
    onClose();
  };

  return (
    <Modal title="Edit trip" onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="label" htmlFor="et-d">Destination</label>
          <input id="et-d" className="input" value={f.destination} onChange={set('destination')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="et-s">Start</label><input id="et-s" type="date" className="input" value={f.startDate} onChange={set('startDate')} /></div>
          <div><label className="label" htmlFor="et-e">End</label><input id="et-e" type="date" className="input" min={f.startDate} value={f.endDate} onChange={set('endDate')} /></div>
        </div>
        <div>
          <label className="label" htmlFor="et-t">Travellers</label>
          <input id="et-t" type="number" min="1" max="20" className="input" value={f.travellers} onChange={set('travellers')} />
        </div>
        <p className="text-xs text-ink-mute">Shortening the trip moves stops from removed days onto the last day. Use “Regenerate” for a fresh draft.</p>
        {err && <p className="text-sm text-coral-600" role="alert">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary">Save</button>
        </div>
      </form>
    </Modal>
  );
}

function CustomItemModal({ ctx, trip, onClose }) {
  const { addItineraryItem } = useTrips();
  const [name, setName] = useState('');
  const [cost, setCost] = useState(0);
  const [cat, setCat] = useState('activities');

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addItineraryItem(trip.id, {
      day: ctx.day,
      slot: ctx.slot,
      estCost: Number(cost) || 0,
      budgetCategory: cat,
      place: { id: `custom-${uid()}`, name: name.trim(), category: 'activity', cuisine: 'Custom item', source: 'Added by you' },
    });
    onClose();
  };

  return (
    <Modal title={`Add custom item · Day ${ctx.day}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="c-n">What are you planning?</label>
          <input id="c-n" autoFocus className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Airport transfer" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="c-c">Estimated cost (₹)</label><input id="c-c" type="number" min="0" className="input" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
          <div>
            <label className="label" htmlFor="c-k">Budget category</label>
            <select id="c-k" className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
              {BUDGET_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary">Add</button>
        </div>
      </form>
    </Modal>
  );
}
