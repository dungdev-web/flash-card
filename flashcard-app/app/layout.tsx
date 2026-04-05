import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ShojiProvider } from "@/components/providers/ShojiContext";
import ConditionalNavbar from "@/components/layout/ConditionalNavbar";
import AuthenticatedExtras from "@/components/providers/AuthenticatedExtras";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="">
        <ThemeProvider>
          <ShojiProvider>
            <ConditionalNavbar />
            <main className="">{children}</main>
             <AuthenticatedExtras />
          </ShojiProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}