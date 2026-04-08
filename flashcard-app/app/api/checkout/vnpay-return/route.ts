// app/api/checkout/vnpay-return/route.ts
// VNPay redirects the user's browser here after payment (GET request)
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
  const amount = Number(searchParams.get("vnp_Amount") ?? 0) / 100;

  // ── Verify signature ────────────────────────────────────────────────────────
  const sorted = Object.keys(params)
    .sort()
    .reduce(
      (acc, key) => ({ ...acc, [key]: params[key] }),
      {} as Record<string, string>,
    );
  const signData = new URLSearchParams(sorted).toString();
  const hmac = crypto.createHmac("sha512", HASH_SECRET);
  const checkHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  if (checkHash !== secureHash) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/checkout?status=invalid`,
    );
  }

  if (responseCode === "00") {
    // ── SUCCESS ──────────────────────────────────────────────────────────────
    // TODO: update DB, activate subscription
    // const order = await db.order.update({
    //   where: { txnRef },
    //   data: { status: "paid", paidAt: new Date() },
    // });
    // await activateSubscription(order.userId, order.plan, order.cycle);
    const orderInfo = params["vnp_OrderInfo"] ?? "";
    const plan = orderInfo.startsWith("master") ? "master" : "pro";
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/checkout/success?ref=${txnRef}&amount=${amount}&plan=${plan}`,
    );
  } else {
    // ── FAILED / CANCELLED ────────────────────────────────────────────────────
    // await db.order.update({ where: { txnRef }, data: { status: "failed" } });
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/checkout?status=failed&code=${responseCode}`,
    );
  }
}
