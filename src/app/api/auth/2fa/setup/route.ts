import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { User } from '@/models/user'
import { TOTPService } from '@/lib/totp'
import { EncryptionService } from '@/lib/encryption'

export async function POST() {
    try {
      await dbConnect()
      const session = await auth()
      
      if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
      }
  
      const user = await User.findById(session.user.id)
      if (!user) {
        return new NextResponse("User not found", { status: 404 })
      }
  
      // Yeni TOTP secret oluştur
      const { secret, otpauth_url } = TOTPService.generateSecret(user.email)
      
      // Secret'ı şifrele
      const encrypted = EncryptionService.encrypt(secret, process.env.ENCRYPTION_KEY!)
      
      // QR kodu oluştur
      const qrCode = await TOTPService.generateQRCode(otpauth_url)
  
      // Secret'ı kaydet ve 2FA'yı henüz aktif etme
      user.twoFactorSecret = encrypted.encryptedText
      user.twoFactorEnabled = false
      await user.save()
  
      // Debug için bilgileri logla
      console.log('2FA Setup Info:')
      console.log('Email:', user.email)
      console.log('Secret:', secret)
      console.log('Auth URL:', otpauth_url)
  
      return NextResponse.json({ 
        qrCode,
        secret, 
        otpauth_url // URI'yi de gönder
      })
    } catch (error) {
      console.error('Error setting up 2FA:', error)
      return new NextResponse("Internal Server Error", { status: 500 })
    }
  }