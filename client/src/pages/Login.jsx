import React, { useState, useEffect, useCallback } from 'react';
import { auth, googleProvider } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import "./Login.css";

// Custom hooks
const useSessionStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading ${key} from sessionStorage:`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting ${key} in sessionStorage:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

// Validation utilities
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return '';
};

const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return '';
};

// Error message mapping
const ERROR_MESSAGES = {
  // Firebase Errors
  'auth/invalid-credential': 'Invalid email or password. Please try again.',
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/too-many-requests': 'Too many login attempts. Please try again later.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/popup-blocked': 'Popup blocked. Please allow popups for this site.',
  'auth/cancelled-popup-request': 'Sign-in request cancelled. Please try again.',
  'auth/unauthorized-domain': 'Unauthorized domain. Please contact support.',
  
  // Backend Errors
  'USER_EXISTS': 'User already exists in our system.',
  'SERVER_ERROR': 'Server error. Please try again later.',
  'NETWORK_ERROR': 'Network error. Please check your connection.',
};

// Constants - Handle process.env safely
const getApiBaseUrl = () => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    
    if (window.REACT_APP_API_URL) {
      return window.REACT_APP_API_URL;
    }
    
    if (import.meta && import.meta.env && import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
  } catch (error) {
    console.warn('Error reading API URL from environment:', error);
  }
  
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();
const LOGIN_ATTEMPTS_LIMIT = 5;
const LOGIN_ATTEMPTS_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const Login = () => {
  // State management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginAttempts, setLoginAttempts] = useSessionStorage('loginAttempts', 0);
  const [lastAttemptTime, setLastAttemptTime] = useSessionStorage('lastAttemptTime', null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Detect mobile view
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const redirectPath = location.state?.from || '/home';
        navigate(redirectPath, { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate, location]);

  // Reset login attempts after timeout
  useEffect(() => {
    if (lastAttemptTime) {
      const timeSinceLastAttempt = Date.now() - lastAttemptTime;
      if (timeSinceLastAttempt > LOGIN_ATTEMPTS_TIMEOUT) {
        setLoginAttempts(0);
        setLastAttemptTime(null);
      }
    }
  }, [lastAttemptTime, setLoginAttempts, setLastAttemptTime]);

  // Input validation
  const validateForm = useCallback(() => {
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    
    setEmailError(emailValidation);
    setPasswordError(passwordValidation);
    
    return !emailValidation && !passwordValidation;
  }, [email, password]);

  // Handle API errors
  const handleApiError = useCallback((error) => {
    console.error('API Error:', error);
    
    if (error.response) {
      const { data, status } = error.response;
      
      if (status === 429) {
        return ERROR_MESSAGES['auth/too-many-requests'];
      }
      
      return data?.message || ERROR_MESSAGES.SERVER_ERROR;
    } else if (error.request) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    } else {
      return error.message || ERROR_MESSAGES.SERVER_ERROR;
    }
  }, []);

  // Handle Firebase errors
  const handleFirebaseError = useCallback((error) => {
    console.error('Firebase Error:', error);
    
    if (error.code && ERROR_MESSAGES[error.code]) {
      return ERROR_MESSAGES[error.code];
    }
    
    return error.message || 'An unexpected error occurred.';
  }, []);

  // Check and update user role
  const checkUserRole = useCallback(async (user) => {
    try {
      const idToken = await user.getIdToken();
      
      // Store authentication data
      localStorage.setItem('auth_token', idToken);
      localStorage.setItem('user_email', user.email);
      localStorage.setItem('user_name', user.displayName || 'User');
      
      // Determine user role
      const isAdmin = user.email === 'admin@gmail.com' || 
                     user.email.endsWith('@travelhub-admin.com');
      
      localStorage.setItem('user_role', isAdmin ? 'admin' : 'user');
      
      // Reset login attempts on successful login
      setLoginAttempts(0);
      setLastAttemptTime(null);
      
      // Redirect based on role
      const redirectPath = isAdmin ? '/admin-dashboard' : '/home';
      navigate(redirectPath, { 
        state: { 
          user: {
            email: user.email,
            name: user.displayName,
            role: isAdmin ? 'admin' : 'user'
          }
        }
      });
      
    } catch (error) {
      console.error('Role check error:', error);
      navigate('/home');
    }
  }, [navigate, setLoginAttempts, setLastAttemptTime]);

  // Handle email/password login
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (loginAttempts >= LOGIN_ATTEMPTS_LIMIT) {
      setError(ERROR_MESSAGES['auth/too-many-requests']);
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await checkUserRole(userCredential.user);
      
    } catch (error) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      setLastAttemptTime(Date.now());
      
      const errorMessage = handleFirebaseError(error);
      setError(errorMessage);
      
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setPassword('');
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      try {
        await axios.post(`${API_BASE_URL}/api/users/google-login`, {
          email: user.email,
          firebaseUid: user.uid,
          name: user.displayName || 'Google User',
          photoURL: user.photoURL,
          provider: 'google'
        });
      } catch (backendError) {
        console.warn('Backend sync warning:', backendError.message);
      }
      
      await checkUserRole(user);
      
    } catch (error) {
      const errorMessage = handleFirebaseError(error);
      setError(errorMessage);
      
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!email || emailError) {
      setError('Please enter a valid email address first');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await sendPasswordResetEmail(auth, email);
      setError('Password reset email sent. Please check your inbox.');
      
    } catch (error) {
      const errorMessage = handleFirebaseError(error);
      setError(`Password reset failed: ${errorMessage}`);
      
    } finally {
      setIsLoading(false);
    }
  };

  // Handle demo login
  const handleDemoLogin = async (type) => {
    const demoCredentials = {
      admin: { email: 'admin@gmail.com', password: 'admin123' },
      user: { email: 'user@gmail.com', password: 'user123' }
    };
    
    setEmail(demoCredentials[type].email);
    setPassword(demoCredentials[type].password);
    
    setTimeout(async () => {
      const event = { preventDefault: () => {} };
      await handleLogin(event);
    }, 300);
  };

  // Handle key press for form submission
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLogin(e);
    }
  };

  return (
    <div className={`login-container ${isMobile ? 'mobile-view' : ''}`}>
      {/* Left Form Section */}
      <div className="login-form-section">
        {/* Header */}
        <div className="login-header">
          <div className="logo-container">
            <div className="logo-icon">✈️</div>
            <h1>TravelHub</h1>
            <span className="login-badge">Login</span>
          </div>
          <h2>Welcome Back</h2>
          <p className="login-subtitle">Sign in to your account to continue your journey</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`error-message ${error.includes('sent') ? 'success-message' : ''}`}>
            <span className="error-icon">
              {error.includes('sent') ? '✓' : '⚠'}
            </span>
            <div className="error-content">
              <p className="error-title">
                {error.includes('sent') ? 'Success!' : 'Error'}
              </p>
              <p className="error-desc">{error}</p>
            </div>
            <button 
              className="error-close" 
              onClick={() => setError('')}
              aria-label="Close error message"
            >
              ×
            </button>
          </div>
        )}

        {/* Login Attempts Warning */}
        {loginAttempts > 0 && (
          <div className="security-info attempts-warning">
            <span className="warning-icon">⚠</span>
            <span className="warning-text">
              Login attempts: {loginAttempts}/{LOGIN_ATTEMPTS_LIMIT}
            </span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="login-form" noValidate>
          {/* Email Input */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address <span className="required">*</span>
            </label>
            <div className="input-container">
              <input
                id="email"
                type="email"
                className={`form-input ${emailError ? 'error' : ''}`}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailError(validateEmail(email))}
                disabled={isLoading}
                autoComplete="email"
                required
              />
              <span className="input-icon">✉️</span>
            </div>
            {emailError && <span className="error-text">{emailError}</span>}
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password <span className="required">*</span>
            </label>
            <div className="input-container">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${passwordError ? 'error' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordError(validatePassword(password))}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                autoComplete="current-password"
                required
              />
              <div className="password-actions">
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
            {passwordError && <span className="error-text">{passwordError}</span>}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                className="checkbox-input"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <span className="checkmark"></span>
              <span className="checkbox-text">Remember me</span>
            </label>
            <button
              type="button"
              className="forgot-password"
              onClick={handleForgotPassword}
              disabled={isLoading}
            >
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="login-btn"
            disabled={isLoading || !email || !password}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                <span className="btn-text">Signing In...</span>
              </>
            ) : (
              <>
                <span className="btn-icon">→</span>
                <span className="btn-text">Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Login */}
        <div className="demo-login">
          <p className="demo-label">Quick Demo</p>
          <div className="demo-buttons">
            <button
              className="demo-btn admin"
              onClick={() => handleDemoLogin('admin')}
              disabled={isLoading}
            >
              <span className="demo-icon">👑</span>
              Admin Demo
            </button>
            <button
              className="demo-btn user"
              onClick={() => handleDemoLogin('user')}
              disabled={isLoading}
            >
              <span className="demo-icon">👤</span>
              User Demo
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="divider">
          <span>or continue with</span>
        </div>

        {/* Social Login */}
        <div className="social-login">
          <button
            className="google-btn"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <span className="google-icon-wrapper">
              <svg className="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </span>
            Sign in with Google
          </button>
        </div>

        {/* Registration & Guest Access */}
        <div className="registration-section">
          <p className="registration-link">
            Don't have an account?{' '}
            <Link to="/register" className="registration-text">
              Create account
            </Link>
          </p>
        </div>
        <div className="guest-access">
          <Link to="/home" className="guest-link">
            <span>→</span> Continue as guest
          </Link>
        </div>

        {/* Security Info */}
        <div className="security-info">
          <span className="security-icon">🔒</span>
          <span className="security-text">Your data is securely encrypted</span>
        </div>
      </div>

      {/* Right Content Section (Hidden on mobile) */}
      {!isMobile && (
        <div className="login-content-section">
          <div className="content-wrapper">
            <div className="welcome-badge">
              <span className="badge-icon">✨</span>
              <span className="badge-text">Trusted by 1M+ Travelers</span>
            </div>
            
            <h1 className="content-title">
              Discover Your Next Adventure
            </h1>
            <p className="content-description">
              Join millions of travelers who trust TravelHub to find the best deals, 
              plan perfect itineraries, and create unforgettable memories.
            </p>

            {/* Features Grid */}
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">✈️</div>
                <h3 className="feature-title">Best Deals</h3>
                <p className="feature-desc">Find exclusive offers on flights and hotels</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🏨</div>
                <h3 className="feature-title">Premium Stays</h3>
                <p className="feature-desc">Luxury accommodations at affordable prices</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🗺️</div>
                <h3 className="feature-title">Smart Planning</h3>
                <p className="feature-desc">AI-powered itinerary suggestions</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⭐</div>
                <h3 className="feature-title">Verified Reviews</h3>
                <p className="feature-desc">Real experiences from fellow travelers</p>
              </div>
            </div>

            {/* Testimonial */}
            <div className="testimonial-slider">
              <p className="testimonial-text">
                TravelHub completely transformed how I plan my vacations. 
                The deals are unbeatable and the user experience is seamless!
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">JS</div>
                <div className="author-info">
                  <div className="author-name">Jessica Smith</div>
                  <div className="author-role">Frequent Traveler</div>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="quick-tips">
              <h3 className="tips-title">
                <span>💡</span> Quick Tips
              </h3>
              <ul className="tips-list">
                <li>Use demo accounts to explore features</li>
                <li>Save your preferences for faster booking</li>
                <li>Enable notifications for deal alerts</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// PropTypes for type checking
Login.propTypes = {
  // Add any props if needed
};

export default Login;