"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import Cookies from "js-cookie";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import ThemeAwareLogo from "@/components/Logo";
import { ThemeToggle } from "@/components/mode-toggle";
import { SpotlightPreview } from "@/components/Spotlight";
import NavButton from "@/components/NavButton";
import { ArrowLeft } from "lucide-react";
import { VirtualKeyboard } from "@/components/VirtualKeyboard";
import { ZeroKnowledgeCrypto } from "@/lib/zero-knowledge-crypto";

export default function MasterKeySetup() {
  const { data: session } = useSession();
  const [masterKey, setMasterKey] = useState("");
  const [confirmMasterKey, setConfirmMasterKey] = useState("");
  const [reminder, setReminder] = useState("");
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showReminderOption, setShowReminderOption] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const statusCheckedRef = useRef(false);
  const router = useRouter();
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();
  const currentYear = new Date().getFullYear();

  const checkMasterKeyStatus = async () => {
    if (statusCheckedRef.current) return;
    
    try {
      const response = await fetch("/api/user/master-key-status");
      if (response.ok) {
        const { hasMasterKey } = await response.json();
        setIsNewUser(!hasMasterKey);
        statusCheckedRef.current = true;
      }
    } catch (error) {
      console.error("Master key durumu kontrol edilirken hata:", error);
    }
  };

  useEffect(() => {
    setMounted(true);
    
    try {
      // Önce cookie kontrolü yap
      const protectionKey = Cookies.get("protection_key");
      if (protectionKey && JSON.parse(protectionKey)) {
        // Geçerli bir protection_key varsa admin sayfasına yönlendir
        router.replace("/admin");
        return;
      }
    } catch (error) {
      // Cookie parse hatası olursa cookie'yi temizle
      Cookies.remove("protection_key");
    }
    
    // Cookie yoksa ve daha önce kontrol edilmediyse master key durumunu kontrol et
    if (!statusCheckedRef.current) {
      checkMasterKeyStatus();
    }
  }, []); // Boş bağımlılık dizisi - sadece bir kez çalışır

  if (!mounted) return null;

  const isDarkMode = resolvedTheme === "dark";

  const handleSendReminder = async () => {
    if (!session?.user?.email) return;
    
    setIsSendingReminder(true);
    try {
      const response = await fetch("/api/send-reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: session.user.email }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Reminder has been sent to your email",
        });
      } else {
        throw new Error("Failed to send reminder");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive",
      });
    } finally {
      setIsSendingReminder(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (masterKey.length !== 6 || !/^\d+$/.test(masterKey)) {
      toast({
        title: "Hata",
        description: "Master key 6 haneli olmalıdır",
        variant: "destructive",
      });
      return;
    }

    if (isNewUser && masterKey !== confirmMasterKey) {
      toast({
        title: "Hata",
        description: "Master key'ler eşleşmiyor",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isNewUser) {
        // Generate master key data
        const masterKeyData = await ZeroKnowledgeCrypto.deriveMasterKey(masterKey);
        
        // Create auth hash for server verification
        const authHash = await ZeroKnowledgeCrypto.createAuthHash(masterKeyData.authKey);

        // Save auth data to server
        const response = await fetch("/api/user/master-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authSalt: authHash.authSalt,
            authVerifier: authHash.authVerifier,
            reminder
          }),
        });

        const responseData = await response.json();

        if (response.ok) {
          // Artık anahtarı dışa aktarmak yerine, sadece master key ve salt değerlerini saklıyoruz
          Cookies.set("protection_key", JSON.stringify({
            masterKey: masterKey,
            salt: masterKeyData.masterSalt
          }), { expires: 7 });

          toast({
            title: "Başarılı",
            description: "Master key başarıyla ayarlandı",
          });

          // Kısa bir gecikme ekleyerek cookie'nin kaydedilmesini bekle
          setTimeout(() => {
            router.push("/admin");
          }, 500);
        } else {
          throw new Error(responseData.error || "Master key ayarlanamadı");
        }
      } else {
        // Verify existing master key
        const response = await fetch("/api/user/verify-master-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ masterKey }),
        });

        if (response.ok) {
          const { authSalt, authVerifier } = await response.json();
          
          const isValid = await ZeroKnowledgeCrypto.verifyMasterKey(
            masterKey,
            authSalt,
            authVerifier
          );

          if (isValid) {
            // Re-derive keys and store protection key
            const masterKeyData = await ZeroKnowledgeCrypto.deriveMasterKey(masterKey);
            
            // Artık anahtarı dışa aktarmak yerine, sadece master key ve salt değerlerini saklıyoruz
            Cookies.set("protection_key", JSON.stringify({
              masterKey: masterKey,
              salt: masterKeyData.masterSalt
            }), { expires: 7 });

            toast({
              title: "Başarılı",
              description: "Giriş başarılı",
            });

            // Kısa bir gecikme ekleyerek cookie'nin kaydedilmesini bekle
            setTimeout(() => {
              router.push("/admin");
            }, 500);
          } else {
            setAttempts(prev => {
              const newAttempts = prev + 1;
              if (newAttempts >= 3) {
                setShowReminderOption(true);
              }
              return newAttempts;
            });
            
            toast({
              title: "Hata",
              description: "Geçersiz master key",
              variant: "destructive",
            });
          }
        } else {
          const errorData = await response.json();
          
          // Migration gerekiyorsa kullanıcıyı migration sayfasına yönlendir
          if (errorData.needsMigration) {
            toast({
              title: "Migration Gerekiyor",
              description: "Master key formatınızın güncellenmesi gerekiyor. Migration sayfasına yönlendiriliyorsunuz.",
            });
            
            setTimeout(() => {
              router.push("/migrate");
            }, 2000);
            return;
          }
          
          toast({
            title: "Hata",
            description: errorData.error || "Doğrulama sırasında bir hata oluştu",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Hata:", error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Bir şeyler yanlış gitti",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (value: string) => {
    if (!isNewUser) {
      setMasterKey(value);
    } else {
      if (masterKey.length < 6) {
        setMasterKey(value);
      } else if (confirmMasterKey.length < 6) {
        setConfirmMasterKey(value);
      }
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
                  value={masterKey}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setMasterKey(value);
                  }}
                  className="text-center text-2xl tracking-widest"
                />
                {isNewUser && (
                  <>
                    <Input
                      type="password"
                      maxLength={6}
                      placeholder="Confirm Master Key"
                      value={confirmMasterKey}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setConfirmMasterKey(value);
                      }}
                      className="text-center text-2xl tracking-widest"
                    />
                    <Input
                      type="text"
                      placeholder="Reminder (Optional)"
                      value={reminder}
                      onChange={(e) => setReminder(e.target.value)}
                      className="text-center"
                    />
                  </>
                )}

                {!isNewUser && (
                  <VirtualKeyboard
                    onKeyPress={handleKeyPress}
                    currentValue={masterKey}
                    maxLength={6}
                  />
                )}

                <Button type="submit" className="w-full py-6 text-lg">
                  {isNewUser ? "Set Master Key" : "Continue"}
                </Button>

                {showReminderOption && !isNewUser && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Forgot your master key?
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendReminder}
                      disabled={isSendingReminder}
                      className="w-full"
                    >
                      {isSendingReminder ? "Sending..." : "Send Reminder to Email"}
                    </Button>
                  </div>
                )}
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
