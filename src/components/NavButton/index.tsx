"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LucideIcon } from "lucide-react";

interface NavButtonProps {
  icon: LucideIcon;
  title: string;
  href: string;
  className?: string;
}

export default function NavButton({
  icon: Icon,
  title,
  href,
  className = "",
}: NavButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      onClick={() => router.push(href)}
      className={`flex items-center gap-2 px-3 h-10 ${className}`}
    >
      <Icon className="h-6 w-6" />
      <span className="hidden sm:inline">{title}</span>
    </Button>
  );
}
