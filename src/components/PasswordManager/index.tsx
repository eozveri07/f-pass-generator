"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search } from "lucide-react";
import { Password } from "./types";
import { PasswordForm } from "./PasswordForm";
import { PasswordTable } from "./PasswordTable";
import { TotpDialog } from "./TotpDialog";
import { ClientCrypto } from "@/lib/client-crypto";
import Cookies from "js-cookie";
import { TwoFactorDialog } from "../TwoFactorDialog";

export default function PasswordManager() {
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState<Password | null>(
    null
  );
  const [masterPassword, setMasterPassword] = useState("");
  const [totpDialog, setTotpDialog] = useState({
    isOpen: false,
    passwordId: null as string | null,
    action: null as "view" | "delete" | null,
  });
  const { toast } = useToast();

  const fetchPasswords = async () => {
    try {
      const response = await fetch("/api/passwords");
      if (!response.ok) throw new Error("Failed to fetch passwords");
      const data = await response.json();
      setPasswords(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch passwords",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const masterKeyHash = Cookies.get("master_key");
    if (masterKeyHash) {
      setMasterPassword(masterKeyHash);
      fetchPasswords();
    }
  }, []);

  const handleAddPassword = async (formData: FormData) => {
    if (!masterPassword) {
      toast({
        title: "Error",
        description: "Please unlock your vault first",
        variant: "destructive",
      });
      return;
    }

    const password = formData.get("password") as string;

    try {
      const encrypted = await ClientCrypto.encrypt(password, masterPassword);

      const passwordData = {
        title: formData.get("title"),
        username: formData.get("username"),
        encryptedData: encrypted.encryptedData,
        iv: encrypted.iv,
        salt: encrypted.salt,
        url: formData.get("url"),
        notes: formData.get("notes"),
        priorityLevel: formData.get("priorityLevel"),
      };

      const response = await fetch("/api/passwords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      });

      if (!response.ok) throw new Error("Failed to add password");

      await fetchPasswords();
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Password added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add password",
        variant: "destructive",
      });
    }
  };

  const handleEditPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPassword || !masterPassword) return;

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("password") as string;

    try {
      const encrypted = await ClientCrypto.encrypt(newPassword, masterPassword);

      const passwordData = {
        title: formData.get("title"),
        username: formData.get("username"),
        encryptedData: encrypted.encryptedData,
        iv: encrypted.iv,
        salt: encrypted.salt,
        url: formData.get("url"),
        notes: formData.get("notes"),
        priorityLevel: formData.get("priorityLevel"),
      };

      const response = await fetch(`/api/passwords/${selectedPassword._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      });

      if (!response.ok) throw new Error("Failed to update password");

      await fetchPasswords();
      setSelectedPassword(null);
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/passwords/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete password");

      await fetchPasswords();
      toast({
        title: "Success",
        description: "Password deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete password",
        variant: "destructive",
      });
    }
  };

  const handleTogglePassword = async (id: string) => {
    if (!masterPassword) {
      toast({
        title: "Error",
        description: "Please unlock your vault first",
        variant: "destructive",
      });
      return;
    }

    const password = passwords.find((p) => p._id === id);
    if (!password) return;

    try {
      const decrypted = await ClientCrypto.decrypt(
        password.encryptedData,
        password.iv,
        password.salt,
        masterPassword
      );

      setPasswords((prev) =>
        prev.map((p) =>
          p._id === id ? { ...p, decryptedPassword: decrypted } : p
        )
      );
      setShowPassword((prev) => ({
        ...prev,
        [id]: !prev[id],
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid master password",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (id: string) => {
    if (!masterPassword) {
      toast({
        title: "Error",
        description: "Please unlock your vault first",
        variant: "destructive",
      });
      return;
    }

    const password = passwords.find((p) => p._id === id);
    if (!password) return;

    try {
      const decrypted = await ClientCrypto.decrypt(
        password.encryptedData,
        password.iv,
        password.salt,
        masterPassword
      );

      await navigator.clipboard.writeText(decrypted);

      const response = await fetch(`/api/passwords/${id}`, {
        method: "PATCH",
      });

      if (!response.ok) throw new Error("Failed to update copy date");

      await fetchPasswords();
      toast({
        title: "Copied",
        description: "Password copied to clipboard",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy password",
        variant: "destructive",
      });
    }
  };

  const verifyTotpAndProcess = async (
    passwordId: string,
    code: string,
    action: "view" | "delete"
  ) => {
    try {
      const verifyResponse = await fetch("/api/passwords/verify-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: code,
          passwordId,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error("Invalid code");
      }

      if (action === "delete") {
        await handleDelete(passwordId);
      }

      setTotpDialog({ isOpen: false, passwordId: null, action: null });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid verification code",
        variant: "destructive",
      });
    }
  };

  const filteredPasswords = passwords.filter(
    (password) =>
      password.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  // TODO: GİBİ DİNLENECEK
  if (loading) {
    return <div className="text-center py-4">Loading passwords...</div>;
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search passwords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        <div className="flex items-center space-x-2">
          <TwoFactorDialog />
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Password
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Password</DialogTitle>
                <DialogDescription>
                  Add a new password to your secure vault.
                </DialogDescription>
              </DialogHeader>
              <PasswordForm
                onSubmit={handleAddPassword}
                buttonText="Add Password"
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <PasswordTable
        passwords={filteredPasswords}
        showPassword={showPassword}
        onTogglePassword={handleTogglePassword}
        onCopyPassword={copyToClipboard}
        onEdit={setSelectedPassword}
        onDelete={handleDelete}
        onTotpRequest={(id, action) =>
          setTotpDialog({
            isOpen: true,
            passwordId: id,
            action,
          })
        }
      />

      <Dialog
        open={!!selectedPassword}
        onOpenChange={(open) => !open && setSelectedPassword(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Password</DialogTitle>
            <DialogDescription>
              Update your stored password information.
            </DialogDescription>
          </DialogHeader>
          {selectedPassword && (
            <PasswordForm
              onSubmit={handleEditPassword}
              initialData={selectedPassword}
              buttonText="Update Password"
              onCancel={() => setSelectedPassword(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <TotpDialog
        dialogState={totpDialog}
        onClose={() =>
          setTotpDialog({ isOpen: false, passwordId: null, action: null })
        }
        onVerify={verifyTotpAndProcess}
      />
    </div>
  );
}
