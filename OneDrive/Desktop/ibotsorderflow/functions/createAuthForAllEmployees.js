const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const svcPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!svcPath || !fs.existsSync(svcPath)) {
  console.error("Set GOOGLE_APPLICATION_CREDENTIALS to a valid service account JSON path");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(svcPath)),
  });
}
const db = admin.firestore();

const DEFAULT_PW = "Seed@1234";

async function ensureAuthForEmployee(doc) {
  const data = doc.data() || {};
  let { uid, email, name } = data;
  name = name || data.displayName || data.fullName || data.name || "Seed User";

  try {
    let userRecord = null;
    if (uid) {
      try {
        userRecord = await admin.auth().getUser(uid);
      } catch (err) {
        if (err.code !== "auth/user-not-found") throw err;
      }
    }

    if (!userRecord && email) {
      try {
        userRecord = await admin.auth().getUserByEmail(email);
        // if found but uid missing in employee doc, write it back
      } catch (err) {
        if (err.code !== "auth/user-not-found") throw err;
      }
    }

    if (!userRecord) {
      // create new user; prefer to set uid if available (keeps doc aligned)
      const createOpts = {
        email: email || `seed-${doc.id}@example.com`,
        password: DEFAULT_PW,
        displayName: name,
      };
      if (uid) createOpts.uid = uid;
      userRecord = await admin.auth().createUser(createOpts);
      console.log(`Created auth user: ${userRecord.uid} (email: ${userRecord.email})`);
    } else {
      // update to ensure displayName/email exist
      const updateData = {};
      if (email && userRecord.email !== email) updateData.email = email;
      if (userRecord.displayName !== name) updateData.displayName = name;
      if (Object.keys(updateData).length) {
        await admin.auth().updateUser(userRecord.uid, updateData);
        console.log(`Updated auth user: ${userRecord.uid}`);
      } else {
        console.log(`Auth user exists: ${userRecord.uid}`);
      }
    }

    // ensure employee doc has uid set
    if (!uid || uid !== userRecord.uid) {
      await db.collection("employees").doc(doc.id).update({ uid: userRecord.uid });
      console.log(`Patched employees/${doc.id} uid -> ${userRecord.uid}`);
    }

    return { success: true, uid: userRecord.uid, email: userRecord.email };
  } catch (err) {
    console.error(`Failed for employees/${doc.id}:`, err);
    return { success: false, error: String(err) };
  }
}

async function run() {
  const snap = await db.collection("employees").get();
  if (snap.empty) {
    console.log("No employee documents found in /employees");
    return;
  }
  console.log(`Found ${snap.size} employee docs. Processing...`);
  const results = [];
  for (const doc of snap.docs) {
    // skip service accounts or test rows by pattern if you want
    results.push(await ensureAuthForEmployee(doc));
  }
  console.log("Done. Summary:");
  console.table(results);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});