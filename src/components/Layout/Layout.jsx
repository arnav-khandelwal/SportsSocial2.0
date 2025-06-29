import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import './Layout.scss';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="layout">
      <Header toggleSidebar={toggleSidebar} />
      <div className="layout__content">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="layout__main">
          {children}
          <footer className="layout__footer">
            <div className="layout__footer-content">
              <div className="layout__footer-links">
                <Link to="/about">About Us</Link>
                <span>•</span>
                <Link to="/privacy">Privacy Policy</Link>
                <span>•</span>
                <Link to="/terms">Terms of Service</Link>
                <span>•</span>
                <a href="mailto:support@sportssocial.com">Contact</a>
              </div>
              <p className="layout__footer-text">
                © 2025 Sports Social. All rights reserved.
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Layout;