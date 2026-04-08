"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Flower2,
  Layers,
  ExternalLink,
  Tag,
  RefreshCw,
  Calculator,
  Percent,
  Receipt,
  Star,
  ShieldCheck,
  RotateCcw,
  ZapOff,
  Info,
  Check,
  Sparkles,
  Crown,
  Zap,
  ChevronRight,
  Loader2,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { useRole } from "../hooks/useRole";
import { useAuth } from "../hooks/useAuth";
import AuthGuard from "@/components/auth/AuthGuard";

// ─── Constants ────────────────────────────────────────────────────────────────
const USD_RATE = 26_334;
const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const toVND = (usd: number) => Math.round((usd * USD_RATE) / 500) * 500;

type PlanId = "free" | "pro" | "master";
type Cycle = "monthly" | "yearly";

interface Plan {
  id: PlanId;
  seal: string;
  name: string;
  sub: string;
  usd: number;
  accent: string;
  accentBg: string;
  accentBorder: string;
  features: string[];
  FeatIcon: React.ElementType;
  badge?: string;
  BadgeIcon?: React.ElementType;
}

const PLANS: Plan[] = [
  {
    id: "free",
    seal: "無",
    name: "Free · 無料",
    sub: "Free forever, no credit card required",
    usd: 0,
    accent: "#44403c",
    accentBg: "rgba(68,64,60,0.06)",
    accentBorder: "rgba(68,64,60,0.25)",
    features: [
      "Up to 50 vocabulary words",
      "Basic flashcards",
      "3 learning topics",
      "Manual data entry",
    ],
    FeatIcon: Check,
  },
  {
    id: "pro",
    seal: "上",
    name: "Pro · 上級",
    sub: "Learning without limits with AI",
    usd: 4.9,
    accent: "#e84d6a",
    accentBg: "rgba(232,77,106,0.06)",
    accentBorder: "rgba(232,77,106,0.35)",
    features: [
      "Unlimited vocabulary",
      "AI-assisted translation",
      "AI-generated example sentences",
      "24/7 priority support",
    ],
    FeatIcon: Sparkles,
    badge: "Popular",
    BadgeIcon: Zap,
  },
  {
    id: "master",
    seal: "師",
    name: "Master · 師範",
    sub: "A complete experience for masters",
    usd: 9.9,
    accent: "#c47d2e",
    accentBg: "rgba(196,125,46,0.06)",
    accentBorder: "rgba(196,125,46,0.35)",
    features: [
      "All Pro benefits",
      "AI Conversation Training",
      "SRS System",
      "Anki/CSV Export",
      "Early access to new features",
    ],
    FeatIcon: Crown,
    badge: "Best",
    BadgeIcon: Crown,
  },
];

const VNPAY_ERRORS: Record<string, string> = {
  "07": "Thanh toán bị nghi ngờ gian lận",
  "09": "Thẻ chưa đăng ký dịch vụ",
  "10": "Xác thực thẻ sai quá 3 lần",
  "11": "Giao dịch đã hết hạn",
  "12": "Thẻ bị khoá",
  "13": "Sai OTP",
  "24": "Giao dịch bị huỷ",
  "51": "Tài khoản không đủ số dư",
  "65": "Vượt hạn mức giao dịch",
  "75": "Ngân hàng đang bảo trì",
  "79": "Nhập sai mật khẩu quá số lần",
  "99": "Lỗi không xác định",
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StepIndicator() {
  const steps = ["Choose plan", "Pay", "Finish"];
  return (
    <div className="flex items-center gap-1.5 text-xs text-stone-400">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1.5">
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-medium
            ${
              i === 0
                ? "bg-emerald-50 border-emerald-300 text-emerald-600"
                : i === 1
                  ? "bg-rose-50 border-rose-300 text-rose-500"
                  : "border-stone-200 text-stone-400"
            }`}
          >
            {i === 0 ? <Check className="w-2.5 h-2.5" /> : i + 1}
          </div>
          <span className={i === 1 ? "text-stone-700 font-medium" : ""}>
            {s}
          </span>
          {i < steps.length - 1 && (
            <ChevronRight className="w-3 h-3 text-stone-300" />
          )}
        </div>
      ))}
    </div>
  );
}

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-medium tracking-widest uppercase text-stone-400 mb-4">
      <Icon className="w-3.5 h-3.5" />
      {children}
      <div className="flex-1 h-px bg-stone-100" />
    </div>
  );
}

function StatusBanner({
  status,
  code,
}: {
  status: string | null;
  code: string | null;
}) {
  if (!status || status === "cancelled") return null;
  if (status === "failed") {
    const msg = code
      ? (VNPAY_ERRORS[code] ?? `Lỗi mã ${code}`)
      : "Thanh toán thất bại";
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-100 bg-red-50 text-red-600 text-[12px] mb-4">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        {msg} · Vui lòng thử lại hoặc chọn phương thức khác.
      </div>
    );
  }
  if (status === "invalid") {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-amber-100 bg-amber-50 text-amber-700 text-[12px] mb-4">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        Phản hồi từ VNPay không hợp lệ. Liên hệ hỗ trợ nếu đã bị trừ tiền.
      </div>
    );
  }
  return null;
}

function VNPayInfo() {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
        <CreditCard className="w-7 h-7 text-blue-400" />
      </div>
      <div>
        <p className="text-[13px] font-medium text-stone-600">
          Payment via VNPay
        </p>
        <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
          Domestic ATM · International Visa/MC
          <br />
          QR Code · VNPay Wallet · 50+ Banks
        </p>
      </div>
      <div className="flex gap-2 flex-wrap justify-center mt-1">
        {[
          "Vietcombank",
          "Techcombank",
          "MB Bank",
          "BIDV",
          "Visa",
          "Mastercard",
        ].map((b) => (
          <span
            key={b}
            className="text-[9px] font-medium px-2 py-0.5 border border-stone-100 rounded text-stone-400 bg-stone-50"
          >
            {b}
          </span>
        ))}
      </div>
      <p className="text-[10px] text-stone-300 mt-1">
        You will be redirected to the VNPay payment gateway.
      </p>
    </div>
  );
}
function CheckoutContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const errorCode = searchParams.get("code");
  const initialPlan = searchParams.get("plan") as PlanId | null;

  // ✅ Fix 1: lấy user thật từ auth
  const { user } = useAuth();
  const { isPro, isMaster, isAdmin, loading: roleLoading } = useRole();

  const [plan, setPlan] = useState<PlanId>("pro");
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Auto-select plan based on current role ──
  useEffect(() => {
    if (roleLoading) return;
    if (isMaster || isAdmin) {
      setPlan("master");
    } else if (isPro) {
      // Pro users can only upgrade to master
      setPlan(initialPlan === "master" ? "master" : "master");
    } else {
      setPlan((initialPlan as PlanId) || "pro");
    }
  }, [isPro, isMaster, isAdmin, roleLoading, initialPlan]);

  const selected = PLANS.find((p) => p.id === plan)!;
  const mult = cycle === "yearly" ? 0.8 : 1;

  // ── Pricing ──
  const baseVnd = toVND(selected.usd * mult);

  // Upgrade discount: Pro → Master, deduct current Pro price
  const showUpgradeDiscount = isPro && plan === "master" && !isAdmin;
  const discountVnd = showUpgradeDiscount
    ? toVND(PLANS.find((p) => p.id === "pro")!.usd * mult)
    : 0;
  const priceVnd = Math.max(0, baseVnd - discountVnd);
  const vatVnd = Math.round((priceVnd * 0.1) / 500) * 500;
  const totalVnd = priceVnd + vatVnd;
  // console.log({ baseVnd, discountVnd, priceVnd, vatVnd, totalVnd });
  // ── Disabled state ──
  const isDisabled =
    loading || plan === "free" || isMaster || (isPro && plan === "pro");

  // ── CTA label ──
  const ctaLabel = () => {
    if (loading)
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Redirecting...
        </>
      );
    if (isAdmin)
      return (
        <>
          <ShieldCheck className="w-4 h-4" /> Admin – bypass payment
        </>
      );
    if (isMaster)
      return (
        <>
          <ShieldCheck className="w-4 h-4" /> You're already Master
        </>
      );
    if (isPro && plan === "pro")
      return (
        <>
          <Check className="w-4 h-4" /> Your current plan
        </>
      );
    if (plan === "free")
      return (
        <>
          <Check className="w-4 h-4" /> Get started for free
        </>
      );
    return (
      <>
        <ExternalLink className="w-4 h-4" /> Pay {fmt(totalVnd)} ₫ via VNPay
      </>
    );
  };

  // ── Plan lock logic ──
  const getPlanLock = (p: Plan): string | null => {
    if (isAdmin) return null; // admin can see everything
    if (isMaster) return p.id !== "master" ? "Lower plan" : "Current";
    if (isPro) {
      if (p.id === "free") return "Lower plan";
      if (p.id === "pro") return "Current";
    } else {
      if (p.id === "free") return "Current";
    }
    return null;
  };

  async function handlePay() {
    if (isDisabled || !user) return;
    setLoading(true);
    setError(null);
    try {
      console.log(totalVnd);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, cycle, userId: user.uid }),
        // ,amount: totalVnd
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error ?? "Không thể tạo link thanh toán");
      window.location.href = data.paymentUrl;
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại",
      );
      setLoading(false);
    }
  }

  return (
    <AuthGuard>
      <div
        className="min-h-screen px-4 py-8 max-w-5xl mx-auto"
        style={{
          fontFamily: "'Noto Serif JP', 'Cormorant Garamond', Georgia, serif",
        }}
      >
        {/* Nav */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-sm font-medium text-stone-700">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
              <Flower2 className="w-4 h-4 text-rose-400" />
            </div>
            Sakura Learn
          </div>
          <StepIndicator />
        </div>

        <StatusBanner status={status} code={errorCode} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">
          {/* ── LEFT ── */}
          <div className="space-y-4">
            {/* Plan selector */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5">
              <SectionLabel icon={Layers}>Choose your plan</SectionLabel>
              <div className="grid grid-cols-3 gap-2.5">
                {PLANS.map((p) => {
                  const lockReason = getPlanLock(p);
                  const isActive = plan === p.id;
                  const locked =
                    lockReason !== null &&
                    lockReason !== "Current" &&
                    !isActive;
                  // "Current" plan stays selectable visually but CTA will be disabled
                  const selectable = !locked;

                  return (
                    <button
                      key={p.id}
                      disabled={!selectable}
                      onClick={() => {
                        if (selectable) {
                          setPlan(p.id);
                          setError(null);
                        }
                      }}
                      className={`relative text-left rounded-xl border p-3.5 transition-all duration-200
                        ${!selectable ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      style={{
                        borderColor: isActive ? p.accentBorder : "#e7e5e4",
                        borderWidth: isActive ? "1.5px" : "1px",
                        background: isActive ? p.accentBg : "#fff",
                      }}
                    >
                      {lockReason && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px] rounded-xl z-10">
                          <span className="text-[10px] font-bold uppercase tracking-tight text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                            {lockReason}
                          </span>
                        </div>
                      )}
                      {p.badge && p.BadgeIcon && !lockReason && (
                        <div
                          className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded"
                          style={{ background: p.accentBg, color: p.accent }}
                        >
                          <p.BadgeIcon className="w-2 h-2" />
                          {p.badge}
                        </div>
                      )}
                      <div
                        className="text-base font-light mb-1.5"
                        style={{
                          color: isActive ? p.accent : "#a8a29e",
                          fontFamily: "'Noto Serif JP', serif",
                        }}
                      >
                        {p.seal}
                      </div>
                      <div className="text-[13px] font-medium text-stone-700 mb-0.5 capitalize">
                        {p.id}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        {p.usd === 0
                          ? "Free"
                          : `${fmt(toVND(p.usd * mult))} ₫/mo`}
                      </div>
                    </button>
                  );
                })}
              </div>

              {plan !== "free" && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {(["monthly", "yearly"] as Cycle[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setCycle(c);
                        setError(null);
                      }}
                      className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-all"
                      style={{
                        borderColor: cycle === c ? "#fda4af" : "#e7e5e4",
                        borderWidth: cycle === c ? "1.5px" : "1px",
                        background:
                          cycle === c ? "rgba(253,164,175,0.08)" : "#fff",
                      }}
                    >
                      <div>
                        <div className="text-[12px] font-medium text-stone-700">
                          {c === "monthly" ? "Monthly" : "Yearly"}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {fmt(
                            toVND(selected.usd * (c === "yearly" ? 0.8 : 1)),
                          )}{" "}
                          ₫ / mo
                        </div>
                      </div>
                      {c === "yearly" && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
                          –20%
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Payment method */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5">
              <SectionLabel icon={CreditCard}>Payment method</SectionLabel>
              <VNPayInfo />
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 mt-3 rounded-lg bg-red-50 border border-red-100 text-[11px] text-red-500">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="space-y-3">
            <div className="bg-white border border-stone-200 rounded-2xl p-5">
              <SectionLabel icon={Receipt}>Order summary</SectionLabel>

              {/* Plan badge */}
              <div
                className="flex items-center gap-3 p-3 rounded-xl border mb-5"
                style={{
                  borderColor: selected.accentBorder,
                  background: selected.accentBg,
                }}
              >
                <div
                  className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg font-light flex-shrink-0"
                  style={{
                    borderColor: selected.accent,
                    color: selected.accent,
                    fontFamily: "'Noto Serif JP', serif",
                  }}
                >
                  {selected.seal}
                </div>
                <div>
                  <div className="text-[13px] font-medium text-stone-700">
                    {selected.name}
                  </div>
                  <div className="text-[11px] text-stone-400">
                    {selected.sub}
                  </div>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="space-y-1.5 text-[12px]">
                {[
                  {
                    icon: Tag,
                    label: "Subscription plan",
                    val:
                      selected.usd === 0
                        ? "Free"
                        : `$${(selected.usd * mult).toFixed(2)}`,
                  },
                  {
                    icon: RefreshCw,
                    label: "USD/VND rate",
                    val: `${fmt(USD_RATE)} ₫`,
                  },
                  {
                    icon: Calculator,
                    label: "Subtotal",
                    val: `${fmt(baseVnd)} ₫`,
                  },
                  ...(showUpgradeDiscount
                    ? [
                        {
                          icon: Tag,
                          label: "Upgrade discount (Pro)",
                          val: `–${fmt(discountVnd)} ₫`,
                        },
                      ]
                    : []),
                  {
                    icon: Percent,
                    label: "VAT (10%)",
                    val: `${fmt(vatVnd)} ₫`,
                  },
                ].map(({ icon: Icon, label, val }) => (
                  <div
                    key={label}
                    className="flex justify-between items-center py-1"
                  >
                    <span className="flex items-center gap-1.5 text-stone-400">
                      <Icon className="w-3 h-3" />
                      {label}
                    </span>
                    <span
                      className={`font-medium ${label.startsWith("Upgrade") ? "text-emerald-600" : "text-stone-600"}`}
                    >
                      {val}
                    </span>
                  </div>
                ))}
                <div className="h-px bg-stone-100 my-2" />
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-[13px] font-medium text-stone-700">
                    Total
                  </span>
                  <span
                    className="text-xl font-medium"
                    style={{ color: selected.accent }}
                  >
                    {fmt(totalVnd)} ₫
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1 mt-3 text-[10px] text-stone-300 border-t border-dashed border-stone-100 pt-3">
                <Info className="w-2.5 h-2.5" />
                Vietcombank reference rate · Subject to change
              </div>

              {/* CTA */}
              <button
                onClick={handlePay}
                disabled={isDisabled}
                className="w-full h-11 rounded-xl font-medium text-[13px] flex items-center justify-center gap-2 mt-4 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
                style={{ background: isDisabled ? undefined : selected.accent }}
              >
                {ctaLabel()}
              </button>

              <div className="flex justify-center gap-4 mt-3 flex-wrap">
                {[
                  { Icon: ShieldCheck, label: "SSL 256-bit" },
                  { Icon: RotateCcw, label: "7-day refund" },
                  { Icon: ZapOff, label: "Cancel anytime" },
                ].map(({ Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-1 text-[10px] text-stone-300"
                  >
                    <Icon className="w-2.5 h-2.5" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5">
              <SectionLabel icon={Star}>Benefits included</SectionLabel>
              <ul className="space-y-2.5">
                {selected.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2.5 text-[12px] text-stone-500"
                  >
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: selected.accentBg }}
                    >
                      <selected.FeatIcon
                        className="w-2.5 h-2.5"
                        style={{ color: selected.accent }}
                      />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fdf9f6] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
