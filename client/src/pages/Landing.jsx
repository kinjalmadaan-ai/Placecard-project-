
import { Link } from 'react-router-dom';
import { Logo, Icon } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Landing() {
  const { user, isAdmin } = useAuth();

  return (
    <>
      <header className="topbar">
        <Logo />

        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#about">About</a>
        </nav>

        <div className="row">
          {user ? (
            <Link className="btn primary" to={isAdmin ? '/admin' : '/portal'}>
              {isAdmin ? 'Open dashboard' : 'My invitations'}
            </Link>
          ) : (
            <>
              <Link className="btn ghost" to="/login">Sign in</Link>
              <Link className="btn primary" to="/register">Create account</Link>
            </>
          )}
        </div>
      </header>

      <main className="wrap">
        {/* Hero Section */}
        <section className="hero hero-new">
          <div className="hero-content">
            <span className="hero-tag">
              ✦ EVENT INVITATIONS, REIMAGINED
            </span>

            <h1 className="display">
              Make every invitation feel special.
            </h1>

            <p className="lead">
              Create beautiful invitations, bring your guest list
              together, and manage every RSVP in one simple place.
            </p>

            <div className="row hero-actions">
              <Link className="btn primary" to="/register">
                Create an invitation <span>→</span>
              </Link>

              <a className="btn" href="#features">
                Explore features
              </a>
            </div>

            <p className="muted small hero-note">
              ✦ Simple invitations. Personal guest links. Easy RSVPs.
            </p>
          </div>

          {/* Guest Invitation Preview */}
          <div className="hero-visual">
            <div className="hero-decoration"></div>

            <div className="guest-invitation-card">
              <div className="guest-invitation-top">
                <span>✦ A SPECIAL INVITATION ✦</span>
              </div>

              <div className="guest-invitation-content">
                <p className="muted small">YOU ARE INVITED TO</p>

                <h2>Maya &amp; Daniel's</h2>
                <h3>Garden Celebration</h3>

                <div className="guest-floral-divider">
                  ✿ ❀ ✿
                </div>

                <p className="guest-message">
                  We'd love for you to join us for an afternoon
                  filled with laughter, love and lovely memories.
                </p>

                <div className="guest-event-details">
                  <div>
                    <span>DATE</span>
                    <b>Saturday, 14 June</b>
                  </div>

                  <div>
                    <span>TIME</span>
                    <b>4:00 PM onwards</b>
                  </div>

                  <div>
                    <span>LOCATION</span>
                    <b>The Orangery, Kew</b>
                  </div>
                </div>

                <div className="guest-rsvp">
                  <h4>Will you be joining us?</h4>

                  <div className="guest-rsvp-buttons">
                    <span className="guest-accept">
                      Accept invitation
                    </span>

                    <span className="guest-decline">
                      Decline
                    </span>
                  </div>
                </div>

                <p className="guest-footer">
                  Kindly respond by 1 June ♡
                </p>
              </div>
            </div>

            <div className="guest-floating-note">
              <span className="guest-check">✓</span>

              <div>
                <b>Personal invitation</b>
                <p className="muted small">
                  A special link for every guest
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section" id="features">
          <div className="section-heading">
            <span className="hero-tag">
              ✦ WHAT PLACECARD OFFERS
            </span>

            <h2 className="display">
              Everything you need to bring people together.
            </h2>

            <p className="muted">
              From the first invitation to the final guest response,
              keep your event organised in one place.
            </p>
          </div>

          <div className="feature-cards">
            {/* Feature 1 */}
            <article className="feature-card">
              <div className="feature-icon">
                <Icon name="mail" size={25} />
              </div>

              <span className="feature-label">
                PERSONAL INVITATIONS
              </span>

              <h3>Every guest gets their own link.</h3>

              <p className="muted">
                Send invitations by email or share personal guest links
                through WhatsApp. Each guest gets a simple way to view
                their invitation and respond.
              </p>

              <div className="feature-card-footer">
                <span>Easy to share</span>
                <span className="feature-arrow">↗</span>
              </div>
            </article>

            {/* Feature 2 */}
            <article className="feature-card">
              <div className="feature-icon">
                <Icon name="users" size={25} />
              </div>

              <span className="feature-label">
                GUEST DETAILS
              </span>

              <h3>Know who's coming and what they need.</h3>

              <p className="muted">
                Collect attendance, party size, guest names, dietary
                preferences, accessibility needs and personal notes
                through one RSVP form.
              </p>

              <div className="feature-card-footer">
                <span>All details together</span>
                <span className="feature-arrow">↗</span>
              </div>
            </article>

            {/* Feature 3 */}
            <article className="feature-card">
              <div className="feature-icon">
                <Icon name="dashboard" size={25} />
              </div>

              <span className="feature-label">
                EVENT MANAGEMENT
              </span>

              <h3>Stay in control of your guest list.</h3>

              <p className="muted">
                Follow responses as they arrive, monitor confirmed
                attendance and keep track of your event capacity
                from your organiser dashboard.
              </p>

              <div className="feature-card-footer">
                <span>Clear event overview</span>
                <span className="feature-arrow">↗</span>
              </div>
            </article>
          </div>
        </section>

        
        {/* How It Works Section */}
        <section className="how-section" id="how-it-works">
          <div className="how-heading">
            <span className="hero-tag">✦ THREE SIMPLE STEPS</span>

            <h2 className="display">
              From invitation to celebration.
            </h2>

            <p className="muted">
              Everything you need to organise your event and bring
              your guests together, without the hassle.
            </p>
          </div>

          <div className="how-steps">
            {/* Step 1 */}
            <article className="how-step">
              <div className="how-step-top">
                <span className="how-number">01</span>
                <div className="how-icon">
                  <Icon name="calendar" size={26} />
                </div>
              </div>

              <h3>Create your event</h3>

              <p className="muted">
                Start by adding your event name, date, venue,
                description and guest capacity. Set up your
                invitation just the way you want it.
              </p>

              <span className="how-step-label">SET UP YOUR EVENT</span>
            </article>

            <div className="how-connector">→</div>

            {/* Step 2 */}
            <article className="how-step">
              <div className="how-step-top">
                <span className="how-number">02</span>
                <div className="how-icon">
                  <Icon name="send" size={26} />
                </div>
              </div>

              <h3>Invite your guests</h3>

              <p className="muted">
                Add your guest list and send personal invitations
                by email or share individual invitation links
                through WhatsApp.
              </p>

              <span className="how-step-label">SEND INVITATIONS</span>
            </article>

            <div className="how-connector">→</div>

            {/* Step 3 */}
            <article className="how-step">
              <div className="how-step-top">
                <span className="how-number">03</span>
                <div className="how-icon">
                  <Icon name="dashboard" size={26} />
                </div>
              </div>

              <h3>Track your RSVPs</h3>

              <p className="muted">
                Watch guest responses arrive, check attendance
                details and monitor your event capacity from
                one simple dashboard.
              </p>

              <span className="how-step-label">MANAGE RESPONSES</span>
            </article>
          </div>

          <div className="how-cta">
            <p>Ready to plan your next event?</p>
            <Link to="/register" className="btn primary">
              Get started <span>→</span>
            </Link>
          </div>
        </section>


        {/* Testimonials Section */}
        <section className="testimonials-section" id="testimonials">
          <div className="testimonials-heading">
            <span className="hero-tag">✦ WHY PEOPLE WOULD LOVE PLACECARD</span>

            <h2 className="display">
              A simpler way to bring everyone together.
            </h2>

            <p className="muted">
              A few examples of the kind of experience Placecard is designed to offer.
            </p>

          </div>

          <div className="testimonial-cards">
            <article className="testimonial-card">
              <div className="testimonial-stars" aria-label="Example five-star rating">
                ★★★★★
              </div>

              <p className="testimonial-quote">
                "I love having all the invitations and guest responses
                in one place. It makes organising an event feel so much
                less stressful."
              </p>

              <div className="testimonial-person">
                <div className="testimonial-avatar">E</div>
                <div>
                  <h4>Event Organiser</h4>
                  <span>Sample profile</span>
                </div>
              </div>
            </article>

            <article className="testimonial-card">
              <div className="testimonial-stars" aria-label="Example five-star rating">
                ★★★★★
              </div>

              <p className="testimonial-quote">
                "The personal invitation link is such a nice touch.
                Guests can open their invitation and respond without
                going through a complicated process."
              </p>

              <div className="testimonial-person">
                <div className="testimonial-avatar">M</div>
                <div>
                  <h4>Event Host</h4>
                  <span>Sample profile</span>
                </div>
              </div>
            </article>

            <article className="testimonial-card">
              <div className="testimonial-stars" aria-label="Example five-star rating">
                ★★★★★
              </div>

              <p className="testimonial-quote">
                "Being able to see who's attending and check the guest
                count from one dashboard would make planning a gathering
                so much easier."
              </p>

              <div className="testimonial-person">
                <div className="testimonial-avatar">A</div>
                <div>
                  <h4>Event Planner</h4>
                  <span>Sample profile</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* About Placecard */}
        <section className="about-section" id="about">
          <div className="about-content">
            <span className="about-tag">
              ✦ A LITTLE ABOUT US
            </span>

            <h2>
              Less time organising.
              <br />
              More time <span>celebrating.</span>
            </h2>

            <p className="about-intro">
              Great events bring people together. Placecard makes
              everything leading up to them feel simpler.
            </p>

            <p className="about-description">
              From creating your invitation to collecting guest responses,
              Placecard keeps the important details in one organised space.
              No scattered messages, confusing guest lists or chasing replies.
              Just a simpler way to bring everyone together.
            </p>

            <Link to="/register" className="about-link">
              Discover Placecard <span>→</span>
            </Link>
          </div>

          {/* Decorative event overview */}
          <div className="about-visual">
            <div className="about-circle about-circle-one"></div>
            <div className="about-circle about-circle-two"></div>

            <div className="about-event-card">
              <div className="about-event-top">
                <span className="about-event-icon">✿</span>
                <span>THE Placecard EXPERIENCE</span>
              </div>

              <h3>Every detail, together.</h3>
              <p>Your event journey, made simple.</p>

              <div className="about-event-item">
                <span className="about-item-icon">01</span>
                <div>
                  <b>Create something special</b>
                  <small>Build your event invitation</small>
                </div>
                <span className="about-item-check">✓</span>
              </div>

              <div className="about-event-item">
                <span className="about-item-icon">02</span>
                <div>
                  <b>Bring your guests together</b>
                  <small>Share personal invitation links</small>
                </div>
                <span className="about-item-check">✓</span>
              </div>

              <div className="about-event-item">
                <span className="about-item-icon">03</span>
                <div>
                  <b>Enjoy an organised event</b>
                  <small>Keep track of every RSVP</small>
                </div>
                <span className="about-item-check">✓</span>
              </div>

              <div className="about-event-footer">
                <span>Made for moments worth celebrating</span>
                <span>♡</span>
              </div>
            </div>

            <div className="about-floating-card">
              <span className="about-floating-icon">✦</span>
              <div>
                <b>All in one place</b>
                <small>From invite to RSVP</small>
              </div>
            </div>
          </div>
        </section>



        {/* Final Call To Action */}
        <section className="final-cta">
          <div className="final-cta-decoration final-cta-decoration-one"></div>
          <div className="final-cta-decoration final-cta-decoration-two"></div>

          <div className="final-cta-content">
            <span className="final-cta-tag">
              ✦ YOUR NEXT CELEBRATION STARTS HERE
            </span>

            <h2>
              Bring everyone together.
              <br />
              We'll help with the details.
            </h2>

            <p>
              Create your event, send beautiful invitations and
              keep every RSVP organised in one place.
            </p>

            <div className="final-cta-actions">
              <Link to="/register" className="btn final-cta-primary">
                Create your free account <span>→</span>
              </Link>

              <Link to="/login" className="final-cta-secondary">
                Already have an account? Sign in
              </Link>
            </div>

            <div className="final-cta-note">
              <span>✓</span> Simple event management
              <span>✓</span> Personal guest invitations
              <span>✓</span> Easy RSVP tracking
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
