import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Contourline | triLift® · CBCD 2026",
  description:
    "Experiência exclusiva Contourline no CBCD 2026. Responda 3 perguntas sobre o triLift® e concorra ao sorteio.",
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
  applicationName: "triLift Quiz",
  appleWebApp: {
    capable: true,
    title: "triLift Quiz",
    statusBarStyle: "black-translucent",
    startupImage: [
      { url: "/logos/contourline-symbol.png" },
    ],
  },
  icons: {
    icon: "/logos/contourline-symbol.png",
    apple: [
      { url: "/logos/contourline-symbol.png", sizes: "180x180" },
    ],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0F2B4B",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-dvh bg-[var(--background)] text-[var(--foreground)] antialiased">
        {children}
      </body>
    </html>
  );
}
