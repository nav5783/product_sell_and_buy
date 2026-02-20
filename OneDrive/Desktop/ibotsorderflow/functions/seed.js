const admin = require("firebase-admin");

// Expect GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account json
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("Set GOOGLE_APPLICATION_CREDENTIALS environment variable to service account JSON path.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

async function seed() {
  const adminUid = "seed-admin-uid";
  const mgrUid = "seed-manager-uid";
  const staffUid = "seed-staff-uid";

  await db.collection("employees").doc(adminUid).set({
    uid: adminUid,
    email: "admin@ibots.test",
    name: "System Admin",
    role: "admin",
    mobile: "9999999999",
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection("employees").doc(mgrUid).set({
    uid: mgrUid,
    email: "manager@ibots.test",
    name: "Manager One",
    role: "manager",
    teamId: "team-1",
    mobile: "8888888888",
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection("employees").doc(staffUid).set({
    uid: staffUid,
    email: "staff@ibots.test",
    name: "Staff One",
    role: "staff",
    teamId: "team-1",
    mobile: "7777777777",
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection("teams").doc("team-1").set({
    name: "Sales Team 1",
    managerUid: mgrUid,
    members: [staffUid],
  });

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
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});