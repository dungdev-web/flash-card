// app/api/admin/reset-usage/route.ts
import { NextResponse, NextRequest } from "next/server";
import { adminDb, adminAuth } from "@/app/libs/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Parse body
    const { userId, date } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // If no date provided, reset today
    const targetDate = date ?? new Date().toISOString().slice(0, 10);
    const docId = `${userId}_${targetDate}`;

    // 3. Reset exampleGen to 0
    await adminDb.collection("usage").doc(docId).set(
      { exampleGen: 0, uid: userId, date: targetDate, resetAt: new Date().toISOString(), resetBy: decoded.uid },
      { merge: true }
    );

    console.log(`✅ Admin ${decoded.uid} reset usage for ${userId} on ${targetDate}`);
    return NextResponse.json({ success: true, docId, date: targetDate });

  } catch (error: any) {
    console.error("❌ Reset usage error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}