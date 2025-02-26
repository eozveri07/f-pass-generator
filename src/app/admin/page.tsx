"use client";
import PasswordManager from "@/components/PasswordManager";
import DeviceRegistration from "@/components/DeviceRegistration";
import { useRouter } from "next/navigation";
import Cookie from "js-cookie";

export default function PasswordsPage() {
  const router = useRouter();

  if (!Cookie.get("protection_key")) return router.push("/2fa");

  return (
    <main className="flex-1 container mx-auto py-8">
      <DeviceRegistration />
      <PasswordManager />
    </main>
  );
}
