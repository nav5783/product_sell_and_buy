import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

async function seed() {
  // sample admin employee (ensure corresponding Auth user exists with same uid or update later)
  const adminUid = "seed-admin-uid";
  await db.collection("employees").doc(adminUid).set({
    uid: adminUid,
    email: "admin@ibots.test",
    name: "System Admin",
    role: "admin",
    mobile: "9999999999",
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // sample manager + staff
  const mgrUid = "seed-manager-uid";
  const staffUid = "seed-staff-uid";
  await db.collection("employees").doc(mgrUid).set({
    uid: mgrUid,
    email: "manager@ibots.test",
    name: "Manager One",
    role: "manager",
    mobile: "8888888888",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await db.collection("employees").doc(staffUid).set({
    uid: staffUid,
    email: "staff@ibots.test",
    name: "Staff One",
    role: "staff",
    mobile: "7777777777",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // team
  await db.collection("teams").doc("team-1").set({
    name: "Sales Team 1",
    managerUid: mgrUid,
    members: [staffUid],
  });

  // sample enquiry
  const enqRef = await db.collection("enquiries").add({
    enqId: "ENQ-TEST-001",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: staffUid,
    assignedTo: staffUid,
    mode: "WhatsApp",
    type: "B2C",
    value: 1200,
    status: "New",
    customer: { name: "Test Customer", contact: "9999999999", email: "cust@test.com", city: "City" },
  });

  await db.collection("enquiries").doc(enqRef.id).collection("audits").add({
    actor: staffUid,
    action: "created",
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    snapshot: { enqId: "ENQ-TEST-001", status: "New" },
  });

  console.log("Seed complete");
}

seed().catch((e) => console.error(e));