"use client";
import { LogOut } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { handleLogout } from "./action";
import Cookies from "js-cookie";

export default function LogoutButton() {
  const handleClick = async () => {
    Cookies.remove("master_key");

    await handleLogout();
  };

  return (
    <DropdownMenuItem
      className="text-red-600 cursor-pointer"
      onClick={handleClick}
    >
      <LogOut className="h-4 w-4 mr-2" />
      Çıkış Yap
    </DropdownMenuItem>
  );
}
