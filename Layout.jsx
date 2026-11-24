import { NavLink, Outlet, Link } from 'react-router-dom';
import { Compass, LayoutDashboard, Map, Wallet } from 'lucide-react';
import { useTrips } from '../context/TripContext';
import { USING_API } from '../services/api';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/planner', label: 'Trip Planner', icon: Map },
  { to: '/budget', label: 'Budget', icon: Wallet },
  { to: '/explore', label: 'Explore', icon: Compass },
];

export default function Layout() {
  const { trips, activeTrip, setActiveTrip } = useTrips();
  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-[900] border-b border-sand-200 bg-sand-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/" className="font-display text-xl font-bold text-lagoon-700">
            Smart<span className="text-coral-500">Travel</span>
          </Link>
          <nav className="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto" aria-label="Main">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    isActive ? 'bg-lagoon-600 text-white' : 'text-ink-soft hover:bg-sand-100'
                  }`
                }
              >
                <Icon size={16} /> {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {trips.length > 0 && (
              <select
                aria-label="Active trip"
                className="input max-w-[200px] py-1.5"
                value={activeTrip?.id || ''}
                onChange={(e) => setActiveTrip(e.target.value)}
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.destination} · {t.startDate}
                  </option>
                ))}
              </select>
            )}
            <Link to="/trips/new" className="btn-accent btn-sm">
              + New trip
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="no-print mx-auto max-w-7xl px-4 pb-10 text-xs text-ink-mute">
        Plan your trip, discover the best experiences and manage every rupee – all in one place.{' '}
        {USING_API ? 'Connected to backend API.' : 'Running on built-in sample data (demo mode).'}
      </footer>
    </div>
  );
}
