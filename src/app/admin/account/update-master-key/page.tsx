"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ZeroKnowledgeCrypto } from "@/lib/zero-knowledge-crypto";
import Cookies from "js-cookie";
import { VirtualKeyboard } from "@/components/VirtualKeyboard";

export default function UpdateMasterKey() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentMasterKey, setCurrentMasterKey] = useState("");
  const [newMasterKey, setNewMasterKey] = useState("");
  const [confirmNewMasterKey, setConfirmNewMasterKey] = useState("");
  const [reminder, setReminder] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate inputs
    if (currentMasterKey.length !== 6 || !/^\d+$/.test(currentMasterKey)) {
      toast({
        title: "Hata",
        description: "Mevcut master key 6 haneli olmalıdır",
        variant: "destructive",
      });
      return;
    }

    if (newMasterKey.length !== 6 || !/^\d+$/.test(newMasterKey)) {
      toast({
        title: "Hata",
        description: "Yeni master key 6 haneli olmalıdır",
        variant: "destructive",
      });
      return;
    }

    if (newMasterKey !== confirmNewMasterKey) {
      toast({
        title: "Hata",
        description: "Yeni master key'ler eşleşmiyor",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      // 1. Verify current master key
      const verifyResponse = await fetch("/api/user/verify-master-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterKey: currentMasterKey }),
      });

      if (!verifyResponse.ok) {
        throw new Error("Mevcut master key doğrulanamadı");
      }

      const { authSalt, authVerifier } = await verifyResponse.json();
      const isValid = await ZeroKnowledgeCrypto.verifyMasterKey(
        currentMasterKey,
        authSalt,
        authVerifier
      );

      if (!isValid) {
        throw new Error("Mevcut master key geçersiz");
      }

      // 2. Generate new master key data
      const newMasterKeyData = await ZeroKnowledgeCrypto.deriveMasterKey(newMasterKey);
      
      // 3. Create new auth hash
      const newAuthHash = await ZeroKnowledgeCrypto.createAuthHash(newMasterKeyData.authKey);

      // 4. Update master key on server
      const updateResponse = await fetch("/api/user/master-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authSalt: newAuthHash.authSalt,
          authVerifier: newAuthHash.authVerifier,
          reminder,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Master key güncellenirken bir hata oluştu");
      }

      // 5. Update protection key in cookie
      // CryptoKey nesnesini JWK formatına dönüştür
      const exportedKey = await crypto.subtle.exportKey(
        "jwk",
        newMasterKeyData.protectionKey
      );

      Cookies.set("protection_key", JSON.stringify({
        key: exportedKey,
        salt: newMasterKeyData.masterSalt
      }));

      // 6. Show success message and redirect
      toast({
        title: "Başarılı",
        description: "Master key başarıyla güncellendi",
      });

      router.push("/admin/account");
    } catch (error) {
      console.error("Error updating master key:", error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Master key güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyPress = (value: string, target: "current" | "new" | "confirm") => {
    if (target === "current") {
      setCurrentMasterKey(value);
    } else if (target === "new") {
      setNewMasterKey(value);
    } else if (target === "confirm") {
      setConfirmNewMasterKey(value);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <Link href="/admin/account">
          <Button variant="ghost" className="hover:bg-accent">
            ← Hesap Sayfasına Dön
          </Button>
        </Link>
      </div>

      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Master Key Güncelleme</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Master key'inizi güncellemek için mevcut master key'inizi ve yeni master key'inizi girin.
          <br />
          <strong>Not:</strong> Master key'inizi unutursanız, şifrelerinize erişemezsiniz.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="currentMasterKey" className="text-sm font-medium">
              Mevcut Master Key
            </label>
            <Input
              id="currentMasterKey"
              type="password"
              maxLength={6}
              placeholder="******"
              value={currentMasterKey}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setCurrentMasterKey(value);
              }}
              className="text-center text-xl tracking-widest"
            />
            <VirtualKeyboard
              onKeyPress={(value) => handleKeyPress(value, "current")}
              currentValue={currentMasterKey}
              maxLength={6}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="newMasterKey" className="text-sm font-medium">
              Yeni Master Key
            </label>
            <Input
              id="newMasterKey"
              type="password"
              maxLength={6}
              placeholder="******"
              value={newMasterKey}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setNewMasterKey(value);
              }}
              className="text-center text-xl tracking-widest"
            />
            <VirtualKeyboard
              onKeyPress={(value) => handleKeyPress(value, "new")}
              currentValue={newMasterKey}
              maxLength={6}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmNewMasterKey" className="text-sm font-medium">
              Yeni Master Key (Tekrar)
            </label>
            <Input
              id="confirmNewMasterKey"
              type="password"
              maxLength={6}
              placeholder="******"
              value={confirmNewMasterKey}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setConfirmNewMasterKey(value);
              }}
              className="text-center text-xl tracking-widest"
            />
            <VirtualKeyboard
              onKeyPress={(value) => handleKeyPress(value, "confirm")}
              currentValue={confirmNewMasterKey}
              maxLength={6}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="reminder" className="text-sm font-medium">
              Hatırlatıcı (İsteğe Bağlı)
            </label>
            <Input
              id="reminder"
              type="text"
              placeholder="Master key'inizi hatırlamanıza yardımcı olacak bir ipucu"
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isUpdating}
          >
            {isUpdating ? "Güncelleniyor..." : "Master Key'i Güncelle"}
          </Button>
        </form>
      </Card>
    </div>
  );
} 