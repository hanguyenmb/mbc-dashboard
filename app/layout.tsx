import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MBC Dashboard — Mắt Bão Corporation",
  description: "Hệ thống báo cáo kinh doanh nội bộ MBC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark h-full antialiased">
      <body className="min-h-full bg-slate-950 text-slate-100">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
