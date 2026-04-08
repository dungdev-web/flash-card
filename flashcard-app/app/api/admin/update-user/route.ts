// src/app/api/update-role/route.ts
import { adminAuth, adminDb } from "@/app/libs/firebase-admin"; // Đảm bảo đã init admin
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { uid, role, idToken } = await req.json();

    // 1. Xác thực người thực hiện lệnh này phải là Admin
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (decodedToken.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Cập nhật Custom Claims (Quan trọng để check auth.token.role)
    await adminAuth.setCustomUserClaims(uid, { role: role });

    // 3. Cập nhật Firestore (Để hiển thị và query)
    await adminDb.collection("users").doc(uid).set({
      role: role,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update Role Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}