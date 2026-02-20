import React, { useState, useEffect } from "react";
import { doc, setDoc, serverTimestamp, getDocs, collection, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";
import type { EmployeeLogin,EmployeeRole } from "../../types/employeeLogin";
import { httpsCallable } from "firebase/functions";
// import { functions } from "../../firebase"; // make sure functions is exported from firebase config

// const createEmployeeUser = httpsCallable(functions, "createEmployeeUser");
// const deleteEmployeeUser = httpsCallable(functions, "deleteEmployeeUser");
// const resetPasswordFn = httpsCallable(functions, "resetEmployeePassword");

interface Props {
  open: boolean;
  title: string;
  initial?: EmployeeLogin | null;
  onClose: () => void;
}

export default function EmployeeLoginAddEditModal({ open, title, initial, onClose }: Props) {
  const [form, setForm] = useState<EmployeeLogin>(
    initial || {
      employeeId: "",
      employeeName: "",
      email: "",
      phone: "",
      role: "staff",
      createdAt: null,
      updatedAt: null,
    }
  );
  const [loading, setLoading] = useState(false);

  // Generate new employeeId
  const generateEmployeeId = async () => {
    const q = query(
      collection(db, "employeeLogin"),
      orderBy("employeeId", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const lastId = snapshot.docs[0].data().employeeId;
      const num = parseInt(lastId.replace("EMP", "")) + 1;
      return `EMP${String(num).padStart(4, "0")}`;
    }
    return "EMP0001";
  };

  useEffect(() => {
    if (!initial) {
      generateEmployeeId().then((id) => setForm((prev) => ({ ...prev, employeeId: id })));
    }
  }, [initial]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.employeeName || !form.email || !form.phone || !form.role) return;
    setLoading(true);
    try {
      if (!initial) {
        // Create in Firebase Auth + Firestore
        await createEmployeeUser({
          email: form.email,
          password: "Default@123", // default password, later can reset
          role: form.role,
          employeeName: form.employeeName,
          phone: form.phone,
          employeeId: form.employeeId,
        });

        await setDoc(doc(db, "employeeLogin", form.employeeId), {
          ...form,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Update Firestore only
        await setDoc(doc(db, "employeeLogin", initial.employeeId), {
          ...form,
          updatedAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (err) {
      console.error("Error saving employee:", err);
      alert("Error saving employee");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!form.email) return;
    setLoading(true);
    try {
      await resetPasswordFn({ email: form.email });
      alert("Password reset email sent!");
    } catch (err) {
      console.error(err);
      alert("Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>

        <div className="space-y-3">
          <input name="employeeName" placeholder="Employee Name" value={form.employeeName} onChange={handleChange} className="w-full border rounded p-2" />
          <input name="email" placeholder="Email" type="email" value={form.email} onChange={handleChange} className="w-full border rounded p-2" />
          <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} className="w-full border rounded p-2" />
          <select name="role" value={form.role} onChange={handleChange} className="w-full border rounded p-2">
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
          </select>
        </div>

        <div className="flex justify-between mt-6">
          {initial && (
            <button
              onClick={handleResetPassword}
              className="text-sm text-blue-600 hover:underline"
              disabled={loading}
            >
              Reset Password
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose} className="px-4 py-2 border rounded" disabled={loading}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? "Processing..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
