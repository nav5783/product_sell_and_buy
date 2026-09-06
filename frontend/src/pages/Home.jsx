import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Search,
  PlusCircle,
  TrendingUp,
  ArrowRight,
  Smartphone,
  Car,
  Armchair,
  Shirt,
  BookOpen,
  Tv,
  Dumbbell,
  Tag,
} from 'lucide-react';

const categoryIcons = {
  Smartphone: <Smartphone size={24} />,
  Car: <Car size={24} />,
  Armchair: <Armchair size={24} />,
  Shirt: <Shirt size={24} />,
  BookOpen: <BookOpen size={24} />,
  Tv: <Tv size={24} />,
  Dumbbell: <Dumbbell size={24} />,
};

const Home = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products/featured'),
        ]);

        setCategories(catRes.data);
        setFeaturedProducts(prodRes.data);

        const token = localStorage.getItem('marketplace_token');
        if (token) {
          try {
            const favRes = await api.get('/favorites');
            setFavorites(favRes.data.map((p) => p._id));
          } catch (e) {}
        }
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleToggleFavorite = async (productId) => {
    try {
      const res = await api.post(`/favorites/${productId}`);
      if (res.data.isFavorite) {
        setFavorites((prev) => [...prev, productId]);
      } else {
        setFavorites((prev) => prev.filter((id) => id !== productId));
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading marketplace..." />;
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <h1 className="hero-title">Buy & Sell Pre-Owned Items Instantly</h1>
        <p className="hero-subtitle">
          Discover verified deals on electronics, vehicles, furniture, fashion & books in Indian Rupees (₹).
        </p>

        {/* Hero Search Box */}
        <form onSubmit={handleSearchSubmit} className="hero-search-box">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.4rem' }}>
            <Search size={18} /> Search
          </button>
        </form>

        {/* Quick Action Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/products" className="btn-secondary" style={{ borderRadius: '9999px', fontSize: '0.85rem' }}>
            <TrendingUp size={16} color="var(--primary)" /> Browse Product Catalog
          </Link>
          <Link to="/add-product" className="btn-primary" style={{ borderRadius: '9999px', fontSize: '0.85rem' }}>
            <PlusCircle size={16} /> Add Product
          </Link>
        </div>

        {/* Stats */}
        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-number">10,000+</span>
            <span className="stat-label">Active Users</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">₹25 Lakhs+</span>
            <span className="stat-label">Transactions Processed</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">100%</span>
            <span className="stat-label">Verified Listings</span>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800 }}>
              Browse Categories
            </h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1.25rem' }}>
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={`/products?category=${cat.slug}`}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '1.5rem 1rem',
                gap: '0.75rem',
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {categoryIcons[cat.icon] || <Tag size={24} />}
              </div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{cat.name}</h4>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {cat.productCount || 0} Listed
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800 }}>
              Featured & Fresh Items
            </h2>
          </div>

          <Link to="/products" className="btn-secondary" style={{ fontSize: '0.88rem' }}>
            View All Catalog <ArrowRight size={16} />
          </Link>
        </div>

        <div className="products-grid">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              isFavorite={favorites.includes(product._id)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
