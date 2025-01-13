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
  onVerify: (passwordId: string, code: string) => void
}

export function TotpDialog({ dialogState, onClose, onVerify }: TotpDialogProps) {
  const [totpCode, setTotpCode] = useState("")

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
          <DialogTitle>Enter 2FA Code</DialogTitle>
          <DialogDescription>
            Enter the 6-digit code from your authenticator app to view this password.
          </DialogDescription>
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
            onClick={() => dialogState.passwordId && onVerify(dialogState.passwordId, totpCode)}
            disabled={totpCode.length !== 6}
          >
            Verify
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}