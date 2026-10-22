import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; // Langsung impor Navbar di sini

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ormov App",
  description: "PT Eka Ormed Indonesia - SPK Monitoring System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F1F4F2] text-[#12292D]">
        {/* Navbar sudah otomatis membungkus semua halaman */}
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}