import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // Crucial for express-session cookie persistence!
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptor to format errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || "An unexpected error occurred. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export default API;