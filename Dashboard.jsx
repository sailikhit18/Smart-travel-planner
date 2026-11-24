import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Heart, Sparkles, Trash2, Users } from 'lucide-react';
import { useTrips } from '../context/TripContext';
import { budgetSummary } from '../utils/budget';
import { daysBetween, formatDate, tripStatus } from '../utils/dates';
import { inr, pct } from '../utils/format';
import { ProgressBar } from '../components/ui';
import { buildDemoTrip } from '../services/demoTrip';

const STATUS_STYLE = {
  upcoming: 'bg-lagoon-50 text-lagoon-700',
  ongoing: 'bg-coral-50 text-coral-600',
  past: 'bg-sand-100 text-ink-soft',
};

export default function Dashboard() {
  const { trips, favourites, createTrip, setTravellerNames, deleteTrip, setActiveTrip, toggleFavourite, activeTrip } = useTrips();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadDemo = async () => {
    setLoading(true);
    const { data, itinerary, names } = await buildDemoTrip();
    const id = createTrip(data, itinerary);
    setTravellerNames(id, names);
    setLoading(false);
    navigate('/planner');
  };

  const groups = ['ongoing', 'upcoming', 'past']
    .map((s) => ({ s, list: trips.filter((t) => tripStatus(t) === s) }))
    .filter((g) => g.list.length);

  return (
    <div className="space-y-10">
      <section className="card overflow-hidden bg-lagoon-900 p-8 text-white sm:p-12" style={{ backgroundImage: 'radial-gradient(600px 240px at 90% 0%, rgba(240,98,58,.35), transparent 60%)' }}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lagoon-100">Smart Travel Planner</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
          Plan your trip, discover the best experiences and manage every rupee.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-lagoon-100">
          One place for your day-wise itinerary, your budget and everything worth eating, seeing and doing at your destination.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/trips/new" className="btn-accent">Plan a new trip</Link>
          <button onClick={loadDemo} disabled={loading} className="btn bg-white/10 text-white hover:bg-white/20">
            <Sparkles size={16} /> {loading ? 'Building demo…' : 'Load demo: 3-day Goa trip'}
          </button>
        </div>
      </section>

      <section aria-labelledby="trips-h">
        <h2 id="trips-h" className="mb-4 text-2xl font-bold">Your trips</h2>
        {trips.length === 0 ? (
          <div className="card p-8 text-center text-sm text-ink-soft">
            No trips yet. Create one, or load the demo trip to see the whole connected workflow.
          </div>
        ) : (
          groups.map(({ s, list }) => (
            <div key={s} className="mb-6">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-soft">{s}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((t) => {
                  const sum = budgetSummary(t);
                  return (
                    <article key={t.id} className={`card p-5 ${activeTrip?.id === t.id ? 'ring-2 ring-lagoon-500' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xl font-bold">{t.destination}</h4>
                          <p className="text-xs text-ink-soft">{t.tripType} trip{t.from ? ` · from ${t.from}` : ''}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLE[s]}`}>{s}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
                        <span className="inline-flex items-center gap-1"><CalendarDays size={13} /> {formatDate(t.startDate, { day: 'numeric', month: 'short' })} – {formatDate(t.endDate)} ({daysBetween(t.startDate, t.endDate)}d)</span>
                        <span className="inline-flex items-center gap-1"><Users size={13} /> {t.travellers}</span>
                      </div>
                      <div className="mt-4">
                        <div className="mb-1 flex justify-between text-xs">
                          <span>{inr(sum.spent)} spent</span>
                          <span className="text-ink-soft">of {inr(sum.total)} · {pct(sum.percentUsed)}</span>
                        </div>
                        <ProgressBar value={sum.spent} max={sum.total} over={sum.spent > sum.total} label="Budget used" />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link to="/planner" onClick={() => setActiveTrip(t.id)} className="btn-primary btn-sm">Open plan</Link>
                        <Link to="/budget" onClick={() => setActiveTrip(t.id)} className="btn-ghost btn-sm">Budget</Link>
                        <button
                          className="btn-danger btn-sm ml-auto"
                          aria-label={`Delete trip to ${t.destination}`}
                          onClick={() => window.confirm(`Delete the trip to ${t.destination}? This cannot be undone.`) && deleteTrip(t.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </section>

      <section aria-labelledby="fav-h">
        <h2 id="fav-h" className="mb-4 text-2xl font-bold">Saved places</h2>
        {favourites.length === 0 ? (
          <p className="text-sm text-ink-soft">Tap the heart on any place in Explore to save it here.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {favourites.map((f) => (
              <span key={f.id} className="chip gap-2 py-1.5">
                {f.name}
                <button aria-label={`Remove ${f.name}`} onClick={() => toggleFavourite(f)}>
                  <Heart size={13} className="fill-coral-500 text-coral-500" />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
