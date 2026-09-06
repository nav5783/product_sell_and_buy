import React, { useState } from 'react';
import { X, Mail, Phone, MapPin, Send, ShieldCheck, User } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ContactSellerModal = ({ seller, productTitle, onClose }) => {
  const { showSuccess } = useToast();
  const [showPhone, setShowPhone] = useState(false);
  const [message, setMessage] = useState(`Hi ${seller?.name || 'Seller'}, I am interested in your item "${productTitle}". Is it still available?`);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    showSuccess('Your message has been sent to the seller!');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (!seller) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail color="var(--primary)" size={20} /> Contact Seller
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Seller Info Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
          <div className="avatar-circle" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>
            {seller.name ? seller.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {seller.name} <ShieldCheck size={16} color="var(--accent-emerald)" title="Verified User" />
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.1rem' }}>
              <MapPin size={13} /> {seller.location || 'Location undisclosed'}
            </p>
          </div>
        </div>

        {/* Contact direct buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <a
            href={`mailto:${seller.email}?subject=Inquiry regarding ${encodeURIComponent(productTitle)}`}
            className="btn-secondary"
            style={{ flex: 1, fontSize: '0.85rem' }}
          >
            <Mail size={16} /> Email Directly
          </a>

          {seller.phone ? (
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1, fontSize: '0.85rem' }}
              onClick={() => setShowPhone(!showPhone)}
            >
              <Phone size={16} color="var(--accent-emerald)" />
              {showPhone ? seller.phone : 'Show Phone Number'}
            </button>
          ) : (
            <button disabled className="btn-secondary" style={{ flex: 1, opacity: 0.5, fontSize: '0.85rem' }}>
              <Phone size={16} /> No Phone Listed
            </button>
          )}
        </div>

        {/* Direct Message Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Message to Seller</label>
            <textarea
              className="form-control"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={sent}>
              <Send size={16} /> {sent ? 'Message Sent!' : 'Send Inquiry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactSellerModal;
