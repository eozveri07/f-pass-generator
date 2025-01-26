"use client";
import { LogOut, User } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { handleLogout } from "./action";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function UserDropdownButtons() {
  const router = useRouter();
  
  const handleClick = async () => {
    Cookies.remove("master_key");
    await handleLogout();
  };

  return (
    <>
      <DropdownMenuItem onClick={() => router.push("/admin/account")}>
        <User className="h-4 w-4 mr-2" />
        Hesabım
      </DropdownMenuItem>
      
      <DropdownMenuItem
        className="text-red-600 cursor-pointer"
        onClick={handleClick}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Çıkış Yap
      </DropdownMenuItem>
    </>
  );
}