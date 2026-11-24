import { Clock, ExternalLink, Heart, MapPin, Navigation, Plus, Star } from 'lucide-react';
import { categoryIcon } from './CategoryTabs';
import { PRICE_LEVEL_LABEL, inr } from '../utils/format';
import { formatDate } from '../utils/dates';

const BANNER = {
  restaurant: 'from-coral-100 to-sand-100',
  hotel: 'from-lagoon-100 to-sand-100',
  streetfood: 'from-amber-100 to-sand-100',
  activity: 'from-sky-100 to-sand-100',
  event: 'from-rose-100 to-sand-100',
};

export function directionsUrl(p) {
  return p.lat != null && p.lng != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' ' + (p.address || ''))}`;
}

function costLabel(p) {
  if (p.unitCost == null) return 'Cost not available';
  if (Number(p.unitCost) === 0) return 'Free / no ticket';
  const unit = p.costUnit === 'night' ? '/ night' : p.costUnit === 'group' ? '/ group' : '/ person';
  return `≈ ${inr(p.unitCost)} ${unit}`;
}

export default function PlaceCard({ place, distanceKm, favourite, inTrip, onAdd, onToggleFav, onSelect, selected }) {
  const isEvent = place.category === 'event';
  return (
    <article
      className={`card overflow-hidden transition ${selected ? 'ring-2 ring-lagoon-500' : ''}`}
      onMouseEnter={onSelect ? () => onSelect(place.id) : undefined}
    >
      {place.image ? (
        <img src={place.image} alt={place.name} loading="lazy" className="h-28 w-full object-cover" />
      ) : (
        <div className={`flex h-20 items-center justify-between bg-gradient-to-br px-4 ${BANNER[place.category] || BANNER.activity}`}>
          <span className="text-3xl" aria-hidden>{categoryIcon(place.category)}</span>
          <button
            onClick={() => onToggleFav(place)}
            aria-pressed={favourite}
            aria-label={favourite ? 'Remove from favourites' : 'Save to favourites'}
            className="rounded-full bg-white/80 p-2 hover:bg-white"
          >
            <Heart size={16} className={favourite ? 'fill-coral-500 text-coral-500' : 'text-ink-soft'} />
          </button>
        </div>
      )}
      <div className="p-4">
        <h3 className="font-display text-lg font-bold leading-snug">{place.name}</h3>
        <p className="mt-0.5 text-xs text-ink-soft">
          {[place.cuisine, place.venue].filter(Boolean).join(' · ')}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {place.rating != null ? (
            <span className="inline-flex items-center gap-1 font-semibold">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              {Number(place.rating).toFixed(1)}
              {place.reviewCount ? <span className="font-normal text-ink-mute">({place.reviewCount})</span> : null}
            </span>
          ) : (
            <span className="text-ink-mute">No rating</span>
          )}
          {place.priceLevel && <span className="font-semibold text-lagoon-700">{PRICE_LEVEL_LABEL[place.priceLevel]}</span>}
          {distanceKm != null && <span className="text-ink-soft">{distanceKm.toFixed(1)} km from centre</span>}
        </div>

        {place.description && <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{place.description}</p>}

        <div className="mt-2 space-y-1 text-xs text-ink-soft">
          {isEvent && place.startDate && (
            <div className="flex items-center gap-1.5">
              <Clock size={13} /> {formatDate(place.startDate, { day: 'numeric', month: 'short' })}
              {place.endDate && place.endDate !== place.startDate ? ` – ${formatDate(place.endDate, { day: 'numeric', month: 'short' })}` : ''}
              {place.time ? ` · ${place.time}` : ''}
            </div>
          )}
          {!isEvent && place.hours && (
            <div className="flex items-center gap-1.5"><Clock size={13} /> {place.hours}</div>
          )}
          {place.address && (
            <div className="flex items-start gap-1.5"><MapPin size={13} className="mt-0.5 shrink-0" /> {place.address}</div>
          )}
          {place.facilities?.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {place.facilities.map((f) => <span key={f} className="tag">{f}</span>)}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-sand-100 pt-3">
          <span className="text-sm font-semibold">{costLabel(place)}</span>
          <span className="text-[10px] text-ink-mute" title={place.lastChecked ? `Last checked ${place.lastChecked}` : ''}>
            {place.source}
          </span>
        </div>
        <p className="mt-1 text-[10px] text-ink-mute">Estimates are not guaranteed prices – verify before you pay.</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => onAdd(place)} className="btn-primary btn-sm">
            <Plus size={14} /> {inTrip ? 'Add again' : 'Add to trip'}
          </button>
          <a href={directionsUrl(place)} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">
            <Navigation size={14} /> Directions
          </a>
          {(place.website || place.ticketUrl) && (
            <a href={place.ticketUrl || place.website} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">
              <ExternalLink size={14} /> {isEvent ? 'Tickets' : 'Website'}
            </a>
          )}
          {place.image && (
            <button onClick={() => onToggleFav(place)} className="btn-ghost btn-sm" aria-pressed={favourite}>
              <Heart size={14} className={favourite ? 'fill-coral-500 text-coral-500' : ''} /> Save
            </button>
          )}
        </div>
        {inTrip && <p className="mt-2 text-xs font-medium text-lagoon-700">✓ Already in your itinerary</p>}
      </div>
    </article>
  );
}
