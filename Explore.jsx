import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Info, Search } from 'lucide-react';
import { useTrips } from '../context/TripContext';
import CategoryTabs from '../components/CategoryTabs';
import PlaceCard from '../components/PlaceCard';
import ExploreMap from '../components/ExploreMap';
import AddToTripModal from '../components/AddToTripModal';
import { PageHeader } from '../components/ui';
import { SAMPLE_DESTINATIONS } from '../data/sampleData';
import { searchExplore } from '../services/api';

const haversine = ([lat1, lng1], [lat2, lng2]) => {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const a = Math.sin(toRad(lat2 - lat1) / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lng2 - lng1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

export default function Explore() {
  const { activeTrip: trip, favourites, toggleFavourite, addItineraryItem } = useTrips();
  const [destInput, setDestInput] = useState(trip?.destination || 'Goa');
  const [destination, setDestination] = useState(trip?.destination || 'Goa');
  const [category, setCategory] = useState('restaurant');
  const [state, setState] = useState({ loading: true, results: [], center: null, note: '', mode: 'sample' });

  const [q, setQ] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(4);
  const [vegOnly, setVegOnly] = useState(false);
  const [sort, setSort] = useState('rating');
  const [savedOnly, setSavedOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [adding, setAdding] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  // follow the active trip's destination when it changes
  useEffect(() => {
    if (trip?.destination) {
      setDestInput(trip.destination);
      setDestination(trip.destination);
    }
  }, [trip?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    searchExplore({ destination, category, from: trip?.startDate, to: trip?.endDate }).then((r) => {
      if (!cancelled) setState({ loading: false, results: r.results, center: r.center, note: r.note || '', mode: r.mode });
    });
    return () => { cancelled = true; };
  }, [destination, category]); // eslint-disable-line react-hooks/exhaustive-deps

  const favIds = useMemo(() => new Set(favourites.map((f) => f.id)), [favourites]);
  const inTripIds = useMemo(() => new Set((trip?.itinerary || []).map((i) => i.place.id)), [trip]);
  const foodLike = category === 'restaurant' || category === 'streetfood';

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = state.results
      .map((p) => ({
        ...p,
        _dist: state.center && p.lat != null ? haversine(state.center, [p.lat, p.lng]) : null,
      }))
      .filter((p) => !needle || [p.name, p.cuisine, p.description, p.address].some((v) => v?.toLowerCase().includes(needle)))
      .filter((p) => minRating === 0 || (p.rating != null && p.rating >= minRating))
      .filter((p) => p.priceLevel == null || p.priceLevel <= maxPrice)
      .filter((p) => !(vegOnly && foodLike) || p.vegFriendly)
      .filter((p) => !savedOnly || favIds.has(p.id));
    const by = {
      rating: (a, b) => (b.rating ?? -1) - (a.rating ?? -1),
      price: (a, b) => (a.priceLevel ?? 9) - (b.priceLevel ?? 9),
      distance: (a, b) => (a._dist ?? 1e9) - (b._dist ?? 1e9),
      date: (a, b) => (a.startDate || '').localeCompare(b.startDate || ''),
    };
    return list.sort(by[category === 'event' && sort === 'rating' ? 'date' : sort]);
  }, [state, q, minRating, maxPrice, vegOnly, savedOnly, sort, favIds, foodLike, category]);

  const submitDest = (e) => {
    e.preventDefault();
    if (destInput.trim()) setDestination(destInput.trim());
  };

  const onAdd = (place) => {
    if (!trip) return;
    setAdding(place);
  };

  return (
    <div>
      <PageHeader title="Explore" sub="Restaurants, hotels, street food, activities and events – add anything straight to your itinerary.">
        {trip && <span className="chip">Adding to: {trip.destination} trip</span>}
      </PageHeader>

      {!trip && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <Info size={16} className="mt-0.5 shrink-0" />
          <span>You can browse freely, but you need a trip to add places. <Link to="/trips/new" className="font-semibold underline">Create one</Link>.</span>
        </div>
      )}

      <form onSubmit={submitDest} className="mb-4 flex flex-wrap gap-2" role="search">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input list="explore-dests" aria-label="Destination" className="input pl-9" value={destInput} onChange={(e) => setDestInput(e.target.value)} placeholder="Search a destination" />
          <datalist id="explore-dests">{SAMPLE_DESTINATIONS.map((d) => <option key={d.id} value={d.label} />)}</datalist>
        </div>
        <button className="btn-primary">Search</button>
      </form>

      <CategoryTabs value={category} onChange={(c) => { setCategory(c); setSelectedId(null); }} />

      <div className="card mt-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <label className="label" htmlFor="f-q">Search in results</label>
          <input id="f-q" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="name, cuisine, keyword…" />
        </div>
        <div>
          <label className="label" htmlFor="f-r">Min rating</label>
          <select id="f-r" className="input" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
            <option value={0}>Any</option><option value={3.5}>3.5+</option><option value={4}>4.0+</option><option value={4.5}>4.5+</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-p">Price</label>
          <select id="f-p" className="input" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))}>
            <option value={4}>Any</option><option value={1}>₹ budget</option><option value={2}>Up to ₹₹</option><option value={3}>Up to ₹₹₹</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-s">Sort by</label>
          <select id="f-s" className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
            {category === 'event' ? <option value="date">Soonest</option> : <option value="rating">Rating</option>}
            <option value="price">Price</option><option value="distance">Distance</option>
          </select>
        </div>
        <div className="flex flex-col justify-end gap-1 text-sm">
          {foodLike && (
            <label className="flex items-center gap-2"><input type="checkbox" className="accent-lagoon-600" checked={vegOnly} onChange={(e) => setVegOnly(e.target.checked)} /> Vegetarian-friendly</label>
          )}
          <label className="flex items-center gap-2"><input type="checkbox" className="accent-lagoon-600" checked={savedOnly} onChange={(e) => setSavedOnly(e.target.checked)} /> Saved only</label>
        </div>
      </div>

      {(state.note || state.mode === 'sample') && (
        <p className="mt-3 flex items-start gap-2 text-xs text-ink-soft" role="status">
          <Info size={14} className="mt-0.5 shrink-0" />
          {state.note || 'Showing sample demo data – ratings, prices and hours are illustrative. Connect the backend (VITE_API_URL) for live provider data.'}
        </p>
      )}

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="mb-3 text-sm text-ink-soft" aria-live="polite">
            {state.loading ? 'Loading…' : `${shown.length} result${shown.length === 1 ? '' : 's'} in ${destination}`}
          </p>
          {!state.loading && shown.length === 0 ? (
            <div className="card p-8 text-center text-sm text-ink-soft">
              {category === 'event'
                ? 'No upcoming events found. Event coverage varies by destination – check official tourism sites too.'
                : 'No places match these filters.'}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {shown.map((p) => (
                <PlaceCard
                  key={p.id}
                  place={p}
                  distanceKm={p._dist}
                  favourite={favIds.has(p.id)}
                  inTrip={inTripIds.has(p.id)}
                  selected={selectedId === p.id}
                  onSelect={setSelectedId}
                  onToggleFav={toggleFavourite}
                  onAdd={trip ? onAdd : () => setToast('Create or select a trip first.')}
                />
              ))}
            </div>
          )}
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ExploreMap places={shown} center={state.center} selectedId={selectedId} onSelect={setSelectedId} height={520} />
          <p className="mt-2 text-[11px] text-ink-mute">Map data © OpenStreetMap contributors. Pins show the current results.</p>
        </div>
      </div>

      {adding && trip && (
        <AddToTripModal
          place={adding}
          trip={trip}
          onClose={() => setAdding(null)}
          onAdd={(item) => {
            // strip UI-only fields before saving the place snapshot
            const { _dist, ...place } = item.place;
            addItineraryItem(trip.id, { ...item, place });
            setToast(`Added “${place.name}” to Day ${item.day}.`);
          }}
        />
      )}

      {toast && (
        <div role="status" className="fixed bottom-5 left-1/2 z-[1100] -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm text-white shadow-lg">
          {toast}
          <button className="ml-3 underline" onClick={() => setToast('')}>OK</button>
        </div>
      )}
    </div>
  );
}
