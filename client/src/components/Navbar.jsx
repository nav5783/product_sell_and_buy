import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase"; // Ensure this path is correct
import { signOut } from "firebase/auth";
import "./Navbar.css"; // We will create/update this CSS file below

const Navbar = () => {
  const navigate = useNavigate();
  const user = auth.currentUser; // Get current logged-in user
  
  // You might be storing role in localStorage (optional)
  const userRole = localStorage.getItem("role");

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("role"); // Clear role on logout
    navigate("/login");
  };

  return (
    <nav className="navbar">
      {/* LEFT SIDE: Logo & Main Links */}
      <div className="nav-left">
        <Link to="/" className="logo">
          🌍 TravelApp
        </Link>
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/packages" className="nav-link">Packages</Link> {/* Optional */}
      </div>

      {/* RIGHT SIDE: Auth Buttons */}
      <div className="nav-right">
        {user ? (
          <>
            {/* Show Admin Dashboard if Admin */}
            {userRole === "admin" && (
              <Link to="/admin-dashboard">
                <button className="nav-btn admin-btn">Admin Panel</button>
              </Link>
            )}

            {/* Show User Dashboard if NOT Admin */}
            {userRole !== "admin" && (
              <Link to="/dashboard">
                <button className="nav-btn dashboard-btn">My Dashboard</button>
              </Link>
            )}

            {/* Logout Button */}
            <button onClick={handleLogout} className="nav-btn logout-btn">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register">
              <button className="nav-btn register-btn">Register</button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;