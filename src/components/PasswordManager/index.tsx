"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Group, Password, Tag } from "./types";
import { PasswordForm } from "./PasswordForm";
import { PasswordTable } from "./PasswordTable";
import { ClientCrypto } from "@/lib/client-crypto";
import Cookies from "js-cookie";
import { TwoFactorDialog } from "../TwoFactorDialog";
import { AttributesDialog } from "./AttributesDialog";
import { PasswordFilter } from "./PasswordFilter";

export default function PasswordManager() {
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState<Password | null>(
    null
  );
  const [masterPassword, setMasterPassword] = useState("");

  const { toast } = useToast();
  const fetchAttributesAndStats = useCallback(async () => {
    try {
      const [tagsRes, groupsRes] = await Promise.all([
        fetch("/api/tags"),
        fetch("/api/groups"),
      ]);

      if (tagsRes.ok && groupsRes.ok) {
        const [tagsData, groupsData] = await Promise.all([
          tagsRes.json(),
          groupsRes.json(),
        ]);
        setTags(tagsData);
        setGroups(groupsData);
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Veriler yüklenirken hata oluştu",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchPasswords = useCallback(async () => {
    try {
      const response = await fetch("/api/passwords");
      if (!response.ok) throw new Error("Failed to fetch passwords");
      const data = await response.json();
      setPasswords(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch passwords",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const [twoFactorStatus, setTwoFactorStatus] = useState({
    enabled: false,
    isUnlocked: false,
  });

  // 2FA durumunu kontrol eden fonksiyon
  const check2FAStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/2fa/status");
      if (response.ok) {
        const data = await response.json();
        setTwoFactorStatus({
          enabled: data.enabled,
          isUnlocked: data.isUnlocked,
        });
      }
    } catch (error) {
      console.error("Error checking 2FA status:", error);
    }
  }, []);

  useEffect(() => {
    check2FAStatus();
    const interval = setInterval(check2FAStatus, 3000);
    return () => clearInterval(interval);
  }, [check2FAStatus]);

  useEffect(() => {
    const masterKeyHash = Cookies.get("master_key");
    if (masterKeyHash) {
      setMasterPassword(masterKeyHash);
      fetchPasswords();
      fetchAttributesAndStats();
    }

    // Event listener ekleyelim
    const handleAttributeUpdate = () => {
      fetchAttributesAndStats();
    };

    window.addEventListener("attributesUpdated", handleAttributeUpdate);

    // Cleanup
    return () => {
      window.removeEventListener("attributesUpdated", handleAttributeUpdate);
    };
  }, [fetchPasswords, fetchAttributesAndStats]);

  const handleAddPassword = async (passwordData: Partial<Password>) => {
    if (!masterPassword) {
      toast({
        title: "Error",
        description: "Please unlock your vault first",
        variant: "destructive",
      });
      return;
    }

    try {
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
    } catch {
      toast({
        title: "Error",
        description: "Failed to add password",
        variant: "destructive",
      });
    }
  };

  const handleFilterChange = (type: "tags" | "groups", ids: string[]) => {
    if (type === "tags") {
      setSelectedTags(ids);
    } else {
      setSelectedGroups(ids);
    }
  };

  const handleEditPassword = async (passwordData: Partial<Password>) => {
    if (!selectedPassword || !masterPassword) return;

    try {
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
    } catch {
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
    } catch {
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

    if (
      password.requires2FA &&
      (!twoFactorStatus.enabled || !twoFactorStatus.isUnlocked)
    ) {
      toast({
        title: "Error",
        description: "System is locked. Please unlock 2FA first",
        variant: "destructive",
      });
      return;
    }

    try {
      const decrypted = await ClientCrypto.decrypt({
        encryptedData: password.encryptedData,
        iv: password.iv,
        salt: password.salt,
        masterPassword: masterPassword,
      });

      setPasswords((prev) =>
        prev.map((p) =>
          p._id === id ? { ...p, decryptedPassword: decrypted } : p
        )
      );
      setShowPassword((prev) => ({
        ...prev,
        [id]: !prev[id],
      }));
    } catch {
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
      const decrypted = await ClientCrypto.decrypt({
        encryptedData: password.encryptedData,
        iv: password.iv,
        salt: password.salt,
        masterPassword: masterPassword,
      });

      await navigator.clipboard.writeText(decrypted);
      const response = await fetch(`/api/passwords/${id}`, {
        method: "PUT",
      });

      if (!response.ok) throw new Error("Failed to update copy date");

      await fetchPasswords();
      toast({
        title: "Copied",
        description: "Password copied to clipboard",
        duration: 2000,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy password",
        variant: "destructive",
      });
    }
  };

  const filteredPasswords = passwords.filter((password) => {
    const matchesSearch = searchTerm
      ? password.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        password.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        password.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        password.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const matchesTags =
      selectedTags.length === 0 ||
      (password.tags &&
        password.tags.some((tag) => selectedTags.includes(tag._id)));

    const matchesGroups =
      selectedGroups.length === 0 ||
      (password.groupId && selectedGroups.includes(password.groupId._id));

    const matches2FA =
      !password.requires2FA ||
      (twoFactorStatus.enabled && twoFactorStatus.isUnlocked);

    return matchesSearch && matchesTags && matchesGroups && matches2FA;
  });

  if (loading) {
    return <div className="text-center py-4">Loading passwords...</div>;
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search passwords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-8"
            />
          </div>
          <PasswordFilter
            tags={tags}
            groups={groups}
            selectedTags={selectedTags}
            selectedGroups={selectedGroups}
            onFilterChange={handleFilterChange}
          />
        </div>
        <div className="flex items-center space-x-2">
          <TwoFactorDialog />
          <AttributesDialog />
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
        systemLocked={!twoFactorStatus.isUnlocked}
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
    </div>
  );
}
