import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { db } from "@/app/libs/firebase";
import { doc, setDoc, addDoc, collection } from "firebase/firestore";
import nodemailer from "nodemailer";
import { getFirestore } from "firebase-admin/firestore";
// ── Nodemailer ────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

function formatVND(amount: number) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " ₫";
}

function buildInvoiceHtml({
  email,
  plan,
  amount,
  ref,
  date,
}: {
  email: string;
  plan: string;
  amount: number;
  ref: string;
  date: string;
}) {
  const planLabel = plan === "master" ? "Master · 師範" : "Pro · 上級";
  const planColor = plan === "master" ? "#c47d2e" : "#e84d6a";
  const features =
    plan === "master"
      ? [
          "Sakura AI chatbot",
          "Voice conversation",
          "Anki export",
          "SRS system",
          "Unlimited words",
          "AI translate",
        ]
      : [
          "Sakura AI chatbot",
          "AI translate",
          "AI example generator",
          "Unlimited words",
          "Sakura overlay",
        ];

  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"/><title>Hóa đơn FlashCard</title></head>
<body style="margin:0;padding:0;background:#fdf9f6;font-family:'Georgia',serif;">
<div style="max-width:480px;margin:40px auto;background:#fff;border-radius:20px;border:1px solid #e7e0d8;overflow:hidden;">

  <div style="background:#1c1917;padding:32px;text-align:center;">
    <p style="margin:0;font-size:10px;letter-spacing:4px;color:#78716c;text-transform:uppercase;">学習アプリ</p>
    <p style="margin:4px 0 0;font-size:20px;font-weight:300;letter-spacing:3px;color:rgba(255,255,255,0.85);">FlashCard</p>
  </div>

  <div style="text-align:center;padding:32px 0 16px;">
<div style="display: block; width: 72px; height: 72px; line-height: 70px; text-align: center; border-radius: 50%; border: 2px solid ${planColor}; background: ${planColor}15; color: ${planColor}; font-size: 28px; font-weight: 300; margin: 0 auto;">
  ${plan === "master" ? "師" : "上"}
</div>
    <p style="margin:12px 0 4px;font-size:24px;font-weight:300;color:#1c1917;">ありがとう</p>
    <p style="margin:0;font-size:13px;color:#a8a29e;">Thank you for your support</p>
  </div>

  <div style="text-align:center;padding:0 32px 24px;">
    <div style="display:inline-flex;align-items:center;gap:8px;padding:8px 20px;border-radius:100px;border:1px solid ${planColor}50;background:${planColor}10;color:${planColor};font-size:13px;">
      ✦ ${planLabel} đã được kích hoạt
    </div>
  </div>

  <div style="margin:0 32px;background:#faf9f7;border-radius:12px;padding:20px;border:1px solid #f0ebe3;">
    <p style="margin:0 0 12px;font-size:10px;letter-spacing:2px;color:#a8a29e;text-transform:uppercase;">Thông tin giao dịch</p>
    ${[
      ["Khách hàng", email],
      ["Gói dịch vụ", planLabel],
      ["Số tiền", formatVND(amount)],
      ["Mã giao dịch", ref],
      ["Ngày", date],
      ["Trạng thái", "✓ Thành công"],
    ]
      .map(
        ([label, value]) => `
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0ebe3;">
        <span style="font-size:12px;color:#a8a29e;">${label}</span>
        <span style="font-size:12px;color:#44403c;">${value}</span>
      </div>`,
      )
      .join("")}
  </div>

  <div style="margin:24px 32px;padding:20px;border-radius:12px;background:#fdf9f6;border:1px solid #f0ebe3;">
    <p style="margin:0 0 12px;font-size:10px;letter-spacing:2px;color:#a8a29e;text-transform:uppercase;">Quyền lợi đã mở khoá</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      ${features
        .map(
          (f) => `
        <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#57534e;">
          <span style="color:${planColor};">✦</span> ${f}
        </div>`,
        )
        .join("")}
    </div>
  </div>

  <div style="padding:0 32px 32px;text-align:center;">
    <a href="${process.env.NEXT_PUBLIC_URL}/dashboard"
      style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;border-radius:12px;background:${planColor};color:#fff;text-decoration:none;font-size:13px;font-weight:300;">
      Bắt đầu học ngay →
    </a>
    <p style="margin:16px 0 0;font-size:10px;color:#c4b9ad;letter-spacing:1px;">桜 Sakura AI · FlashCard</p>
  </div>

</div>
</body>
</html>`;
}

// ── Firebase Admin (chỉ Auth) ─────────────────────────────────────────────────
function initAdmin() {
  if (getApps().length > 0) return;
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(
        /\\n/g,
        "\n",
      ),
    }),
  });
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { uid, email, amount, plan, ref, idToken } = await req.json();

    // Xác minh user
    initAdmin();
    const decoded = await getAuth().verifyIdToken(idToken);
    if (decoded.uid !== uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (plan !== "pro" && plan !== "master") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    const adminDb = getFirestore(); // Lấy Firestore Instance từ Admin SDK
    const date = new Date().toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // 1. Upgrade role bằng Admin (Có quyền ghi đè mọi Rules)
    await adminDb.collection("users").doc(uid).set(
      {
        role: plan,
        upgradedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    // 2. Lưu transaction bằng Admin
    await adminDb.collection("transactions").add({
      uid,
      email,
      amount,
      ref,
      plan,
      createdAt: new Date().toISOString(),
      status: "success",
    });
    // Gửi email hóa đơn
    await transporter.sendMail({
      from: `"FlashCard 桜" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `🌸 Hóa đơn FlashCard ${plan === "master" ? "Master" : "Pro"} — ${ref}`,
      html: buildInvoiceHtml({ email, plan, amount, ref, date }),
    });

    return NextResponse.json({ success: true, plan });
  } catch (err: any) {
    console.error("payment-success error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
