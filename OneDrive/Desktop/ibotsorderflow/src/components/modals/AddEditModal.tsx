// components/modals/AddEditModal.tsx

import React, { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  deleteField,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import type { Enquiry } from "../../types/enquiry";

// --- Types for props (Unchanged) ---
type UserProfile = {
  id: string;
  role: "admin" | "manager" | "staff";
  employeeName?: string;
  name?: string;
};

type Employee = {
  id?: string;
  uid?: string;
  email?: string;
  employeeName?: string;
  name?: string;
};

interface AddEditModalProps {
  open: boolean;
  initial?: Partial<Enquiry> | null;
  onClose: () => void;
  onSave: () => void;
  currentUserProfile: UserProfile | null;
  employees: Employee[];
}

const statusMappings: Record<string, string[]> = {
  Dropped: ["Spec mismatch", "Out of stock items", "Lead time mismatch", "Budget mismatch"],
  Quotation: ["Technical clarification", "Waiting for order confirmation", "PI released waiting for payment"],
  Approved: ["PI released & initiated payment", "Payment received waiting for materials arrangement"],
  Dispatched: ["Porter / Rapido", "Courier", "Urgent delivery Bus", "Dispatched payment not received","Hand-to-Hand delivery"],
};

const statusPaymentMapping:Record<string,string[]>={
  Paid:["GPay","Account","Cash"],
}

// --- Helper function to check for duplicates (Unchanged) ---
const checkForDuplicates = async (
  field: "email" | "contactNumber",
  value: string,
  currentDocId: string | null
): Promise<boolean> => {
  if (!value || value.trim() === "") {
    return false;
  }
  
  const enquiriesRef = collection(db, "enquiries");
  const q = query(enquiriesRef, where(field, "==", value.trim()));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return false;
  }
  
  if (!currentDocId) {
    return true;
  }
  
  for (const doc of querySnapshot.docs) {
    if (doc.id !== currentDocId) {
      return true;
    }
  }
  
  return false;
};


const AddEditModal: React.FC<AddEditModalProps> = ({
  open,
  initial = null,
  onClose,
  onSave,
  currentUserProfile,
  employees,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  // --- 🚀 NEW: State to manage the styled error dialog ---
  const [error, setError] = useState<string | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (initial) {
      setFormData({ ...initial });
    } else {
      setFormData({
        enqId: `IB${Date.now().toString().slice(-4)}`,
        mode: "Website",
        type: "",
        status: "",
        subStatus: "",
        value: 0,
        customerName: "",
        remarks: "",
        assignedTo: currentUserProfile?.id ?? "",
      });
    }
    isInitialMount.current = true;
  }, [initial, currentUserProfile, open]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const relevantSubStatuses = statusMappings[formData.status] || [];
    setFormData((prev) => ({
      ...prev,
      subStatus: relevantSubStatuses.length > 0 ? relevantSubStatuses[0] : "",
    }));
  }, [formData.status]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const relevantSubStatuses = statusPaymentMapping[formData.paymentStatus] || [];
    setFormData((prev) => ({
      ...prev,
      paymentSubStatus: relevantSubStatuses.length > 0 ? relevantSubStatuses[0] : "",
    }));
  }, [formData.paymentStatus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    if (!formData.customerName?.trim() || !formData.contactNumber?.trim()) {
      alert("Please enter the Customer Name and the Contact Number");
      setLoading(false);
      return;
    }

    const currentDocId = initial && (initial as any).id ? (initial as any).id : null;
    let createdAtValue;

    if (formData.createdAt instanceof Date) {
      createdAtValue = Timestamp.fromDate(formData.createdAt);
    } else if (formData.createdAt?.toDate) {
      // Firestore Timestamp (editing case)
      createdAtValue = formData.createdAt;
    } else if (typeof formData.createdAt === "string" && formData.createdAt !== "") {
      // datetime-local input
      const d = new Date(formData.createdAt);
      if (isNaN(d.getTime())) throw new Error("Invalid createdAt date");
      createdAtValue = Timestamp.fromDate(d);
    } else {
      createdAtValue = serverTimestamp();
    }
    try {
      const payload: Record<string, any> = {
        enqId: formData.enqId ?? "",
        customerName: formData.customerName ?? "",
        contactPerson: formData.contactPerson ?? "",
        contactNumber: formData.contactNumber ?? "",
        email: formData.email ?? "",
        city: formData.city ?? "",
        mode: formData.mode ?? "",
        type: formData.type ?? "",
        status: formData.status ?? "",
        paymentStatus : formData.paymentStatus ?? "",
        shipmentStatus : formData.shipmentStatus ?? "",
        paymentSubStatus : formData.paymentSubStatus ?? "",
        value: Number(formData.value) || 0,
        remarks: formData.remarks ?? "",
        assignedTo: formData.assignedTo ?? "",
        updatedAt: serverTimestamp(),
        subStatus: formData.subStatus ?? "",
        reason: formData.reason ?? "",
        createdAt: createdAtValue,
        materials: formData.materials ?? "",
      };

      if(!(formData.status==="Waiting Payment" || formData.status==="Waiting for Materials"))
        payload.reason="";

      if(!(formData.paymentStatus==="Paid"))
        payload.paymentSubStatus="";

      if (initial && (initial as any).id) {
        payload.droppedReason = deleteField();
        const ref = doc(db, "enquiries", (initial as any).id);
        await updateDoc(ref, payload);
      } else {
        await addDoc(collection(db, "enquiries"), payload);
      }

      onSave?.();
      onClose();
    } catch (err) {
      console.error("Error saving enquiry:", err);
      // You might want to use the styled error for this as well
      setError("Failed to save the enquiry. Please check the console for more details.");
    } finally {
      setLoading(false);
    }
  };

  const toDateTimeLocal = (value: any): string => {
    if (!value) return "";

    let date: Date;

    if (value instanceof Date) {
      date = value;
    } else if (value?.toDate) {
      // Firestore Timestamp
      date = value.toDate();
    } else if (typeof value === "string") {
      const d = new Date(value);
      if (isNaN(d.getTime())) return "";
      date = d;
    } else {
      return "";
    }

    // Fix timezone offset for datetime-local
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };

  if (!open) return null;

  const canEditAssignee = currentUserProfile?.role === "admin" || currentUserProfile?.role === "manager";
  const subStatusOptions = statusMappings[formData.status] || [];
  const paymentSubStatusOptions=statusPaymentMapping[formData.paymentStatus]||[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-fade-in">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">{initial ? "Edit Enquiry" : "Add Enquiry"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* All your form fields remain unchanged here... */}
          
          {/* Enquiry ID */}
          <div>
            <label className="block text-sm font-medium text-gray-600">Enquiry ID</label>
            <input readOnly type="text" name="enqId" value={formData.enqId ?? ""} className="w-full px-3 py-2 border rounded-lg bg-gray-100" />
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-600">Customer Name *</label>
            <input type="text" name="customerName" value={formData.customerName ?? ""} onChange={handleChange} placeholder="Enter customer name" className="w-full px-3 py-2 border rounded-lg" />
          </div>
          
          {/* Contact Person & Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Contact Person</label>
              <input type="text" name="contactPerson" value={formData.contactPerson ?? ""} onChange={handleChange} placeholder="Enter contact person" className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Contact Number *</label>
              <input type="tel" name="contactNumber" value={formData.contactNumber ?? ""} onChange={handleChange} placeholder="Enter contact number" className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>

          {/* Email & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <input type="email" name="email" value={formData.email ?? ""} onChange={handleChange} placeholder="Enter email" className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">City</label>
              <input type="text" name="city" value={formData.city ?? ""} onChange={handleChange} placeholder="Enter city" className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          
          {/* Source, Type, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Source</label>
              <select name="mode" value={formData.mode ?? ""} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                <option value="" disabled>-- Select source --</option>
                {["WhatsApp", "FB", "Website", "Instagram", "Mail", "LinkedIn", "OwnerDirect", "Offline"].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Type</label>
              <select name="type" value={formData.type ?? ""} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                <option value="" disabled>-- Select Type --</option>
                <option value="B2B">B2B</option>
                <option value="B2C">B2C</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Product Status</label>
              <select name="status" value={formData.status ?? ""} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                <option value="" disabled>-- Select Status --</option>
                {["Enquiries", "Quotation", "Approved","Waiting for Materials"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600">Payment Status</label>
              <select name="paymentStatus" value={formData.paymentStatus ?? ""} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                <option value="">-- Select Payment Status --</option>
                {["Paid","Not Paid","Credit","Refund","Replacement"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Shipment Status</label>
              <select name="shipmentStatus" value={formData.shipmentStatus ?? ""} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                <option value="">-- Select Shipment Status --</option>
                {["Packed","Dispatched","Delivered","In Shipment"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {/* Sub-Status Dropdown */}
          {subStatusOptions.length > 0 && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-gray-600">
                {formData.status === "Dropped" ? "Reason for Dropping" : "Sub-Status Detail"}
              </label>
              <select name="subStatus" value={formData.subStatus ?? ""} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                <option value="">-- Select sub-status --</option>
                {subStatusOptions.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}
          {/* Payment-Sub-Status Dropdown */}
            {paymentSubStatusOptions.length > 0 && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-gray-600">
                  Payment Type
                </label>
                <select name="paymentSubStatus" value={formData.paymentSubStatus ?? ""} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">-- Select payment-sub-status --</option>
                  {paymentSubStatusOptions.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}

          {(formData.status==="Waiting Payment" || formData.status==="Waiting for Materials") && (
            <div className="animate-fade-in">
              <input type="text" name="reason" value={formData.reason ?? ""} placeholder="Enter the reason" onChange={handleChange} className="w-full px-3 py-2 border rounded-lg"/>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Value (₹)</label>
              <input type="number" name="value" value={formData.value ?? ""} onChange={handleChange} placeholder="Enter estimated value" className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Date</label>
              <input type="datetime-local" name="createdAt" value={toDateTimeLocal(formData.createdAt)} onChange={handleChange} placeholder="Enter the date" className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Materials</label>
            <textarea name="materials" value={formData.materials ?? ""} onChange={handleChange} rows={3} placeholder="Enter the materials" className="w-full px-3 py-2 border rounded-lg" />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-600">Remarks</label>
            <textarea name="remarks" value={formData.remarks ?? ""} onChange={handleChange} rows={3} placeholder="Additional remarks" className="w-full px-3 py-2 border rounded-lg" />
          </div>
          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-gray-600">Assigned To</label>
            <div className="mt-1">
              {canEditAssignee ? (
                <select name="assignedTo" value={formData.assignedTo ?? ""} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                  <option value="" disabled>-- Select an Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeName ?? emp.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input type="text" readOnly value={currentUserProfile?.employeeName || currentUserProfile?.name || ""} className="w-full px-3 py-2 border rounded-lg bg-gray-100" />
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* --- 🚀 NEW: Styled Error Dialog --- */}
      {error && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-800">Error</h3>
                <p className="mt-2 text-sm text-gray-600">{error}</p>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setError(null)}
                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- 🚀 END: Styled Error Dialog --- */}
    </div>
  );
};

export default AddEditModal;