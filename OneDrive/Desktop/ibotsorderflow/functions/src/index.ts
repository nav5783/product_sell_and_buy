import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();
const firestore = admin.firestore();

export type EmployeeRole = "admin" | "manager" | "staff";

export interface EmployeeLogin {
  id?: string;          // Firestore doc ID
  employeeId: string;   // Auto-generated, like EMP0001
  employeeName: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  createdAt: any;       // Firestore Timestamp
  updatedAt: any;       // Firestore Timestamp
}

async function assertCallerIsAdmin(context: any) {
  const callerUid = context?.auth?.uid;
  if (!callerUid) {
    throw new functions.https.HttpsError("unauthenticated", "Caller must be signed in");
  }
  const empSnap = await firestore.doc(`employees/${callerUid}`).get();
  if (!empSnap.exists) {
    throw new functions.https.HttpsError("permission-denied", "Caller has no employee record");
  }
  const emp = empSnap.data() as Partial<EmployeeLogin> | undefined;
  if (!emp || emp.role !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "Caller must be an admin");
  }
}

function generateEmployeeId(): string {
  const tail = Date.now().toString().slice(-6);
  return `EMP${tail}`;
}

export const createUser = functions.https.onCall(async (data: any, context: any) => {
  await assertCallerIsAdmin(context);

  const raw = data || {};
  const email: string | undefined = typeof raw.email === "string" ? raw.email.trim() : undefined;
  const password: string | undefined = typeof raw.password === "string" ? raw.password : undefined;
  const employeeName: string | undefined = typeof raw.employeeName === "string"
    ? raw.employeeName.trim()
    : typeof raw.name === "string"
    ? raw.name.trim()
    : undefined;
  const phone: string = typeof raw.phone === "string" ? raw.phone : "";
  const role: EmployeeRole = raw.role === "admin" || raw.role === "manager" || raw.role === "staff" ? raw.role : "staff";
  const employeeIdProvided: string | undefined = typeof raw.employeeId === "string" ? raw.employeeId : undefined;

  if (!email || !password || !employeeName) {
    throw new functions.https.HttpsError("invalid-argument", "email, password and employeeName are required");
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: employeeName,
    });

    const uid = userRecord.uid;
    const employeeId = employeeIdProvided || generateEmployeeId();

    const empDoc: EmployeeLogin = {
      id: uid,
      employeeId,
      employeeName,
      email,
      phone,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await firestore.collection("employees").doc(uid).set(empDoc, { merge: true });

    return { success: true, id: uid, employeeId };
  } catch (err: any) {
    console.error("createUser error:", err);
    throw new functions.https.HttpsError("internal", err?.message || "Failed to create user");
  }
});

export const deleteUser = functions.https.onCall(async (data: any, context: any) => {
  await assertCallerIsAdmin(context);

  const uid: string | undefined = typeof data?.uid === "string" ? data.uid : undefined;
  if (!uid) {
    throw new functions.https.HttpsError("invalid-argument", "uid is required");
  }

  try {
    await admin.auth().deleteUser(uid);
    await firestore.doc(`employees/${uid}`).delete().catch(() => null);
    return { success: true, id: uid };
  } catch (err: any) {
    console.error("deleteUser error:", err);
    throw new functions.https.HttpsError("internal", err?.message || "Failed to delete user");
  }
});
