import { EXPLORE_CATEGORIES } from '../data/constants';

const ICON = { restaurant: '🍽️', hotel: '🏨', streetfood: '🥟', activity: '🎯', event: '🎟️' };
export const categoryIcon = (c) => ICON[c] || '📍';

export default function CategoryTabs({ value, onChange }) {
  return (
    <div role="tablist" aria-label="Explore categories" className="flex gap-2 overflow-x-auto pb-1">
      {EXPLORE_CATEGORIES.map((c) => (
        <button
          key={c.id}
          role="tab"
          aria-selected={value === c.id}
          onClick={() => onChange(c.id)}
          className={`chip whitespace-nowrap px-4 py-2 text-sm ${value === c.id ? 'chip-on' : 'hover:bg-sand-100'}`}
        >
          <span className="mr-1.5" aria-hidden>{ICON[c.id]}</span>
          {c.label}
        </button>
      ))}
    </div>
  );
}
