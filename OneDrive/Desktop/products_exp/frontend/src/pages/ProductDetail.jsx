import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import CheckoutModal from '../components/CheckoutModal';
import FeedbackModal from '../components/FeedbackModal';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Heart,
  MapPin,
  Calendar,
  Eye,
  ShoppingCart,
  Star,
  Edit,
  Trash2,
  Tag,
  ArrowLeft,
  MessageSquare,
  PlusCircle,
  Shield,
} from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { addToCart } = useCart();
  const { showSuccess, showError } = useToast();

  const [product, setProduct] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchProductAndFeedback = async () => {
    try {
      const [prodRes, feedRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get(`/feedback?productId=${id}`),
      ]);
      setProduct(prodRes.data);
      setFeedbacks(feedRes.data);

      if (localStorage.getItem('marketplace_token')) {
        try {
          const favRes = await api.get(`/favorites/check/${id}`);
          setIsFavorite(favRes.data.isFavorite);
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error loading product:', err);
      showError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductAndFeedback();
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!user) return navigate('/login');
    try {
      const res = await api.post(`/favorites/${id}`);
      setIsFavorite(res.data.isFavorite);
      showSuccess(res.data.message);
    } catch (err) {
      showError('Failed to update favorite status');
    }
  };

  const handleAddToCart = () => {
    addToCart(product, 1);
    showSuccess(`Added "${product.title}" to Cart!`);
  };

  const handlePurchaseSuccess = async (productId, quantity) => {
    try {
      const res = await api.post(`/products/${productId}/buy`, { quantity });
      showSuccess(res.data.message);
      setShowCheckoutModal(false);
      fetchProductAndFeedback();

      setTimeout(() => {
        setShowFeedbackModal(true);
      }, 500);
    } catch (err) {
      showError(err.response?.data?.message || 'Purchase failed');
    }
  };

  const handleDeleteProduct = async () => {
    try {
      await api.delete(`/products/${id}`);
      showSuccess('Product deleted successfully');
      navigate('/products');
    } catch (err) {
      showError('Failed to delete product');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading product listing & reviews..." />;
  }

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Product Not Found</h2>
        <Link to="/products" className="btn-primary" style={{ marginTop: '1rem' }}>
          Back to Catalog
        </Link>
      </div>
    );
  }

  const isOwnerOrAdmin = user && (user._id === product.seller?._id || isAdmin);

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&auto=format&fit=crop&q=80'];

  const originalPrice = product.price || 0;
  const discount = product.discountPercent || 0;
  const finalPrice = originalPrice * (1 - discount / 100);
  const isOutOfStock = product.stockQuantity === 0;

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : '5.0';

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="btn-secondary"
        style={{ marginBottom: '1.5rem', padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
        {/* Left: Gallery */}
        <div>
          <div className="glass-card" style={{ padding: '0.5rem', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '1rem', position: 'relative' }}>
            {discount > 0 && (
              <span
                className="badge badge-sold"
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  left: '1.25rem',
                  fontSize: '0.85rem',
                  background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                  color: '#fff',
                  fontWeight: 800,
                  zIndex: 5,
                }}
              >
                SPECIAL DEAL: {discount}% OFF
              </span>
            )}
            <div style={{ width: '100%', height: '420px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#0f172a' }}>
              <img
                src={getImageUrl(images[selectedImgIndex])}
                alt={product.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>

          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImgIndex(idx)}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: selectedImgIndex === idx ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    opacity: selectedImgIndex === idx ? 1 : 0.6,
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <img src={getImageUrl(img)} alt={`Thumb ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details & Buying Options */}
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span className="badge badge-good">
              Condition: {product.condition}
            </span>
            <span className={`badge ${isOutOfStock ? 'badge-sold' : 'badge-available'}`}>
              {isOutOfStock ? 'Out of Stock' : `In Stock: ${product.stockQuantity} items`}
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.1rem', fontWeight: 800, color: '#fff', lineHeight: '1.25', marginBottom: '0.75rem' }}>
            {product.title}
          </h1>

          {/* Ratings Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', color: '#f59e0b' }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="#f59e0b" />
              ))}
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{avgRating}</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              ({feedbacks.length} Reviews)
            </span>
          </div>

          {/* Price in Rupees */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
              ₹{finalPrice.toFixed(2)}
            </span>
            {discount > 0 && (
              <span style={{ fontSize: '1.2rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                ₹{originalPrice}
              </span>
            )}

            <button
              onClick={handleToggleFavorite}
              className={`btn-secondary ${isFavorite ? 'active' : ''}`}
              style={{
                marginLeft: 'auto',
                borderRadius: 'var(--radius-full)',
                borderColor: isFavorite ? 'var(--accent-rose)' : 'var(--border-color)',
                color: isFavorite ? 'var(--accent-rose)' : 'var(--text-main)',
              }}
            >
              <Heart size={18} fill={isFavorite ? 'var(--accent-rose)' : 'none'} />
              {isFavorite ? 'Saved' : 'Save'}
            </button>
          </div>

          {/* Action Row: ADD TO CART & BUY NOW (Regular Users Only) */}
          {!isAdmin ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {!isOutOfStock ? (
                <>
                  <button
                    onClick={handleAddToCart}
                    className="btn-secondary"
                    style={{ padding: '0.85rem', fontSize: '1rem', fontWeight: 700 }}
                  >
                    <PlusCircle size={20} /> Add to Cart
                  </button>
                  <button
                    onClick={() => {
                      if (!user) return navigate('/login');
                      setShowCheckoutModal(true);
                    }}
                    className="btn-primary"
                    style={{ padding: '0.85rem', fontSize: '1rem', background: 'linear-gradient(135deg, var(--accent-emerald), #059669)' }}
                  >
                    <ShoppingCart size={20} /> Buy Now
                  </button>
                </>
              ) : (
                <button disabled className="btn-secondary" style={{ gridColumn: 'span 2', padding: '0.85rem', opacity: 0.5, fontSize: '1rem' }}>
                  Out of Stock
                </button>
              )}
            </div>
          ) : (
            <div style={{ padding: '0.85rem 1.25rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', color: '#f59e0b', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} /> Admin Mode: Inventory & Price Control Active
            </div>
          )}

          {/* Meta Info Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2rem', fontSize: '0.85rem', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '0.85rem 1.2rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Tag size={15} color="var(--primary)" /> {product.category?.name || 'General'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={15} color="var(--primary)" /> {product.location}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={15} /> {new Date(product.createdAt).toLocaleDateString()}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Eye size={15} /> {product.viewsCount} views
            </span>
          </div>

          {/* Seller Details Card */}
          <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
              👤 Seller Information & Listing Rights
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 600 }}>
              Sold & Listed by: {product.seller?.name || 'Verified Marketplace User'}
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Email: {product.seller?.email || 'Undisclosed'}
            </p>
            {product.seller?.phone && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Phone: {product.seller.phone}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
              Description
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
              {product.description}
            </p>
          </div>

          {/* Admin Controls */}
          {isOwnerOrAdmin && (
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '1.2rem', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                ⚙️ Admin & Inventory Controls
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                <Link to={`/edit-product/${product._id}`} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                  <Edit size={16} /> Edit Product & Discount
                </Link>

                <button onClick={() => setShowDeleteModal(true)} className="btn-danger" style={{ marginLeft: 'auto' }}>
                  <Trash2 size={16} /> Remove Product
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Reviews & Feedback Section */}
      <section className="glass-card" style={{ padding: '2rem', marginTop: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare color="var(--primary)" size={24} /> Verified Customer Reviews
            </h2>
          </div>

          {user && (
            <button onClick={() => setShowFeedbackModal(true)} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
              <Star size={16} color="#f59e0b" /> Write Review
            </button>
          )}
        </div>

        {feedbacks.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '1.5rem 0' }}>
            No customer feedback posted yet for this product.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {feedbacks.map((fb) => (
              <div key={fb._id} style={{ background: 'var(--bg-primary)', padding: '1.1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div className="avatar-circle" style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>
                      {fb.user?.name ? fb.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{fb.user?.name || 'Verified Buyer'}</span>
                  </div>

                  <div style={{ display: 'flex', color: '#f59e0b' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < fb.rating ? '#f59e0b' : 'none'} color={i < fb.rating ? '#f59e0b' : 'var(--text-dim)'} />
                    ))}
                  </div>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  "{fb.comment}"
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <CheckoutModal
          product={product}
          onClose={() => setShowCheckoutModal(false)}
          onPurchaseSuccess={handlePurchaseSuccess}
        />
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          productId={product._id}
          productName={product.title}
          onClose={() => setShowFeedbackModal(false)}
          onFeedbackSubmitted={(newFb) => setFeedbacks([newFb, ...feedbacks])}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Remove Product?"
        message={`Are you sure you want to remove "${product.title}" permanently?`}
        confirmText="Remove"
        isDanger={true}
        onConfirm={handleDeleteProduct}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

export default ProductDetail;
