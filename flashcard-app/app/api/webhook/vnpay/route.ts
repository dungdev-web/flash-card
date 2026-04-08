// app/api/webhook/vnpay/route.ts
// VNPay gọi IPN này server-to-server (không qua browser)
// Đây là nơi an toàn nhất để kích hoạt subscription
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const HASH_SECRET = process.env.VNPAY_HASH_SECRET!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    if (key !== "vnp_SecureHash" && key !== "vnp_SecureHashType") {
      params[key] = value;
    }
  });

  const secureHash = searchParams.get("vnp_SecureHash") ?? "";
  const responseCode = searchParams.get("vnp_ResponseCode") ?? "";
  const txnRef = searchParams.get("vnp_TxnRef") ?? "";
  const vnpAmount = Number(searchParams.get("vnp_Amount") ?? 0);
  const transactionNo = searchParams.get("vnp_TransactionNo") ?? "";

  // ── 1. Verify signature ─────────────────────────────────────────────────────
  const sorted = Object.keys(params)
    .sort()
    .reduce((acc, key) => ({ ...acc, [key]: params[key] }), {} as Record<string, string>);
  const signData = new URLSearchParams(sorted).toString();
  const hmac = crypto.createHmac("sha512", HASH_SECRET);
  const checkHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  if (checkHash !== secureHash) {
    return NextResponse.json({ RspCode: "97", Message: "Invalid signature" });
  }

  // ── 2. Find order in DB ─────────────────────────────────────────────────────
  // const order = await db.order.findUnique({ where: { txnRef } });
  // if (!order) return NextResponse.json({ RspCode: "01", Message: "Order not found" });

  // ── 3. Verify amount ────────────────────────────────────────────────────────
  // if (order.amount * 100 !== vnpAmount) {
  //   return NextResponse.json({ RspCode: "04", Message: "Invalid amount" });
  // }

  // ── 4. Check if already processed (idempotency) ─────────────────────────────
  // if (order.status === "paid") {
  //   return NextResponse.json({ RspCode: "02", Message: "Order already confirmed" });
  // }

  if (responseCode === "00") {
    // ── SUCCESS ──────────────────────────────────────────────────────────────
    console.log(`[VNPay IPN] ✅ txnRef=${txnRef}, transactionNo=${transactionNo}`);

    // await db.order.update({
    //   where: { txnRef },
    //   data: { status: "paid", transactionNo, paidAt: new Date() },
    // });
    // await activateSubscription(order.userId, order.plan, order.cycle);
    // await sendConfirmationEmail(order.userEmail, order.plan);

    return NextResponse.json({ RspCode: "00", Message: "Confirm success" });
  } else {
    // ── FAILED ────────────────────────────────────────────────────────────────
    console.log(`[VNPay IPN] ❌ txnRef=${txnRef}, code=${responseCode}`);

    // await db.order.update({ where: { txnRef }, data: { status: "failed" } });

    return NextResponse.json({ RspCode: "00", Message: "Confirm success" }); // vẫn trả 00 để VNPay không retry
  }
}