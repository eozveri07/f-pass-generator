import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  import { Button } from "@/components/ui/button"
  import { Badge } from "@/components/ui/badge"
  import { Eye, EyeOff, Copy, Pencil, Trash, ShieldAlert, Shield, ShieldCheck } from "lucide-react"
  import { Password } from "./types"
  
  interface PasswordTableProps {
    passwords: Password[]
    showPassword: Record<string, boolean>
    onTogglePassword: (id: string) => void
    onCopyPassword: (id: string, password: string) => void
    onEdit: (password: Password) => void
    onDelete: (id: string) => void
    onTotpRequest: (id: string) => void
  }
  
  export function PasswordTable({
    passwords,
    showPassword,
    onTogglePassword,
    onCopyPassword,
    onEdit,
    onDelete,
    onTotpRequest
  }: PasswordTableProps) {
    const getPriorityIcon = (level: string) => {
      switch (level) {
        case 'high':
          return <ShieldAlert className="text-red-500" />
        case 'medium':
          return <Shield className="text-yellow-500" />
        case 'low':
          return <ShieldCheck className="text-green-500" />
        default:
          return null
      }
    }
  
    const getPriorityBadge = (level: string) => {
      const variants: Record<string, "destructive" | "warning" | "default"> = {
        high: "destructive",
        medium: "warning",
        low: "default"
      }
      return (
        <Badge variant={variants[level]}>
          {level.charAt(0).toUpperCase() + level.slice(1)}
        </Badge>
      )
    }
  
    const formatDate = (date: string) => {
      return new Date(date).toLocaleString()
    }
    
  
    return (
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
                  {password.title}
                  {password.notes && (
                    <p className="text-sm text-gray-500 truncate">{password.notes}</p>
                  )}
                </TableCell>
                <TableCell>{password.username}</TableCell>
                <TableCell>
                  {password.requiresTotp ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onTotpRequest(password._id)}
                    >
                      Enter 2FA Code
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="font-mono">
                        {showPassword[password._id] ? password.password : "••••••••"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onTogglePassword(password._id)}
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
                        onClick={() => onCopyPassword(password._id, password.password)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
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
                      {new URL(password.url).hostname}
                    </a>
                  )}
                </TableCell>
                <TableCell>
                  {password.lastCopied ? formatDate(password.lastCopied) : 'Never'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(password)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(password._id)}
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
    )
  }