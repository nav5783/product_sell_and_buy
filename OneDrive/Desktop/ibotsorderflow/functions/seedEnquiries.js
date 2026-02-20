// Run: set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\serviceAccount.json ; node functions\seedEnquiries.js

const admin = require("firebase-admin");

const svcPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!svcPath) {
  console.error("Set GOOGLE_APPLICATION_CREDENTIALS to service account JSON path");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(svcPath)),
});

const db = admin.firestore();

async function run() {
  // create a sample employee (use your own uid if you want)
  const uid = "seed-user-uid-1";
  await db.collection("employees").doc(uid).set({
    uid,
    name: "Seed User",
    email: "seed@ibots.test",
    role: "admin",
    teamId: "team-seed",
  });
  console.log("Created employee", uid);

  // create 5 sample enquiries
  for (let i = 1; i <= 5; i++) {
    const doc = {
      enqId: `ENQ-SEED-${String(i).padStart(3, "0")}`,
      createdAt: admin.firestore.Timestamp.now(),
      createdBy: uid,
      assignedTo: uid,
      status: i === 1 ? "New" : "In Process",
      value: 1000 * i,
      mode: "Website",
      remarks: `Seed enquiry ${i}`,
      customer: {
        name: `Customer ${i}`,
        email: `cust${i}@example.com`,
        contact: `900000000${i}`,
      },
    };
    const ref = await db.collection("enquiries").add(doc);
    console.log("Created enquiry", ref.id);
  }

  console.log("Seeding complete");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});