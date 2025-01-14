import { auth } from "@/auth";
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

export default async function PasswordsPage() {
  const session = await auth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ThemeAwareLogo />
            </div>
            <h1 className="text-2xl font-bold">Password Manager</h1>

            <div className="flex items-center space-x-4">
              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      {session && (
                        <>
                          <AvatarImage
                            src={session.user?.image || ""}
                            alt={session.user?.name || ""}
                          />
                          <AvatarFallback>
                            {session.user?.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      {session && (
                        <>
                          <p className="text-sm font-medium leading-none">
                            {session.user?.name}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {session.user?.email}
                          </p>
                        </>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <LogoutButton />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-8">
        <PasswordManager />
      </main>
    </div>
  );
}
