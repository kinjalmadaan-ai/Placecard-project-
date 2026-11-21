import { Icon, Badge } from './ui.jsx';
import { fmtDate, fmtTimes, fmtDateTime, deadlinePassed } from '../lib.js';

// Shows an event's public details. Used on the invitation page and the RSVP page.
export default function EventInfo({ event }) {
  const mapsHref = event.mapsLink || (event.venueAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venueAddress)}` : '');
  return (
    <section className="event-card">
      {event.coverImage && <img className="cover" src={event.coverImage} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
      <div className="event-body">
        <p className="muted small">{event.category}</p>
        <h1 className="display">{event.name}</h1>
        {event.status === 'cancelled' && <p><Badge kind="cancelled">This event has been cancelled</Badge></p>}
        <ul className="facts">
          <li><Icon name="calendar" /><span>{fmtDate(event.date)}{fmtTimes(event) && <><br /><span className="muted">{fmtTimes(event)}</span></>}</span></li>
          {(event.venueName || event.venueAddress) && (
            <li><Icon name="pin" /><span>{event.venueName}{event.venueName && event.venueAddress && <br />}<span className="muted">{event.venueAddress}</span>
              {mapsHref && <><br /><a href={mapsHref} target="_blank" rel="noopener noreferrer">Open in Google Maps</a></>}</span></li>
          )}
          {event.dressCode && <li><Icon name="shirt" /><span>Dress code: {event.dressCode}</span></li>}
          {event.rsvpDeadline && <li><Icon name="clock" /><span>Reply by {fmtDateTime(event.rsvpDeadline)}{deadlinePassed(event) && <> <Badge kind="expired">closed</Badge></>}</span></li>}
        </ul>
        {event.description && <p className="prewrap">{event.description}</p>}
        {event.instructions && <div className="note"><Icon name="info" /><div><strong>Good to know</strong><p className="prewrap">{event.instructions}</p></div></div>}
        {(event.contactName || event.contactEmail || event.contactPhone) && (
          <p className="muted small">Questions? {[event.contactName, event.contactEmail && <a key="e" href={`mailto:${event.contactEmail}`}>{event.contactEmail}</a>, event.contactPhone].filter(Boolean).reduce((a, x, i) => (i ? [...a, ' · ', x] : [x]), [])}</p>
        )}
      </div>
    </section>
  );
}
