import { useState } from "react";
import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset link sent! Check your inbox.");
      setError("");
    } catch (err) {
      setError("Failed to reset password. Check if the email is correct.");
      setMessage("");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Reset Password</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      <form onSubmit={handleReset} style={styles.form}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Send Reset Link</button>
      </form>
      <div style={{ marginTop: "15px" }}>
        <Link to="/login">Back to Login</Link>
      </div>
    </div>
  );
};
const handleReset = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset link sent! Check your inbox.");
      setError("");
      
    // REPLACE THIS PART BELOW:
    } catch (err) {
      // THIS IS THE NEW LINE TO ADD:
      console.error("FIREBASE ERROR:", err.code, err.message); 
      
      setError("Failed to reset password. Check console for details.");
      setMessage("");
    }
  };

const styles = {
  container: { textAlign: "center", marginTop: "50px" },
  form: { display: "flex", flexDirection: "column", maxWidth: "300px", margin: "auto" },
  input: { padding: "10px", marginBottom: "10px", fontSize: "16px" },
  button: { padding: "10px", background: "orange", color: "white", border: "none", cursor: "pointer" }
};

export default ForgotPassword;