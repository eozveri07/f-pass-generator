// app/api/auth/2fa/verify/route.ts
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

    // Şifrelenmiş secret'ı çöz
    const decrypted = EncryptionService.decrypt(
      { encryptedText: user.twoFactorSecret },
      process.env.ENCRYPTION_KEY!
    )

    // TOTP doğrula
    const isValid = await TOTPService.verifyToken(token, decrypted.text)
    
    if (isValid) {
      // 2FA'yı aktifleştir
      user.twoFactorEnabled = true
      await user.save()
      
      return NextResponse.json({ success: true })
    }

    return new NextResponse("Invalid token", { status: 400 })
  } catch (error) {
    console.error('Error verifying 2FA:', error)
    return new NextResponse("Verification failed", { status: 500 })
  }
}