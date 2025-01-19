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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown } from "lucide-react";
import { ClientCrypto } from "@/lib/client-crypto";
import { Password, Tag, Group } from "./types";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";

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
  const masterPassword = Cookies.get("master_key");
  const [groups, setGroups] = useState<Group[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>(initialData?.tags?.[0] || "none");


  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        const [groupsRes, tagsRes] = await Promise.all([
          fetch('/api/groups'),
          fetch('/api/tags')
        ]);

        if (groupsRes.ok && tagsRes.ok) {
          const [groupsData, tagsData] = await Promise.all([
            groupsRes.json(),
            tagsRes.json()
          ]);

          setGroups(groupsData);
          setTags(tagsData);
        }
      } catch (error) {
        console.error('Error fetching attributes:', error);
      }
    };

    fetchAttributes();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!masterPassword) return;
  
    try {
      const formData = new FormData(e.currentTarget);
      const { encryptedData, iv, salt } = await ClientCrypto.encrypt(
        formData.get("password") as string,
        masterPassword
      );
  
      const groupId = formData.get("groupId") as string;
  
      const passwordData: Partial<Password> = {
        title: formData.get("title") as string,
        username: formData.get("username") as string,
        encryptedData,
        iv,
        salt,
        url: formData.get("url") as string,
        notes: formData.get("notes") as string,
        priorityLevel: formData.get("priorityLevel") as "low" | "medium" | "high",
        groupId: groupId === "none" ? null : groupId,
        tags: selectedTag === "none" ? [] : [selectedTag] // Tekli tag için güncellendi
      };
  
      await onSubmit(passwordData);
    } catch (error) {
      console.error("Encryption failed:", error);
    }
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
        <Label htmlFor="password">Password *</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required={!initialData}
        />
      </div>

      <div className="space-y-2">
  <Label htmlFor="groupId">Group</Label>
  <Select name="groupId" defaultValue={initialData?.groupId || "none"}>
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
  <Select 
    value={selectedTag} 
    onValueChange={setSelectedTag}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select a tag" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="none">No Tag</SelectItem>
      {tags.map((tag) => (
        <SelectItem key={tag._id} value={tag._id}>
          <div className="flex items-center gap-2">
            <Badge style={{ backgroundColor: tag.color }}>
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
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High (Requires 2FA)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input id="url" name="url" defaultValue={initialData?.url} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" defaultValue={initialData?.notes} />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{buttonText}</Button>
      </div>
    </form>
  );
}