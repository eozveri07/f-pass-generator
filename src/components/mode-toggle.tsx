import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, SunMedium, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    switch (theme) {
      case "light":
        return (
          <SunMedium className="w-6 h-6 text-zinc-900 transition-transform duration-200 hover:rotate-45" />
        );
      case "dark":
        return (
          <Moon className="w-6 h-6 text-zinc-300 transition-transform duration-200 hover:-rotate-12" />
        );
      case "system":
        return (
          <Monitor className="w-6 h-6 text-zinc-600 dark:text-zinc-300 transition-transform duration-200 hover:scale-110" />
        );
      default:
        return (
          <SunMedium className="w-6 h-6 text-zinc-900 transition-transform duration-200 hover:rotate-45" />
        );
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "p-2 rounded-lg transition-all duration-200",
        "hover:bg-zinc-100 dark:hover:bg-zinc-800",
        "focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600"
      )}
      aria-label="Toggle theme"
    >
      <div className="relative w-6 h-6">{getIcon()}</div>
    </button>
  );
}
