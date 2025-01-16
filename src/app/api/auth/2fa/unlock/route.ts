// app/api/auth/2fa/unlock/route.ts
import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { User } from '@/models/user'
import { TOTPService } from '@/lib/totp'
import { EncryptionService } from '@/lib/encryption'

export async function POST(req: Request) {
  try {
    await dbConnect()
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { token } = await req.json()
    const user = await User.findById(session.user.id)
    
    if (!user?.twoFactorSecret) {
      return new NextResponse("2FA not set up", { status: 400 })
    }

    const decrypted = EncryptionService.decrypt(
      { encryptedText: user.twoFactorSecret },
      process.env.ENCRYPTION_KEY!
    )

    const isValid = await TOTPService.verifyToken(token, decrypted.text)
    
    if (isValid) {
      user.twoFactorUnlockedAt = new Date()
      await user.save()
      
      return NextResponse.json({ success: true })
    }

    return new NextResponse("Invalid token", { status: 400 })
  } catch (error) {
    console.error('Error unlocking 2FA:', error)
    return new NextResponse("Unlock failed", { status: 500 })
  }
}