// src/app/libs/firebase-admin.ts
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
function getPrivateKey() {
  const key = process.env.FIREBASE_PRIVATE_KEY ?? "";
  console.log("KEY START:", key.slice(0, 40));
  console.log("KEY END:", key.slice(-20));
  console.log("HAS LITERAL \\n:", key.includes("\\n"));
  console.log("HAS REAL NEWLINE:", key.includes("\n"));
  return key.includes("\\n") ? key.replace(/\\n/g, "\n") : key;
}
export function initAdmin() {
  if (getApps().length > 0) return;
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey:  getPrivateKey(), // ← thay vì (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n")
    }),
  });
}

initAdmin();
export const adminDb = getFirestore();
export const adminAuth = getAuth();
