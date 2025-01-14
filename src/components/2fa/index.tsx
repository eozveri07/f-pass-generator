"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export function TwoFactorSetup() {
  const [qrCode, setQrCode] = useState<string>("")
  const [secret, setSecret] = useState<string>("")
  const [token, setToken] = useState("")
  const [isSettingUp, setIsSettingUp] = useState(false)
  const { toast } = useToast()

  const setupTwoFactor = async () => {
    try {
      setIsSettingUp(true)
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
      })

      if (!response.ok) throw new Error("Setup failed")

      const data = await response.json()
      setQrCode(data.qrCode)
      setSecret(data.secret)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set up 2FA",
        variant: "destructive",
      })
    } finally {
      setIsSettingUp(false)
    }
  }

  const verifyToken = async () => {
    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) throw new Error("Verification failed")

      toast({
        title: "Success",
        description: "Two-factor authentication enabled",
      })

      // Reset state
      setQrCode("")
      setSecret("")
      setToken("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid verification code",
        variant: "destructive",
      })
    }
  }

  if (!qrCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Secure your account with Google Authenticator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={setupTwoFactor} disabled={isSettingUp}>
            {isSettingUp ? "Setting up..." : "Set up 2FA"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set up Google Authenticator</CardTitle>
        <CardDescription>
          Scan the QR code with your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <Image
            src={qrCode}
            alt="QR Code"
            width={200}
            height={200}
          />
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            If you can't scan the QR code, enter this code manually:
          </p>
          <code className="block bg-muted p-2 rounded text-center">
            {secret}
          </code>
        </div>

        <div className="space-y-2">
          <label htmlFor="token" className="text-sm font-medium">
            Enter verification code
          </label>
          <Input
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter 6-digit code"
            maxLength={6}
          />
        </div>

        <Button 
          onClick={verifyToken} 
          disabled={token.length !== 6}
          className="w-full"
        >
          Verify and Enable
        </Button>
      </CardContent>
    </Card>
  )
}