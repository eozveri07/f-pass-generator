"use client";

import ThemeAwareLogo from "@/components/Logo";
import { ThemeToggle } from "@/components/mode-toggle";
import PasswordGenerator from "@/components/PasswordGenerator";
import { SpotlightPreview } from "@/components/Spotlight";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import NavButton from "@/components/NavButton";
import { LogIn } from "lucide-react";

export default function Home() {
  const currentYear = new Date().getFullYear();
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDarkMode = resolvedTheme === "dark";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-200 to-indigo-200 dark:from-gray-950 dark:via-indigo-950 dark:to-blue-900 blur-2xl transform scale-110"></div>

      {/* Spotlight */}
      {isDarkMode && (
        <div className="absolute inset-0 z-30 hidden dark:block pointer-events-none">
          {" "}
          <SpotlightPreview />
        </div>
      )}

      {/* Content */}
      <div className="relative min-h-screen z-20 flex flex-col items-center justify-between p-8 font-[family-name:var(--font-geist-sans)]">
        {" "}
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-white/95 dark:from-black/60 dark:to-black/95 pointer-events-none"></div>
        <header className="relative w-full flex justify-between items-center mb-12">
          <ThemeAwareLogo />
          <div className="flex items-center gap-2">
            <NavButton icon={LogIn} title="Login" href="/login" />
            <ThemeToggle />
          </div>
        </header>
        <main className="relative flex-grow flex items-center justify-center w-full max-w-md mx-auto">
          <PasswordGenerator />
        </main>
        <footer className="relative mt-12 text-center text-sm text-gray-700 dark:text-gray-300">
          <a
            href="https://fenrio.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            © {currentYear} Fenrio. All rights reserved.
          </a>
        </footer>
      </div>
    </div>
  );
}
