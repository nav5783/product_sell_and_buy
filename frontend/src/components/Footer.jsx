import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, RefreshCw, Lock } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Brand info */}
        <div className="footer-brand">
          <div className="nav-brand">
            <div className="nav-brand-icon">
              <ShoppingBag size={22} />
            </div>
            <span>ReMarket</span>
          </div>
          <p className="footer-desc">
            The safe, easy, and trusted marketplace to buy and sell verified pre-owned products locally and nationally.
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
              <ShieldCheck size={16} color="var(--accent-emerald)" /> Verified Sellers
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
              <Lock size={16} color="var(--primary)" /> Secure Contact
            </span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-col">
          <h4>Explore Marketplace</h4>
          <ul className="footer-links">
            <li><Link to="/products">All Products</Link></li>
            <li><Link to="/products?category=electronics">Electronics & Tech</Link></li>
            <li><Link to="/products?category=furniture-decor">Home & Furniture</Link></li>
            <li><Link to="/products?category=vehicles">Vehicles & Bikes</Link></li>
            <li><Link to="/products?category=sports-outdoors">Sports Gear</Link></li>
          </ul>
        </div>

        {/* Account Links */}
        <div className="footer-col">
          <h4>For Sellers & Buyers</h4>
          <ul className="footer-links">
            <li><Link to="/add-product">List a Product</Link></li>
            <li><Link to="/my-listings">My Dashboard</Link></li>
            <li><Link to="/favorites">Saved Favorites</Link></li>
            <li><Link to="/profile">Account Settings</Link></li>
          </ul>
        </div>

        {/* Trust & Help */}
        <div className="footer-col">
          <h4>Trust & Safety</h4>
          <ul className="footer-links">
            <li><a href="#safe-tips">Safety Guidelines</a></li>
            <li><a href="#buyer-protection">Buyer Protection</a></li>
            <li><a href="#selling-guide">Selling Tips</a></li>
            <li><a href="#contact">Help & Support</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} ReMarket Used Products Marketplace. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
