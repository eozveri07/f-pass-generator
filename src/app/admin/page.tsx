"use client";

import ThemeAwareLogo from "@/components/Logo";
import { ThemeToggle } from "@/components/mode-toggle";
import PasswordManager from "@/components/PasswordManager";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LogoutButton from "./logout";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Cookie from "js-cookie";

export default function PasswordsPage() {
  const router = useRouter();
  const { data: session } = useSession();

  if (!Cookie.get("master_key")) return router.push("/2fa");

  return (
    <main className="flex-1 container mx-auto py-8">
      <PasswordManager />
    </main>
  );
}
