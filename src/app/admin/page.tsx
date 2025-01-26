"use client";
import PasswordManager from "@/components/PasswordManager";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Cookie from "js-cookie";

export default function PasswordsPage() {
  const router = useRouter();
  const { data: session } = useSession();

  if (!Cookie.get("master_key")) return router.push("/2fa");

  useEffect(() => {
    const registerDevice = async () => {
      try {
        await fetch("/api/devices", {
          method: "POST",
          credentials: "include",
        });
      } catch (error) {
        console.error("Error registering device:", error);
      }
    };

    registerDevice();
  }, []);

  return (
    <main className="flex-1 container mx-auto py-8">
      <PasswordManager />
    </main>
  );
}
