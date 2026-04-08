import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ShojiProvider } from "@/components/providers/ShojiContext";
import ConditionalNavbar from "@/components/layout/ConditionalNavbar";
import RoleGatedFeatures from "@/components/effects/RoleGatedFeatures";
import AuthGuard from "@/components/auth/AuthGuard";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>

      <body suppressHydrationWarning>
        <ThemeProvider>
          <ShojiProvider>
            <ConditionalNavbar />
            <main>{children}</main>
              <RoleGatedFeatures />
          </ShojiProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}