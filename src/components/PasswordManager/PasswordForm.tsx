"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ClientCrypto } from "@/lib/client-crypto";
import { Password, Tag, Group } from "./types";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";
import { useProtectionKey } from "@/hooks/use-protection-key";
import { useToast } from "@/hooks/use-toast";

interface PasswordFormProps {
  onSubmit: (data: Partial<Password>) => Promise<void>;
  initialData?: Partial<Password>;
  buttonText?: string;
  onCancel: () => void;
}

export function PasswordForm({
  onSubmit,
  initialData = {},
  buttonText = "Save",
  onCancel,
}: PasswordFormProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { isReady, encrypt } = useProtectionKey();
  const { toast } = useToast();

  // Initial tag value from initialData
  const initialTagId = initialData?.tags?.[0]?._id || "none";
  const [selectedTagId, setSelectedTagId] = useState<string>(initialTagId);

  // Initial group value from initialData
  const initialGroupId = initialData?.groupId?._id || "none";
  const [selectedGroupId, setSelectedGroupId] =
    useState<string>(initialGroupId);


  const getPreviewTextColor = (bgColor: string) => {
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000000" : "#ffffff";
  };

  useEffect(() => {
    setIsMounted(true);
    const fetchAttributes = async () => {
      try {
        const [groupsRes, tagsRes] = await Promise.all([
          fetch("/api/groups"),
          fetch("/api/tags"),
        ]);
        if (groupsRes.ok && tagsRes.ok) {
          const [groupsData, tagsData] = await Promise.all([
            groupsRes.json(),
            tagsRes.json(),
          ]);
          setGroups(groupsData);
          setTags(tagsData);
        }
      } catch (error) {
        console.error("Error fetching attributes:", error);
      }
    };
    fetchAttributes();
  }, []);

  // Hidrasyon hatalarını önlemek için
  if (!isMounted) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isReady) {
      toast({
        title: "Error",
        description: "Protection key is not ready",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData(e.currentTarget);
      const password = formData.get("password") as string;
      
      // Temel veri alanlarını hazırla
      const passwordData: Partial<Password> = {
        title: formData.get("title") as string,
        username: formData.get("username") as string,
        url: formData.get("url") as string,
        notes: formData.get("notes") as string,
        priorityLevel: formData.get("priorityLevel") as
          | "low"
          | "medium"
          | "high",
      };

      // Şifre alanı doldurulmuşsa şifreyi güncelle
      if (password.trim() !== "") {
        // Yeni yaklaşım: useProtectionKey hook'unu kullan
        const { encryptedData, iv, salt } = await encrypt(password);
        passwordData.encryptedData = encryptedData;
        passwordData.iv = iv;
        passwordData.salt = salt;
      }

      const foundGroup =
        selectedGroupId === "none"
          ? null
          : groups.find((group) => group._id === selectedGroupId);

      const selectedGroup = foundGroup
        ? {
            _id: foundGroup._id,
            userId: foundGroup.userId,
            name: foundGroup.name,
            description: foundGroup.description || "",
            createdAt: foundGroup.createdAt,
            updatedAt: foundGroup.updatedAt,
          }
        : null;

      // Find the selected tag object
      const selectedTag =
        selectedTagId === "none"
          ? []
          : tags.filter((tag) => tag._id === selectedTagId);

      passwordData.groupId = selectedGroup;
      passwordData.tags = selectedTag;

      await onSubmit(passwordData);
    } catch (error) {
      console.error("Encryption failed:", error);
      toast({
        title: "Error",
        description: "Failed to encrypt password",
        variant: "destructive",
      });
    }
  };

  const renderPriorityBadge = (priority: string) => {
    const colors = {
      low: "bg-green-500/20 text-green-600 dark:bg-green-500/30 dark:text-green-400",
      medium:
        "bg-yellow-500/20 text-yellow-600 dark:bg-yellow-500/30 dark:text-yellow-400",
      high: "bg-red-500/20 text-red-600 dark:bg-red-500/30 dark:text-red-400",
    };

    return (
      <Badge
        variant="secondary"
        className={cn(
          "ml-2 font-normal",
          colors[priority as keyof typeof colors]
        )}
      >
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          name="title"
          defaultValue={initialData?.title}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Username/Email</Label>
        <Input
          id="username"
          name="username"
          defaultValue={initialData?.username}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password {initialData?._id ? "(Boş bırakırsanız değişmez)" : "*"}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={initialData?._id ? "••••••••" : "Şifre girin"}
          required={!initialData?._id}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="groupId">Group</Label>
        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Group</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group._id} value={group._id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Tag</Label>
        <Select value={selectedTagId} onValueChange={setSelectedTagId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Tag</SelectItem>
            {tags.map((tag) => (
              <SelectItem key={tag._id} value={tag._id}>
                <div className="flex items-center gap-2">
                  <Badge
                    style={{
                      backgroundColor: tag.color,
                      color: getPreviewTextColor(tag.color),
                      padding: "0.25rem 0.5rem",
                    }}
                  >
                    {tag.name}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="priorityLevel">Priority Level *</Label>
        <Select
          name="priorityLevel"
          defaultValue={initialData?.priorityLevel || "low"}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">
              <div className="flex items-center">
                Low {renderPriorityBadge("low")}
              </div>
            </SelectItem>
            <SelectItem value="medium">
              <div className="flex items-center">
                Medium {renderPriorityBadge("medium")}
              </div>
            </SelectItem>
            <SelectItem value="high">
              <div className="flex items-center">
                High (Requires 2FA) {renderPriorityBadge("high")}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="url">Website URL</Label>
        <Input id="url" name="url" defaultValue={initialData?.url} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" defaultValue={initialData?.notes} />
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{buttonText}</Button>
      </div>
    </form>
  );
}
