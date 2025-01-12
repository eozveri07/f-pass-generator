import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { Toaster } from "@/components/ui/toaster";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title:
    "Secure Password Generator - Create Strong Passwords Instantly | Fenrio",

  description:
    "Generate secure, unique, and unbreakable passwords effortlessly with Fenrio's Password Generator. Safeguard your accounts and enhance online security today.",
  icons: {
    icon: "/images/favicon.ico",
  },
  openGraph: {
    title:
      "Secure Password Generator - Create Strong Passwords Instantly | Fenrio",
    description:
      "Generate secure, unique, and unbreakable passwords effortlessly with Fenrio's Password Generator. Safeguard your accounts and enhance online security today.",
    url: "https://pass.fenrio.com",
    siteName: "Fenrio",
    images: [
      {
        url: "https://fenrio.com/images/logo.png",
        width: 1200,
        height: 630,
        alt: "Secure Password Generator - Create Strong Passwords Instantly | Fenrio",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head></head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <TailwindIndicator />
        </ThemeProvider>
      </body>
    </html>
  );
}
