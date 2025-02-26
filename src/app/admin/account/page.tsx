"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Cookies from "js-cookie";
import SecurityDevices from "@/components/Security";

export default function MyAccount() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const clearAllCookiesAndStorage = () => {
    // Clear all cookies
    const cookies = Cookies.get();
    for (const cookie in cookies) {
      Cookies.remove(cookie);
    }

    // Clear localStorage
    localStorage.clear();

    // Clear sessionStorage
    sessionStorage.clear();
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch("/api/delete", {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        // Clear all client-side data
        clearAllCookiesAndStorage();
        
        // Show success toast
        toast({
          title: "Account Deleted",
          description: "Your account and all associated data have been successfully deleted.",
          duration: 5000,
        });

        // Sign out from next-auth
        await signOut({ redirect: false });

        // Redirect to login page
        router.push("/login");
      } else {
        throw new Error(data.message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <Link href="/admin">
          <Button variant="ghost" className="hover:bg-accent">
            ← Back to Dashboard
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback>{session?.user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{session?.user?.name}</h3>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Account Type</h4>
            <div className="flex space-x-2">
              <Badge variant="secondary">Primary</Badge>
              <Badge variant="outline">Google</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Güvenlik</h4>
            <div className="flex flex-col space-y-2">
              <Link href="/admin/account/update-master-key">
                <Button variant="outline" className="w-full justify-start">
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Master Key Güncelle
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Delete your account and all its associated data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>This action cannot be undone. This will permanently delete:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Your account information</li>
                    <li>All your saved passwords</li>
                    <li>All your device records</li>
                    <li>All associated data and settings</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete Everything"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
      <SecurityDevices />
    </div>
  );
}