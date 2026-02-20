// src/hooks/useCollection.tsx

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  QueryConstraint,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

export function useCollection<T = any>(colPath?: string, constraints: QueryConstraint[] = []) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState<boolean>(!!colPath);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!colPath) {
      // no path: return empty array and not loading
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const q = query(collection(db, colPath), ...constraints);
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.error("useCollection snapshot error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    );

    return () => unsub();
  }, [colPath, JSON.stringify(constraints)]);

  const create = async (payload: Partial<T>) => {
    if (!colPath) throw new Error("Cannot create: collectionPath is empty");
    const ref = await addDoc(collection(db, colPath), payload as any);
    return ref.id;
  };

  const remove = async (id: string) => {
    if (!colPath) throw new Error("Cannot remove: collectionPath is empty");
    await deleteDoc(doc(db, colPath, id));
  };

  return { data, loading, error, create, remove };
}

// compatibility aliases if other files import different names
export const useCollectionRealtime = useCollection;
export const useCollectionSafe = useCollection;