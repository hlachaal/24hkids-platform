// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "24hKids Platform",
  description: "Plateforme de gestion des ateliers pour enfants",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-grow container mx-auto p-4">{children}</main>
        <footer className="bg-slate-800 text-slate-300 p-4 text-center text-sm">
          © 2025 24hKids & Co. Tous droits réservés. - <a href="/admin/dashboard">Admin Panel</a>
        </footer>
      </body>
    </html>
  );
}
