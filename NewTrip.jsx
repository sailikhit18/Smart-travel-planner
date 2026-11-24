import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrips } from '../context/TripContext';
import { INTERESTS, TRIP_TYPES } from '../data/constants';
import { SAMPLE_DESTINATIONS } from '../data/sampleData';
import { addDays, daysBetween, todayISO } from '../utils/dates';
import { generateItinerary } from '../services/itineraryGenerator';
import { PageHeader } from '../components/ui';
import { USING_API } from '../services/api';

export default function NewTrip() {
  const { createTrip } = useTrips();
  const navigate = useNavigate();
  const [f, setF] = useState({
    from: '',
    destination: '',
    startDate: addDays(todayISO(), 7),
    endDate: addDays(todayISO(), 9),
    travellers: 2,
    tripType: 'Friends',
    interests: ['food', 'sightseeing'],
    budget: 20000,
  });
  const [auto, setAuto] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const toggleInterest = (id) =>
    setF((s) => ({ ...s, interests: s.interests.includes(id) ? s.interests.filter((i) => i !== id) : [...s.interests, id] }));

  const validate = () => {
    const e = {};
    if (!f.destination.trim()) e.destination = 'Enter a destination.';
    if (!f.startDate || !f.endDate) e.dates = 'Choose start and end dates.';
    else if (f.endDate < f.startDate) e.dates = 'End date must be on or after the start date.';
    else if (daysBetween(f.startDate, f.endDate) > 14) e.dates = 'Trips are limited to 14 days in this version.';
    if (!(Number(f.travellers) >= 1 && Number(f.travellers) <= 20)) e.travellers = 'Travellers must be between 1 and 20.';
    if (!(Number(f.budget) >= 0)) e.budget = 'Budget cannot be negative.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setBusy(true);
    const data = { ...f, destination: f.destination.trim(), travellers: Number(f.travellers), budget: Number(f.budget) };
    const itinerary = auto ? await generateItinerary(data) : [];
    createTrip(data, itinerary);
    setBusy(false);
    navigate('/planner');
  };

  const err = (k) => errors[k] && <p className="mt-1 text-xs text-coral-600" role="alert">{errors[k]}</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Plan a new trip" sub="Tell us the basics – you can edit everything afterwards." />
      <form onSubmit={submit} className="card space-y-6 p-6" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="from">Starting from</label>
            <input id="from" className="input" value={f.from} onChange={set('from')} placeholder="e.g. Mumbai" />
          </div>
          <div>
            <label className="label" htmlFor="dest">Destination *</label>
            <input id="dest" list="dest-list" className="input" value={f.destination} onChange={set('destination')} placeholder="e.g. Goa" />
            <datalist id="dest-list">{SAMPLE_DESTINATIONS.map((d) => <option key={d.id} value={d.label} />)}</datalist>
            {err('destination')}
            {!USING_API && <p className="mt-1 text-xs text-ink-mute">Demo data available for: {SAMPLE_DESTINATIONS.map((d) => d.label).join(', ')}.</p>}
          </div>
          <div>
            <label className="label" htmlFor="start">Start date</label>
            <input id="start" type="date" className="input" value={f.startDate} min={todayISO()} onChange={set('startDate')} />
          </div>
          <div>
            <label className="label" htmlFor="end">End date</label>
            <input id="end" type="date" className="input" value={f.endDate} min={f.startDate} onChange={set('endDate')} />
          </div>
          {errors.dates && <p className="text-xs text-coral-600 sm:col-span-2" role="alert">{errors.dates}</p>}
          <div>
            <label className="label" htmlFor="trav">Number of travellers</label>
            <input id="trav" type="number" min="1" max="20" className="input" value={f.travellers} onChange={set('travellers')} />
            {err('travellers')}
          </div>
          <div>
            <label className="label" htmlFor="type">Trip type</label>
            <select id="type" className="input" value={f.tripType} onChange={set('tripType')}>
              {TRIP_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="budget">Total trip budget (₹)</label>
            <input id="budget" type="number" min="0" className="input" value={f.budget} onChange={set('budget')} />
            {err('budget')}
          </div>
        </div>

        <fieldset>
          <legend className="label">Interests</legend>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((i) => (
              <button
                type="button"
                key={i.id}
                aria-pressed={f.interests.includes(i.id)}
                onClick={() => toggleInterest(i.id)}
                className={`chip px-4 py-1.5 text-sm ${f.interests.includes(i.id) ? 'chip-on' : 'hover:bg-sand-100'}`}
              >
                {i.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="h-4 w-4 accent-lagoon-600" />
          Generate a draft day-wise itinerary (morning / afternoon / evening)
        </label>

        <div className="flex justify-end">
          <button className="btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create trip'}</button>
        </div>
      </form>
    </div>
  );
}
