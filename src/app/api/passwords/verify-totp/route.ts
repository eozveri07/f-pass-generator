// app/api/passwords/verify-totp/route.ts
import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { Password } from '@/models/password'
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
  
      const { token, passwordId } = await req.json()
  
      console.log('Verifying TOTP:')
      console.log('Token:', token)
  
      const user = await User.findById(session.user.id)
      if (!user?.twoFactorSecret) {
        return new NextResponse("2FA not set up", { status: 400 })
      }
  
      // Şifrelenmiş secret'ı çöz
      const decrypted = EncryptionService.decrypt(
        { encryptedText: user.twoFactorSecret },
        process.env.ENCRYPTION_KEY!
      )
  
      console.log('Decrypted secret:', decrypted.text)
  
      // TOTP doğrulama
      const isValid = await TOTPService.verifyToken(token, decrypted.text)
      
      if (!isValid) {
        console.log('TOTP validation failed')
        return new NextResponse("Invalid 2FA token", { status: 400 })
      }
  
      // Şifreyi çöz ve gönder
      const password = await Password.findOne({
        _id: passwordId,
        userId: session.user.id
      })
  
      if (!password) {
        return new NextResponse("Password not found", { status: 404 })
      }
  
      const decryptedPassword = EncryptionService.decrypt(
        {
          encryptedText: password.password,
          recoveryData: password.recoveryData
        },
        process.env.ENCRYPTION_KEY!
      )
  
      return NextResponse.json({ 
        password: decryptedPassword.text
      })
    } catch (error) {
      console.error('Error in verify-totp:', error)
      return new NextResponse(error instanceof Error ? error.message : "Internal Server Error", { 
        status: 500 
      })
    }
  }