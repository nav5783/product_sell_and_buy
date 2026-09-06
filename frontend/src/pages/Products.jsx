import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import ProductFilter from '../components/ProductFilter';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Extract filter parameters from URL
  const filters = {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    condition: searchParams.get('condition') || '',
    location: searchParams.get('location') || '',
    sort: searchParams.get('sort') || 'newest',
  };

  // Fetch categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products whenever filters or page change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        queryParams.set('page', page);
        queryParams.set('limit', 9);

        if (filters.search) queryParams.set('search', filters.search);
        if (filters.category) queryParams.set('category', filters.category);
        if (filters.minPrice) queryParams.set('minPrice', filters.minPrice);
        if (filters.maxPrice) queryParams.set('maxPrice', filters.maxPrice);
        if (filters.condition) queryParams.set('condition', filters.condition);
        if (filters.location) queryParams.set('location', filters.location);
        if (filters.sort) queryParams.set('sort', filters.sort);

        const [prodRes, favRes] = await Promise.all([
          api.get(`/products?${queryParams.toString()}`),
          localStorage.getItem('marketplace_token') ? api.get('/favorites') : Promise.resolve({ data: [] }),
        ]);

        setProducts(prodRes.data.products);
        setTotalPages(prodRes.data.pages);
        setTotalCount(prodRes.data.total);

        if (favRes.data) {
          setFavorites(favRes.data.map((p) => p._id));
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams, page]);

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // Reset to page 1 on filter update
    setPage(1);
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setPage(1);
    setSearchParams(new URLSearchParams());
  };

  const handleToggleFavorite = async (productId) => {
    try {
      const res = await api.post(`/favorites/${productId}`);
      if (res.data.isFavorite) {
        setFavorites((prev) => [...prev, productId]);
      } else {
        setFavorites((prev) => prev.filter((id) => id !== productId));
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
          Browse Marketplace Listings
        </h1>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
          Showing {totalCount} verified pre-owned products available for sale
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Left Filter Sidebar */}
        <aside>
          <ProductFilter
            filters={filters}
            categories={categories}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </aside>

        {/* Right Product Grid */}
        <main>
          {loading ? (
            <LoadingSpinner message="Filtering product listings..." />
          ) : products.length === 0 ? (
            <EmptyState
              title="No products match your criteria"
              description="Try clearing some filters or searching for a different keyword."
              actionText="Reset All Filters"
              onActionClick={handleResetFilters}
            />
          ) : (
            <>
              <div className="products-grid">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    isFavorite={favorites.includes(product._id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(newPage) => {
                  setPage(newPage);
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('page', newPage);
                  setSearchParams(newParams);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Products;
