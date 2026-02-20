import React, { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../../firebase";
import { toast } from "react-toastify";

export default function UserForm({
  role,
  title,
}: {
  role: "admin" | "manager" | "staff";
  title: string;
}) {
  const [employeeName, setEmployeeName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const functions = getFunctions(app);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim() || !email.trim()) {
      return toast.error("Name and email are required");
    }
    setLoading(true);
    try {
      const callable = httpsCallable(functions, "createUser");
      const resp = await callable({
        employeeName,
        email,
        password, // required for Auth user creation
        phone,
        role,
      });
      toast.success(`${title} created (${resp.data.employeeId})`);
      setEmployeeName("");
      setEmail("");
      setPhone("");
      setPassword("");
    } catch (err: any) {
      console.error("createUser failed:", err);
      toast.error(err?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white shadow rounded">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <form onSubmit={handleCreate} className="space-y-3">
        <input
          required
          placeholder="Full name"
          value={employeeName}
          onChange={(e) => setEmployeeName(e.target.value)}
          className="input"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
        <input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input"
        />
        <input
          required
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Creating…" : `Create ${title}`}
          </button>
        </div>
      </form>
    </div>
  );
}