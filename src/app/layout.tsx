import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Monev OpenSID — Kabupaten Bandung",
  description:
    "Aplikasi Monitoring & Evaluasi Pemanfaatan Sistem Informasi Desa (OpenSID) dan Website Desa Kabupaten Bandung",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex">
        <Sidebar />
        <div className="main-content" style={{ flex: 1 }}>
          <Header />
          <main className="main-body">{children}</main>
        </div>
      </body>
    </html>
  );
}
