// import React, { useEffect, useState } from "react";
// import { getFunctions, httpsCallable } from "firebase/functions";
// import { app, auth, db } from "../../firebase";
// import {
//   collection,
//   getDocs,
//   query,
//   where,
//   orderBy,
//   doc,
//   setDoc,
//   serverTimestamp,
// } from "firebase/firestore";
// import { sendPasswordResetEmail } from "firebase/auth";
// import { toast } from "react-toastify";
// import { FaEdit, FaTrash } from "react-icons/fa";

// /**
//  * Generic management page used by AddAdmin/AddManager/AddStaff wrappers.
//  * - Uses EmployeeLogin shape: id (doc id = uid), employeeId, employeeName, email, phone, role, createdAt, updatedAt
//  * - Create -> callable createUser (requires password)
//  * - Delete -> callable deleteUser
//  * - Edit -> updates employees/{uid} doc only (does not change Firebase Auth email/displayName)
//  * - Reset -> sendPasswordResetEmail
//  */

// type Role = "admin" | "manager" | "staff";

// export default function ManageUsers({ role, title }: { role: Role; title: string }) {
//   const [employeeName, setEmployeeName] = useState("");
//   const [email, setEmail] = useState("");
//   const [phone, setPhone] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [listLoading, setListLoading] = useState(true);
//   const [editing, setEditing] = useState<any | null>(null);
//   const [employees, setEmployees] = useState<any[]>([]);
//   const [actionInProgress, setActionInProgress] = useState<string | null>(null); // uid for spinner

//   const functions = getFunctions(app);

//   const fetchEmployees = async () => {
//     setListLoading(true);
//     try {
//       const q = query(
//         collection(db, "employees"),
//         where("role", "==", role),
//         orderBy("createdAt", "desc")
//       );
//       const snap = await getDocs(q);
//       const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
//       setEmployees(rows);
//     } catch (err) {
//       console.error("fetchEmployees error", err);
//       toast.error("Failed to load employees");
//     } finally {
//       setListLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchEmployees();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [role]);

//   const resetForm = () => {
//     setEmployeeName("");
//     setEmail("");
//     setPhone("");
//     setPassword("");
//     setEditing(null);
//   };

//   const handleEditClick = (emp: any) => {
//     setEditing(emp);
//     setEmployeeName(emp.employeeName || "");
//     setEmail(emp.email || "");
//     setPhone(emp.phone || "");
//     setPassword("");
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   const handleCreateOrUpdate = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!employeeName.trim() || !email.trim()) return toast.error("Name and email required");

//     setLoading(true);
//     try {
//       if (editing) {
//         const docRef = doc(db, "employees", editing.id);
//         await setDoc(
//           docRef,
//           {
//             employeeName,
//             email,
//             phone,
//             role,
//             updatedAt: serverTimestamp(),
//           },
//           { merge: true }
//         );
//         toast.success(`${title} updated`);
//       } else {
//         if (!password) {
//           setLoading(false);
//           return toast.error("Password is required for new user");
//         }
//         const callable = httpsCallable(functions, "createUser");
//         const resp = await callable({
//           employeeName,
//           email,
//           password,
//           phone,
//           role,
//         });
//         toast.success(`${title} created (${resp.data?.employeeId ?? "id"})`);
//       }
//       await fetchEmployees();
//       resetForm();
//     } catch (err: any) {
//       console.error("create/update error", err);
//       toast.error(err?.message || "Operation failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async (emp: any) => {
//     const uid = emp.id || emp.uid;
//     if (!uid) return toast.error("Invalid user");
//     if (!confirm(`Delete ${emp.employeeName}? This will remove Auth user and employees record.`)) return;
//     setActionInProgress(uid);
//     try {
//       const callable = httpsCallable(functions, "deleteUser");
//       await callable({ uid });
//       toast.success("Deleted");
//       await fetchEmployees();
//     } catch (err: any) {
//       console.error("delete error", err);
//       toast.error(err?.message || "Delete failed");
//     } finally {
//       setActionInProgress(null);
//     }
//   };

//   const handleResetPassword = async (emp: any) => {
//     try {
//       await sendPasswordResetEmail(auth, emp.email);
//       toast.success(`Password reset email sent to ${emp.email}`);
//     } catch (err: any) {
//       console.error("reset password error", err);
//       toast.error(err?.message || "Failed to send reset email");
//     }
//   };

//   const renderShimmer = () => {
//     const items = Array.from({ length: 5 }).map((_, i) => (
//       <div key={i} className="manager-card" style={{ minHeight: 72 }}>
//         <div style={{ display: "flex", gap: 12 }}>
//           <div style={{ width: 48, height: 48, borderRadius: 8, background: "linear-gradient(90deg,#eee,#f5f5f5)" }} />
//           <div style={{ flex: 1 }}>
//             <div style={{ width: "60%", height: 14, background: "linear-gradient(90deg,#eee,#f5f5f5)", marginBottom: 8 }} />
//             <div style={{ width: "40%", height: 12, background: "linear-gradient(90deg,#eee,#f5f5f5)" }} />
//           </div>
//         </div>
//       </div>
//     ));
//     return <div>{items}</div>;
//   };

//   return (
//     <div className="add-manager-page" style={{ paddingTop: 24 }}>
//       <div className="form-container">
//         <h2 style={{ textAlign: "center" }}>{editing ? `Edit ${title}` : `Add ${title}`}</h2>
//         <form onSubmit={handleCreateOrUpdate}>
//           <div>
//             <label>Full name</label>
//             <input
//               type="text"
//               value={employeeName}
//               onChange={(e) => setEmployeeName(e.target.value)}
//               required
//               className="input-style"
//             />
//           </div>

//           <div>
//             <label>Email</label>
//             <input
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//               disabled={!!editing}
//               className="input-style"
//             />
//           </div>

//           <div>
//             <label>Phone</label>
//             <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-style" />
//           </div>

//           {!editing && (
//             <div>
//               <label>Password</label>
//               <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-style" />
//             </div>
//           )}

//           <div className="button-group" style={{ marginTop: 12 }}>
//             <button type="submit" disabled={loading} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 8 }}>
//               {loading ? <span className="shimmer-spinner" /> : null}
//               {editing ? "Save changes" : `Create ${title}`}
//             </button>
//             <button type="button" onClick={resetForm} style={{ background: "#6c757d", color: "#fff", padding: "10px 14px", borderRadius: 6 }}>
//               Reset
//             </button>
//           </div>
//         </form>

//         {editing && (
//           <div style={{ marginTop: 18 }}>
//             <button
//               type="button"
//               onClick={() => handleResetPassword(editing)}
//               className="btn-primary"
//               style={{ background: "#17a2b8", marginRight: 8 }}
//             >
//               Send Password Reset Email
//             </button>
//           </div>
//         )}
//       </div>

//       <div className="card-container">
//         <h2 style={{ textAlign: "center" }}>{title}s</h2>

//         {listLoading ? (
//           renderShimmer()
//         ) : employees.length === 0 ? (
//           <div style={{ textAlign: "center", color: "#666", padding: 24 }}>No {title.toLowerCase()} found</div>
//         ) : (
//           employees.map((emp) => (
//             <div className="manager-card" key={emp.id || emp.uid}>
//               <h3 style={{ marginBottom: 6 }}>{emp.employeeName}</h3>
//               <p style={{ margin: 0, color: "#555" }}>{emp.email}</p>
//               <p style={{ margin: "8px 0 0 0", color: "#777", fontSize: 13 }}>{emp.phone}</p>

//               <div className="card-actions" style={{ right: 12 }}>
//                 <button onClick={() => handleEditClick(emp)} title="Edit" style={{ background: "transparent", border: "none", cursor: "pointer" }}>
//                   <FaEdit style={{ color: "#007bff" }} />
//                 </button>

//                 <button
//                   onClick={() => handleResetPassword(emp)}
//                   title="Reset password"
//                   style={{ background: "transparent", border: "none", cursor: "pointer", marginLeft: 8 }}
//                 >
//                   Reset
//                 </button>

//                 <button
//                   onClick={() => handleDelete(emp)}
//                   title="Delete"
//                   style={{ background: "transparent", border: "none", cursor: "pointer", marginLeft: 8, color: "#dc3545" }}
//                 >
//                   {actionInProgress === (emp.id || emp.uid) ? <span className="shimmer-spinner" /> : <FaTrash />}
//                 </button>
//               </div>
//             </div>
//           ))
//         )}

//         {/* simple pagination placeholder (kept small for design) */}
//       </div>

//       {/* small spinner + shimmer styles */}
//       <style>{`
//         .shimmer-spinner {
//           display: inline-block;
//           width: 16px;
//           height: 16px;
//           border-radius: 50%;
//           background: linear-gradient(90deg,#e6e6e6,#f0f0f0,#e6e6e6);
//           background-size: 200% 100%;
//           animation: shimmer 1s linear infinite;
//         }
//         @keyframes shimmer {
//           0% { background-position: 200% 0; }
//           100% { background-position: -200% 0; }
//         }
//       `}</style>
//     </div>
//   );
// }




import React, { useEffect, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app, auth, db } from "../../firebase"; // Assuming firebase config is at 'src/firebase.ts'
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { toast, ToastContainer } from "react-toastify";
// In a real project, you would import this CSS file
// import 'react-toastify/dist/ReactToastify.css';

type Role = "admin" | "manager" | "staff";

// SVG Icons to provide the required visuals without external dependencies
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#007bff' }}>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const DeleteIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#dc3545' }}>
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const KeyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
);


export default function ManageUsers({ role, title }: { role: Role; title: string }) {
  const [employeeName, setEmployeeName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const functions = getFunctions(app);

  const fetchEmployees = async () => {
    setListLoading(true);
    try {
      const q = query(
        collection(db, "employees"),
        where("role", "==", role),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEmployees(rows);
    } catch (err) {
      console.error("fetchEmployees error", err);
      toast.error("Failed to load employees");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [role]);

  const resetForm = () => {
    setEmployeeName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setEditing(null);
  };

  const handleEditClick = (emp: any) => {
    setEditing(emp);
    setEmployeeName(emp.employeeName || "");
    setEmail(emp.email || "");
    setPhone(emp.phone || "");
    setPassword("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim() || !email.trim())
      return toast.error("Name and email required");

    setLoading(true);
    try {
      if (editing) {
        const docRef = doc(db, "employees", editing.id);
        await setDoc(
          docRef,
          {
            employeeName,
            email,
            phone,
            role,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        toast.success(`${title} updated`);
      } else {
        if (!password) {
          setLoading(false);
          return toast.error("Password is required for new user");
        }
        const callable = httpsCallable(functions, "createUser");
        const resp = await callable({
          employeeName,
          email,
          password,
          phone,
          role,
        });
        toast.success(`${title} created (${(resp.data as any)?.employeeId ?? "id"})`);
      }
      await fetchEmployees();
      resetForm();
    } catch (err: any) {
      console.error("create/update error", err);
      toast.error(err?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (emp: any) => {
    const uid = emp.id || emp.uid;
    if (!uid) return toast.error("Invalid user");
    if (!confirm(`Delete ${emp.employeeName}? This will remove Auth user and employees record.`)) return;
    setActionInProgress(uid);
    try {
      const callable = httpsCallable(functions, "deleteUser");
      await callable({ uid });
      toast.success("Deleted");
      await fetchEmployees();
    } catch (err: any) {
      console.error("delete error", err);
      toast.error(err?.message || "Delete failed");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleResetPassword = async (emp: any) => {
    try {
      await sendPasswordResetEmail(auth, emp.email);
      toast.success(`Password reset email sent to ${emp.email}`);
    } catch (err: any) {
      console.error("reset password error", err);
      toast.error(err?.message || "Failed to send reset email");
    }
  };

  const renderShimmer = () => (
    <div>
        {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 animate-pulse">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-sans">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            {editing ? `Edit ${title}` : `Add ${title}`}
          </h2>
          <form onSubmit={handleCreateOrUpdate} className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-gray-600 mb-1 block">Name</label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                required
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!!editing}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            {editing && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleResetPassword(editing)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <KeyIcon />
                  Send Password Reset Email
                </button>
              </div>
            )}
            
            <div>
              <label className="text-sm font-semibold text-gray-600 mb-1 block">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {!editing && (
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
              >
                {loading ? "Saving..." : editing ? "Save Changes" : `Create ${title}`}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-transparent">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">{title}s</h2>
          <div className="space-y-4">
            {listLoading ? (
              renderShimmer()
            ) : employees.length === 0 ? (
              <div className="text-center text-gray-500 pt-10">
                No {title.toLowerCase()}s found
              </div>
            ) : (
              employees.map((emp) => (
                <div key={emp.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-gray-800">{emp.employeeName}</h3>
                    <p className="text-sm text-gray-600">{emp.email}</p>
                    <p className="text-xs text-gray-500 mt-1">{emp.phone}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button onClick={() => handleEditClick(emp)} title="Edit" className="p-1">
                      <EditIcon />
                    </button>
                    <button onClick={() => handleDelete(emp)} title="Delete" className="p-1">
                      {actionInProgress === emp.id ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <DeleteIcon />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
       <style>{`
        .Toastify__toast-container {
            z-index: 9999;
            position: fixed;
            padding: 4px;
            width: 320px;
            box-sizing: border-box;
            color: #fff;
        }
        .Toastify__toast {
            position: relative;
            min-height: 64px;
            box-sizing: border-box;
            margin-bottom: 1rem;
            padding: 8px;
            border-radius: 4px;
            box-shadow: 0 1px 10px 0 rgba(0, 0, 0, 0.1), 0 2px 15px 0 rgba(0, 0, 0, 0.05);
            display: flex;
            justify-content: space-between;
            max-height: 800px;
            overflow: hidden;
            font-family: sans-serif;
            cursor: pointer;
            direction: ltr;
        }
        .Toastify__toast--success {
            background: #07bc0c;
        }
        .Toastify__toast--error {
            background: #e74c3c;
        }
        .Toastify__toast-body {
            margin: auto 0;
            flex: 1 1 auto;
            padding: 6px;
        }
        .Toastify__progress-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 5px;
            z-index: 9999;
            opacity: 0.7;
            background-color: rgba(255, 255, 255, 0.7);
            transform-origin: left;
        }
      `}</style>
    </div>
  );
}

