import { useMemo, useState } from 'react';
import { AlertTriangle, Info, Lightbulb, Pencil, Plus, Scale, Trash2 } from 'lucide-react';
import { useTrips } from '../context/TripContext';
import { NoTrip, PageHeader, ProgressBar, Stat } from '../components/ui';
import ExpenseForm from '../components/ExpenseForm';
import BudgetCharts from '../components/BudgetCharts';
import { BUDGET_CATEGORIES } from '../data/constants';
import { activeAlert, allocationTotal, budgetSuggestions, budgetSummary, splitSummary } from '../utils/budget';
import { daysBetween, formatDate } from '../utils/dates';
import { inr, pct } from '../utils/format';

const ALERT_STYLE = {
  info: 'border-lagoon-100 bg-lagoon-50 text-lagoon-900',
  warn: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-coral-100 bg-coral-50 text-coral-600',
};

export default function BudgetPlanner() {
  const t = useTrips();
  const trip = t.activeTrip;
  const [form, setForm] = useState(null); // null | {} | expense
  const [filter, setFilter] = useState('all');
  const [namesDraft, setNamesDraft] = useState(null);

  const summary = useMemo(() => (trip ? budgetSummary(trip) : null), [trip]);
  const split = useMemo(() => (trip ? splitSummary(trip) : null), [trip]);
  if (!trip) return <NoTrip />;

  const days = daysBetween(trip.startDate, trip.endDate);
  const alert = activeAlert(summary.percentUsed, trip.alertThresholds);
  const tips = budgetSuggestions(trip, summary, days);
  const allocSum = allocationTotal(trip.budget.allocation);
  const catLabel = (id) => BUDGET_CATEGORIES.find((c) => c.id === id)?.label || id;

  const setAlloc = (id, v) =>
    t.setBudget(trip.id, { allocation: { ...trip.budget.allocation, [id]: Math.max(0, Math.min(100, Number(v) || 0)) } });
  const normalise = () => {
    const cur = trip.budget.allocation;
    const s = allocationTotal(cur) || 1;
    const next = Object.fromEntries(Object.entries(cur).map(([k, v]) => [k, Math.round((v / s) * 100)]));
    const diff = 100 - allocationTotal(next);
    next.misc = Math.max(0, next.misc + diff);
    t.setBudget(trip.id, { allocation: next });
  };
  const toggleThreshold = (th) => {
    const has = trip.alertThresholds.includes(th);
    t.setAlertThresholds(trip.id, has ? trip.alertThresholds.filter((x) => x !== th) : [...trip.alertThresholds, th]);
  };

  const expenses = [...trip.expenses]
    .filter((e) => filter === 'all' || e.category === filter)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const saveNames = () => {
    const names = namesDraft.map((n, i) => n.trim() || `Traveller ${i + 1}`);
    if (new Set(names).size !== names.length) return window.alert('Traveller names must be unique.');
    // keep paidBy in sync when a name changes
    const rename = Object.fromEntries(trip.travellerNames.map((old, i) => [old, names[i]]));
    t.setTravellerNames(trip.id, names);
    t.updateTrip(trip.id, { expenses: trip.expenses.map((e) => (e.paidBy ? { ...e, paidBy: rename[e.paidBy] || e.paidBy } : e)) });
    setNamesDraft(null);
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Budget & expenses" sub={`${trip.destination} · ${days} days · ${trip.travellers} travellers`}>
        <button className="btn-primary" onClick={() => setForm({})}><Plus size={16} /> Record expense</button>
      </PageHeader>

      {alert && (
        <div role="alert" className={`flex items-start gap-3 rounded-2xl border p-4 text-sm font-medium ${ALERT_STYLE[alert.level]}`}>
          <AlertTriangle size={18} className="mt-0.5 shrink-0" /> {alert.text}
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card p-4">
          <label htmlFor="total" className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Total budget (₹)</label>
          <input id="total" type="number" min="0" className="input mt-1 font-display text-xl font-bold" value={trip.budget.total}
            onChange={(e) => t.setBudget(trip.id, { total: Math.max(0, Number(e.target.value) || 0) })} />
        </div>
        <Stat label="Spent (actual)" value={inr(summary.spent)} sub={`${pct(summary.percentUsed)} of budget used`} />
        <Stat label={summary.remaining < 0 ? 'Over budget by' : 'Remaining'} value={inr(Math.abs(summary.remaining))} tone={summary.remaining < 0 ? 'bad' : 'good'} />
        <Stat label="Estimated (planned)" value={inr(summary.estimated)} sub="From itinerary · predictions, not guaranteed" />
      </section>
      <ProgressBar value={summary.spent} max={summary.total} over={summary.spent > summary.total} label="Budget used" />
      {summary.total > 0 && summary.estimated > summary.total && (
        <p className="-mt-4 flex items-center gap-2 text-sm text-amber-800">
          <AlertTriangle size={14} /> Your planned itinerary (estimated {inr(summary.estimated)}) is above your total budget. Swap a costly stop in the Trip Planner or raise the budget.
        </p>
      )}

      <section>
        <h2 className="mb-3 text-2xl font-bold">Category allocation</h2>
        <div className="card divide-y divide-sand-100">
          <div className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <span>Share of budget per category (total {allocSum}%)</span>
            {allocSum !== 100 && (
              <span className="flex items-center gap-2 text-coral-600">
                <Info size={14} /> Should add up to 100%.
                <button className="btn-ghost btn-sm" onClick={normalise}><Scale size={13} /> Auto-balance</button>
              </span>
            )}
          </div>
          {BUDGET_CATEGORIES.map((c) => {
            const planned = summary.allocated[c.id];
            const actual = summary.actualCat[c.id];
            const est = summary.estimatedCat[c.id];
            return (
              <div key={c.id} className="grid items-center gap-3 p-4 sm:grid-cols-[160px_90px_1fr]">
                <div className="flex items-center gap-2 font-semibold"><span className="h-3 w-3 rounded-full" style={{ background: c.color }} />{c.label}</div>
                <div className="flex items-center gap-1">
                  <input aria-label={`${c.label} percentage`} type="number" min="0" max="100" className="input !px-2 text-center" value={trip.budget.allocation[c.id]}
                    onChange={(e) => setAlloc(c.id, e.target.value)} />
                  <span className="text-sm text-ink-soft">%</span>
                </div>
                <div>
                  <div className="mb-1 flex flex-wrap justify-between gap-x-4 text-xs text-ink-soft">
                    <span>Allocated {inr(planned)}</span>
                    <span>Estimated {inr(est)}</span>
                    <span className={actual > planned ? 'font-semibold text-coral-600' : 'font-semibold text-ink'}>Actual {inr(actual)}</span>
                  </div>
                  <ProgressBar value={actual} max={planned} color={c.color} over={planned > 0 && actual > planned} label={`${c.label} spent`} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <BudgetCharts summary={summary} />

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold"><Lightbulb size={18} className="text-amber-500" /> Suggestions</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-ink-soft">{tips.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
        <div className="card p-5">
          <h2 className="mb-3 text-xl font-bold">Alert thresholds</h2>
          <p className="mb-3 text-sm text-ink-soft">Get a warning banner when spending crosses:</p>
          <div className="flex flex-wrap gap-2">
            {[50, 75, 90, 100].map((th) => (
              <button key={th} aria-pressed={trip.alertThresholds.includes(th)} onClick={() => toggleThreshold(th)}
                className={`chip px-4 py-1.5 text-sm ${trip.alertThresholds.includes(th) ? 'chip-on' : 'hover:bg-sand-100'}`}>
                {th === 100 ? 'Budget reached' : `${th}%`}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-bold">Actual expenses</h2>
          <select aria-label="Filter by category" className="input max-w-[200px]" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All categories</option>
            {BUDGET_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div className="card overflow-x-auto">
          {expenses.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-mute">No expenses {filter !== 'all' ? 'in this category' : 'recorded'} yet.</p>
          ) : (
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-sand-200 text-xs uppercase tracking-wide text-ink-soft">
                <tr><th className="p-3">Date</th><th className="p-3">Description</th><th className="p-3">Category</th><th className="p-3">Paid by</th><th className="p-3 text-right">Amount</th><th className="p-3"><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="p-3 whitespace-nowrap">{formatDate(e.date, { day: 'numeric', month: 'short' })}</td>
                    <td className="p-3">{e.description || '—'}</td>
                    <td className="p-3"><span className="tag">{catLabel(e.category)}</span></td>
                    <td className="p-3 text-ink-soft">{e.paidBy || '—'}</td>
                    <td className="p-3 text-right font-semibold">{inr(e.amount)}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button className="btn-ghost btn-sm !px-2" aria-label="Edit expense" onClick={() => setForm(e)}><Pencil size={13} /></button>{' '}
                      <button className="btn-danger btn-sm !px-2" aria-label="Delete expense" onClick={() => window.confirm('Delete this expense?') && t.deleteExpense(trip.id, e.id)}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-bold">Group split</h2>
          {namesDraft ? (
            <div className="flex gap-2"><button className="btn-ghost btn-sm" onClick={() => setNamesDraft(null)}>Cancel</button><button className="btn-primary btn-sm" onClick={saveNames}>Save names</button></div>
          ) : (
            <button className="btn-ghost btn-sm" onClick={() => setNamesDraft([...trip.travellerNames])}><Pencil size={13} /> Edit traveller names</button>
          )}
        </div>
        <div className="card p-5">
          {namesDraft && (
            <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {namesDraft.map((n, i) => (
                <input key={i} aria-label={`Traveller ${i + 1} name`} className="input" value={n} onChange={(e) => setNamesDraft((d) => d.map((x, k) => (k === i ? e.target.value : x)))} />
              ))}
            </div>
          )}
          <p className="mb-4 text-sm text-ink-soft">
            Expenses with a “Paid by” person are split equally between all {trip.travellers} travellers
            ({inr(split.shared)} shared · {inr(split.share)} each).
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {trip.travellerNames.map((n) => {
              const b = split.balance[n];
              return (
                <div key={n} className="rounded-xl border border-sand-200 p-3">
                  <div className="font-semibold">{n}</div>
                  <div className="text-xs text-ink-soft">Paid {inr(split.paid[n])}</div>
                  <div className={`mt-1 text-sm font-bold ${b > 0.5 ? 'text-lagoon-600' : b < -0.5 ? 'text-coral-600' : 'text-ink-soft'}`}>
                    {b > 0.5 ? `Gets back ${inr(b)}` : b < -0.5 ? `Owes ${inr(-b)}` : 'Settled'}
                  </div>
                </div>
              );
            })}
          </div>
          <h3 className="mb-2 mt-5 font-sans text-xs font-bold uppercase tracking-widest text-lagoon-700">Settle up</h3>
          {split.settlements.length === 0 ? (
            <p className="text-sm text-ink-mute">Nothing to settle.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {split.settlements.map((s, i) => (
                <li key={i}><strong>{s.from}</strong> pays <strong>{s.to}</strong> <span className="font-semibold text-coral-600">{inr(s.amount)}</span></li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {form && (
        <ExpenseForm
          trip={trip}
          initial={form.id ? form : undefined}
          onSave={(exp) => (form.id ? t.updateExpense(trip.id, form.id, exp) : t.addExpense(trip.id, exp))}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  );
}
