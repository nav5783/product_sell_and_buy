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
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../App";

type UserProfile = {
  id: string;
  role: "admin" | "manager" | "staff";
  [key: string]: any;
};

type EmployeeDoc = {
  id?: string;
  employeeName?: string;
  name?: string;
  email?: string;
  uid?: string;
  [k: string]: any;
};

// Renamed component to follow React/PascalCase convention
export default function DroppedPage() {
  const { user } = useAuth();
  // Although this page doesn't use the modal directly, we keep it for consistency if users modify the page to allow editing.
  const [modalOpen, setModalOpen] = useState(false); 
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeDoc[]>([]);
  const [employeesByUid, setEmployeesByUid] = useState<Record<string, EmployeeDoc>>({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "employees"), (snap) => {
        const byUid: Record<string, EmployeeDoc> = {};
        const allEmployees: EmployeeDoc[] = [];
        snap.docs.forEach((d) => {
          const data = { id: d.id, ...d.data() } as EmployeeDoc;
          byUid[data.id!] = data;
          allEmployees.push(data);
        });
        setEmployeesByUid(byUid);
        setEmployees(allEmployees);
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
    // Base query: Filter only for 'Dropped' status
    let q = query(collection(db, "enquiries"), where("status", "==", "Dropped"), orderBy("createdAt", "desc"));

    if (currentUserProfile.role === 'staff') {
      q = query(
        collection(db, "enquiries"), 
        where("assignedTo", "==", currentUserProfile.id), 
        where("status", "==", "Dropped"), 
        orderBy("createdAt", "desc")
      );
    } else if (currentUserProfile.role === 'manager') {
      const teamsQuery = query(collection(db, "teams"), where("managerId", "==", currentUserProfile.id), limit(1));
      getDocs(teamsQuery).then(teamSnap => {
        const staffIds = !teamSnap.empty ? (teamSnap.docs[0].data().staff || []).map((s: any) => s.id) : [];
        const visibleIds = [currentUserProfile.id, ...staffIds].filter(Boolean);
        let managerQuery = query(collection(db, "enquiries"), where("assignedTo", "==", "no-one")); 
        
        if (visibleIds.length > 0) {
            managerQuery = query(
            collection(db, "enquiries"), 
            where("assignedTo", "in", visibleIds), 
            where("status", "==", "Dropped"), 
            orderBy("createdAt", "desc")
          );
        }

        return onSnapshot(managerQuery, (snap) => {
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Enquiry));
          setEnquiries(data);
          setIsLoading(false);
        });
      });
      return;
    }
    
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Enquiry));
      setEnquiries(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, [currentUserProfile]);

  const columns = useMemo<ColumnDef<Enquiry, any>[]>(() => {
    return [
        { accessorKey: "enqId", header: "Enquiry ID" },
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
        { id: "value", header: "Value", accessorFn: (r: any) => r.value ?? "-" },
        // Display the droppedReason, or default to "Dropped"
        { id: "status", header: "Dropped Reason", accessorFn: (r: any) => r.droppedReason ?? "Dropped" }, 
        { id: "subStatus", header: "Sub-Status", accessorFn: (r: any) => r.subStatus ?? "-" },
        { id: "mode", header: "Source", accessorFn: (r: any) => r.mode ?? r.source ?? "-" },
        {
          id: "assignedTo", header: "Assigned To", accessorFn: (row: any) => row.assignedTo ?? null,
          cell: ({ row }) => {
            const assignedUid = row.original.assignedTo as string;
            if (!assignedUid) return "UNASSIGNED";
            const employee = employeesByUid[assignedUid];
            return employee?.employeeName || employee?.name || "Unknown";
          },
        },
        { id: "remarks", header: "Remarks", accessorFn: (r: any) => r.remarks ?? "-" },
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
      // Replaced alert() with console.error as per instructions
      console.error("User feedback needed: There was an error deleting the enquiry. See console for details.");
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
        <h2 className="text-2xl font-semibold ml-10 md:ml-0">Dropped Enquiries</h2>
        <div className="text-sm text-gray-600">Signed in: {user?.email ?? "not signed in"}</div>
      </div>

      {/* FIX 2: Wrap the DataTable in an overflow-x-auto div to enable horizontal scrolling on mobile */}
      <div className="overflow-x-auto">
        <DataTable<Enquiry>
          title="Dropped Enquiries List"
          columns={columns}
          data={enquiries}
          loading={isLoading}
          hideAdd // Dropped page should generally not allow adding new items
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
    </div>
  );
}
