import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  Copy,
  Pencil,
  Trash,
  ShieldAlert,
  Shield,
  ShieldCheck,
  Lock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Password } from "./types";

interface PasswordTableProps {
  passwords: Password[];
  showPassword: Record<string, boolean>;
  onTogglePassword: (id: string) => void;
  onCopyPassword: (id: string) => void;
  onEdit: (password: Password) => void;
  onDelete: (id: string) => void;
  systemLocked?: boolean;
}

export function PasswordTable({
  passwords,
  showPassword,
  onTogglePassword,
  onCopyPassword,
  onEdit,
  onDelete,
  systemLocked = false,
}: PasswordTableProps) {
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    password: Password | null;
  }>({
    isOpen: false,
    password: null,
  });

  const getPriorityIcon = (level: string) => {
    switch (level) {
      case "high":
        return <ShieldAlert className="text-red-500" />;
      case "medium":
        return <Shield className="text-yellow-500" />;
      case "low":
        return <ShieldCheck className="text-green-500" />;
      default:
        return null;
    }
  };

  const getPriorityBadge = (level: string) => {
    const variants: Record<string, "destructive" | "warning" | "default"> = {
      high: "destructive",
      medium: "warning",
      low: "default",
    };

    const badgeVariant = variants[level] as
      | "default"
      | "secondary"
      | "destructive"
      | "warning"
      | "outline";

    return (
      <Badge variant={badgeVariant}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Badge>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const handleDeleteConfirm = () => {
    if (!deleteDialog.password) return; 

    if (deleteDialog.password.priorityLevel === "high" && systemLocked) {
      setDeleteDialog({ isOpen: false, password: null });
      return;
    }

    onDelete(deleteDialog.password._id);
    setDeleteDialog({ isOpen: false, password: null });
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Title</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Password</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Last Copied</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {passwords.map((password) => (
              <TableRow key={password._id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {password.priorityLevel === "high" && systemLocked && (
                      <Lock className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      {password.title}
                      {password.notes && (
                        <p className="text-sm text-gray-500 truncate">
                          {password.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{password.username}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono">
                      {showPassword[password._id]
                        ? password.decryptedPassword
                        : "••••••••"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onTogglePassword(password._id)}
                      disabled={
                        systemLocked && password.priorityLevel === "high"
                      }
                    >
                      {showPassword[password._id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        onCopyPassword(password._id)
                      }
                      disabled={
                        systemLocked && password.priorityLevel === "high"
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(password.priorityLevel)}
                    {getPriorityBadge(password.priorityLevel)}
                  </div>
                </TableCell>
                <TableCell>
                  {password.url && (
                    <a
                      href={password.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {(() => {
                        try {
                          return new URL(password.url).hostname;
                        } catch (e) {
                          return password.url;
                        }
                      })()}
                    </a>
                  )}
                </TableCell>
                <TableCell>
                  {password.lastCopied
                    ? formatDate(password.lastCopied)
                    : "Never"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(password)}
                      disabled={
                        systemLocked && password.priorityLevel === "high"
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setDeleteDialog({ isOpen: true, password })
                      }
                      disabled={
                        systemLocked && password.priorityLevel === "high"
                      }
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {passwords.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  No passwords found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ isOpen: false, password: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Password</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;
              {deleteDialog.password?.title}&quot;?
              {deleteDialog.password?.priorityLevel === "high" &&
                systemLocked && (
                  <p className="mt-2 text-red-500">
                    This is a high-priority password. System is currently
                    locked. Please unlock the system first.
                  </p>
                )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ isOpen: false, password: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={
                systemLocked && deleteDialog.password?.priorityLevel === "high"
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
