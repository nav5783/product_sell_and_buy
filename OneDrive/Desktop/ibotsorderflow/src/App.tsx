import React, { createContext, useContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

import ProtectedRoute from "./components/ProtectedRoute";
import SidebarLayout from "./layouts/SidebarLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import EnquiryPage from "./pages/Enquiry"; // your existing enquiries page
import DroppedPage from "./pages/dropped"; 
import AddAdminPage from "./pages/admin/AddAdmin";
import AddManagerPage from "./pages/admin/AddManager";
import AddStaffPage from "./pages/admin/AddStaff";
import AccessControl from "./pages/access-control";

import MasterData from "./pages/master-data";

import ManageTeams from "./pages/ManageTeams";
import TaskManagement from "./pages/TaskManagement";
import InventoryManagement from "./pages/InventoryManagement";
import TrainingManagement from "./pages/TrainingManagement";

type AppUser = {
  uid: string;
  email?: string | null;
  role?: string | undefined;     // undefined when employee doc missing
  teamId?: string | null;
  employeeLoaded?: boolean;      // true if employee doc existed and was read
};

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Keep loading true until auth state + employee doc resolution completes
    setLoading(true);
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const empDoc = await getDoc(doc(db, "employees", u.uid));
        const empData = empDoc.exists() ? empDoc.data() : null;

        // Do NOT force a default role; if employee doc is missing we mark employeeLoaded=false
        setUser({
          uid: u.uid,
          email: u.email,
          role: empData?.role ?? undefined,
          teamId: empData?.teamId ?? null,
          employeeLoaded: !!empDoc.exists(),
        } as AppUser);
      } catch (e) {
        console.error("Failed to load employee doc:", e);
        // On error, still set user with minimal info but mark employeeLoaded false
        setUser({ uid: u.uid, email: u.email, role: undefined, teamId: null, employeeLoaded: false });
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsub();
    };
  }, []);

  async function login(email: string, password: string) {
    // signInWithEmailAndPassword triggers onAuthStateChanged; we still return the promise for callers
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
  }

  // expose helper to refresh employee doc (useful after seeding / admin changes)
  async function refreshEmployeeDoc() {
    if (!auth.currentUser) return;
    try {
      setLoading(true);
      const empDoc = await getDoc(doc(db, "employees", auth.currentUser.uid));
      const empData = empDoc.exists() ? empDoc.data() : null;
      setUser((prev) => ({
        uid: auth.currentUser!.uid,
        email: auth.currentUser!.email,
        role: empData?.role ?? undefined,
        teamId: empData?.teamId ?? null,
        employeeLoaded: !!empDoc.exists(),
      }));
    } catch (err) {
      console.error("refreshEmployeeDoc error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshEmployeeDoc }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* App routes wrapped by your SidebarLayout so sidebar + topbar show */}
          <Route
            element={
              <ProtectedRoute>
                <SidebarLayout />
              </ProtectedRoute>
            }
          >
            {/* landing dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Enquiries */}
            <Route path="/enquiries" element={<EnquiryPage />} />
            <Route path="/dropped" element={<DroppedPage />} />
            <Route path="/admin/add-admin" element={<AddAdminPage />} />
            <Route path="/admin/add-manager" element={<AddManagerPage />} />
            <Route path="/admin/add-staff" element={<AddStaffPage />} />
            <Route path="/manage-teams" element={<ManageTeams />} />
            <Route path="/master-data" element={<MasterData />} />
            <Route path="/task" element={<TaskManagement/>}/>
            <Route path="/inventory" element={<InventoryManagement/>}/>
            <Route path="/training" element={<TrainingManagement/>}/>
            
            {/* <Route path="/settings" element={<Settings />} /> */}
            
            {/* <Route path="/admin/add-staff" element={<AddStaffPage />} /> */}
            {/* add other protected pages/routes here */}
          </Route>

          {/* fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
