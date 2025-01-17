"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import Cookies from "js-cookie";
import { checkMasterKeySalt } from "@/app/actions/user";
import { useSession } from "next-auth/react";
import { ClientCrypto } from "@/lib/client-crypto";
import ThemeAwareLogo from "@/components/Logo";
import { ThemeToggle } from "@/components/mode-toggle";
import { useTheme } from "next-themes";
import { SpotlightPreview } from "@/components/Spotlight";
import NavButton from "@/components/NavButton";
import { ArrowLeft } from "lucide-react";

export default function MasterKeySetup() {
  const { data: session } = useSession();
  const [masterKeySalt, setMasterKey] = useState("");
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();
  const currentYear = new Date().getFullYear();

  const checkMasterKeyStatus = async () => {
    try {
      const response = await fetch("/api/user/master-key-status");
      if (response.ok) {
        const { hasMasterKey } = await response.json();
        setIsNewUser(!hasMasterKey);
      }
    } catch (error) {
      console.error("Error checking master key status:", error);
    }
  };

  useEffect(() => {
    setMounted(true);
    checkMasterKeyStatus();
  }, []);

  if (!mounted) return null;
  if (Cookies.get("master_key")) return router.push("/admin");

  const isDarkMode = resolvedTheme === "dark";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (masterKeySalt.length !== 6 || !/^\d+$/.test(masterKeySalt)) {
      toast({
        title: "Error",
        description: "Master key must be 6 digits",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isNewUser) {
        const response = await fetch("/api/user/master-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ masterKeySalt }),
        });

        if (response.ok) {
          const masterKey = await ClientCrypto.hashMasterPassword(
            masterKeySalt
          );
          Cookies.set("master_key", masterKey);
          router.push("/admin");
        }
      } else {
        const userMail = session?.user?.email;
        if (userMail) {
          const checkMaster = await checkMasterKeySalt(userMail, masterKeySalt);

          if (checkMaster) {
            const masterKey = await ClientCrypto.hashMasterPassword(
              masterKeySalt
            );
            Cookies.set("master_key", masterKey);
            router.push("/admin");
          } else {
            toast({
              title: "Error",
              description: "Invalid master key",
              variant: "destructive",
            });
          }
        }
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-200 to-indigo-200 dark:from-gray-950 dark:via-indigo-950 dark:to-blue-900 blur-2xl transform scale-110"></div>
      <div className="relative min-h-screen z-20 flex flex-col items-center justify-between p-8">
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-white/95 dark:from-black/60 dark:to-black/95 pointer-events-none"></div>

        {isDarkMode && (
          <div className="absolute inset-0 z-30 hidden dark:block pointer-events-none">
            <SpotlightPreview />
          </div>
        )}

        <header className="relative w-full flex justify-between items-center mb-12">
          <ThemeAwareLogo />
          <div className="flex items-center gap-2">
            <NavButton icon={ArrowLeft} title="Back" href="/" />
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
                {isNewUser ? "Set Up Master Key" : "Enter Master Key"}
              </motion.h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
                {isNewUser
                  ? "Create a 6-digit master key for additional security"
                  : "Enter your 6-digit master key to continue"}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="password"
                  maxLength={6}
                  placeholder="******"
                  value={masterKeySalt}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setMasterKey(value);
                  }}
                  className="text-center text-2xl tracking-widest"
                />
                <Button type="submit" className="w-full py-6 text-lg">
                  {isNewUser ? "Set Master Key" : "Continue"}
                </Button>
              </form>
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
