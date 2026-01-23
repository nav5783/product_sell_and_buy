import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./UserDashboard.css";

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Tabs: 'bookings' or 'explore'
  const [activeTab, setActiveTab] = useState("bookings");

  // Data
  const [myBookings, setMyBookings] = useState([]);
  const [allPackages, setAllPackages] = useState([]); // For Search
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        navigate("/login");
      } else {
        setUser(currentUser);
        fetchData(currentUser.email);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchData = async (email) => {
    try {
      setLoading(true);
      // 1. Fetch Bookings
      const bookingRes = await axios.get("http://localhost:5000/api/bookings");
      setMyBookings(bookingRes.data.filter((b) => b.userEmail === email));

      // 2. Fetch All Tours (For the Search Tab)
      const tourRes = await axios.get("http://localhost:5000/api/tours");
      setAllPackages(tourRes.data);
      
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  // --- FILTER LOGIC ---
  const filteredPackages = allPackages.filter(pkg => {
    const matchesSearch = pkg.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || pkg.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // --- PDF GENERATOR ---
  const downloadReceipt = (booking) => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.setTextColor(40, 167, 69); doc.text("Travel Receipt", 105, 20, null, "center");
    doc.setFontSize(12); doc.setTextColor(0, 0, 0);
    doc.text(`ID: ${booking._id}`, 14, 40);
    doc.text(`Package: ${booking.packageName}`, 14, 50);
    doc.text(`Date: ${new Date(booking.travelDate).toDateString()}`, 14, 60);

    doc.autoTable({
      startY: 75,
      head: [['Item', 'Amount']],
      body: [
        ['Package Cost', `$${booking.totalAmount - booking.gstAmount}`],
        ['GST Tax', `$${booking.gstAmount}`],
        ['TOTAL PAID', `$${booking.totalAmount}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [40, 167, 69] }
    });
    doc.save(`Receipt_${booking._id}.pdf`);
  };

  if (loading) return <h2 style={{textAlign:"center", marginTop:"50px"}}>Loading...</h2>;

  return (
    <div className="user-container">
      
      {/* HEADER */}
      <div className="user-header">
        <div className="user-title">
          <h1>Hello, {user?.displayName || "Traveler"}! 🌍</h1>
          <p>Ready for your next adventure?</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      {/* TABS */}
      <div className="dashboard-tabs">
        <button 
          className={`d-tab ${activeTab === 'bookings' ? 'active' : ''}`} 
          onClick={() => setActiveTab('bookings')}
        >
          📅 My Bookings
        </button>
        <button 
          className={`d-tab ${activeTab === 'explore' ? 'active' : ''}`} 
          onClick={() => setActiveTab('explore')}
        >
          🔍 Explore & Book
        </button>
      </div>

      {/* === TAB 1: MY BOOKINGS === */}
      {activeTab === 'bookings' && (
        <>
            {/* Stats */}
            <div className="stats-row">
                <div className="u-card">
                <h3>Total Trips</h3>
                <p>{myBookings.length}</p>
                </div>
                <div className="u-card" style={{borderBottomColor: "#28a745"}}>
                <h3>Total Spent</h3>
                <p>${myBookings.reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString()}</p>
                </div>
            </div>

            <div className="bookings-section">
                <h2>✈ Trip History</h2>
                {myBookings.length === 0 ? (
                <div style={{textAlign:"center", padding:"40px"}}>
                    <p style={{color:"#888", fontSize:"18px"}}>No trips yet.</p>
                    <button className="view-btn" onClick={() => setActiveTab('explore')}>Book a Trip Now</button>
                </div>
                ) : (
                <div>
                    {myBookings.map((booking) => (
                    <div key={booking._id} className="booking-item">
                        <div className="b-info">
                        <h3>{booking.packageName}</h3>
                        <p>📅 {new Date(booking.travelDate).toDateString()} • 👥 {booking.members} Travelers</p>
                        </div>
                        <div className="b-status-container">
                            <span className={`b-status ${booking.status === 'Confirmed' ? 'confirmed' : 'pending'}`}>
                                {booking.status}
                            </span>
                        </div>
                        <div className="b-price">${booking.totalAmount}</div>
                        <button onClick={() => downloadReceipt(booking)} className="download-btn">⬇ Receipt</button>
                    </div>
                    ))}
                </div>
                )}
            </div>
        </>
      )}

      {/* === TAB 2: EXPLORE & SEARCH === */}
      {activeTab === 'explore' && (
        <>
            {/* Search Bar */}
            <div className="explore-controls">
                <input 
                    type="text" 
                    placeholder="Search places (e.g., Dubai, Beach...)" 
                    className="u-search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select 
                    className="u-filter-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    <option value="All">All Categories</option>
                    <option value="Family">Family</option>
                    <option value="Couple">Couple</option>
                    <option value="Single">Solo / Single</option>
                    <option value="Friends">Friends</option>
                </select>
            </div>

            {/* Results Grid */}
            <div className="u-package-grid">
                {filteredPackages.map(pkg => (
                    <div key={pkg._id} className="u-package-card">
                        <img src={pkg.image} alt={pkg.title} className="u-card-img" />
                        <div className="u-card-body">
                            <span className="u-card-cat">{pkg.category}</span>
                            <h3 className="u-card-title">{pkg.title}</h3>
                            <p className="u-card-info">⏱ {pkg.duration} Days • ✈ Flight Incl.</p>
                            
                            <div className="u-card-footer">
                                <div>
                                    <span style={{fontSize:"12px", color:"#888"}}>Starts from</span><br/>
                                    <span className="u-price">${pkg.costs.flight + pkg.costs.hotel + 200}</span>
                                </div>
                                <button onClick={() => navigate(`/tour/${pkg._id}`)} className="view-btn">
                                    View & Book
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                
                {filteredPackages.length === 0 && (
                    <p style={{gridColumn:"span 3", textAlign:"center", color:"#888"}}>No packages found matching your search.</p>
                )}
            </div>
        </>
      )}

    </div>
  );
};

export default UserDashboard;