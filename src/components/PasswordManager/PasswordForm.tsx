"use client";

import { useState } from "react";
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
import { ClientCrypto } from "@/lib/client-crypto";
import { Password } from "./types";
import Cookies from "js-cookie";

interface PasswordFormProps {
  onSubmit: (data: any) => Promise<void>;
  initialData?: Password | null;
  buttonText?: string;
  onCancel: () => void;
}

export function PasswordForm({
  onSubmit,
  initialData = null,
  buttonText = "Save",
  onCancel,
}: PasswordFormProps) {
  const masterPassword = Cookies.get("master_key");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!masterPassword) return; //2FA girilmedi demek , 2fa ekranına atılabilir

    try {
      // Şifreleme işlemi
      const { encryptedData, iv, salt } = await ClientCrypto.encrypt(
        formData.get("password") as string,
        masterPassword
      );

      const title = formData.get("title"),
        username = formData.get("username"),
        url = formData.get("url"),
        notes = formData.get("notes"),
        priorityLevel = formData.get("priorityLevel");

      const passwordData = {
        title,
        username,
        encryptedData,
        iv,
        salt,
        url,
        notes,
        priorityLevel,
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
