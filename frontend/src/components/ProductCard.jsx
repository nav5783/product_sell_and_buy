import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Calendar, Tag } from 'lucide-react';
import { getImageUrl } from '../services/api';

const ProductCard = ({ product, isFavorite: initialFavorite, onToggleFavorite }) => {
  const [isFav, setIsFav] = useState(initialFavorite || false);

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFav(!isFav);
    if (onToggleFavorite) {
      onToggleFavorite(product._id);
    }
  };

  const getConditionBadge = (cond) => {
    switch (cond) {
      case 'New': return 'badge-new';
      case 'Like New': return 'badge-likenew';
      case 'Good': return 'badge-good';
      case 'Fair': return 'badge-fair';
      default: return 'badge-good';
    }
  };

  const displayImage = product.images && product.images.length > 0
    ? getImageUrl(product.images[0])
    : 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&auto=format&fit=crop&q=80';

  const originalPrice = product.price || 0;
  const discount = product.discountPercent || 0;
  const finalPrice = originalPrice * (1 - discount / 100);

  const isOutOfStock = product.stockQuantity === 0;

  return (
    <div className="product-card">
      <div className="product-card-img-wrap">
        <Link to={`/products/${product._id}`}>
          <img src={displayImage} alt={product.title} className="product-card-img" />
        </Link>
        <button
          className={`product-fav-btn ${isFav ? 'active' : ''}`}
          onClick={handleFavoriteClick}
          title={isFav ? 'Remove from Favorites' : 'Save to Favorites'}
        >
          <Heart size={18} fill={isFav ? 'var(--accent-rose)' : 'none'} />
        </button>

        {discount > 0 && (
          <span
            className="badge badge-sold"
            style={{
              position: 'absolute',
              top: '0.75rem',
              left: '0.75rem',
              background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
              color: '#fff',
              fontWeight: 800,
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {discount}% OFF
          </span>
        )}
      </div>

      <div className="product-card-body">
        <div className="product-card-meta">
          <span className={`badge ${getConditionBadge(product.condition)}`}>
            {product.condition}
          </span>
          <span className={`badge ${isOutOfStock ? 'badge-sold' : 'badge-available'}`}>
            {isOutOfStock ? 'Out of Stock' : `In Stock: ${product.stockQuantity}`}
          </span>
        </div>

        <Link to={`/products/${product._id}`}>
          <h3 className="product-card-title">{product.title}</h3>
        </Link>

        {/* Pricing with Discount calculation */}
        <div className="product-card-price" style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span>₹{finalPrice.toFixed(2)}</span>
          {discount > 0 && (
            <span style={{ fontSize: '0.85rem', textDecoration: 'line-through', color: 'var(--text-muted)', fontWeight: 400 }}>
              ₹{originalPrice}
            </span>
          )}
        </div>

        <div className="product-card-footer">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <MapPin size={14} color="var(--primary)" />
            {product.location || 'Location undisclosed'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Tag size={14} />
            {product.category?.name || 'General'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
