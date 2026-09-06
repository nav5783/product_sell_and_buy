import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  ShoppingBag,
  Search,
  PlusCircle,
  Heart,
  User,
  LogOut,
  Shield,
  Tag,
  Grid,
  ChevronDown,
  ShoppingCart,
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <Link to={isAdmin ? '/admin' : '/'} className="nav-brand">
          <div className="nav-brand-icon">
            <ShoppingBag size={22} />
          </div>
          <span>ReMarket</span>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="nav-search">
          <Search size={18} className="nav-search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Navigation Links */}
        <div className="nav-links">
          {/* Browse Catalog Link (Available for Everyone) */}
          <Link
            to="/products"
            className={`nav-link ${location.pathname === '/products' ? 'active' : ''}`}
          >
            <Grid size={18} />
            <span>Browse Catalog</span>
          </Link>

          {/* Admin Dashboard Link (Admin Only) */}
          {isAdmin && (
            <Link
              to="/admin"
              className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
              style={{ color: '#f59e0b', fontWeight: 700 }}
            >
              <Shield size={18} />
              <span>Admin Dashboard</span>
            </Link>
          )}

          {/* Cart Icon Link - Shown for Users Only */}
          {!isAdmin && (
            <Link
              to="/cart"
              className={`nav-link ${location.pathname === '/cart' ? 'active' : ''}`}
              style={{ position: 'relative' }}
            >
              <ShoppingCart size={18} />
              <span>Cart</span>
              {cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: 'var(--accent-rose)',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {user && !isAdmin && (
            <Link
              to="/my-listings"
              className={`nav-link ${location.pathname === '/my-listings' ? 'active' : ''}`}
            >
              <Tag size={18} />
              <span>My Listings</span>
            </Link>
          )}

          {user && !isAdmin && (
            <Link
              to="/favorites"
              className={`nav-link ${location.pathname === '/favorites' ? 'active' : ''}`}
            >
              <Heart size={18} />
              <span>Favorites</span>
            </Link>
          )}

          {/* Sell Product Button for Logged-In Users */}
          {user && (
            <Link to="/add-product" className="btn-primary">
              <PlusCircle size={18} />
              <span>Sell Product</span>
            </Link>
          )}

          {/* User Profile Menu */}
          {user ? (
            <div className="user-menu">
              <button
                className="user-avatar-btn"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="avatar-circle">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} />
              </button>

              {showDropdown && (
                <div
                  className="dropdown-menu"
                  onMouseLeave={() => setShowDropdown(false)}
                >
                  <div style={{ padding: '0.5rem 0.85rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.2rem' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{user.name}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{user.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={() => setShowDropdown(false)}
                  >
                    <User size={16} />
                    <span>My Profile</span>
                  </Link>

                  {!isAdmin && (
                    <Link
                      to="/my-listings"
                      className="dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <Tag size={16} />
                      <span>My Listed Products</span>
                    </Link>
                  )}

                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="dropdown-item"
                      onClick={() => setShowDropdown(false)}
                      style={{ color: '#f59e0b' }}
                    >
                      <Shield size={16} />
                      <span>Admin Control Panel</span>
                    </Link>
                  )}

                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setShowDropdown(false);
                      logout();
                      navigate('/login');
                    }}
                    style={{ color: 'var(--accent-rose)' }}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" className="btn-secondary">
                Log In
              </Link>
              <Link to="/register" className="btn-primary">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
