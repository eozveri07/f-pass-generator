import ThemeAwareLogo from "@/components/Logo";
import { ThemeToggle } from "@/components/mode-toggle";
import PasswordGenerator from "@/components/PasswordGenerator";

export default function Home() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-200 to-indigo-200 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex flex-col items-center justify-between p-8 font-[family-name:var(--font-geist-sans)]">
      <header className="w-full flex justify-between items-center  mb-12">
        <ThemeAwareLogo />
        <ThemeToggle />
      </header>
      
      <main className="flex-grow flex items-center justify-center w-full">
       
          <PasswordGenerator />
       
      </main>
      
      <footer className="mt-12 text-center text-sm text-gray-700 dark:text-gray-300">
        © {currentYear} Fenrio. All rights reserved.
      </footer>
    </div>
  );
}