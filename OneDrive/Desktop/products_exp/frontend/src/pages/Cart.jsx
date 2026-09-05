import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getImageUrl } from '../services/api';
import CheckoutModal from '../components/CheckoutModal';
import FeedbackModal from '../components/FeedbackModal';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import { ShoppingCart, Trash2, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const { user, isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [purchasedProduct, setPurchasedProduct] = useState(null);

  if (isAdmin) {
    return (
      <div style={{ maxWidth: '800px', margin: '3rem auto' }}>
        <EmptyState
          title="Admin Access - Inventory & Sales Mode"
          description="Shopping cart checkout is designed for customer accounts. Use the Admin Control Panel to manage stock quantities, discounts, and sales analytics."
          actionText="Go to Admin Dashboard"
          actionLink="/admin"
        />
      </div>
    );
  }

  const handleCheckoutSingle = (product) => {
    if (!user) {
      return navigate('/login');
    }
    setCheckoutProduct(product);
  };

  const handlePurchaseSuccess = async (productId, quantity) => {
    try {
      const res = await api.post(`/products/${productId}/buy`, { quantity });
      showSuccess(res.data.message);

      // Remove purchased item from cart
      removeFromCart(productId);
      const itemInCart = cart.find((i) => i.product._id === productId);
      setPurchasedProduct(itemInCart?.product || null);

      setCheckoutProduct(null);

      // Open Feedback Review modal
      setTimeout(() => {
        setShowFeedbackModal(true);
      }, 500);
    } catch (err) {
      showError(err.response?.data?.message || 'Checkout failed');
    }
  };

  if (cart.length === 0) {
    return (
      <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShoppingCart size={28} color="var(--primary)" /> Shopping Cart
        </h1>
        <EmptyState
          title="Your Shopping Cart is Empty"
          description="Explore our marketplace catalog to discover products and add them to your cart."
          actionText="Browse Products"
          actionLink="/products"
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShoppingCart size={28} color="var(--primary)" /> Shopping Cart ({cart.length} items)
        </h1>
        <button onClick={clearCart} className="btn-secondary" style={{ fontSize: '0.82rem' }}>
          Clear Cart
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
        {/* Cart Item List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cart.map(({ product, quantity }) => {
            const displayImg = product.images && product.images.length > 0 ? getImageUrl(product.images[0]) : '';
            const originalPrice = product.price || 0;
            const discount = product.discountPercent || 0;
            const finalUnitPrice = originalPrice * (1 - discount / 100);
            const itemTotal = finalUnitPrice * quantity;

            return (
              <div
                key={product._id}
                className="glass-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  padding: '1.2rem',
                  flexWrap: 'wrap',
                }}
              >
                {/* Thumbnail */}
                <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, background: '#0f172a' }}>
                  <img src={displayImg} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span className="badge badge-good">{product.condition}</span>
                    {discount > 0 && <span className="badge badge-sold">{discount}% OFF</span>}
                  </div>
                  <Link to={`/products/${product._id}`}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                      {product.title}
                    </h3>
                  </Link>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Unit Price: <strong style={{ color: 'var(--accent-emerald)' }}>₹{finalUnitPrice.toFixed(2)}</strong>
                    {discount > 0 && <span style={{ textDecoration: 'line-through', marginLeft: '0.4rem' }}>₹{originalPrice}</span>}
                  </p>
                </div>

                {/* Quantity modifier */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => updateQuantity(product._id, quantity - 1)}
                    className="btn-secondary"
                    style={{ width: '32px', height: '32px', padding: 0 }}
                  >
                    -
                  </button>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', minWidth: '24px', textAlign: 'center' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(product._id, quantity + 1)}
                    className="btn-secondary"
                    style={{ width: '32px', height: '32px', padding: 0 }}
                  >
                    +
                  </button>
                </div>

                {/* Item Total in Rupees */}
                <div style={{ textAlign: 'right', minWidth: '100px' }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                    ₹{itemTotal.toFixed(2)}
                  </span>
                </div>

                {/* Action controls */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleCheckoutSingle(product)}
                    className="btn-primary"
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                  >
                    Buy Item
                  </button>
                  <button
                    onClick={() => removeFromCart(product._id)}
                    className="btn-danger"
                    style={{ padding: '0.4rem 0.6rem' }}
                    title="Remove item from cart"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary Side Card */}
        <div className="glass-card" style={{ padding: '1.5rem', position: 'sticky', top: '90px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            Order Summary
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Items:</span>
              <strong style={{ color: '#fff' }}>{cart.length} item(s)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Grand Total:</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                ₹{cartTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              if (cart.length > 0) {
                handleCheckoutSingle(cart[0].product);
              }
            }}
            className="btn-primary"
            style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem' }}
          >
            <CheckCircle size={18} /> Checkout Items
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {checkoutProduct && (
        <CheckoutModal
          product={checkoutProduct}
          onClose={() => setCheckoutProduct(null)}
          onPurchaseSuccess={handlePurchaseSuccess}
        />
      )}

      {/* Post Purchase Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          productId={purchasedProduct?._id}
          productName={purchasedProduct?.title}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}
    </div>
  );
};

export default Cart;
