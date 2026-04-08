// src/middleware.ts  (hoặc middleware.ts ở root project)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Bỏ qua warning page của ngrok khi dùng local dev
  // Header này báo cho ngrok biết đây là request hợp lệ từ developer
  res.headers.set("ngrok-skip-browser-warning", "true");

  return res;
}

// Áp dụng cho tất cả routes
export const config = {
  matcher: "/:path*",
};