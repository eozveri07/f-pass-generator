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
import { useTwoFactor } from "@/contexts/TwoFactorContent";
import { useProtectionKey } from "@/hooks/use-protection-key";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

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
  const [isMounted, setIsMounted] = useState(false);
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");

  const { toast } = useToast();
  const { isReady, error, decrypt } = useProtectionKey();

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
    } catch  {
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

  useEffect(() => {
    setIsMounted(true);
    
    // Yeni yaklaşım: protection_key cookie'sini kontrol et
    const protectionKeyCookie = Cookies.get("protection_key");
    if (protectionKeyCookie) {
      try {
        const { masterKey } = JSON.parse(protectionKeyCookie);
        if (masterKey) {
          setMasterPassword(masterKey);
          fetchPasswords();
          fetchAttributesAndStats();
        }
      } catch (err) {
        console.error("Invalid protection key format:", err);
      }
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

  // Hidrasyon hatalarını önlemek için
  if (!isMounted) {
    return null;
  }

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

  const { status: twoFactorStatus } = useTwoFactor();

  const handleTogglePassword = async (id: string) => {
    if (!isReady) {
      toast({
        title: "Error",
        description: "Protection key is not ready",
        variant: "destructive",
      });
      return;
    }

    const password = passwords.find((p) => p._id === id);
    if (!password) return;

    // Burada kontrolleri status ile yapıyoruz
    if (
      password.requires2FA &&
      (!twoFactorStatus?.enabled || !twoFactorStatus?.isUnlocked)
    ) {
      toast({
        title: "Error",
        description: "System is locked. Please unlock 2FA first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Yeni yaklaşım: useProtectionKey hook'unu kullan
      const decrypted = await decrypt(password.encryptedData, password.iv);

      setPasswords((prev) =>
        prev.map((p) =>
          p._id === id ? { ...p, decryptedPassword: decrypted } : p
        )
      );
      setShowPassword((prev) => ({
        ...prev,
        [id]: !prev[id],
      }));
    } catch (err) {
      console.error("Decryption error:", err);
      toast({
        title: "Error",
        description: "Failed to decrypt password",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (id: string) => {
    if (!isReady) {
      toast({
        title: "Error",
        description: "Protection key is not ready",
        variant: "destructive",
      });
      return;
    }
    
    const password = passwords.find((p) => p._id === id);
    if (!password) return;
    
    try {
      // Yeni yaklaşım: useProtectionKey hook'unu kullan
      const decrypted = await decrypt(password.encryptedData, password.iv);
      
      await navigator.clipboard.writeText(decrypted);
  
      // Kopyalama API endpoint'ini güncelle
      await fetch(`/api/passwords/${id}/copy`, {
        method: "PUT"
      });
  
      await fetchPasswords();
      toast({
        title: "Copied",
        description: "Password copied to clipboard",
        duration: 2000,
      });
    } catch (err) {
      console.error("Copy error:", err);
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

    const matchesTag = filterTag === "all" || 
      (password.tags && password.tags.some(tag => tag._id === filterTag));

    const matchesGroup = filterGroup === "all" || 
      (password.groupId && password.groupId._id === filterGroup);

    const matches2FA =
      !password.requires2FA ||
      (twoFactorStatus?.enabled && twoFactorStatus?.isUnlocked);

    return matchesSearch && matchesTag && matchesGroup && matches2FA;
  });

  if (loading) {
    return <div className="text-center py-4">Loading passwords...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        Error: {error}. Please try refreshing the page or logging in again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Password Manager</h2>
        <div className="flex items-center gap-2">
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

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Search passwords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select
              value={filterGroup}
              onValueChange={setFilterGroup}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group._id} value={group._id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterTag}
              onValueChange={setFilterTag}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag._id} value={tag._id}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={sortBy}
              onValueChange={setSortBy}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="username">Username</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="lastCopied">Last Copied</SelectItem>
                <SelectItem value="priorityLevel">Priority</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? (
                <ArrowUpIcon className="h-4 w-4" />
              ) : (
                <ArrowDownIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <PasswordTable
          passwords={filteredPasswords}
          showPassword={showPassword}
          onTogglePassword={handleTogglePassword}
          onCopyPassword={(id) => copyToClipboard(id)}
          onEdit={setSelectedPassword}
          onDelete={handleDelete}
          systemLocked={!twoFactorStatus?.isUnlocked && twoFactorStatus?.enabled}
        />
      </div>

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
