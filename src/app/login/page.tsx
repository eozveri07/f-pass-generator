"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ThemeAwareLogo from "@/components/Logo";
import { ThemeToggle } from "@/components/mode-toggle";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { SpotlightPreview } from "@/components/Spotlight";
import NavButton from "@/components/NavButton";
import { ArrowLeft } from "lucide-react";

export default function SignIn() {
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

      <div className="relative min-h-screen z-20 flex flex-col items-center justify-between p-8">
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-white/95 dark:from-black/60 dark:to-black/95 pointer-events-none"></div>

        {/* Spotlight */}
        {isDarkMode && (
          <div className="absolute inset-0 z-30 hidden dark:block pointer-events-none">
            {" "}
            <SpotlightPreview />
          </div>
        )}

        <header className="relative w-full flex justify-between items-center mb-12">
          <ThemeAwareLogo />
          <div className="flex items-center gap-2">
            <NavButton icon={ArrowLeft} title="Back to Generator" href="/" />
            <ThemeToggle />
          </div>
        </header>

        <main className="relative flex-grow flex items-center justify-center w-full max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <Card className="p-8">
              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-3xl font-bold mb-6 text-center"
              >
                Welcome Back
              </motion.h2>
              <Button
                className="w-full py-6 text-lg"
                onClick={() => signIn("google", { callbackUrl: "/2fa" })}
              >
                <svg
                  className="mr-2 h-5 w-5"
                  aria-hidden="true"
                  focusable="false"
                  data-prefix="fab"
                  data-icon="google"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 488 512"
                >
                  <path
                    fill="currentColor"
                    d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                  ></path>
                </svg>
                Continue with Google
              </Button>
            </Card>
          </motion.div>
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
