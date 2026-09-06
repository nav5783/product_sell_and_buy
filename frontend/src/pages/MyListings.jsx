import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import {
  Tag,
  CheckCircle,
  Edit,
  Trash2,
  PlusCircle,
  Eye,
} from 'lucide-react';

const MyListings = () => {
  const { showSuccess, showError } = useToast();
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ totalListings: 0, availableCount: 0, soldCount: 0 });
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchMyListings = async () => {
    try {
      const res = await api.get('/products/user/my-listings');
      setProducts(res.data.products);
      setStats(res.data.stats);
    } catch (err) {
      console.error('Error fetching user listings:', err);
      showError('Failed to fetch your product listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, []);

  const handleDelete = async () => {
    if (!selectedProduct) return;
    try {
      await api.delete(`/products/${selectedProduct._id}`);
      showSuccess('Listing deleted');
      setShowDeleteModal(false);
      setSelectedProduct(null);
      fetchMyListings();
    } catch (err) {
      showError('Failed to delete listing');
    }
  };

  const filteredProducts = products.filter((p) => {
    if (activeTab === 'available') return p.stockQuantity > 0;
    if (activeTab === 'sold') return p.stockQuantity === 0;
    return true;
  });

  const totalValue = products.reduce((acc, p) => acc + (p.price || 0) * (p.stockQuantity || 1), 0);

  if (loading) {
    return <LoadingSpinner message="Loading product listings..." />;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
            My Inventory Listings
          </h1>
        </div>

        <Link to="/add-product" className="btn-primary">
          <PlusCircle size={18} /> Add New Item
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total Items Listed</span>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
            {stats.totalListings}
          </h3>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--accent-emerald)' }}>Active & Available</span>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.2rem' }}>
            {stats.availableCount}
          </h3>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--accent-rose)' }}>Out of Stock</span>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-rose)', marginTop: '0.2rem' }}>
            {stats.soldCount}
          </h3>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)' }}>Total Stock Value</span>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>
            ₹{totalValue.toLocaleString()}
          </h3>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <button
          className={activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
          onClick={() => setActiveTab('all')}
        >
          All Listings ({stats.totalListings})
        </button>
        <button
          className={activeTab === 'available' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
          onClick={() => setActiveTab('available')}
        >
          Available ({stats.availableCount})
        </button>
        <button
          className={activeTab === 'sold' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
          onClick={() => setActiveTab('sold')}
        >
          Out of Stock ({stats.soldCount})
        </button>
      </div>

      {filteredProducts.length === 0 ? (
        <EmptyState
          title="No product listings found"
          description="Add products to your inventory catalog."
          actionText="Create Listing"
          actionLink="/add-product"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredProducts.map((p) => {
            const displayImg = p.images && p.images.length > 0 ? getImageUrl(p.images[0]) : '';
            return (
              <div
                key={p._id}
                className="glass-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  padding: '1rem 1.25rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ width: '90px', height: '90px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, background: '#0f172a' }}>
                  <img src={displayImg} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span className={`badge ${p.stockQuantity === 0 ? 'badge-sold' : 'badge-available'}`}>
                      {p.stockQuantity === 0 ? 'Out of Stock' : `Stock: ${p.stockQuantity}`}
                    </span>
                    <span className="badge badge-good">{p.condition}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: 'auto' }}>
                      <Eye size={14} /> {p.viewsCount} views
                    </span>
                  </div>

                  <Link to={`/products/${p._id}`}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                      {p.title}
                    </h3>
                  </Link>

                  <p style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.2rem' }}>
                    ₹{p.price?.toLocaleString()}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Link
                    to={`/edit-product/${p._id}`}
                    className="btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                  >
                    <Edit size={16} /> Edit
                  </Link>

                  <button
                    onClick={() => {
                      setSelectedProduct(p);
                      setShowDeleteModal(true);
                    }}
                    className="btn-danger"
                    style={{ padding: '0.45rem 0.85rem' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Listing?"
        message={selectedProduct ? `Remove "${selectedProduct.title}" permanently?` : ''}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

export default MyListings;
