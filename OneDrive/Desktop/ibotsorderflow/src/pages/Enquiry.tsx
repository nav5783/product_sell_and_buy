// // src/pages/EnquiryPage.tsx

// import React, { useEffect, useMemo, useState } from "react";
// import { type ColumnDef } from "@tanstack/react-table";
// import DataTable from "../components/Table/DataTable";
// import type { Enquiry } from "../types/enquiry";
// import AddEditModal from "../components/modals/AddEditModal";
// import {
//   deleteDoc,
//   doc,
//   collection,
//   onSnapshot,
//   query,
//   orderBy,
//   limit,
//   getDocs,
//   getDoc,
//   where,
// } from "firebase/firestore";
// import { db } from "../firebase";
// import { useAuth } from "../App";

// type UserProfile = {
//   id: string;
//   role: "admin" | "manager" | "staff";
//   [key: string]: any;
// };

// type EmployeeDoc = {
//   id?: string; // CHANGED: Make sure id is part of the type
//   employeeName?: string;
//   name?: string;
//   email?: string;
//   uid?: string;
//   [k: string]: any;
// };

// export default function EnquiryPage() {
//   const { user } = useAuth();
//   const [modalOpen, setModalOpen] = useState(false);
//   const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

//   const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
//   const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
//   const [isLoading, setIsLoading] = useState(true);

//   // CHANGED: This state now holds the full employee list to pass to the modal
//   const [employees, setEmployees] = useState<EmployeeDoc[]>([]);
//   const [employeesByEmail, setEmployeesByEmail] = useState<Record<string, EmployeeDoc>>({});
//   const [employeesByUid, setEmployeesByUid] = useState<Record<string, EmployeeDoc>>({});

//   useEffect(() => {
//     const unsub = onSnapshot(collection(db, "employees"), (snap) => {
//         const byEmail: Record<string, EmployeeDoc> = {};
//         const byUid: Record<string, EmployeeDoc> = {};
//         const allEmployees: EmployeeDoc[] = []; // Array for the prop
//         snap.docs.forEach((d) => {
//           const data = { id: d.id, ...d.data() } as EmployeeDoc;
//           const email = (data.email ?? "").toString().toLowerCase();
          
//           if (email) byEmail[email] = data;
//           byUid[data.id!] = data;
//           allEmployees.push(data);
//         });
//         setEmployeesByEmail(byEmail);
//         setEmployeesByUid(byUid);
//         setEmployees(allEmployees); // Set the full list
//       }
//     );
//     return () => unsub();
//   }, []);
  
//   useEffect(() => {
//     if (!user?.uid) {
//         setIsLoading(false);
//         return;
//     }
//     const userDocRef = doc(db, "employees", user.uid);
//     const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
//       if (docSnap.exists()) {
//         setCurrentUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
//       } else {
//         setIsLoading(false);
//         console.error("Current user profile not found in 'employees' collection.");
//       }
//     });
//     return () => unsubProfile();
//   }, [user]);

//   useEffect(() => {
//     if (!currentUserProfile) return;

//     setIsLoading(true);
//     let q = query(collection(db, "enquiries"), orderBy("createdAt", "desc"));

//     if (currentUserProfile.role === 'staff') {
//       q = query(collection(db, "enquiries"), where("assignedTo", "==", currentUserProfile.id), orderBy("createdAt", "desc"));
//     } else if (currentUserProfile.role === 'manager') {
//       const teamsQuery = query(collection(db, "teams"), where("managerId", "==", currentUserProfile.id), limit(1));
//       getDocs(teamsQuery).then(teamSnap => {
//         const staffIds = !teamSnap.empty ? (teamSnap.docs[0].data().staff || []).map((s: any) => s.id) : [];
//         const visibleIds = [currentUserProfile.id, ...staffIds].filter(Boolean);
//         let managerQuery = query(collection(db, "enquiries"), where("assignedTo", "==", "no-one")); // A query that returns nothing as a fallback
//         if (visibleIds.length > 0) {
//             managerQuery = query(collection(db, "enquiries"), where("assignedTo", "in", visibleIds), orderBy("createdAt", "desc"));
//         }
//         return onSnapshot(managerQuery, (snap) => {
//           const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Enquiry));
//           setEnquiries(data);
//           setIsLoading(false);
//         });
//       });
//       return;
//     }
    
//     const unsub = onSnapshot(q, (snap) => {
//       const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Enquiry));
//       setEnquiries(data);
//       setIsLoading(false);
//     });
//     return () => unsub();
//   }, [currentUserProfile]);

//   const columns = useMemo<ColumnDef<Enquiry, any>[]>(() => {
//     return [
//         { accessorKey: "enqId", header: "Enquiry ID" },
//         { id: "customerName", header: "Customer", accessorFn: (r: any) => r.customer?.name ?? r.customerName ?? "-", },
//         { id: "value", header: "Value", accessorFn: (r: any) => r.value ?? "-" },
//         { id: "status", header: "Status", accessorFn: (r: any) => r.status ?? "-" },
//         { id: "mode", header: "Source", accessorFn: (r: any) => r.mode ?? r.source ?? "-" },
//         {
//           id: "assignedTo", header: "Assigned To", accessorFn: (row: any) => row.assignedTo ?? null,
//           cell: ({ row }) => {
//             const assignedUid = row.original.assignedTo as string;
//             if (!assignedUid) return "UNASSIGNED";
//             const employee = employeesByUid[assignedUid];
//             return employee?.employeeName || employee?.name || "Unknown";
//           },
//         },
//         {
//           id: "createdAt", header: "Enquiry Date", accessorFn: (r: any) => r.createdAt ?? null,
//           cell: ({ row }) => {
//             const ts: any = row.original.createdAt;
//             if (!ts) return "-";
//             if (typeof ts.toDate === "function") return ts.toDate().toLocaleString();
//             const d = new Date(ts);
//             return isNaN(d.getTime()) ? String(ts) : d.toLocaleString();
//           },
//         },
//         { id: "remarks", header: "Remarks", accessorFn: (r: any) => r.remarks ?? "-" },
//     ];
//   }, [employeesByUid]);

//   const handleDelete = async (item: Enquiry) => {
//     if (!item.id) {
//         console.error("Cannot delete: item is missing a document ID.");
//         return;
//     }
//     try {
//       await deleteDoc(doc(db, "enquiries", item.id));
//     } catch (err) {
//       console.error("Failed to delete enquiry:", err);
//       alert("There was an error deleting the enquiry. See console for details.");
//     }
//   };

//   const generateNextEnqId = async (): Promise<string> => {
//     try {
//       const q = query(collection(db, "enquiries"), orderBy("enqId", "desc"), limit(1));
//       const snap = await getDocs(q);

//       if (!snap.empty) {
//         const lastId = snap.docs[0].data().enqId as string;
//         const num = parseInt(lastId.replace("IB", ""), 10) || 0;
//         const nextNum = num + 1;
//         return `IB${nextNum.toString().padStart(3, "0")}`;
//       }
//       return "IB001";
//     } catch (err) {
//       console.error("Error generating next Enquiry ID:", err);
//       return "IB001";
//     }
//   };


//   return (
//     <div className="p-4">
//       <div className="flex items-center justify-between mb-4">
//         <h2 className="text-xl font-semibold">Enquiries</h2>
//         <div className="text-sm text-gray-600">Signed in: {user?.email ?? "not signed in"}</div>
//       </div>

//       <DataTable<Enquiry>
//         title="Enquiries List"
//         columns={columns}
//         data={enquiries}
//         loading={isLoading}
//         onAdd={async () => {
//           const nextId = await generateNextEnqId();
//           setSelectedEnquiry({
//             enqId: nextId,
//             assignedTo: user?.uid ?? "",
//           } as Enquiry);
//           setModalOpen(true);
//         }}
//         onEdit={(item) => {
//           setSelectedEnquiry(item);
//           setModalOpen(true);
//         }}
//         onDelete={handleDelete}
//       />

//       {modalOpen && (
//         <AddEditModal
//           open={modalOpen}
//           initial={selectedEnquiry}
//           onClose={() => {
//             setModalOpen(false);
//             setSelectedEnquiry(null);
//           }}
//           onSave={() => {
//             setModalOpen(false);
//             setSelectedEnquiry(null);
//           }}
//           // --- CHANGED: Pass the current user's profile and the full employee list to the modal ---
//           currentUserProfile={currentUserProfile}
//           employees={employees}
//         />
//       )}
//     </div>
//   );
// }

// src/pages/EnquiryPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import DataTable from "../components/Table/DataTable";
import type { Enquiry } from "../types/enquiry";
import AddEditModal from "../components/modals/AddEditModal";
import {
  deleteDoc,
  doc,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../App";
// --- 🚀 CHANGE START: Added icons for the new view modal ---
import { User, Phone, Mail, X } from "lucide-react";
// --- 🚀 CHANGE END ---

type UserProfile = {
  id: string;
  role: "admin" | "manager" | "staff";
  [key: string]: any;
};

type EmployeeDoc = {
  id?: string; // CHANGED: Make sure id is part of the type
  employeeName?: string;
  name?: string;
  email?: string;
  uid?: string;
  [k: string]: any;
};

export default function EnquiryPage() {
  const { user } = useAuth();
  // --- 🚀 CHANGE START: Added new state for the read-only view modal ---
  const [viewModalOpen, setViewModalOpen] = useState(false);
  // --- 🚀 CHANGE END ---
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // CHANGED: This state now holds the full employee list to pass to the modal
  const [employees, setEmployees] = useState<EmployeeDoc[]>([]);
  const [employeesByEmail, setEmployeesByEmail] = useState<Record<string, EmployeeDoc>>({});
  const [employeesByUid, setEmployeesByUid] = useState<Record<string, EmployeeDoc>>({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "employees"), (snap) => {
        const byEmail: Record<string, EmployeeDoc> = {};
        const byUid: Record<string, EmployeeDoc> = {};
        const allEmployees: EmployeeDoc[] = []; // Array for the prop
        snap.docs.forEach((d) => {
          const data = { id: d.id, ...d.data() } as EmployeeDoc;
          const email = (data.email ?? "").toString().toLowerCase();
          
          if (email) byEmail[email] = data;
          byUid[data.id!] = data;
          allEmployees.push(data);
        });
        setEmployeesByEmail(byEmail);
        setEmployeesByUid(byUid);
        setEmployees(allEmployees); // Set the full list
      }
    );
    return () => unsub();
  }, []);
  
  useEffect(() => {
    if (!user?.uid) {
        setIsLoading(false);
        return;
    }
    const userDocRef = doc(db, "employees", user.uid);
    const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setCurrentUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
      } else {
        setIsLoading(false);
        console.error("Current user profile not found in 'employees' collection.");
      }
    });
    return () => unsubProfile();
  }, [user]);

   useEffect(() => {
    if (!currentUserProfile) return;

    setIsLoading(true);

    const enquiriesRef = collection(db, "enquiries");
    const employeesRef = collection(db, "employees");

    const loadData = async () => {
      // 1️⃣ Fetch employees once
      const empSnap = await getDocs(employeesRef);

      const employeeMap: Record<string, string> = {};
      empSnap.forEach((doc) => {
        const empData = doc.data() as { employeeName: string };
        employeeMap[doc.id] = empData.employeeName;
      });

      let q = query(enquiriesRef, orderBy("createdAt", "desc"));

      // STAFF VIEW
      if (currentUserProfile.role === "staff") {
        q = query(
          enquiriesRef,
          where("assignedTo", "==", currentUserProfile.id),
          orderBy("createdAt", "desc")
        );
      }

      // MANAGER VIEW
      else if (currentUserProfile.role === "manager") {
        const teamsQuery = query(
          collection(db, "teams"),
          where("managerId", "==", currentUserProfile.id),
          limit(1)
        );

        const teamSnap = await getDocs(teamsQuery);

        const staffIds = !teamSnap.empty
          ? (teamSnap.docs[0].data().staff || []).map((s: any) => s.id)
          : [];

        const visibleIds = [currentUserProfile.id, ...staffIds].filter(Boolean);

        if (visibleIds.length > 0) {
          q = query(
            enquiriesRef,
            where("assignedTo", "in", visibleIds),
            orderBy("createdAt", "desc")
          );
        }
      }

      // 2️⃣ Real-time listener
      const unsub = onSnapshot(q, (snap) => {
        const data: Enquiry[] = snap.docs.map((doc) => {
          const enquiryData = doc.data() as Enquiry;

          return {
            ...enquiryData,
            id: doc.id,
            assignedToName:
              employeeMap[enquiryData.assignedTo] || "Not Assigned",
          };
        });

        setEnquiries(data);
        setIsLoading(false);
      });

      return unsub;
    };

    let unsubscribe: (() => void) | undefined;

    loadData().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUserProfile]);


  const columns = useMemo<ColumnDef<Enquiry, any>[]>(() => {
    return [
        {
          id: "enqId",
          header: "Enquiry ID",
          cell: ({ row }) => (
            <button
              // --- 🚀 CHANGE START: On click, this now opens the NEW view-only modal ---
              onClick={() => {
                setSelectedEnquiry(row.original);
                setViewModalOpen(true); // Use the new state setter
              }}
              // --- 🚀 CHANGE END ---
              className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
              >
              {row.original.enqId}
            </button>
          ),
        },
        {
          id: "createdAt", header: "Enquiry Date", accessorFn: (r: any) => r.createdAt ?? null,
          cell: ({ row }) => {
            const ts: any = row.original.createdAt;
            if (!ts) return "-";
            if (typeof ts.toDate === "function") return ts.toDate().toLocaleString();
            const d = new Date(ts);
            return isNaN(d.getTime()) ? String(ts) : d.toLocaleString();
          },
        },
        { id: "customerName", header: "Customer", accessorFn: (r: any) => r.customer?.name ?? r.customerName ?? "-", },
        { 
          id: "value", 
          header: "Value", 
          accessorFn: (r: any) => r.value ?? null,
          // --- 💰 CHANGE START: Add cell function for Rupee formatting ---
          cell: ({ row }) => {
            const value = row.original.value;
            if (value === null || value === undefined || value === "") return "-";
            
            // Format as Indian Rupee (INR)
            const formattedValue = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0, // Assuming whole numbers
            }).format(value);

            return formattedValue;
          }
          // --- 💰 CHANGE END ---
        },
        { id: "status", header: "Product Status", accessorFn: (r: any) => r.status ?? "-" },
        { id: "paymentStatus", header: "Payment Status", accessorFn: (r: any) => r.paymentStatus ?? "-" },
        { id: "paymentSubStatus", header: "Payment Sub Status", accessorFn: (r: any) => r.paymentSubStatus ?? "-" },
        { id: "shipmentStatus", header: "Shipment Status", accessorFn: (r: any) => r.shipmentStatus ?? "-" },
        { id: "subStatus", header: "Sub-Status", accessorFn: (r: any) => r.subStatus ?? "-" },
        { id: "reason", header: "Reason", accessorFn: (r: any) => r.reason ?? "-" },
        {
          id: "assignedToName", header: "Assigned To", accessorFn: (row: any) => row.assignedTo ?? null,
          cell: ({ row }) => {
            const assignedUid = row.original.assignedTo as string;
            if (!assignedUid) return "UNASSIGNED";
            const employee = employeesByUid[assignedUid];
            return employee?.employeeName || employee?.name || "Unknown";
          },
        },
        { id: "materials", header: "Materials", accessorFn: (r: any) => r.materials ?? "-" },
        { id: "remarks", header: "Remarks", accessorFn: (r: any) => r.remarks ?? "-" },
        { id: "type", header: "Type", accessorFn: (r: any) => r.type ?? "-" },
        { id: "city", header: "City", accessorFn: (r: any) => r.city ?? "-" },
        { id: "contactNumber", header: "Contact", accessorFn: (r: any) => r.contactNumber ?? "-" },
        { id: "mode", header: "Source", accessorFn: (r: any) => r.mode ?? "-" },
        { id: "email", header: "Email", accessorFn: (r: any) => r.email ?? "-" }
    ];
  }, [employeesByUid]);

  const handleDelete = async (item: Enquiry) => {
    if (!item.id) {
        console.error("Cannot delete: item is missing a document ID.");
        return;
    }
    try {
      await deleteDoc(doc(db, "enquiries", item.id));
    } catch (err) {
      console.error("Failed to delete enquiry:", err);
      // Using custom alert message instead of browser alert()
      // You would typically replace this with a toast notification or a custom modal
      console.error("User needs to be notified: There was an error deleting the enquiry.");
    }
  };

  const generateNextEnqId = async (): Promise<string> => {
    try {
      const q = query(collection(db, "enquiries"), orderBy("enqId", "desc"), limit(1));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const lastId = snap.docs[0].data().enqId as string;
        const num = parseInt(lastId.replace("IB", ""), 10) || 0;
        const nextNum = num + 1;
        return `IB${nextNum.toString().padStart(3, "0")}`;
      }
      return "IB001";
    } catch (err) {
      console.error("Error generating next Enquiry ID:", err);
      return "IB001";
    }
  };


  return (
    <div className="p-4 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        {/* FIX 1: Add ml-10 to clear the fixed mobile menu button, and reset it on desktop (md:ml-0) */}
        <h2 className="text-2xl font-semibold ml-10 md:ml-0">Enquiries</h2>
        <div className="text-sm text-gray-600">Signed in: {user?.email ?? "not signed in"}</div>
      </div>
    
    {/* FIX 2: Wrap the DataTable in an overflow-x-auto div to enable horizontal scrolling on mobile */}
    <div className="overflow-x-auto">
      <DataTable<Enquiry>
        title="Enquiries List"
        columns={columns}
        data={enquiries}
        loading={isLoading}
        onAdd={async () => {
          const nextId = await generateNextEnqId();
          setSelectedEnquiry({
            enqId: nextId,
            assignedTo: user?.uid ?? "",
          } as Enquiry);
          setModalOpen(true);
        }}
        onEdit={(item) => {
          setSelectedEnquiry(item);
          setModalOpen(true);
        }}
        onDelete={handleDelete}
      />
    </div>

      {/* This is the original Add/Edit Modal. It will now only open for Add/Edit actions. */}
      {modalOpen && (
        <AddEditModal
          open={modalOpen}
          initial={selectedEnquiry}
          onClose={() => {
            setModalOpen(false);
            setSelectedEnquiry(null);
          }}
          onSave={() => {
            setModalOpen(false);
            setSelectedEnquiry(null);
          }}
          currentUserProfile={currentUserProfile}
          employees={employees}
        />
      )}

      {/* --- 🚀 CHANGE START: JSX for the new Customer Details Modal with reordered fields --- */}
      {viewModalOpen && selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-fade-in">
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">
                Customer Details
              </h2>
              <button
                onClick={() => setViewModalOpen(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              
              {/* Organization / Customer Name (Moved to the top) */}
              <div className="flex items-center gap-4">
                <User className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="flex-grow">
                  <label className="text-xs font-semibold text-gray-500">Customer Name</label>
                  <p className="text-md text-gray-900">{selectedEnquiry.customerName || "-"}</p>
                </div>
              </div>
              
              {/* Customer Type (Moved to second position) */}
              <div className="flex items-center gap-4">
                {/* Briefcase Icon SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.593 23.593 0 0112 15c-3.18 0-6.24-.95-9-2.745M12 9l.01 0M10.5 4.5l1.5 1.5 1.5-1.5M6 13a4 4 0 11-8 0 4 4 0 018 0zm10 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <div className="flex-grow">
                  <label className="text-xs font-semibold text-gray-500">Organization</label>
                  <p className="text-md text-gray-900">{selectedEnquiry.type || "-"}</p>
                </div>
              </div>

              {/* Contact Person (Remains)
              <div className="flex items-center gap-4">
                <User className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="flex-grow">
                  <label className="text-xs font-semibold text-gray-500">Contact Person</label>
                  <p className="text-md text-gray-900">{selectedEnquiry.contactPerson || "-"}</p>
                </div>
              </div> */}

              {/* City (Remains) */}
              <div className="flex items-center gap-4">
                {/* Location Icon SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <div className="flex-grow">
                  <label className="text-xs font-semibold text-gray-500">City</label>
                  <p className="text-md text-gray-900">{selectedEnquiry.city || "-"}</p>
                </div>
              </div>

              {/* Contact Number (Phone Number) (Remains) */}
              <div className="flex items-center gap-4">
                <Phone className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="flex-grow">
                  <label className="text-xs font-semibold text-gray-500">Contact Number</label>
                  <p className="text-md text-gray-900">{selectedEnquiry.contactNumber || "-"}</p>
                </div>
              </div>
              
              {/* Email Address (Remains) */}
              <div className="flex items-center gap-4">
                <Mail className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="flex-grow">
                  <label className="text-xs font-semibold text-gray-500">Email Address</label>
                  <p className="text-md text-gray-900 break-all">{selectedEnquiry.email || "-"}</p>
                </div>
              </div>
              
            </div>
             <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
                <button 
                  onClick={() => setViewModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
        </div>
      )}
      {/* --- 🚀 CHANGE END --- */}

    </div>
  );
}
              
