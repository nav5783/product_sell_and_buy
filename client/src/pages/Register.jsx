import { useState, useEffect } from "react";
import { auth, googleProvider } from "../firebase";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Register.css"; // Create this CSS file

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  // Detect device type
  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      setIsIOS(/iphone|ipad|ipod/.test(userAgent));
      setIsAndroid(/android/.test(userAgent));
      setIsMobile(window.innerWidth <= 768);
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    
    // Add platform classes
    if (isIOS) {
      document.body.classList.add('ios-device');
    } else if (isAndroid) {
      document.body.classList.add('android-device');
    }

    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Validation functions
  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return "Full name is required";
        if (value.length < 2) return "Name must be at least 2 characters";
        return "";
        
      case 'phone':
        if (!value.trim()) return "Phone number is required";
        const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(value)) return "Enter a valid phone number";
        return "";
        
      case 'email':
        if (!value.trim()) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Enter a valid email address";
        return "";
        
      case 'password':
        if (!value) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) 
          return "Password must include uppercase, lowercase, and number";
        return "";
        
      case 'confirmPassword':
        if (!value) return "Please confirm your password";
        if (value !== formData.password) return "Passwords do not match";
        return "";
        
      default:
        return "";
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        errors[key] = error;
        isValid = false;
      }
    });

    // Check terms agreement
    if (!agreedToTerms) {
      errors.terms = "You must agree to the Terms & Conditions";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Email/Password Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!validateForm()) {
      setError("Please fix the errors below");
      return;
    }

    setLoading(true);

    try {
      // 1. Create User in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      const user = userCredential.user;

      // 2. Save User Details to MongoDB Backend
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/register`,
        {
          name: formData.name,
          phone: formData.phone,
          email: user.email,
          firebaseUid: user.uid,
          platform: isIOS ? "ios" : isAndroid ? "android" : "web",
          registrationDate: new Date().toISOString()
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // 3. Auto-login after successful registration
      localStorage.setItem('userName', formData.name);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userRole', res.data.user?.role || 'user');
      localStorage.setItem('registrationComplete', 'true');

      // Show success and redirect
      setTimeout(() => {
        navigate("/home", { 
          state: { 
            welcomeMessage: `Welcome ${formData.name}! Your account has been created successfully.`,
            user: res.data.user
          }
        });
      }, 1500);

    } catch (err) {
      console.error("Registration error:", err);
      
      const errorMessages = {
        "auth/email-already-in-use": "This email is already registered. Please try logging in.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/operation-not-allowed": "Email/password registration is currently disabled.",
        "auth/weak-password": "Password is too weak. Please use a stronger password.",
        "auth/network-request-failed": "Network error. Please check your connection.",
        "ERR_NETWORK": "Cannot connect to server. Please try again later.",
        "ECONNABORTED": "Request timeout. Please try again.",
      };

      setError(errorMessages[err.code] || 
               errorMessages[err.message] || 
               "Registration failed. Please try again.");
      
      // Clear password fields on error
      setFormData(prev => ({
        ...prev,
        password: "",
        confirmPassword: ""
      }));
    } finally {
      setLoading(false);
    }
  };

  // Google Registration/Login
  const handleGoogleRegister = async () => {
    if (loading) return;
    
    setLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      
      // Platform-specific settings
      if (isMobile) {
        provider.setCustomParameters({ 
          prompt: 'select_account',
          display: 'touch'
        });
      }

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Send to backend
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/google-login`,
        {
          name: user.displayName || "Google User",
          email: user.email,
          firebaseUid: user.uid,
          photoURL: user.photoURL,
          provider: "google",
          registrationDate: new Date().toISOString()
        }
      );

      // Store user data
      localStorage.setItem('userName', user.displayName || "User");
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userRole', res.data.user?.role || 'user');
      localStorage.setItem('registrationComplete', 'true');

      // Redirect to home
      setTimeout(() => {
        navigate("/home", { 
          state: { 
            welcomeMessage: `Welcome ${user.displayName || "User"}!`,
            user: res.data.user
          }
        });
      }, 1000);

    } catch (err) {
      console.error("Google registration error:", err);
      
      const errorMessages = {
        "auth/popup-closed-by-user": "Google sign-in was cancelled.",
        "auth/popup-blocked": isMobile 
          ? "Redirect blocked. Please try the email registration method." 
          : "Popup was blocked. Please allow popups and try again.",
        "auth/unauthorized-domain": "Unauthorized domain. Contact support.",
      };

      setError(errorMessages[err.code] || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleRegister(e);
    }
  };

  // Get country code for phone input
  const getCountryCode = () => {
    if (isIOS || isAndroid) {
      return "+1"; // Default to US for mobile
    }
    return "+91"; // Default to India for web
  };

  return (
    <div className={`register-container ${isMobile ? 'mobile-view' : ''} ${isIOS ? 'ios-platform' : ''}`}>
      
      {/* Left Side - Registration Form */}
      <div className="register-form-section">
        <div className="register-header">
          <div className="logo">
            <span className="logo-icon">✈️</span>
            <h1>TravelHub</h1>
            <span className="register-badge">Join Now</span>
          </div>
          <h2>Create Your Account</h2>
          <p className="register-subtitle">Start your journey with personalized travel experiences</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message animate-shake">
            <span className="error-icon">⚠️</span>
            <div className="error-content">
              <p className="error-title">Registration Failed</p>
              <p className="error-desc">{error}</p>
            </div>
            <button 
              className="error-close" 
              onClick={() => setError("")}
              aria-label="Close error message"
            >
              ×
            </button>
          </div>
        )}

        {/* Success Message (on redirect) */}
        {localStorage.getItem('registrationComplete') && (
          <div className="success-message">
            <span className="success-icon">🎉</span>
            <div className="success-content">
              <p className="success-title">Welcome to TravelHub!</p>
              <p className="success-desc">Your account has been created successfully</p>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="register-form" noValidate>
          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="name">
              Full Name
              <span className="required">*</span>
            </label>
            <div className="input-container">
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                onBlur={() => {
                  const error = validateField('name', formData.name);
                  setFormErrors(prev => ({ ...prev, name: error }));
                }}
                required
                disabled={loading}
                className={`form-input ${formErrors.name ? "error" : ""}`}
                autoComplete="name"
                autoFocus={!isMobile}
                inputMode="text"
              />
              <span className="input-icon">👤</span>
            </div>
            {formErrors.name && <span className="error-text">{formErrors.name}</span>}
          </div>

          {/* Phone Field with Country Code */}
          <div className="form-group">
            <label htmlFor="phone">
              Phone Number
              <span className="required">*</span>
            </label>
            <div className="phone-input-container">
              <div className="country-code">
                <span className="country-flag">📱</span>
                <select 
                  className="country-select"
                  defaultValue={getCountryCode()}
                  disabled={loading}
                >
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+61">🇦🇺 +61</option>
                  <option value="+81">🇯🇵 +81</option>
                </select>
              </div>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Phone number"
                value={formData.phone}
                onChange={handleChange}
                onBlur={() => {
                  const error = validateField('phone', formData.phone);
                  setFormErrors(prev => ({ ...prev, phone: error }));
                }}
                required
                disabled={loading}
                className={`form-input ${formErrors.phone ? "error" : ""}`}
                autoComplete="tel"
                inputMode="tel"
              />
            </div>
            {formErrors.phone && <span className="error-text">{formErrors.phone}</span>}
            <p className="input-hint">We'll use this for important updates</p>
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">
              Email Address
              <span className="required">*</span>
            </label>
            <div className="input-container">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => {
                  const error = validateField('email', formData.email);
                  setFormErrors(prev => ({ ...prev, email: error }));
                }}
                required
                disabled={loading}
                className={`form-input ${formErrors.email ? "error" : ""}`}
                autoComplete="email"
                inputMode="email"
              />
              <span className="input-icon">✉️</span>
            </div>
            {formErrors.email && <span className="error-text">{formErrors.email}</span>}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">
              Password
              <span className="required">*</span>
            </label>
            <div className="input-container">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                onBlur={() => {
                  const error = validateField('password', formData.password);
                  setFormErrors(prev => ({ ...prev, password: error }));
                }}
                onKeyPress={handleKeyPress}
                required
                disabled={loading}
                className={`form-input ${formErrors.password ? "error" : ""}`}
                autoComplete="new-password"
              />
              <div className="password-actions">
                <button 
                  type="button" 
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>
            {formErrors.password && <span className="error-text">{formErrors.password}</span>}
            <div className="password-strength">
              <div className={`strength-bar ${formData.password.length >= 8 ? 'active' : ''}`}></div>
              <div className={`strength-bar ${/(?=.*[a-z])/.test(formData.password) ? 'active' : ''}`}></div>
              <div className={`strength-bar ${/(?=.*[A-Z])/.test(formData.password) ? 'active' : ''}`}></div>
              <div className={`strength-bar ${/(?=.*\d)/.test(formData.password) ? 'active' : ''}`}></div>
            </div>
            <p className="input-hint">At least 8 characters with uppercase, lowercase, and number</p>
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm Password
              <span className="required">*</span>
            </label>
            <div className="input-container">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={() => {
                  const error = validateField('confirmPassword', formData.confirmPassword);
                  setFormErrors(prev => ({ ...prev, confirmPassword: error }));
                }}
                required
                disabled={loading}
                className={`form-input ${formErrors.confirmPassword ? "error" : ""}`}
                autoComplete="new-password"
              />
              <div className="password-actions">
                <button 
                  type="button" 
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>
            {formErrors.confirmPassword && (
              <span className="error-text">{formErrors.confirmPassword}</span>
            )}
          </div>

          {/* Terms & Conditions */}
          <div className="form-group terms-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={loading}
                className="checkbox-input"
              />
              <span className="checkmark"></span>
              <span className="checkbox-text">
                I agree to the <Link to="/terms" className="terms-link">Terms & Conditions</Link> and 
                <Link to="/privacy" className="terms-link"> Privacy Policy</Link>
              </span>
            </label>
            {formErrors.terms && <span className="error-text">{formErrors.terms}</span>}
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="register-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span className="btn-text">Creating Account...</span>
              </>
            ) : (
              <>
                <span className="btn-icon">🚀</span>
                <span className="btn-text">Create Account</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="divider">
          <span>or sign up with</span>
        </div>

        {/* Social Registration */}
        <div className="social-register">
          <button 
            onClick={handleGoogleRegister} 
            className="google-btn"
            disabled={loading}
            aria-label="Sign up with Google"
          >
            <div className="google-icon-wrapper">
              <img 
                src="https://www.google.com/favicon.ico" 
                alt="Google" 
                className="google-icon"
                loading="lazy"
              />
            </div>
            <span className="btn-text">Continue with Google</span>
          </button>

          {/* Additional social options */}
          {isIOS && (
            <button 
              onClick={() => setError("Apple Sign Up coming soon!")}
              className="apple-btn"
              disabled={loading}
            >
              <span className="apple-icon"></span>
              <span className="btn-text">Continue with Apple</span>
            </button>
          )}
        </div>

        {/* Already have account */}
        <div className="login-section">
          <p className="login-link">
            Already have an account? 
            <Link to="/login" className="login-text">
              Sign in here
            </Link>
          </p>
        </div>

        {/* Security Info */}
        <div className="security-info">
          <span className="security-icon">🔒</span>
          <span className="security-text">
            Your data is protected with 256-bit SSL encryption
          </span>
        </div>

        {/* Registration Benefits */}
        <div className="benefits-box">
          <h3 className="benefits-title">🎁 Sign up benefits:</h3>
          <ul className="benefits-list">
            <li>Get 10% off your first booking</li>
            <li>Access to exclusive member-only deals</li>
            <li>Personalized travel recommendations</li>
            <li>Priority customer support</li>
          </ul>
        </div>
      </div>

      {/* Right Side - Benefits & Features */}
      <div className="register-content-section">
        <div className="content-wrapper">
          <div className="welcome-badge">
            <span className="badge-icon">⭐</span>
            <span className="badge-text">Join 500,000+ Happy Travelers</span>
          </div>
          
          <h2 className="content-title">Start Your Adventure Today</h2>
          <p className="content-description">
            Create your account to unlock personalized travel experiences, 
            exclusive deals, and seamless booking across all your devices.
          </p>
          
          {/* Registration Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">✈️</div>
              <div className="stat-content">
                <h3 className="stat-number">500K+</h3>
                <p className="stat-label">Travelers Joined</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <h3 className="stat-number">4.8</h3>
                <p className="stat-label">Average Rating</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🌎</div>
              <div className="stat-content">
                <h3 className="stat-number">150+</h3>
                <p className="stat-label">Countries Covered</p>
              </div>
            </div>
          </div>
          
          {/* Features */}
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Personalized Experience</h3>
              <p className="feature-desc">Get recommendations based on your preferences</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3 className="feature-title">Best Price Guarantee</h3>
              <p className="feature-desc">We guarantee the lowest prices or we'll match it</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3 className="feature-title">Secure Booking</h3>
              <p className="feature-desc">Your payments and data are 100% secure</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3 className="feature-title">Mobile Friendly</h3>
              <p className="feature-desc">Access your account from any device</p>
            </div>
          </div>
          
          {/* Testimonials */}
          <div className="testimonial-slider">
            <div className="testimonial">
              <p className="testimonial-text">
                "TravelHub made planning my dream vacation so easy! The personalized recommendations were spot on."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">SR</div>
                <div className="author-info">
                  <h4 className="author-name">Sarah R.</h4>
                  <p className="author-role">Premium Member</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Tips */}
          <div className="quick-tips">
            <h3 className="tips-title">💡 Quick Tips:</h3>
            <ul className="tips-list">
              <li>Use a strong, unique password</li>
              <li>Verify your email for account security</li>
              <li>Download our mobile app for better experience</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner-circle"></div>
            <p>Setting up your account...</p>
            <p className="loading-sub">This will just take a moment</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;