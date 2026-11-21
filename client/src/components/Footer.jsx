
import { Link } from 'react-router-dom';
import { Logo } from './ui.jsx';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        {/* Brand */}
        <div className="footer-brand">
          <Logo />

          <p>
            Make every invitation feel special.
            Create beautiful events, invite your guests
            and keep every RSVP in one place.
          </p>

          <Link to="/register" className="footer-cta">
            Create your event <span>→</span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="footer-column">
          <h4>Explore</h4>
          <a href="/#features">Features</a>
          <a href="/#how-it-works">How it works</a>
          <a href="/#testimonials">Testimonials</a>
          <a href="/#about">About Placecard</a>
        </div>

        {/* Account */}
        <div className="footer-column">
          <h4>Your account</h4>
          <Link to="/login">Sign in</Link>
          <Link to="/register">Create an account</Link>
        </div>

        {/* Help */}
        <div className="footer-column">
          <h4>Get started</h4>
          <p>
            Have an invitation? Open your personal invitation link
            to view the event and respond.
          </p>
          <a href="/#how-it-works">Discover how it works →</a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} Placecard. All rights reserved.
        </p>

        <a href="#top" className="footer-back-top">
          Back to top ↑
        </a>

        <p className="footer-made">
          Made for moments worth celebrating ♡
        </p>
      </div>
    </footer>
  );
}
