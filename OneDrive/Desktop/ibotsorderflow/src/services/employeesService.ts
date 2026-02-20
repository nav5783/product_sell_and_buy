import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

export type Employee = {
  uid: string;
  email?: string;
  name?: string;
  role?: string;
  teamId?: string | null;
  mobile?: string;
  active?: boolean;
};

export async function getEmployee(uid: string): Promise<Employee | null> {
  const d = await getDoc(doc(db, "employees", uid));
  if (!d.exists()) return null;
  return { uid: d.id, ...(d.data() as any) };
}

export async function listEmployeesByTeam(teamId: string) {
  const q = query(collection(db, "employees"), where("teamId", "==", teamId));
  const snap = await getDocs(q);
  return snap.docs.map((s) => ({ uid: s.id, ...(s.data() as any) }));
}

export async function listAllEmployees() {
  const snap = await getDocs(collection(db, "employees"));
  return snap.docs.map((s) => ({ uid: s.id, ...(s.data() as any) }));
}