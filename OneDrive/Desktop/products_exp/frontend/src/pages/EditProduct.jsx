import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import ImageUploader from '../components/ImageUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import { Edit, MapPin, Package, Percent } from 'lucide-react';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [condition, setCondition] = useState('Good');
  const [location, setLocation] = useState('');

  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get('/categories'),
          api.get(`/products/${id}`),
        ]);

        setCategories(catRes.data);
        const prod = prodRes.data;

        setTitle(prod.title);
        setDescription(prod.description);
        setCategory(prod.category?._id || prod.category);
        setPrice(prod.price);
        setDiscountPercent(prod.discountPercent || '0');
        setStockQuantity(prod.stockQuantity !== undefined ? prod.stockQuantity : '10');
        setCondition(prod.condition);
        setLocation(prod.location);
        setExistingImages(prod.images || []);
      } catch (err) {
        console.error('Error loading listing data:', err);
        showError('Failed to fetch listing for editing');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (existingImages.length === 0 && newFiles.length === 0) {
      return showError('Product must have at least one image');
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('price', price);
      formData.append('discountPercent', discountPercent);
      formData.append('stockQuantity', stockQuantity);
      formData.append('condition', condition);
      formData.append('location', location);

      existingImages.forEach((img) => {
        formData.append('existingImages', img);
      });

      newFiles.forEach((file) => {
        formData.append('images', file);
      });

      await api.put(`/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      showSuccess('Product updated successfully!');
      navigate(`/products/${id}`);
    } catch (err) {
      console.error('Error updating product:', err);
      showError(err.response?.data?.message || 'Failed to update listing');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading product data..." />;
  }

  return (
    <div style={{ maxWidth: '720px', margin: '2rem auto' }}>
      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Edit color="var(--primary)" size={28} /> Edit Product Listing
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Update product title, pricing, stock levels, discount rates or photos
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Image Uploader */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label>Manage Photos</label>
            <ImageUploader
              existingImages={existingImages}
              onExistingImagesChange={setExistingImages}
              newFiles={newFiles}
              onNewFilesChange={setNewFiles}
              maxImages={5}
            />
          </div>

          {/* Title */}
          <div className="form-group">
            <label>Product Title *</label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Category & Condition */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Category *</label>
              <select
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Condition *</label>
              <select
                className="form-control"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                required
              >
                <option value="New">Brand New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
          </div>

          {/* Price, Discount & Stock Quantity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Original Price (₹ INR) *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 700 }}>
                  ₹
                </span>
                <input
                  type="number"
                  className="form-control"
                  style={{ paddingLeft: '2.2rem' }}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Discount (% Off)</label>
              <div style={{ position: 'relative' }}>
                <Percent size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-rose)' }} />
                <input
                  type="number"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Stock Quantity *</label>
              <div style={{ position: 'relative' }}>
                <Package size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                <input
                  type="number"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="form-group">
            <label>Location *</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '2.6rem' }}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label>Item Description *</label>
            <textarea
              className="form-control"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1 }}
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 2 }}
              disabled={submitting}
            >
              {submitting ? 'Saving Changes...' : 'Save Product Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
