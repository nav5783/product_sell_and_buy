import React from 'react';
import { RotateCcw, Search, MapPin, SlidersHorizontal } from 'lucide-react';

const ProductFilter = ({ filters, categories, onFilterChange, onReset }) => {
  const conditions = ['New', 'Like New', 'Good', 'Fair'];

  const handleConditionToggle = (cond) => {
    const current = filters.condition ? filters.condition.split(',') : [];
    let updated;
    if (current.includes(cond)) {
      updated = current.filter((c) => c !== cond);
    } else {
      updated = [...current, cond];
    }
    onFilterChange('condition', updated.join(','));
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SlidersHorizontal size={18} color="var(--primary)" /> Filter Products
        </h3>
        <button onClick={onReset} className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {/* Search Filter */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Keyword Search</label>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.4rem' }}
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
          />
        </div>
      </div>

      {/* Category Dropdown */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Category</label>
        <select
          className="form-control"
          value={filters.category || ''}
          onChange={(e) => onFilterChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat.slug}>
              {cat.name} ({cat.productCount || 0})
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Price Range ($)</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <input
            type="number"
            className="form-control"
            value={filters.minPrice || ''}
            onChange={(e) => onFilterChange('minPrice', e.target.value)}
          />
          <input
            type="number"
            className="form-control"
            value={filters.maxPrice || ''}
            onChange={(e) => onFilterChange('maxPrice', e.target.value)}
          />
        </div>
      </div>

      {/* Condition Checkboxes */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Condition</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.2rem' }}>
          {conditions.map((cond) => {
            const isSelected = filters.condition ? filters.condition.split(',').includes(cond) : false;
            return (
              <label
                key={cond}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  color: isSelected ? '#fff' : 'var(--text-muted)',
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleConditionToggle(cond)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                {cond}
              </label>
            );
          })}
        </div>
      </div>

      {/* Location */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Location / City</label>
        <div style={{ position: 'relative' }}>
          <MapPin size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.4rem' }}
            value={filters.location || ''}
            onChange={(e) => onFilterChange('location', e.target.value)}
          />
        </div>
      </div>

      {/* Sort By */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Sort Listings By</label>
        <select
          className="form-control"
          value={filters.sort || 'newest'}
          onChange={(e) => onFilterChange('sort', e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="popular">Most Popular</option>
          <option value="discount">Highest Discount %</option>
        </select>
      </div>
    </div>
  );
};

export default ProductFilter;
