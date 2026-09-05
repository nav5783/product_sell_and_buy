import React, { useEffect, useState } from 'react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { Heart } from 'lucide-react';

const Favorites = () => {
  const { showSuccess, showError } = useToast();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      const res = await api.get('/favorites');
      setFavorites(res.data);
    } catch (err) {
      console.error('Error loading favorites:', err);
      showError('Failed to load favorite products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleToggleFavorite = async (productId) => {
    try {
      const res = await api.post(`/favorites/${productId}`);
      setFavorites((prev) => prev.filter((p) => p._id !== productId));
      showSuccess('Item removed from favorites');
    } catch (err) {
      showError('Failed to update favorite status');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your saved products..." />;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Heart color="var(--accent-rose)" fill="var(--accent-rose)" size={30} /> My Saved Favorites
        </h1>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
          {favorites.length} saved product listings in your personal watchlist
        </p>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          title="Your favorites list is empty"
          description="Click the heart icon on any product card while browsing to save items here."
          actionText="Explore Products Catalog"
          actionLink="/products"
        />
      ) : (
        <div className="products-grid">
          {favorites.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              isFavorite={true}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
