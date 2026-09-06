import React, { useState } from 'react';
import { Star, X, ThumbsUp, MessageSquare, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const FeedbackModal = ({ productId, productName, onClose, onFeedbackSubmitted }) => {
  const { showSuccess, showError } = useToast();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('App Experience');
  const [comment, setComment] = useState('');
  const [recommended, setRecommended] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const categories = ['App Experience', 'Product Quality', 'Delivery & Pickup', 'Value for Money', 'Customer Support'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      return showError('Please write a brief comment describing your experience');
    }

    setSubmitting(true);
    try {
      const res = await api.post('/feedback', {
        productId: productId || null,
        rating,
        experienceCategory: category,
        comment,
        recommended,
      });

      showSuccess('Thank you! Your feedback has been recorded.');
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(res.data);
      }
      onClose();
    } catch (err) {
      showError('Failed to submit feedback review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star color="#f59e0b" fill="#f59e0b" size={22} /> Amazon/Flipkart Style Feedback
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          How was your experience buying {productName ? `"${productName}"` : 'on ReMarket Marketplace'}?
        </p>

        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div className="form-group" style={{ alignItems: 'center', textAlign: 'center', marginBottom: '1.5rem' }}>
            <label>Rate Your Experience</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.15s' }}
                  >
                    <Star
                      size={32}
                      color={isActive ? '#f59e0b' : 'var(--text-dim)'}
                      fill={isActive ? '#f59e0b' : 'none'}
                    />
                  </button>
                );
              })}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-amber)', fontWeight: 700, marginTop: '0.4rem' }}>
              {rating === 5 && '⭐⭐⭐⭐⭐ Exceptional (5/5)'}
              {rating === 4 && '⭐⭐⭐⭐ Very Good (4/5)'}
              {rating === 3 && '⭐⭐⭐ Average (3/5)'}
              {rating === 2 && '⭐⭐ Below Average (2/5)'}
              {rating === 1 && '⭐ Poor (1/5)'}
            </span>
          </div>

          {/* Experience Category Selector Chips */}
          <div className="form-group">
            <label>Primary Feedback Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.3rem' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={category === cat ? 'btn-primary' : 'btn-secondary'}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)' }}
                >
                  {category === cat && <Check size={14} />} {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label>Detailed Comments & Feedback *</label>
            <textarea
              className="form-control"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>

          {/* Recommend checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: '#fff', cursor: 'pointer', marginBottom: '1.5rem' }}>
            <input
              type="checkbox"
              checked={recommended}
              onChange={(e) => setRecommended(e.target.checked)}
              style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
            />
            I would recommend this application to friends and family
          </label>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Skip
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={submitting}>
              <ThumbsUp size={16} /> {submitting ? 'Submitting...' : 'Submit Feedback Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
