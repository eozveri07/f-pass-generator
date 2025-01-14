import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TotpDialogState } from "./types"

interface TotpDialogProps {
  dialogState: TotpDialogState
  onClose: () => void
  onVerify: (passwordId: string, code: string, action: 'view' | 'delete') => void
}

export function TotpDialog({ dialogState, onClose, onVerify }: TotpDialogProps) {
  const [totpCode, setTotpCode] = useState("")

  const getDialogTitle = () => {
    switch (dialogState.action) {
      case 'delete':
        return "2FA Authentication Required"
      case 'view':
        return "Enter 2FA Code"
      default:
        return "2FA Authentication"
    }
  }

  const getDialogDescription = () => {
    switch (dialogState.action) {
      case 'delete':
        return "Enter the 6-digit code from your authenticator app to confirm password deletion."
      case 'view':
        return "Enter the 6-digit code from your authenticator app to view this password."
      default:
        return "Enter your 6-digit authentication code."
    }
  }

  const getButtonText = () => {
    switch (dialogState.action) {
      case 'delete':
        return "Verify and Delete"
      case 'view':
        return "View Password"
      default:
        return "Verify"
    }
  }

  return (
    <Dialog
      open={dialogState.isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
          setTotpCode("")
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <Input
            placeholder="Enter 6-digit code"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            className="text-center text-2xl tracking-widest"
          />
          <Button 
            onClick={() => dialogState.passwordId && dialogState.action && 
              onVerify(dialogState.passwordId, totpCode, dialogState.action)}
            disabled={totpCode.length !== 6}
            variant={dialogState.action === 'delete' ? 'destructive' : 'default'}
          >
            {getButtonText()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}