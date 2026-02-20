import React from "react";
import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded shadow text-center max-w-md">
        <h2 className="text-2xl font-semibold mb-2">Unauthorized</h2>
        <p className="mb-4">You do not have permission to access this page.</p>
        <Link to="/" className="text-indigo-600">Go to Home</Link>
      </div>
    </div>
  );
}