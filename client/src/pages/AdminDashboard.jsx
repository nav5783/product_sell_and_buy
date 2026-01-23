import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  FiLogOut, FiPackage, FiUsers, FiDollarSign, FiCalendar,
  FiSearch, FiFilter, FiDownload, FiEdit2, FiTrash2,
  FiEye, FiTrendingUp, FiTrendingDown, FiBarChart2,
  FiUserPlus, FiShoppingCart, FiSettings, FiHome,
  FiMessageSquare, FiBell, FiChevronRight, FiCheckCircle,
  FiXCircle, FiAlertCircle, FiRefreshCw, FiPrinter,
  FiShare2, FiCopy, FiCreditCard, FiGlobe, FiMapPin,
  FiClock, FiStar, FiUserCheck, FiUserX, FiActivity,
  FiPercent, FiTarget, FiDownloadCloud, FiUploadCloud,
  FiKey, FiDatabase, FiServer, FiShield, FiHelpCircle
} from "react-icons/fi";
import { MdOutlineAdminPanelSettings, MdDashboard } from "react-icons/md";
import { BsThreeDotsVertical, BsFillBellFill } from "react-icons/bs";
import { AiOutlineDashboard } from "react-icons/ai";
import { TbReportAnalytics, TbChartLine } from "react-icons/tb";
import "./AdminDashboard.css";

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState({
    packages: true, bookings: true, users: true, stats: true
  });
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Data State
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [bookingStatus, setBookingStatus] = useState("all");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Package Filters
  const [pkgSearch, setPkgSearch] = useState("");
  const [pkgCategory, setPkgCategory] = useState("All");
  const [pkgSortBy, setPkgSortBy] = useState("newest");
  const [pkgStatus, setPkgStatus] = useState("all");

  // Form States
  const [pkgData, setPkgData] = useState({
    title: "", description: "", image: "", mapUrl: "", category: "Family",
    duration: "", location: "", rating: "4.5", difficulty: "Easy", tags: "",
    flightCost: "", hotelCost: "", foodCost: "", transportCost: "", guideCost: "",
    placeImages: "", hotelImages: "", foodImages: "", inclusions: "", exclusions: "",
    highlights: "", itinerary: "", cancellationPolicy: "Flexible",
    minTravelers: 1, maxTravelers: 10, isActive: true
  });

  const [adminData, setAdminData] = useState({
    name: "", email: "", phone: "", role: "admin", permissions: ["read", "write"],
    department: "Administration"
  });

  // Analytics & Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    dailyRevenue: 0,
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    totalUsers: 0,
    totalAdmins: 0,
    activePackages: 0,
    inactivePackages: 0,
    revenueChange: 0,
    bookingChange: 0,
    userGrowth: 0,
    avgBookingValue: 0,
    conversionRate: 0
  });

  const [performanceMetrics, setPerformanceMetrics] = useState({
    serverUptime: 99.9,
    responseTime: 120,
    pageViews: 0,
    bounceRate: 32.5,
    sessionDuration: 4.2
  });

  // Platform Detection
  const [platform, setPlatform] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isWindows: false,
    isMac: false,
    isIOS: false,
    isAndroid: false,
    browser: "chrome"
  });

  // API Base URL - 修复 process is not defined 错误
  const API_BASE_URL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) 
    ? process.env.REACT_APP_API_URL 
    : 'http://localhost:5000';

  useEffect(() => {
    const detectPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = window.innerWidth <= 768;
      const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
      const isDesktop = window.innerWidth > 1024;
      const isWindows = userAgent.includes("windows");
      const isMac = userAgent.includes("macintosh") || userAgent.includes("mac os");
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);

      let browser = "chrome";
      if (userAgent.includes("firefox")) browser = "firefox";
      else if (userAgent.includes("safari") && !userAgent.includes("chrome")) browser = "safari";
      else if (userAgent.includes("edge")) browser = "edge";

      setPlatform({
        isMobile,
        isTablet,
        isDesktop,
        isWindows,
        isMac,
        isIOS,
        isAndroid,
        browser
      });

      // Add platform-specific classes to body
      document.body.classList.toggle('windows-platform', isWindows);
      document.body.classList.toggle('mac-platform', isMac);
      document.body.classList.toggle('ios-platform', isIOS);
      document.body.classList.toggle('android-platform', isAndroid);
      document.body.classList.toggle('mobile-view', isMobile);
      document.body.classList.toggle('tablet-view', isTablet);
    };

    detectPlatform();
    window.addEventListener('resize', detectPlatform);

    // Load initial data
    fetchDashboardData();
    fetchNotifications();
    fetchRecentActivity();

    // Auto-refresh data every 5 minutes
    const refreshInterval = setInterval(fetchDashboardData, 300000);

    return () => {
      window.removeEventListener('resize', detectPlatform);
      clearInterval(refreshInterval);
    };
  }, []);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    try {
      await Promise.all([
        fetchPackages(),
        fetchBookings(),
        fetchUsers()
      ]);
      await fetchAnalytics();
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      addNotification("error", "Failed to load dashboard data. Please refresh the page.");
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tours`);
      setPackages(res.data);
      setLoading(prev => ({ ...prev, packages: false }));
    } catch (err) {
      console.error("Error fetching packages:", err);
      setLoading(prev => ({ ...prev, packages: false }));
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/bookings`);
      setBookings(res.data);
      setLoading(prev => ({ ...prev, bookings: false }));
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setLoading(prev => ({ ...prev, bookings: false }));
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/users`);
      setUsers(res.data);
      setLoading(prev => ({ ...prev, users: false }));
    } catch (err) {
      console.error("Error fetching users:", err);
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  const fetchAnalytics = async () => {
    try {
      // In a real app, you would have a dedicated analytics endpoint
      const totalRevenue = bookings.reduce((acc, curr) => acc + (curr.totalPrice || curr.totalAmount || 0), 0);
      const monthlyBookings = bookings.filter(b => {
        const date = new Date(b.createdAt);
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
      });
      const monthlyRevenue = monthlyBookings.reduce((acc, curr) => acc + (curr.totalPrice || curr.totalAmount || 0), 0);
      const dailyRevenue = bookings.filter(b => {
        const date = new Date(b.createdAt);
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
      }).reduce((acc, curr) => acc + (curr.totalPrice || curr.totalAmount || 0), 0);

      const pendingBookings = bookings.filter(b => b.status === 'Pending').length;
      const confirmedBookings = bookings.filter(b => b.status === 'Confirmed').length;
      const cancelledBookings = bookings.filter(b => b.status === 'Cancelled').length;
      const totalAdmins = users.filter(u => u.role === 'admin').length;
      const activePackages = packages.filter(p => p.isActive !== false).length;
      const inactivePackages = packages.filter(p => p.isActive === false).length;

      const avgBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;
      const conversionRate = users.length > 0 ? (bookings.length / users.length) * 100 : 0;

      setStats({
        totalRevenue,
        monthlyRevenue,
        dailyRevenue,
        totalBookings: bookings.length,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        totalUsers: users.length,
        totalAdmins,
        activePackages,
        inactivePackages,
        revenueChange: 12.5,
        bookingChange: 8.3,
        userGrowth: 15.7,
        avgBookingValue,
        conversionRate
      });
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  const fetchNotifications = async () => {
    // Mock notifications - in production, fetch from API
    const mockNotifications = [
      { id: 1, type: 'success', title: 'New Booking', message: 'John Doe booked "Mountain Adventure"', time: '2 mins ago', read: false },
      { id: 2, type: 'warning', title: 'Low Stock', message: 'Only 3 slots left for "Beach Paradise"', time: '1 hour ago', read: false },
      { id: 3, type: 'info', title: 'System Update', message: 'Scheduled maintenance at 2 AM', time: '3 hours ago', read: true },
      { id: 4, type: 'error', title: 'Payment Failed', message: 'Payment failed for booking #45678', time: '5 hours ago', read: true },
    ];
    setNotifications(mockNotifications);
  };

  const fetchRecentActivity = async () => {
    // Mock recent activity - in production, fetch from API
    const mockActivity = [
      { id: 1, user: 'Admin', action: 'created new package', target: 'Ski Resort Adventure', time: '10 minutes ago' },
      { id: 2, user: 'Jane Smith', action: 'made a booking', target: 'Tropical Getaway', time: '45 minutes ago' },
      { id: 3, user: 'System', action: 'processed payment', target: '#78901', time: '2 hours ago' },
      { id: 4, user: 'Admin', action: 'updated settings', target: 'Email templates', time: '5 hours ago' },
    ];
    setRecentActivity(mockActivity);
  };

  const addNotification = (type, message) => {
    const newNotification = {
      id: Date.now(),
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      message,
      time: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const handlePkgChange = (e) => {
    const { name, value } = e.target;
    setPkgData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setAdminData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPackage = async (e) => {
    e.preventDefault();
    try {
      const splitUrls = (str) => str ? str.split(',').map(url => url.trim()) : [];
      const splitArray = (str) => str ? str.split(',').map(item => item.trim()) : [];

      const payload = {
        ...pkgData,
        gallery: {
          places: splitUrls(pkgData.placeImages),
          hotels: splitUrls(pkgData.hotelImages),
          food: splitUrls(pkgData.foodImages)
        },
        costs: {
          flight: Number(pkgData.flightCost) || 0,
          hotel: Number(pkgData.hotelCost) || 0,
          food: Number(pkgData.foodCost) || 0,
          transport: Number(pkgData.transportCost) || 0,
          guide: Number(pkgData.guideCost) || 0
        },
        inclusions: splitArray(pkgData.inclusions),
        exclusions: splitArray(pkgData.exclusions),
        highlights: splitArray(pkgData.highlights),
        tags: splitArray(pkgData.tags),
        totalPrice: (
          (Number(pkgData.flightCost) || 0) +
          (Number(pkgData.hotelCost) || 0) +
          (Number(pkgData.foodCost) || 0) +
          (Number(pkgData.transportCost) || 0) +
          (Number(pkgData.guideCost) || 0)
        ),
        createdAt: new Date().toISOString()
      };

      await axios.post(`${API_BASE_URL}/api/tours`, payload);
      addNotification('success', `Package "${pkgData.title}" created successfully`);
      setShowPackageForm(false);
      fetchPackages();

      // Reset form
      setPkgData({
        title: "", description: "", image: "", mapUrl: "", category: "Family",
        duration: "", location: "", rating: "4.5", difficulty: "Easy", tags: "",
        flightCost: "", hotelCost: "", foodCost: "", transportCost: "", guideCost: "",
        placeImages: "", hotelImages: "", foodImages: "", inclusions: "", exclusions: "",
        highlights: "", itinerary: "", cancellationPolicy: "Flexible",
        minTravelers: 1, maxTravelers: 10, isActive: true
      });
    } catch (err) {
      console.error("Error adding package:", err);
      addNotification('error', 'Failed to create package. Please try again.');
    }
  };

  const handleUpdatePackage = async (id, updates) => {
    try {
      await axios.put(`${API_BASE_URL}/api/tours/${id}`, updates);
      addNotification('success', 'Package updated successfully');
      fetchPackages();
    } catch (err) {
      console.error("Error updating package:", err);
      addNotification('error', 'Failed to update package.');
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/users/create-admin`, adminData);
      addNotification('success', `Admin "${adminData.name}" created successfully`);
      setShowAdminForm(false);
      fetchUsers();

      // Reset form
      setAdminData({
        name: "", email: "", phone: "", role: "admin", permissions: ["read", "write"],
        department: "Administration"
      });
    } catch (err) {
      console.error("Error creating admin:", err);
      addNotification('error', 'Failed to create admin user.');
    }
  };

  const handleDelete = async (url, itemType, itemName) => {
    if (window.confirm(`Are you sure you want to delete this ${itemType}: ${itemName}?`)) {
      try {
        await axios.delete(url);
        addNotification('success', `${itemType} "${itemName}" deleted successfully`);

        // Refresh data based on item type
        if (url.includes('tours')) fetchPackages();
        else if (url.includes('bookings')) fetchBookings();
        else if (url.includes('users')) fetchUsers();
      } catch (err) {
        console.error("Error deleting item:", err);
        addNotification('error', `Failed to delete ${itemType}.`);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate("/login");
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  const generatePDFReport = () => {
    const doc = new jsPDF();
    const monthName = months[selectedMonth];

    // Header with logo
    doc.setFontSize(24);
    doc.setTextColor(41, 128, 185);
    doc.text("TravelHub Analytics Report", 105, 20, null, "center");

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 105, 30, null, "center");
    doc.text(`Period: ${monthName} ${selectedYear}`, 105, 37, null, "center");

    // Summary Section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Performance Summary", 20, 55);

    doc.setFontSize(11);
    doc.text(`Total Revenue: $${stats.totalRevenue.toLocaleString()}`, 20, 65);
    doc.text(`Monthly Revenue: $${stats.monthlyRevenue.toLocaleString()}`, 20, 72);
    doc.text(`Total Bookings: ${stats.totalBookings}`, 20, 79);
    doc.text(`Active Users: ${stats.totalUsers}`, 20, 86);

    // Bookings Table
    doc.autoTable({
      startY: 95,
      head: [['Date', 'Customer', 'Package', 'Amount', 'Status']],
      body: filteredBookings.map(b => [
        new Date(b.createdAt).toLocaleDateString(),
        b.fullName || b.userName || 'N/A',
        b.packageName || 'N/A',
        `$${b.totalPrice || b.totalAmount || 0}`,
        b.status || 'Pending'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219] },
      margin: { top: 10 }
    });

    // Footer
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Confidential - For Internal Use Only", 105, finalY, null, "center");
    doc.text(`Page 1 of 1`, 190, finalY, null, "right");

    doc.save(`TravelHub_Report_${monthName}_${selectedYear}.pdf`);
  };

  const exportCSV = (data, filename) => {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefresh = () => {
    fetchDashboardData();
    addNotification('info', 'Dashboard data refreshed successfully');
  };

  // Filtered Data
  const filteredBookings = bookings.filter(b => {
    const date = new Date(b.createdAt);
    const matchesDate = date.getMonth() === parseInt(selectedMonth) && date.getFullYear() === parseInt(selectedYear);
    const matchesUser = selectedUserId === "all" || (b.userEmail === selectedUserId || b.userId === selectedUserId);
    const matchesStatus = bookingStatus === "all" || b.status === bookingStatus;
    const matchesDateRange = (!dateRange.start || !dateRange.end) || (
      date >= new Date(dateRange.start) && date <= new Date(dateRange.end)
    );
    return matchesDate && matchesUser && matchesStatus && matchesDateRange;
  });

  const filteredPackages = packages.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(pkgSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(pkgSearch.toLowerCase()) ||
      p.location.toLowerCase().includes(pkgSearch.toLowerCase());
    const matchesCategory = pkgCategory === "All" || p.category === pkgCategory;
    const matchesStatus = pkgStatus === "all" || (pkgStatus === "active" ? p.isActive !== false : p.isActive === false);
    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    switch (pkgSortBy) {
      case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
      case 'price-high': return (b.totalPrice || 0) - (a.totalPrice || 0);
      case 'price-low': return (a.totalPrice || 0) - (b.totalPrice || 0);
      case 'popular': return (b.bookingsCount || 0) - (a.bookingsCount || 0);
      default: return 0;
    }
  });

  const filteredUsers = users.filter(u => {
    const searchLower = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      u.phone.includes(searchQuery) ||
      u.role.toLowerCase().includes(searchLower)
    );
  });

  // Chart Data
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const revenueData = {
    labels: months,
    datasets: [
      {
        label: 'Revenue ($)',
        data: months.map((_, index) => {
          return bookings
            .filter(b => new Date(b.createdAt).getMonth() === index && new Date(b.createdAt).getFullYear() === selectedYear)
            .reduce((sum, b) => sum + (b.totalPrice || b.totalAmount || 0), 0);
        }),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4
      },
      {
        label: 'Bookings',
        data: months.map((_, index) => {
          return bookings.filter(b =>
            new Date(b.createdAt).getMonth() === index &&
            new Date(b.createdAt).getFullYear() === selectedYear
          ).length;
        }),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  const packageRevenueData = {
    labels: packages.slice(0, 8).map(p => p.title.substring(0, 15) + '...'),
    datasets: [{
      label: 'Package Revenue ($)',
      data: packages.slice(0, 8).map(p =>
        bookings
          .filter(b => b.packageName === p.title)
          .reduce((sum, b) => sum + (b.totalPrice || b.totalAmount || 0), 0)
      ),
      backgroundColor: [
        '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0',
        '#118AB2', '#EF476F', '#073B4C', '#7209B7'
      ],
      borderWidth: 1
    }]
  };

  const userGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'New Users',
      data: [120, 190, 300, 500, 200, 300],
      borderColor: 'rgb(54, 162, 235)',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      fill: true
    }]
  };

  // Platform-specific shortcuts
  const platformShortcuts = platform.isMac ? [
    { key: '⌘K', action: 'Search' },
    { key: '⌘R', action: 'Refresh' },
    { key: '⌘P', action: 'Print' }
  ] : [
    { key: 'Ctrl+K', action: 'Search' },
    { key: 'Ctrl+R', action: 'Refresh' },
    { key: 'Ctrl+P', action: 'Print' }
  ];

  // Loading Components
  const LoadingSpinner = () => (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <span>Loading...</span>
    </div>
  );

  const SkeletonCard = ({ count = 1 }) => (
    <div className="skeleton-grid">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-line" style={{ width: '70%' }}></div>
          <div className="skeleton-line" style={{ width: '50%' }}></div>
          <div className="skeleton-line" style={{ width: '60%' }}></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`admin-dashboard ${platform.isMobile ? 'mobile' : ''} ${platform.isMac ? 'mac' : 'windows'}`}>
      {/* Desktop Sidebar */}
      {!platform.isMobile && (
        <aside className="admin-sidebar">
          <div className="sidebar-header">
            <div className="logo">
              <div className="logo-icon">
                <FiGlobe />
              </div>
              <div className="logo-text">
                <h2>TravelHub</h2>
                <span className="platform-tag">
                  {platform.isMac ? 'macOS' : platform.isWindows ? 'Windows' : 'Web'} Admin
                </span>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section">
              <span className="nav-label">MAIN</span>
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
              >
                <MdDashboard className="nav-icon" />
                <span>Dashboard</span>
                <span className="nav-badge">{notifications.filter(n => !n.read).length}</span>
              </button>

              <button
                onClick={() => setActiveTab("bookings")}
                className={`nav-item ${activeTab === "bookings" ? "active" : ""}`}
              >
                <FiShoppingCart className="nav-icon" />
                <span>Bookings</span>
                {stats.pendingBookings > 0 && (
                  <span className="nav-badge warning">{stats.pendingBookings}</span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("packages")}
                className={`nav-item ${activeTab === "packages" ? "active" : ""}`}
              >
                <FiPackage className="nav-icon" />
                <span>Packages</span>
              </button>
            </div>

            <div className="nav-section">
              <span className="nav-label">MANAGEMENT</span>
              <button
                onClick={() => setActiveTab("users")}
                className={`nav-item ${activeTab === "users" ? "active" : ""}`}
              >
                <FiUsers className="nav-icon" />
                <span>Users</span>
              </button>

              <button
                onClick={() => setActiveTab("analytics")}
                className={`nav-item ${activeTab === "analytics" ? "active" : ""}`}
              >
                <TbReportAnalytics className="nav-icon" />
                <span>Analytics</span>
              </button>

              <button
                onClick={() => setActiveTab("reports")}
                className={`nav-item ${activeTab === "reports" ? "active" : ""}`}
              >
                <FiDownloadCloud className="nav-icon" />
                <span>Reports</span>
              </button>
            </div>

            <div className="nav-section">
              <span className="nav-label">SYSTEM</span>
              <button
                onClick={() => setActiveTab("settings")}
                className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
              >
                <FiSettings className="nav-icon" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => setActiveTab("support")}
                className={`nav-item ${activeTab === "support" ? "active" : ""}`}
              >
                <FiHelpCircle className="nav-icon" />
                <span>Support</span>
              </button>
            </div>
          </nav>

          <div className="sidebar-footer">
            <div className="user-profile">
              <div className="user-avatar">
                <span>A</span>
              </div>
              <div className="user-info">
                <strong>Administrator</strong>
                <small>Super Admin</small>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <FiLogOut />
              <span>Logout</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="admin-content">
        {/* Top Navigation Bar */}
        <header className="admin-header">
          <div className="header-left">
            {platform.isMobile && (
              <button
                className="menu-toggle"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <BsThreeDotsVertical />
              </button>
            )}
            <div className="breadcrumbs">
              <FiHome />
              <FiChevronRight />
              <span>Admin</span>
              <FiChevronRight />
              <span className="current">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
            </div>
          </div>

          <div className="header-center">
            <div className="search-bar">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search across dashboard..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {platform.isDesktop && (
                <span className="search-shortcut">
                  {platform.isMac ? '⌘K' : 'Ctrl+K'}
                </span>
              )}
            </div>
          </div>

          <div className="header-right">
            <button
              className="header-btn refresh-btn"
              onClick={handleRefresh}
              title="Refresh Data"
            >
              <FiRefreshCw />
            </button>

            <div className="notifications-wrapper">
              <button
                className="header-btn notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <FiBell />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="notification-badge">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h4>Notifications</h4>
                    <button
                      className="mark-all-read"
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="notifications-list">
                    {notifications.slice(0, 5).map(notification => (
                      <div
                        key={notification.id}
                        className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className={`notification-icon ${notification.type}`}>
                          {notification.type === 'success' && <FiCheckCircle />}
                          {notification.type === 'warning' && <FiAlertCircle />}
                          {notification.type === 'error' && <FiXCircle />}
                          {notification.type === 'info' && <FiMessageSquare />}
                        </div>
                        <div className="notification-content">
                          <strong>{notification.title}</strong>
                          <p>{notification.message}</p>
                          <small>{notification.time}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="notifications-footer">
                    <button onClick={() => setActiveTab("notifications")}>
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="user-menu">
              <div className="user-avatar small">
                <span>A</span>
              </div>
              <div className="user-details">
                <strong>Admin User</strong>
                <small>Super Admin</small>
              </div>
              <button className="logout-btn-mobile" onClick={handleLogout}>
                <FiLogOut />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Menu */}
        {platform.isMobile && showMobileMenu && (
          <div className="mobile-menu-overlay">
            <div className="mobile-menu">
              <div className="mobile-menu-header">
                <h3>TravelHub Admin</h3>
                <button onClick={() => setShowMobileMenu(false)}>×</button>
              </div>
              <div className="mobile-menu-items">
                {['dashboard', 'bookings', 'packages', 'users', 'analytics', 'settings'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setShowMobileMenu(false);
                    }}
                    className={`mobile-menu-item ${activeTab === tab ? 'active' : ''}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {loading.stats && <LoadingSpinner />}

          {/* Dashboard Overview */}
          {activeTab === "dashboard" && !loading.stats && (
            <>
              {/* Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card primary">
                  <div className="stat-icon">
                    <FiDollarSign />
                  </div>
                  <div className="stat-content">
                    <h3>${stats.totalRevenue.toLocaleString()}</h3>
                    <p>Total Revenue</p>
                    <div className="stat-trend">
                      <FiTrendingUp />
                      <span>{stats.revenueChange}%</span>
                    </div>
                  </div>
                </div>

                <div className="stat-card success">
                  <div className="stat-icon">
                    <FiShoppingCart />
                  </div>
                  <div className="stat-content">
                    <h3>{stats.totalBookings}</h3>
                    <p>Total Bookings</p>
                    <div className="stat-detail">
                      <span className="confirmed">{stats.confirmedBookings} Confirmed</span>
                      <span className="pending">{stats.pendingBookings} Pending</span>
                    </div>
                  </div>
                </div>

                <div className="stat-card warning">
                  <div className="stat-icon">
                    <FiUsers />
                  </div>
                  <div className="stat-content">
                    <h3>{stats.totalUsers}</h3>
                    <p>Total Users</p>
                    <div className="stat-trend">
                      <FiTrendingUp />
                      <span>{stats.userGrowth}% growth</span>
                    </div>
                  </div>
                </div>

                <div className="stat-card info">
                  <div className="stat-icon">
                    <FiPackage />
                  </div>
                  <div className="stat-content">
                    <h3>{stats.activePackages}</h3>
                    <p>Active Packages</p>
                    <div className="stat-detail">
                      <span className="inactive">{stats.inactivePackages} Inactive</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="charts-row">
                <div className="chart-container large">
                  <div className="chart-header">
                    <h4>Revenue & Bookings Overview</h4>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="chart-select"
                    >
                      {[2022, 2023, 2024, 2025].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div className="chart-wrapper">
                    <Line
                      data={revenueData}
                      options={{
                        responsive: true,
                        interaction: {
                          mode: 'index',
                          intersect: false,
                        },
                        scales: {
                          y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                              display: true,
                              text: 'Revenue ($)'
                            }
                          },
                          y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                              display: true,
                              text: 'Bookings'
                            },
                            grid: {
                              drawOnChartArea: false,
                            },
                          },
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="chart-container medium">
                  <div className="chart-header">
                    <h4>Package Revenue</h4>
                    <button
                      onClick={() => exportCSV(packages, 'packages.csv')}
                      className="export-btn"
                    >
                      <FiDownload />
                    </button>
                  </div>
                  <div className="chart-wrapper">
                    <Doughnut
                      data={packageRevenueData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: platform.isMobile ? 'bottom' : 'right'
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Recent Activity & Performance */}
              <div className="content-row">
                <div className="content-card">
                  <div className="card-header">
                    <h4>Recent Activity</h4>
                    <button onClick={fetchRecentActivity} className="refresh-btn-small">
                      <FiRefreshCw />
                    </button>
                  </div>
                  <div className="activity-list">
                    {recentActivity.map(activity => (
                      <div key={activity.id} className="activity-item">
                        <div className="activity-avatar">
                          <span>{activity.user.charAt(0)}</span>
                        </div>
                        <div className="activity-content">
                          <p>
                            <strong>{activity.user}</strong> {activity.action} <em>{activity.target}</em>
                          </p>
                          <small>{activity.time}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="content-card">
                  <div className="card-header">
                    <h4>System Performance</h4>
                    <span className="status-indicator active">Live</span>
                  </div>
                  <div className="performance-metrics">
                    <div className="metric">
                      <div className="metric-label">
                        <FiServer />
                        <span>Server Uptime</span>
                      </div>
                      <div className="metric-value">
                        <strong>{performanceMetrics.serverUptime}%</strong>
                        <div className="metric-bar">
                          <div
                            className="metric-fill"
                            style={{ width: `${performanceMetrics.serverUptime}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="metric">
                      <div className="metric-label">
                        <FiActivity />
                        <span>Response Time</span>
                      </div>
                      <div className="metric-value">
                        <strong>{performanceMetrics.responseTime}ms</strong>
                        <span className="metric-status good">Good</span>
                      </div>
                    </div>

                    <div className="metric">
                      <div className="metric-label">
                        <FiTarget />
                        <span>Conversion Rate</span>
                      </div>
                      <div className="metric-value">
                        <strong>{stats.conversionRate.toFixed(1)}%</strong>
                        <div className="metric-change positive">
                          <FiTrendingUp />
                          <span>+2.3%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Bookings Management */}
          {activeTab === "bookings" && (
            <div className="content-card full-width">
              <div className="card-header">
                <h4>Booking Management</h4>
                <div className="card-actions">
                  <div className="filters-row">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="filter-select"
                    >
                      {months.map((month, index) => (
                        <option key={index} value={index}>{month}</option>
                      ))}
                    </select>
                    <select
                      value={bookingStatus}
                      onChange={(e) => setBookingStatus(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="date-input"
                    />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="date-input"
                    />
                  </div>
                  <div className="action-buttons">
                    <button
                      onClick={() => exportCSV(filteredBookings, 'bookings.csv')}
                      className="action-btn secondary"
                    >
                      <FiDownload /> Export
                    </button>
                    <button
                      onClick={generatePDFReport}
                      className="action-btn primary"
                    >
                      <FiPrinter /> PDF Report
                    </button>
                  </div>
                </div>
              </div>

              {loading.bookings ? (
                <SkeletonCard count={5} />
              ) : (
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Package</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map(booking => (
                        <tr key={booking._id}>
                          <td className="monospace">#{booking._id.slice(-8)}</td>
                          <td>{new Date(booking.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div className="user-cell">
                              <strong>{booking.fullName || booking.userName}</strong>
                              <small>{booking.email || booking.userEmail}</small>
                            </div>
                          </td>
                          <td>{booking.packageName}</td>
                          <td className="amount">
                            <strong>${booking.totalPrice || booking.totalAmount || 0}</strong>
                          </td>
                          <td>
                            <span className={`status-badge status-${booking.status?.toLowerCase() || 'pending'}`}>
                              {booking.status || 'Pending'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons compact">
                              <button className="action-btn view" title="View Details">
                                <FiEye />
                              </button>
                              <button className="action-btn edit" title="Edit Booking">
                                <FiEdit2 />
                              </button>
                              <button
                                onClick={() => handleDelete(
                                  `${API_BASE_URL}/api/bookings/${booking._id}`,
                                  'booking',
                                  booking.packageName
                                )}
                                className="action-btn delete"
                                title="Delete Booking"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredBookings.length === 0 && (
                    <div className="empty-state">
                      <FiPackage />
                      <p>No bookings found for the selected filters</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Package Management */}
          {activeTab === "packages" && (
            <div className="content-card full-width">
              <div className="card-header">
                <h4>Package Management</h4>
                <button
                  onClick={() => setShowPackageForm(!showPackageForm)}
                  className="action-btn primary"
                >
                  {showPackageForm ? 'Cancel' : '+ Add Package'}
                </button>
              </div>

              {showPackageForm && (
                <div className="form-container">
                  <form onSubmit={handleAddPackage} className="package-form">
                    <div className="form-section">
                      <h5>Basic Information</h5>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Package Title *</label>
                          <input
                            type="text"
                            name="title"
                            value={pkgData.title}
                            onChange={handlePkgChange}
                            placeholder="Enter package title"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Category *</label>
                          <select
                            name="category"
                            value={pkgData.category}
                            onChange={handlePkgChange}
                            required
                          >
                            <option value="Family">Family</option>
                            <option value="Couple">Couple</option>
                            <option value="Single">Single</option>
                            <option value="Adventure">Adventure</option>
                            <option value="Luxury">Luxury</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="form-section">
                      <h5>Cost Breakdown</h5>
                      <div className="cost-grid">
                        {['flightCost', 'hotelCost', 'foodCost', 'transportCost', 'guideCost'].map((field) => (
                          <div className="form-group" key={field}>
                            <label>{field.replace('Cost', '').replace(/([A-Z])/g, ' $1').trim()} *</label>
                            <div className="input-with-symbol">
                              <span className="input-symbol">$</span>
                              <input
                                type="number"
                                name={field}
                                value={pkgData[field]}
                                onChange={handlePkgChange}
                                placeholder="0"
                                required
                                min="0"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="submit-btn">
                        <FiCheckCircle /> Save Package
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPackageForm(false)}
                        className="cancel-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="filters-row">
                <div className="search-box">
                  <FiSearch />
                  <input
                    type="text"
                    placeholder="Search packages..."
                    value={pkgSearch}
                    onChange={(e) => setPkgSearch(e.target.value)}
                  />
                </div>
                <select
                  value={pkgCategory}
                  onChange={(e) => setPkgCategory(e.target.value)}
                  className="filter-select"
                >
                  <option value="All">All Categories</option>
                  <option value="Family">Family</option>
                  <option value="Couple">Couple</option>
                  <option value="Single">Single</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Luxury">Luxury</option>
                </select>
                <select
                  value={pkgStatus}
                  onChange={(e) => setPkgStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  value={pkgSortBy}
                  onChange={(e) => setPkgSortBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>

              {loading.packages ? (
                <SkeletonCard count={6} />
              ) : (
                <div className="packages-grid">
                  {filteredPackages.map(pkg => (
                    <div key={pkg._id} className="package-card">
                      <div className="package-image">
                        <img src={pkg.image || 'https://via.placeholder.com/300x200'} alt={pkg.title} />
                        <div className="package-overlay">
                          <span className="package-category">{pkg.category}</span>
                          <span className={`package-status ${pkg.isActive ? 'active' : 'inactive'}`}>
                            {pkg.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="package-content">
                        <h5>{pkg.title}</h5>
                        <p className="package-location">
                          <FiMapPin /> {pkg.location || 'Location not specified'}
                        </p>
                        <div className="package-meta">
                          <span><FiClock /> {pkg.duration} Days</span>
                          <span><FiDollarSign /> ${pkg.totalPrice || 0}</span>
                          <span><FiStar /> {pkg.rating || '4.5'}/5</span>
                        </div>
                        <div className="package-actions">
                          <button
                            onClick={() => handleUpdatePackage(pkg._id, { isActive: !pkg.isActive })}
                            className={`status-toggle ${pkg.isActive ? 'deactivate' : 'activate'}`}
                          >
                            {pkg.isActive ? <FiUserX /> : <FiUserCheck />}
                            {pkg.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(
                              `${API_BASE_URL}/api/tours/${pkg._id}`,
                              'package',
                              pkg.title
                            )}
                            className="delete-package"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading.packages && filteredPackages.length === 0 && (
                <div className="empty-state">
                  <FiPackage size={48} />
                  <h4>No packages found</h4>
                  <p>Try adjusting your search filters or create a new package.</p>
                </div>
              )}
            </div>
          )}

          {/* User Management */}
          {activeTab === "users" && (
            <div className="content-card full-width">
              <div className="card-header">
                <h4>User Management</h4>
                <button
                  onClick={() => setShowAdminForm(!showAdminForm)}
                  className="action-btn primary"
                >
                  <MdOutlineAdminPanelSettings /> Create Admin
                </button>
              </div>

              {showAdminForm && (
                <div className="form-container">
                  <form onSubmit={handleCreateAdmin} className="admin-form">
                    <h5>Create New Admin</h5>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={adminData.name}
                          onChange={handleAdminChange}
                          placeholder="Enter full name"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Email *</label>
                        <input
                          type="email"
                          name="email"
                          value={adminData.email}
                          onChange={handleAdminChange}
                          placeholder="Enter email address"
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Phone *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={adminData.phone}
                          onChange={handleAdminChange}
                          placeholder="Enter phone number"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Role</label>
                        <select
                          name="role"
                          value={adminData.role}
                          onChange={handleAdminChange}
                          required
                        >
                          <option value="admin">Admin</option>
                          <option value="superadmin">Super Admin</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="submit-btn">
                        <FiUserCheck /> Create Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAdminForm(false)}
                        className="cancel-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="search-box full-width">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search users by name, email, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {loading.users ? (
                <SkeletonCard count={5} />
              ) : (
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user._id}>
                          <td className="monospace">#{user._id.slice(-8)}</td>
                          <td>
                            <div className="user-cell">
                              <strong>{user.name}</strong>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>{user.phone || 'N/A'}</td>
                          <td>
                            <span className={`role-badge ${user.role}`}>
                              {user.role === 'admin' ? 'Admin' : 'User'}
                            </span>
                          </td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div className="action-buttons compact">
                              <button className="action-btn view" title="View Profile">
                                <FiEye />
                              </button>
                              <button
                                onClick={() => handleDelete(
                                  `${API_BASE_URL}/api/users/${user._id}`,
                                  'user',
                                  user.name
                                )}
                                className="action-btn delete"
                                title="Delete User"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="analytics-dashboard">
              <div className="analytics-header">
                <h3>Advanced Analytics</h3>
                <div className="analytics-controls">
                  <select className="analytics-select">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last quarter</option>
                    <option>Last year</option>
                  </select>
                  <button className="export-btn">
                    <FiDownload /> Export Data
                  </button>
                </div>
              </div>

              <div className="analytics-grid">
                <div className="analytics-card">
                  <h5>Revenue Trends</h5>
                  <div className="chart-wrapper">
                    <Bar
                      data={revenueData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top',
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="analytics-card">
                  <h5>User Growth</h5>
                  <div className="chart-wrapper">
                    <Line
                      data={userGrowthData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top',
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="analytics-card">
                  <h5>Performance Metrics</h5>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <div className="metric-value">${stats.avgBookingValue.toFixed(2)}</div>
                      <div className="metric-label">Average Booking Value</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-value">{stats.conversionRate.toFixed(1)}%</div>
                      <div className="metric-label">Conversion Rate</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-value">{performanceMetrics.bounceRate}%</div>
                      <div className="metric-label">Bounce Rate</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-value">{performanceMetrics.sessionDuration}min</div>
                      <div className="metric-label">Avg Session Duration</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div className="reports-dashboard">
              <h3>Reports & Exports</h3>
              <div className="reports-grid">
                <div className="report-card" onClick={generatePDFReport}>
                  <div className="report-icon">
                    <FiPrinter />
                  </div>
                  <h5>Revenue Statement</h5>
                  <p>Generate PDF report for selected period</p>
                </div>

                <div className="report-card" onClick={() => exportCSV(bookings, 'bookings.csv')}>
                  <div className="report-icon">
                    <FiDownloadCloud />
                  </div>
                  <h5>Bookings Export</h5>
                  <p>Export all bookings data as CSV</p>
                </div>

                <div className="report-card" onClick={() => exportCSV(users, 'users.csv')}>
                  <div className="report-icon">
                    <FiUsers />
                  </div>
                  <h5>User Database</h5>
                  <p>Export user information as CSV</p>
                </div>

                <div className="report-card" onClick={() => exportCSV(packages, 'packages.csv')}>
                  <div className="report-icon">
                    <FiPackage />
                  </div>
                  <h5>Package Catalog</h5>
                  <p>Export all package details</p>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="settings-dashboard">
              <h3>System Settings</h3>
              <div className="settings-grid">
                <div className="settings-card">
                  <h5><FiShield /> Security Settings</h5>
                  <div className="settings-option">
                    <span>Two-Factor Authentication</span>
                    <label className="toggle-switch">
                      <input type="checkbox" />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="settings-option">
                    <span>Session Timeout</span>
                    <select className="settings-select">
                      <option>15 minutes</option>
                      <option>30 minutes</option>
                      <option>1 hour</option>
                      <option>4 hours</option>
                    </select>
                  </div>
                </div>

                <div className="settings-card">
                  <h5><FiBell /> Notifications</h5>
                  <div className="settings-option">
                    <span>Email Notifications</span>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="settings-option">
                    <span>Push Notifications</span>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>

                <div className="settings-card">
                  <h5><FiDatabase /> Data Management</h5>
                  <button className="settings-btn">
                    <FiDownload /> Backup Database
                  </button>
                  <button className="settings-btn warning">
                    <FiTrash2 /> Clear Cache
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Platform-specific Tips */}
          {platform.isDesktop && (
            <div className="platform-tips">
              <h5>Quick Tips</h5>
              <div className="shortcuts-grid">
                {platformShortcuts.map(shortcut => (
                  <div key={shortcut.key} className="shortcut-item">
                    <kbd>{shortcut.key}</kbd>
                    <span>{shortcut.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="dashboard-footer">
          <div className="footer-left">
            <span>TravelHub Admin v2.0</span>
            <span className="footer-separator">•</span>
            <span>{platform.isMac ? 'macOS' : platform.isWindows ? 'Windows' : 'Web'} Edition</span>
          </div>
          <div className="footer-right">
            <span>Server Status: <span className="status-online">Online</span></span>
            <span className="footer-separator">•</span>
            <span>Last Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default AdminDashboard;