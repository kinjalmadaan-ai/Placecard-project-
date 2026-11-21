
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { useLoad } from '../../hooks.js';
import {
  Loading,
  PageHead,
  Stat,
  Donut,
  Bar,
  Empty
} from '../../components/ui.jsx';
import { fmtShortDate } from '../../lib.js';

export default function Overview() {
  const { data, loading, error, reload } = useLoad(
    () => api('/admin/stats'),
    []
  );

  const t = data?.totals;

  return (
    <div className="overview-page">

      <PageHead
        title="Overview"
        sub="Here's what's happening across your events."
      >
        <Link className="btn primary overview-create-btn" to="/admin/events/new">
          <span>＋</span> Create event
        </Link>
      </PageHead>

      <Loading loading={loading} error={error} onRetry={reload}>

        {data && (
          t.events === 0 ? (

            <div className="overview-empty">
              <div className="overview-empty-icon">✉</div>
              <h2>Your celebrations start here</h2>
              <p>
                Create your first event, invite your guests and
                watch your RSVP activity come to life.
              </p>
              <Link className="btn primary" to="/admin/events/new">
                Create your first event →
              </Link>
            </div>

          ) : (

            <>

              {/* Welcome banner */}
              <section className="overview-welcome">
                <div>
                  <span className="overview-kicker">
                    YOUR Placecard DASHBOARD
                  </span>
                  <h2>Your events, all in one place.</h2>
                  <p>
                    Keep track of invitations, guest responses and
                    upcoming celebrations.
                  </p>
                </div>
              </section>

              {/* Statistics */}
              <section className="overview-stats-section">
                <div className="overview-section-heading">
                  <div>
                    <span className="overview-kicker">AT A GLANCE</span>
                    <h2>Your event statistics</h2>
                  </div>
                </div>

                <div className="overview-stats">

                  <div className="overview-stat-card stat-purple">
                    <div className="overview-stat-top">
                      <span className="overview-stat-label">EVENTS</span>
                    </div>
                    <strong>{t.events}</strong>
                    <p>Total events created</p>
                  </div>

                  <div className="overview-stat-card stat-peach">
                    <div className="overview-stat-top">
                      <span className="overview-stat-label">INVITED</span>
                    </div>
                    <strong>{t.invited}</strong>
                    <p>Guests invited</p>
                  </div>

                  <div className="overview-stat-card stat-green">
                    <div className="overview-stat-top">
                      <span className="overview-stat-label">CONFIRMED</span>
                    </div>
                    <strong>{t.confirmed}</strong>
                    <p>{t.attendees} people attending</p>
                  </div>

                  <div className="overview-stat-card stat-rose">
                    <div className="overview-stat-top">
                      <span className="overview-stat-label">DECLINED</span>
                    </div>
                    <strong>{t.declined}</strong>
                    <p>Unable to attend</p>
                  </div>

                  <div className="overview-stat-card stat-yellow">
                    <div className="overview-stat-top">
                      <span className="overview-stat-label">PENDING</span>
                    </div>
                    <strong>{t.pending}</strong>
                    <p>Awaiting responses</p>
                  </div>

                  <div className="overview-stat-card stat-lavender">
                    <div className="overview-stat-top">
                      <span className="overview-stat-label">ATTENDANCE</span>
                    </div>
                    <strong>{t.attendancePercent}%</strong>
                    <p>Of invited guests confirmed</p>
                  </div>

                </div>

                <div className="overview-capacity">
                  <div>
                    <span>AVAILABLE PLACES</span>
                    <strong>
                      {t.hasCapacityLimits ? t.remainingCapacity : 'No limit set'}
                    </strong>
                    <p>
                      {t.hasCapacityLimits
                        ? 'Remaining capacity across events with a limit'
                        : 'Your events currently have no capacity limits'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Analytics */}
              <section className="overview-analytics-section">
                <div className="overview-section-heading">
                  <div>
                    <span className="overview-kicker">THE DETAILS</span>
                    <h2>Guest activity</h2>
                  </div>
                  <span className="overview-live-label">
                    <span /> RSVP overview
                  </span>
                </div>

                <div className="overview-analytics-grid">

                  <div className="card overview-panel">
                    <div className="overview-panel-heading">
                      <div>
                        <h3>Response breakdown</h3>
                        <p>How your invited guests responded</p>
                      </div>
                    </div>

                    <div className="overview-donut">
                      <Donut
                        label="guests"
                        total={t.invited}
                        parts={[
                          {
                            label: 'Confirmed',
                            value: t.confirmed,
                            color: 'var(--sage)'
                          },
                          {
                            label: 'Declined',
                            value: t.declined,
                            color: 'var(--rose)'
                          },
                          {
                            label: 'Pending',
                            value: t.pending,
                            color: '#D9B44A'
                          }
                        ]}
                      />
                    </div>
                  </div>

                  <div className="card overview-panel overview-event-panel">
                    <div className="overview-panel-heading">
                      <div>
                        <h3>Performance by event</h3>
                        <p>Guest attendance across your events</p>
                      </div>
                    </div>

                    <div className="overview-event-list">
                      {data.perEvent.map((e) => (
                        <div className="overview-event-row" key={e.id}>

                          <div className="overview-event-title">
                            <Link to={`/admin/events/${e.id}`}>
                              {e.name}
                            </Link>
                            <span>{fmtShortDate(e.date)}</span>
                          </div>

                          <Bar
                            value={e.attendees}
                            max={e.capacity || e.invited || 1}
                          />

                          <div className="overview-event-meta">
                            <span>
                              <i className="event-dot confirmed-dot" />
                              {e.attendees} attending
                            </span>

                            {e.capacity && (
                              <span>{e.capacity} places</span>
                            )}

                            <span>
                              <i className="event-dot pending-dot" />
                              {e.pending} pending
                            </span>

                            <span>
                              {e.declined} declined
                            </span>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </section>

              {/* Quick action */}
              <section className="overview-bottom-cta">
                <div>
                  <span>✦ THE NEXT CELEBRATION STARTS HERE</span>
                  <h2>Planning something special?</h2>
                  <p>Create a beautiful event and bring everyone together.</p>
                </div>

                <Link className="btn primary" to="/admin/events/new">
                  Create another event →
                </Link>
              </section>

            </>
          )
        )}

      </Loading>
    </div>
  );
}
