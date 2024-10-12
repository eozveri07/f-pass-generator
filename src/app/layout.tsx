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
  title: "Fenrio Password Generator",
  description: "Easily generate strong and secure passwords for all your needs with us.",
  icons: {
    icon: "/images/favicon.ico",
  },
  openGraph: {
    title: "Fenrio Password Generator",
    description: "Easily generate strong and secure passwords for all your needs with us.",
    url: "https://pass.fenrio.com", 
    siteName: "Fenrio",
    images: [
      {
        url: "https://fenrio.com/images/logo.png", 
        width: 1200,
        height: 630,
        alt: "Fenrio Password Generator",
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
      <head>
      </head>
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
