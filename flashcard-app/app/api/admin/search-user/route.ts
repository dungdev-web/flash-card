// app/api/admin/search-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { initAdmin } from "@/app/libs/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  initAdmin();
  const { email, idToken } = await req.json();

  // Verify caller là admin
  const decoded = await getAuth().verifyIdToken(idToken);
  const adminDoc = await getFirestore().collection("users").doc(decoded.uid).get();
  if (adminDoc.data()?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Query bằng Admin SDK — bypass rules
  const snap = await getFirestore()
    .collection("users")
    .where("email", "==", email.trim())
    .get();

  if (snap.empty) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const d = snap.docs[0].data();
  return NextResponse.json({ uid: d.uid, email: d.email, role: d.role ?? "user" });
}