"use client";

import { LogOut } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { handleLogout } from "./action";

export default function LogoutButton() {
  return (
    <DropdownMenuItem
      className="text-red-600 cursor-pointer"
      onClick={() => handleLogout()}
    >
      <LogOut className="h-4 w-4 mr-2" />
      Çıkış Yap
    </DropdownMenuItem>
  );
}
