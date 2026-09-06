import React, { useEffect, useState } from 'react';
import api, { getImageUrl } from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmModal from '../components/ConfirmModal';
import {
  Shield,
  Users,
  Package,
  CheckCircle,
  Tag,
  Ban,
  Trash2,
  Plus,
  Eye,
  Activity,
  TrendingUp,
  Star,
  Edit,
  Save,
  ShoppingBag,
  X,
} from 'lucide-react';

const AdminDashboard = () => {
  const { showSuccess, showError } = useToast();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(true);

  // User activity detail modal state
  const [selectedUserActivity, setSelectedUserActivity] = useState(null);

  // Category creation form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Tag');

  // Inline stock & discount editor state
  const [editingStockId, setEditingStockId] = useState(null);
  const [stockInput, setStockInput] = useState('');
  const [discountInput, setDiscountInput] = useState('');

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, prodRes, catRes, feedRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/products?status=all&limit=50'),
        api.get('/categories'),
        api.get('/feedback'),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setProducts(prodRes.data.products);
      setCategories(catRes.data);
      setFeedbacks(feedRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      showError('Failed to fetch admin dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleQuickStockDiscountSave = async (productId) => {
    try {
      await api.patch(`/admin/products/${productId}/stock-discount`, {
        stockQuantity: Number(stockInput),
        discountPercent: Number(discountInput),
      });
      showSuccess('Stock & Discount updated!');
      setEditingStockId(null);
      fetchAdminData();
    } catch (err) {
      showError('Failed to update stock or discount');
    }
  };

  const handleToggleUserBlock = async (userId) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/block`);
      showSuccess(res.data.message);
      fetchAdminData();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (user) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete User "${user.name}"?`,
      message: `This will delete user account (${user.email}) and ALL their data permanently.`,
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${user._id}`);
          showSuccess('User account removed');
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          fetchAdminData();
        } catch (err) {
          showError('Failed to remove user');
        }
      },
    });
  };

  const handleDeleteProduct = async (product) => {
    setConfirmModal({
      isOpen: true,
      title: `Remove Product "${product.title}"?`,
      message: `As admin, you are removing this product listing from inventory.`,
      onConfirm: async () => {
        try {
          await api.delete(`/products/${product._id}`);
          showSuccess('Product removed by admin');
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          fetchAdminData();
        } catch (err) {
          showError('Failed to remove product');
        }
      },
    });
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return showError('Category name is required');
    try {
      await api.post('/categories', {
        name: newCatName,
        description: newCatDesc,
        icon: newCatIcon,
      });
      showSuccess(`Category "${newCatName}" created!`);
      setNewCatName('');
      setNewCatDesc('');
      fetchAdminData();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (cat) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete Category "${cat.name}"?`,
      message: `Delete this category if no products are assigned to it.`,
      onConfirm: async () => {
        try {
          await api.delete(`/categories/${cat._id}`);
          showSuccess('Category deleted');
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          fetchAdminData();
        } catch (err) {
          showError(err.response?.data?.message || 'Failed to delete category');
        }
      },
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading Admin Dashboard & Analytics..." />;
  }

  const monthlyRev = stats?.monthlySales?.totalRevenue || 0;
  const monthlyOrders = stats?.monthlySales?.orderCount || 0;
  const yearlyRev = stats?.yearlySales?.totalRevenue || 0;
  const yearlyOrders = stats?.yearlySales?.orderCount || 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Shield color="#f59e0b" size={30} /> Admin Dashboard & User Monitoring
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
            Monitor sales revenue, user purchasing activity, stock levels & product discounts
          </p>
        </div>

        <a href="/add-product" className="btn-primary">
          <Plus size={18} /> Add New Product
        </a>
      </div>

      {/* Monthly & Yearly Sales Analytics in Rupees */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-emerald)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--accent-emerald)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            📈 This Month Sales (Rupees)
          </span>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.2rem' }}>
            ₹{monthlyRev.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {monthlyOrders} order(s) this month
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-cyan)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            📊 This Year Sales (Rupees)
          </span>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>
            ₹{yearlyRev.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {yearlyOrders} order(s) this year
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            📦 Inventory Products
          </span>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
            {stats?.totalProducts || 0}
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {stats?.availableProducts || 0} in-stock • {stats?.soldProducts || 0} out of stock
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <span style={{ fontSize: '0.82rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            👥 Registered Users
          </span>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
            {stats?.totalUsers || 0}
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {stats?.totalFeedbackCount || 0} customer reviews
          </p>
        </div>
      </div>

      {/* Admin Tab Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button
          className={activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.45rem 1rem', fontSize: '0.88rem' }}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp size={16} /> Sales & Behavior Analytics
        </button>
        <button
          className={activeTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.45rem 1rem', fontSize: '0.88rem' }}
          onClick={() => setActiveTab('inventory')}
        >
          <Package size={16} /> Products & Discounts ({products.length})
        </button>
        <button
          className={activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.45rem 1rem', fontSize: '0.88rem' }}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} /> User Monitoring & Activity ({users.length})
        </button>
        <button
          className={activeTab === 'feedback' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.45rem 1rem', fontSize: '0.88rem' }}
          onClick={() => setActiveTab('feedback')}
        >
          <Star size={16} color="#f59e0b" /> Customer Feedback ({feedbacks.length})
        </button>
        <button
          className={activeTab === 'categories' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.45rem 1rem', fontSize: '0.88rem' }}
          onClick={() => setActiveTab('categories')}
        >
          <Tag size={16} /> Categories ({categories.length})
        </button>
      </div>

      {/* Tab 1: Sales Analytics */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
              Monthly Sales Performance (Rupees)
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Monitors user purchasing behavior and monthly revenue trends
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '0.5rem', alignItems: 'flex-end', height: '180px', paddingTop: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              {stats?.salesChartData?.map((item) => {
                const maxRev = Math.max(...stats.salesChartData.map((d) => d.revenue), 1000);
                const heightPercent = Math.min(100, Math.max(15, (item.revenue / maxRev) * 100));
                return (
                  <div key={item.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div
                      style={{
                        width: '100%',
                        height: `${heightPercent}%`,
                        background: item.revenue > 0 ? 'linear-gradient(180deg, var(--accent-emerald), var(--primary))' : 'var(--bg-surface)',
                        borderRadius: '4px 4px 0 0',
                      }}
                      title={`${item.month}: ₹${item.revenue.toFixed(2)} (${item.orders} orders)`}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
              Recent Completed Orders
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats?.recentOrders?.length === 0 ? (
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No completed orders yet.</p>
              ) : (
                stats?.recentOrders?.map((order) => (
                  <div key={order._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <h4 style={{ color: '#fff', fontSize: '0.92rem', fontWeight: 600 }}>{order.product?.title || 'Purchased Product'}</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Buyer: {order.user?.name || 'User'} ({order.user?.email}) • Qty: {order.quantity}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                        ₹{order.totalAmount?.toFixed(2)}
                      </span>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Inventory & Discounts */}
      {activeTab === 'inventory' && (
        <div className="glass-card" style={{ overflowX: 'auto', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.5rem 1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              Manage Stock Quantity & Discount Rates
            </h3>
            <a href="/add-product" className="btn-primary" style={{ fontSize: '0.82rem' }}>
              <Plus size={16} /> Add Product
            </a>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.85rem' }}>Product Title</th>
                <th style={{ padding: '0.85rem' }}>Original Price</th>
                <th style={{ padding: '0.85rem' }}>Discount %</th>
                <th style={{ padding: '0.85rem' }}>Stock Qty</th>
                <th style={{ padding: '0.85rem' }}>Final Price</th>
                <th style={{ padding: '0.85rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const discount = p.discountPercent || 0;
                const finalP = p.price * (1 - discount / 100);
                const isEditing = editingStockId === p._id;

                return (
                  <tr key={p._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.85rem' }}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{p.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.category?.name || 'General'}</div>
                    </td>

                    <td style={{ padding: '0.85rem', color: '#fff', fontWeight: 600 }}>
                      ₹{p.price}
                    </td>

                    <td style={{ padding: '0.85rem' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-control"
                          style={{ width: '70px', padding: '0.3rem' }}
                          value={discountInput}
                          onChange={(e) => setDiscountInput(e.target.value)}
                          min="0"
                          max="100"
                        />
                      ) : (
                        <span className={discount > 0 ? 'badge badge-sold' : 'badge badge-good'}>
                          {discount}% OFF
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-control"
                          style={{ width: '70px', padding: '0.3rem' }}
                          value={stockInput}
                          onChange={(e) => setStockInput(e.target.value)}
                          min="0"
                        />
                      ) : (
                        <span className={p.stockQuantity === 0 ? 'badge badge-sold' : 'badge badge-available'}>
                          {p.stockQuantity} in stock
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 800 }}>
                      ₹{finalP.toFixed(2)}
                    </td>

                    <td style={{ padding: '0.85rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        {isEditing ? (
                          <button
                            onClick={() => handleQuickStockDiscountSave(p._id)}
                            className="btn-primary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                          >
                            <Save size={14} /> Save
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingStockId(p._id);
                              setStockInput(p.stockQuantity);
                              setDiscountInput(p.discountPercent || 0);
                            }}
                            className="btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                          >
                            <Edit size={14} /> Quick Edit
                          </button>
                        )}

                        <a href={`/edit-product/${p._id}`} className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}>
                          Edit Details
                        </a>

                        <button onClick={() => handleDeleteProduct(p)} className="btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: User Monitoring & Activity */}
      {activeTab === 'users' && (
        <div className="glass-card" style={{ overflowX: 'auto', padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.85rem' }}>User</th>
                <th style={{ padding: '0.85rem' }}>Role</th>
                <th style={{ padding: '0.85rem' }}>Purchased Items</th>
                <th style={{ padding: '0.85rem' }}>Listed Products</th>
                <th style={{ padding: '0.85rem' }}>Status</th>
                <th style={{ padding: '0.85rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem' }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{u.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                  </td>

                  <td style={{ padding: '0.85rem' }}>
                    <span className={u.role === 'admin' ? 'badge badge-admin' : 'badge badge-good'}>
                      {u.role}
                    </span>
                  </td>

                  <td style={{ padding: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                    {u.ordersCount || 0} order(s)
                  </td>

                  <td style={{ padding: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                    {u.userProducts?.length || 0} item(s)
                  </td>

                  <td style={{ padding: '0.85rem' }}>
                    <span className={u.status === 'blocked' ? 'badge badge-sold' : 'badge badge-available'}>
                      {u.status}
                    </span>
                  </td>

                  <td style={{ padding: '0.85rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        onClick={() => setSelectedUserActivity(u)}
                        className="btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
                      >
                        <Eye size={14} /> Activity
                      </button>

                      {u.role !== 'admin' && (
                        <>
                          <button
                            onClick={() => handleToggleUserBlock(u._id)}
                            className="btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
                          >
                            <Ban size={14} color={u.status === 'blocked' ? 'var(--accent-emerald)' : 'var(--accent-rose)'} />
                            {u.status === 'blocked' ? 'Unblock' : 'Block'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="btn-danger"
                            style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Customer Feedback */}
      {activeTab === 'feedback' && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star color="#f59e0b" fill="#f59e0b" size={22} /> Customer Application & Product Feedback
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {feedbacks.length === 0 ? (
              <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No feedback reviews submitted yet.</p>
            ) : (
              feedbacks.map((fb) => (
                <div key={fb._id} style={{ background: 'var(--bg-primary)', padding: '1.1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{fb.user?.name || 'User'}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                        Product: {fb.product?.title || 'General App Experience'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', color: '#f59e0b' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={15} fill={i < fb.rating ? '#f59e0b' : 'none'} color={i < fb.rating ? '#f59e0b' : 'var(--text-dim)'} />
                      ))}
                    </div>
                  </div>

                  <span className="badge badge-good" style={{ fontSize: '0.72rem', marginBottom: '0.4rem' }}>
                    Criteria: {fb.experienceCategory}
                  </span>

                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    "{fb.comment}"
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Categories */}
      {activeTab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', alignItems: 'start' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={18} color="var(--primary)" /> Add New Category
            </h3>
            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Icon Name</label>
                <select
                  className="form-control"
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                >
                  <option value="Tag">Tag</option>
                  <option value="Smartphone">Smartphone</option>
                  <option value="Car">Car</option>
                  <option value="Armchair">Armchair</option>
                  <option value="Shirt">Shirt</option>
                  <option value="BookOpen">BookOpen</option>
                  <option value="Tv">Tv</option>
                  <option value="Dumbbell">Dumbbell</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                Create Category
              </button>
            </form>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
              Existing Categories
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {categories.map((cat) => (
                <div key={cat._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700 }}>{cat.name}</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Slug: {cat.slug} • {cat.productCount || 0} Products
                    </p>
                  </div>
                  <button onClick={() => handleDeleteCategory(cat)} className="btn-danger" style={{ padding: '0.35rem 0.65rem' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Activity Modal */}
      {selectedUserActivity && (
        <div className="modal-overlay" onClick={() => setSelectedUserActivity(null)}>
          <div className="modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users color="var(--primary)" size={22} /> User Activity: {selectedUserActivity.name}
              </h3>
              <button onClick={() => setSelectedUserActivity(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Email: {selectedUserActivity.email} • Status: <strong style={{ color: 'var(--accent-emerald)' }}>{selectedUserActivity.status}</strong>
            </p>

            {/* Purchased Items Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                🛍️ Purchased Items History ({selectedUserActivity.purchasedItems?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                {selectedUserActivity.purchasedItems?.length === 0 ? (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No completed purchases.</p>
                ) : (
                  selectedUserActivity.purchasedItems?.map((ord) => (
                    <div key={ord._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>{ord.product?.title || 'Purchased Item'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date: {new Date(ord.createdAt).toLocaleDateString()} • Qty: {ord.quantity}</div>
                      </div>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                        ₹{ord.totalAmount?.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* User's Listed Used Products */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                📦 User's Listed Used Products ({selectedUserActivity.userProducts?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                {selectedUserActivity.userProducts?.length === 0 ? (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No product listings posted by this user.</p>
                ) : (
                  selectedUserActivity.userProducts?.map((p) => (
                    <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>{p.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Condition: {p.condition} • Stock: {p.stockQuantity}</div>
                      </div>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                        ₹{p.price}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AdminDashboard;
