import { Outlet } from 'react-router-dom';
import Footer from './Footer.jsx';

export default function SiteLayout() {
  return (
    <div className="site-layout" id="top">
      <div className="site-content">
        <Outlet />
      </div>

      <Footer />
    </div>
  );
}
