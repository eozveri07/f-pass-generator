import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "next-auth/react";
import { TwoFactorProvider } from "@/contexts/TwoFactorContent";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
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
    <html lang="en" suppressHydrationWarning>
      <head></head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <TwoFactorProvider pollInterval={10000}>
              {children}
            </TwoFactorProvider>
          </SessionProvider>
          <Toaster />
          <TailwindIndicator />
        </ThemeProvider>
      </body>
    </html>
  );
}
