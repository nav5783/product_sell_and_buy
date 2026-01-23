import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Home.css";

// Import icons as React components or use SVG
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const ArrowRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

const StarIcon = ({ filled = false }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={filled ? "#FFD700" : "none"} stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const FireIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FF6B6B" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
  </svg>
);

const PercentageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="5" x2="5" y2="19"></line>
    <circle cx="6.5" cy="6.5" r="2.5"></circle>
    <circle cx="17.5" cy="17.5" r="2.5"></circle>
  </svg>
);

const HeartIcon = ({ filled = false }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? "#FF6B6B" : "none"} stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

const PlaneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13"></path>
    <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
  </svg>
);

const Home = () => {
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [featuredPackages, setFeaturedPackages] = useState([]);
  const [wishlist, setWishlist] = useState(new Set());

  const categories = [
    { name: "Family", icon: "👨‍👩‍👧‍👦", color: "#3B82F6", image: "https://images.unsplash.com/photo-1578836537282-3171d77f8632?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" },
    { name: "Temple", icon: "🕉️", color: "#8B5CF6", image: "https://images.unsplash.com/photo-1585506936724-fa0c19d6b158?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" },
    { name: "Couples", icon: "❤️", color: "#EC4899", image: "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" },
    { name: "Friends", icon: "🎒", color: "#10B981", image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" },
    { name: "IV Trip", icon: "🏭", color: "#F59E0B", image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" },
    { name: "Tracking", icon: "🥾", color: "#EF4444", image: "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" }
  ];

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/tours");
        const allPackages = res.data;
        setPackages(allPackages);
        setFilteredPackages(allPackages);
        
        const featured = allPackages
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 3);
        setFeaturedPackages(featured);
      } catch (err) { 
        console.error(err); 
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const filterPackages = (category) => {
    setActiveCategory(category);
    if (category === "All") {
      setFilteredPackages(packages);
    } else {
      const filtered = packages.filter(p => 
        p.category.toLowerCase().includes(category.toLowerCase())
      );
      setFilteredPackages(filtered);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (!term.trim()) {
      filterPackages(activeCategory);
      return;
    }

    const filtered = packages.filter(p =>
      p.title.toLowerCase().includes(term.toLowerCase()) ||
      p.description?.toLowerCase().includes(term.toLowerCase()) ||
      p.category.toLowerCase().includes(term.toLowerCase()) ||
      p.location?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredPackages(filtered);
  };

  const toggleWishlist = (id) => {
    const newWishlist = new Set(wishlist);
    if (newWishlist.has(id)) {
      newWishlist.delete(id);
    } else {
      newWishlist.add(id);
    }
    setWishlist(newWishlist);
  };

  const getRatingStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <StarIcon key={i} filled={i < Math.floor(rating || 4)} />
      );
    }
    return stars;
  };

  const calculateTotalPrice = (pkg) => {
    return (pkg.costs?.flight || 0) + (pkg.costs?.hotel || 0) + (pkg.costs?.food || 0) + 100;
  };

  const getCategoryImage = (categoryName) => {
    const category = categories.find(c => c.name === categoryName);
    return category?.image || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80";
  };

  return (
    <div className="home-container">
      
      {/* 1. HERO SECTION - Enhanced */}
      <div className="hero-section">
        <div className="hero-overlay">
          <div className="hero-content">
            <div className="hero-badge">
              <FireIcon /> Best Travel Experience 2024
            </div>
            <h1>Discover Your Perfect <span className="gradient-text">Getaway</span></h1>
            <p className="hero-subtitle">
              Curated travel experiences that blend adventure, luxury, and culture at unbeatable prices.
            </p>
            
            {/* Search Bar */}
            <div className="search-container">
              <div className="search-icon-wrapper">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search destinations, packages, or categories..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
              />
              <button className="search-btn">
                Find Tours <ArrowRight />
              </button>
            </div>

            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">500+</span>
                <span className="stat-label">Destinations</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">98%</span>
                <span className="stat-label">Satisfaction</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Support</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">50K+</span>
                <span className="stat-label">Travelers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FEATURED PACKAGES */}
      {featuredPackages.length > 0 && (
        <section className="featured-section">
          <div className="section-header">
            <div className="header-decorative">
              <span className="decorative-line"></span>
              <h2>Featured Packages</h2>
              <span className="decorative-line"></span>
            </div>
            <p className="section-subtitle">Handpicked experiences for extraordinary journeys</p>
          </div>
          <div className="featured-grid">
            {featuredPackages.map((pkg) => (
              <div key={pkg._id} className="featured-card">
                <div className="featured-badge">
                  <PercentageIcon /> {Math.floor(Math.random() * 20) + 15}% OFF
                </div>
                <div className="featured-image-container">
                  <img src={pkg.image} alt={pkg.title} className="featured-image" />
                  <div className="image-overlay"></div>
                </div>
                <div className="featured-content">
                  <div className="featured-category">{pkg.category}</div>
                  <h3>{pkg.title}</h3>
                  <div className="featured-rating">
                    <div className="stars">
                      {getRatingStars(pkg.rating)}
                    </div>
                    <span className="rating-text">({pkg.reviews || 42} reviews)</span>
                  </div>
                  <div className="featured-details">
                    <span className="detail-with-icon">
                      <LocationIcon />
                      <span>{pkg.location || "Multiple Locations"}</span>
                    </span>
                    <span className="detail-with-icon">
                      <ClockIcon />
                      <span>{pkg.duration} Days</span>
                    </span>
                  </div>
                  <div className="featured-price">
                    <span className="original-price">${calculateTotalPrice(pkg) + 200}</span>
                    <span className="discount-price">${calculateTotalPrice(pkg)}</span>
                    <span className="price-note">per person</span>
                  </div>
                  <Link to={`/tour/${pkg._id}`} className="featured-btn">
                    <span>Book Now</span>
                    <ArrowRight />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. ABOUT SECTION */}
      <section className="about-section">
        <div className="about-content">
          <div className="about-text">
            <div className="section-badge">
              <PlaneIcon />
              Why Choose Us
            </div>
            <h2>Your Trusted Travel Partner</h2>
            <p className="about-description">
              As India's premier travel brand, we specialize in crafting unforgettable journeys that 
              resonate with your soul. From spiritual <strong className="highlight">Temple Pilgrimages</strong> to romantic 
              <strong className="highlight"> Honeymoon Escapes</strong> and educational <strong className="highlight">Industrial Tours</strong>, 
              every itinerary is meticulously designed for excellence.
            </p>
            <div className="about-features">
              <div className="about-feature">
                <div className="feature-icon">✓</div>
                <div className="feature-text">
                  <h4>100% Tailor-Made Experiences</h4>
                  <p>Personalized itineraries crafted just for you</p>
                </div>
              </div>
              <div className="about-feature">
                <div className="feature-icon">✓</div>
                <div className="feature-text">
                  <h4>Best Price Guarantee</h4>
                  <p>We'll match any lower price you find</p>
                </div>
              </div>
              <div className="about-feature">
                <div className="feature-icon">✓</div>
                <div className="feature-text">
                  <h4>24/7 Dedicated Support</h4>
                  <p>Round-the-clock assistance throughout your journey</p>
                </div>
              </div>
            </div>
            <Link to="/about" className="about-cta">
              <span>Learn More About Us</span>
              <ArrowRight />
            </Link>
          </div>
          <div className="about-image">
            <div className="image-frame">
              <img 
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                alt="Travel Experience" 
              />
              <div className="image-caption">
                <div className="caption-text">Experience the World with Us</div>
                <div className="caption-subtext">Since 2010</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CATEGORY SELECTOR */}
      <section className="category-section">
        <div className="section-header">
          <h2>Browse by Category</h2>
          <p className="section-subtitle">Find your perfect travel style</p>
        </div>
        <div className="categories-grid">
          <button
            className={`category-card ${activeCategory === 'All' ? 'active' : ''}`}
            onClick={() => filterPackages("All")}
          >
            <div className="category-icon">
              <span className="category-all">🌏</span>
            </div>
            <span className="category-name">All Tours</span>
            <span className="category-count">{packages.length} tours</span>
          </button>
          
          {categories.map((cat) => (
            <button
              key={cat.name}
              className={`category-card ${activeCategory === cat.name ? 'active' : ''}`}
              onClick={() => filterPackages(cat.name)}
              style={{ '--cat-color': cat.color }}
            >
              <div className="category-icon">
                <span style={{ color: cat.color, fontSize: '32px' }}>{cat.icon}</span>
              </div>
              <span className="category-name">{cat.name}</span>
              <span className="category-count">
                {packages.filter(p => p.category.toLowerCase().includes(cat.name.toLowerCase())).length} tours
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 5. PACKAGE GRID */}
      <section id="packages" className="packages-section">
        <div className="section-header">
          <div className="header-left">
            <div className="header-decorative">
              <span className="decorative-line"></span>
              <h2>Popular Tour Packages</h2>
              <span className="decorative-line"></span>
            </div>
            <p className="results-count">{filteredPackages.length} packages found</p>
          </div>
          <div className="sort-options">
            <div className="sort-container">
              <span className="sort-label">Sort by:</span>
              <select className="sort-select">
                <option>Popularity</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Duration</option>
                <option>Rating</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading amazing tours...</p>
            <p className="loading-subtext">Preparing your next adventure</p>
          </div>
        ) : filteredPackages.length > 0 ? (
          <div className="packages-grid">
            {filteredPackages.map((pkg) => (
              <div key={pkg._id} className="package-card">
                <div className="package-image">
                  <img src={pkg.image} alt={pkg.title} />
                  <div className="package-badges">
                    <span 
                      className="category-badge" 
                      style={{ 
                        backgroundColor: `${categories.find(c => c.name === pkg.category)?.color}20`,
                        color: categories.find(c => c.name === pkg.category)?.color 
                      }}
                    >
                      {pkg.category}
                    </span>
                    {Math.random() > 0.5 && (
                      <span className="discount-badge">
                        <PercentageIcon /> {Math.floor(Math.random() * 15) + 10}% OFF
                      </span>
                    )}
                  </div>
                  <button 
                    className={`wishlist-btn ${wishlist.has(pkg._id) ? 'active' : ''}`}
                    onClick={() => toggleWishlist(pkg._id)}
                  >
                    <HeartIcon filled={wishlist.has(pkg._id)} />
                  </button>
                </div>
                <div className="package-content">
                  <div className="package-header">
                    <h3>{pkg.title}</h3>
                    <div className="package-rating">
                      <div className="stars">
                        {getRatingStars(pkg.rating || 4)}
                      </div>
                      <span className="rating-text">{pkg.rating || 4.0}</span>
                    </div>
                  </div>
                  <p className="package-description">
                    {pkg.description?.substring(0, 100) || "Experience the perfect getaway with this amazing tour package..."}
                  </p>
                  <div className="package-details">
                    <div className="detail-item">
                      <ClockIcon />
                      <span>{pkg.duration} Days</span>
                    </div>
                    <div className="detail-item">
                      <UsersIcon />
                      <span>{pkg.category}</span>
                    </div>
                    <div className="detail-item">
                      <LocationIcon />
                      <span>{pkg.location || "Various Locations"}</span>
                    </div>
                  </div>
                  <div className="package-footer">
                    <div className="package-price">
                      <div className="price-from">Starting from</div>
                      <div className="price-amount">${calculateTotalPrice(pkg)}</div>
                      <div className="price-per">per person</div>
                    </div>
                    <Link to={`/tour/${pkg._id}`} className="package-btn">
                      <span>View Details</span>
                      <ArrowRight />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-packages">
            <div className="no-packages-icon">✈️</div>
            <h3>No packages found for "{activeCategory}"</h3>
            <p>Try selecting a different category or check back soon for new additions!</p>
            <button className="reset-btn" onClick={() => filterPackages("All")}>
              Show All Packages
            </button>
          </div>
        )}
      </section>

      {/* 6. CTA SECTION */}
      <section className="cta-section">
        <div className="cta-content">
          <div className="cta-decorative">
            <span className="cta-line"></span>
            <h2>Ready for Your Next Adventure?</h2>
            <span className="cta-line"></span>
          </div>
          <p className="cta-subtitle">Sign up today and get 15% off your first booking!</p>
          <div className="cta-stats">
            <div className="cta-stat">
              <span className="cta-stat-number">50K+</span>
              <span className="cta-stat-label">Happy Travelers</span>
            </div>
            <div className="cta-stat">
              <span className="cta-stat-number">150+</span>
              <span className="cta-stat-label">Countries</span>
            </div>
            <div className="cta-stat">
              <span className="cta-stat-number">4.9</span>
              <span className="cta-stat-label">Average Rating</span>
            </div>
          </div>
          <div className="cta-buttons">
            <Link to="/register" className="cta-btn-primary">
              <span>Create Free Account</span>
              <ArrowRight />
            </Link>
            <Link to="/contact" className="cta-btn-secondary">
              Contact Our Experts
            </Link>
          </div>
          <p className="cta-note">No credit card required • Free cancellation • Best price guarantee</p>
        </div>
      </section>

      {/* 7. NEWSLETTER SECTION */}
      <section className="newsletter-section">
        <div className="newsletter-content">
          <h3>Stay Updated with Travel Deals</h3>
          <p>Subscribe to our newsletter and be the first to know about exclusive offers</p>
          <div className="newsletter-form">
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className="newsletter-input"
            />
            <button className="newsletter-btn">
              Subscribe
            </button>
          </div>
          <p className="newsletter-note">We respect your privacy. Unsubscribe at any time.</p>
        </div>
      </section>

    </div>
  );
};

export default Home;