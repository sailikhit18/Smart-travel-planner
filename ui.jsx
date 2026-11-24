import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="no-print fixed inset-0 z-[1000] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={`card max-h-[92vh] w-full overflow-y-auto rounded-b-none p-5 sm:rounded-b-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button className="rounded-lg p-1 text-ink-soft hover:bg-sand-100" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ProgressBar({ value, max = 100, color = '#1f8a7e', over = false, label }) {
  const p = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      className="h-2.5 w-full overflow-hidden rounded-full bg-sand-100"
      role="progressbar"
      aria-valuenow={Math.round(p)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, background: over ? '#d94d27' : color }} />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="card mx-auto max-w-xl p-10 text-center">
      {Icon && <Icon className="mx-auto mb-3 text-lagoon-500" size={36} />}
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">{text}</p>
      {action && (
        <Link to={action.to} className="btn-primary mt-5">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function Stat({ label, value, sub, tone }) {
  const color = tone === 'bad' ? 'text-coral-600' : tone === 'good' ? 'text-lagoon-600' : 'text-ink';
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-mute">{sub}</div>}
    </div>
  );
}

export function PageHeader({ title, sub, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-ink-soft">{sub}</p>}
      </div>
      <div className="no-print flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function NoTrip() {
  return (
    <EmptyState
      title="No trip selected"
      text="Create a trip (or load the demo trip from the dashboard) to start planning, budgeting and exploring."
      action={{ to: '/trips/new', label: 'Create a trip' }}
    />
  );
}
