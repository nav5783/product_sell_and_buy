import React, { useState } from 'react';
import { X, ShoppingCart, CheckCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getImageUrl } from '../services/api';

const CheckoutModal = ({ product, onClose, onPurchaseSuccess }) => {
  const { showSuccess, showError } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  if (!product) return null;

  const originalPrice = product.price || 0;
  const discount = product.discountPercent || 0;
  const unitPrice = originalPrice * (1 - discount / 100);
  const totalAmount = unitPrice * quantity;

  const handleCheckout = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onPurchaseSuccess(product._id, quantity);
    } catch (err) {
      showError(err.response?.data?.message || 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  const displayImage = product.images && product.images.length > 0
    ? getImageUrl(product.images[0])
    : 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&auto=format&fit=crop&q=80';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart color="var(--primary)" size={22} /> Order Checkout
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Product summary card */}
        <div style={{ display: 'flex', gap: '1rem', padding: '0.85rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
            <img src={displayImage} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', lineHeight: '1.3' }}>
              {product.title}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
              {discount > 0 ? (
                <>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                    ₹{unitPrice.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '0.82rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                    ₹{originalPrice}
                  </span>
                  <span className="badge badge-new" style={{ fontSize: '0.7rem' }}>
                    {discount}% OFF
                  </span>
                </>
              ) : (
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                  ₹{originalPrice}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              In Stock: {product.stockQuantity} items
            </p>
          </div>
        </div>

        <form onSubmit={handleCheckout}>
          <div className="form-group">
            <label>Select Quantity</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ width: '36px', height: '36px', padding: 0 }}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </button>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, minWidth: '30px', textAlign: 'center' }}>
                {quantity}
              </span>
              <button
                type="button"
                className="btn-secondary"
                style={{ width: '36px', height: '36px', padding: 0 }}
                onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
              >
                +
              </button>
            </div>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              <span>Item Subtotal ({quantity}x):</span>
              <span>₹{(originalPrice * quantity).toFixed(2)}</span>
            </div>

            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--accent-emerald)' }}>
                <span>Discount Saved ({discount}%):</span>
                <span>-₹{((originalPrice - unitPrice) * quantity).toFixed(2)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: '#fff', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.2rem' }}>
              <span>Total Payable Amount:</span>
              <span style={{ color: 'var(--accent-emerald)' }}>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={submitting}>
              <CheckCircle size={18} /> {submitting ? 'Processing...' : 'Confirm & Place Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutModal;
