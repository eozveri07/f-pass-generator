"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search } from "lucide-react"
import { Password, TotpDialogState } from "./types"
import { PasswordForm } from "./Passwordform"
import { PasswordTable } from "./PasswordTable"
import { TotpDialog } from "./TotpDialog"
import { TwoFactorSetup } from "../2fa"

export default function PasswordManager() {
  const [passwords, setPasswords] = useState<Password[]>([])
  const [loading, setLoading] = useState(true)
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedPassword, setSelectedPassword] = useState<Password | null>(null)
  const [totpDialog, setTotpDialog] = useState<TotpDialogState>({
    isOpen: false,
    passwordId: null,
    action: null
  })
  const { toast } = useToast()

  const fetchPasswords = async () => {
    try {
      const response = await fetch('/api/passwords')
      if (!response.ok) throw new Error('Failed to fetch passwords')
      const data = await response.json()
      setPasswords(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch passwords",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPasswords()
  }, [])

  const verifyTotpAndProcess = async (passwordId: string, code: string, action: 'view' | 'delete') => {
    try {
      // First verify the TOTP code
      const verifyResponse = await fetch('/api/passwords/verify-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: code,
          passwordId
        })
      })

      if (!verifyResponse.ok) {
        throw new Error('Invalid code')
      }

      // If the action is view, get the password
      if (action === 'view') {
        const data = await verifyResponse.json()
        setPasswords(prev => prev.map(p => 
          p._id === passwordId 
            ? { ...p, password: data.password, requiresTotp: false }
            : p
        ))
        toast({
          title: "Success",
          description: "Password unlocked successfully",
        })
      } 
      // If the action is delete, proceed with deletion
      else if (action === 'delete') {
        await handleDelete(passwordId)
      }

      setTotpDialog({ isOpen: false, passwordId: null, action: null })
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid verification code",
        variant: "destructive",
      })
    }
  }

  const handleAddPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const passwordData = {
      title: formData.get("title") as string,
      username: formData.get("username") as string,
      password: formData.get("password") as string,
      url: formData.get("url") as string,
      notes: formData.get("notes") as string,
      priorityLevel: formData.get("priorityLevel") as 'low' | 'medium' | 'high'
    }

    try {
      const response = await fetch('/api/passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData),
      })

      if (!response.ok) throw new Error('Failed to add password')
      
      await fetchPasswords()
      setIsAddDialogOpen(false)
      toast({
        title: "Success",
        description: "Password added successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add password",
        variant: "destructive",
      })
    }
  }

  const handleEditPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedPassword) return

    const formData = new FormData(e.currentTarget)
    const passwordData = {
      title: formData.get("title") as string,
      username: formData.get("username") as string,
      password: formData.get("password") as string,
      url: formData.get("url") as string,
      notes: formData.get("notes") as string,
      priorityLevel: formData.get("priorityLevel") as 'low' | 'medium' | 'high'
    }

    try {
      const response = await fetch(`/api/passwords/${selectedPassword._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData),
      })

      if (!response.ok) throw new Error('Failed to update password')
      
      await fetchPasswords()
      setSelectedPassword(null)
      toast({
        title: "Success",
        description: "Password updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/passwords/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete password')
      
      await fetchPasswords()
      toast({
        title: "Success",
        description: "Password deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete password",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      
      // Update lastCopied date
      const response = await fetch(`/api/passwords/${id}`, {
        method: 'PATCH'
      })

      if (!response.ok) throw new Error('Failed to update copy date')
      
      await fetchPasswords()
      toast({
        title: "Copied",
        description: "Password copied to clipboard",
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy password",
        variant: "destructive",
      })
    }
  }

  const filteredPasswords = passwords.filter(password =>
    password.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    password.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    password.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    password.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-4">Loading passwords...</div>
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <TwoFactorSetup />
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search passwords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
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

      <PasswordTable 
        passwords={filteredPasswords}
        showPassword={showPassword}
        onTogglePassword={(id) => setShowPassword(prev => ({
          ...prev,
          [id]: !prev[id]
        }))}
        onCopyPassword={copyToClipboard}
        onEdit={setSelectedPassword}
        onDelete={handleDelete}
        onTotpRequest={(id, action) => setTotpDialog({
          isOpen: true,
          passwordId: id,
          action
        })}
      />

      {/* Edit Dialog */}
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

      {/* TOTP Dialog */}
      <TotpDialog 
        dialogState={totpDialog}
        onClose={() => setTotpDialog({ isOpen: false, passwordId: null, action: null })}
        onVerify={verifyTotpAndProcess}
      />
    </div>
  )
}