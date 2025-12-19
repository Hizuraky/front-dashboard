import type { Metadata } from "next";
import { Kaisei_Opti, Roboto_Mono } from "next/font/google"; // Changed Zen_Maru_Gothic to Kaisei_Opti
import { Toaster } from "sonner";
import "./globals.css";

const kaiseiOpti = Kaisei_Opti({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-kaisei-opti",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Next.js Project Manager",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${kaiseiOpti.variable} ${robotoMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
