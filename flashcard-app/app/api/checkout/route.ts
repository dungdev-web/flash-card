import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { format } from "date-fns";
// CHỈ IMPORT adminDb từ libs/firebase-admin
import { adminDb } from "@/app/libs/firebase-admin";

const VNPAY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const TMN_CODE = process.env.VNPAY_TMN_CODE!;
const HASH_SECRET = process.env.VNPAY_HASH_SECRET!;
const RETURN_URL = `${process.env.NEXT_PUBLIC_URL}/api/checkout/vnpay-return`;

const USD_RATE = 26334;

const PRICES: Record<string, number> = {
  pro: 4.9,
  master: 9.9,
};

const PLAN_NAMES: Record<string, string> = {
  pro: "Sakura Pro",
  master: "Sakura Master",
};

export async function POST(req: NextRequest) {
  try {
    const { plan, cycle, userId } = await req.json();

    // 1. Kiểm tra đầu vào
    if (!PRICES[plan] || (cycle !== "monthly" && cycle !== "yearly")) {
      return NextResponse.json({ error: "Invalid plan or cycle" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Lấy Role thật bằng ADMIN SDK (Sử dụng adminDb)
    // Cú pháp Admin SDK: .collection().doc().get()
    const userSnap = await adminDb.collection("users").doc(userId).get();
    
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnap.data();
    const userRole = userData?.role ?? "user";

    // 3. Logic tính toán giá tiền (Giữ nguyên của bạn)
    const toVND = (usd: number) => Math.round((usd * USD_RATE) / 500) * 500;
    const mult = cycle === "yearly" ? 0.8 : 1;
    const baseVnd = toVND(PRICES[plan] * mult);

    let discountVnd = 0;
    if (userRole === "pro" && plan === "master") {
      discountVnd = toVND(PRICES["pro"] * mult);
    }

    if (userRole === "master" || (userRole === "pro" && plan === "pro")) {
      return NextResponse.json({ error: "Gói không hợp lệ" }, { status: 400 });
    }

    const priceAfterDiscount = Math.max(0, baseVnd - discountVnd);
    const vatVnd = Math.round((priceAfterDiscount * 0.1) / 500) * 500;
    const finalAmount = priceAfterDiscount + vatVnd;

    // 4. Tạo VNPay Params
    const vnpAmount = finalAmount * 100;
    const txnRef = `SK${Date.now().toString().slice(-6)}`;
    const createDate = format(new Date(), "yyyyMMddHHmmss");
    const expireDate = format(new Date(Date.now() + 15 * 60 * 1000), "yyyyMMddHHmmss");

    const ipAddr = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1";

    const params: any = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: TMN_CODE,
      vnp_Amount: String(vnpAmount),
      vnp_CreateDate: createDate,
      vnp_CurrCode: "VND",
      vnp_IpAddr: ipAddr,
      vnp_Locale: "vn",
      vnp_OrderInfo: `${plan}|Thanh toan ${PLAN_NAMES[plan]} ${cycle === "yearly" ? "nam" : "thang"} ${txnRef}`,
      vnp_OrderType: "other",
      vnp_ReturnUrl: RETURN_URL,
      vnp_TxnRef: txnRef,
      vnp_ExpireDate: expireDate,
    };

    // 5. Sort và Hash
    const sorted: any = {};
    Object.keys(params).sort().forEach((key) => (sorted[key] = params[key]));

    const signData = new URLSearchParams(sorted).toString();
    const hmac = crypto.createHmac("sha512", HASH_SECRET);
    const secureHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    const paymentUrl = `${VNPAY_URL}?${signData}&vnp_SecureHash=${secureHash}`;

    return NextResponse.json({
      success: true,
      paymentUrl,
      totalVnd: finalAmount,
    });
  } catch (err) {
    console.error("Firebase Admin Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}