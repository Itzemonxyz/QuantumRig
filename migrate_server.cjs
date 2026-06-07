const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf-8');

// 1. Remove old imports
content = content.replace(/import \{ initializeApp \} from "firebase\/app";\n/, '');
content = content.replace(/import \{ getFirestore[\s\S]*?\} from "firebase\/firestore";\n/, '');
content = content.replace(/setLogLevel\('silent'\);\n?\n?/, '');

// 2. Replace connection logic
const oldLogicRegex = /\/\/ ================= FIREBASE SETUP =================[\s\S]*?console\.log\("🔥 Connected to Firebase Firestore with Long Polling"\);\n\}/;
const newLogic = `import * as admin from 'firebase-admin';

// Initialize the Admin SDK
let db: admin.firestore.Firestore | any = null;
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

if (serviceAccountJson) {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log("🔥 Connected to Firebase Admin (bypasses security rules)");
  } catch (error) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:", error);
  }
} else {
  console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT environment variable is missing.");
}`;

content = content.replace(oldLogicRegex, newLogic);

// 3. Replace Firestore methods
// setDoc(doc(db, "coll", id), data, {merge: true}) -> db.collection("coll").doc(id).set(data, {merge: true})
content = content.replace(/await setDoc\(doc\(db, (.*?), (.*?)\), (.*?), (\{.*?\})\)/g, 'await db.collection($1).doc($2).set($3, $4)');
// setDoc(doc(db, "coll", id), data) -> db.collection("coll").doc(id).set(data)
content = content.replace(/await setDoc\(doc\(db, (.*?), (.*?)\), (.*?)\)/g, 'await db.collection($1).doc($2).set($3)');
// deleteDoc(doc(db, "coll", id)) -> db.collection("coll").doc(id).delete()
content = content.replace(/await deleteDoc\(doc\(db, (.*?), (.*?)\)\)/g, 'await db.collection($1).doc($2).delete()');
// updateDoc(doc(db, "coll", id), data) -> db.collection("coll").doc(id).update(data)
content = content.replace(/await updateDoc\(doc\(db, (.*?), (.*?)\), (.*?)\)/g, 'await db.collection($1).doc($2).update($3)');
// getDocs(collection(db, "coll")) -> db.collection("coll").get()
content = content.replace(/await getDocs\(collection\(db, (.*?)\)\)/g, 'await db.collection($1).get()');

// If there are non-awaited ones (just in case)
content = content.replace(/setDoc\(doc\(db, (.*?), (.*?)\), (.*?), (\{.*?\})\)/g, 'db.collection($1).doc($2).set($3, $4)');
content = content.replace(/setDoc\(doc\(db, (.*?), (.*?)\), (.*?)\)/g, 'db.collection($1).doc($2).set($3)');
content = content.replace(/deleteDoc\(doc\(db, (.*?), (.*?)\)\)/g, 'db.collection($1).doc($2).delete()');
content = content.replace(/updateDoc\(doc\(db, (.*?), (.*?)\), (.*?)\)/g, 'db.collection($1).doc($2).update($3)');
content = content.replace(/getDocs\(collection\(db, (.*?)\)\)/g, 'db.collection($1).get()');

fs.writeFileSync('server.ts', content, 'utf-8');
console.log('Update complete.');
