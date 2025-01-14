import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { Password, PriorityLevel } from '@/models/password'
import { User } from '@/models/user'
import { EncryptionService } from '@/lib/encryption'
import { TOTPService } from '@/lib/totp'

// GET /api/passwords
export async function GET(req: Request) {
  try {
    await dbConnect()
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // 2FA token'ı URL'den al
    const { searchParams } = new URL(req.url)
    const totpToken = searchParams.get('totpToken')

    const passwords = await Password.find({ userId: session.user.id })
      .select('-__v')
      .sort({ createdAt: -1 })

    const user = await User.findById(session.user.id)
    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    const decryptedPasswords = passwords.map(pass => {
      // Eğer priorityLevel HIGH ise ve geçerli 2FA token yoksa şifreyi gizle
      if (pass.priorityLevel === PriorityLevel.HIGH) {
        if (!totpToken || !user.twoFactorSecret) {
          return {
            ...pass.toObject(),
            password: null, // Şifreyi gizle
            requiresTotp: true
          }
        }

        // 2FA token'ı doğrula
        const decryptedSecret = EncryptionService.decrypt(
          { encryptedText: user.twoFactorSecret },
          process.env.ENCRYPTION_KEY!
        )

        const isValidToken = TOTPService.verifyToken(totpToken, decryptedSecret.text)
        if (!isValidToken) {
          return {
            ...pass.toObject(),
            password: null,
            requiresTotp: true
          }
        }
      }

      // Normal şifre çözme işlemi
      const decrypted = EncryptionService.decrypt(
        {
          encryptedText: pass.password,
          recoveryData: pass.recoveryData
        },
        process.env.ENCRYPTION_KEY!
      )

      return {
        ...pass.toObject(),
        password: decrypted.text,
        recoveryData: undefined
      }
    })

    return NextResponse.json(decryptedPasswords)
  } catch (error) {
    console.error('Error fetching passwords:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// POST /api/passwords
export async function POST(req: Request) {
  try {
    await dbConnect()
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { title, username, password, url, notes, priorityLevel } = body

    if (!title || !password) {
      return new NextResponse("Title and password are required", { status: 400 })
    }

    // Priority level validasyonu
    if (!Object.values(PriorityLevel).includes(priorityLevel)) {
      return new NextResponse("Invalid priority level", { status: 400 })
    }

    const encrypted = EncryptionService.encrypt(password, process.env.ENCRYPTION_KEY!)

    const newPassword = await Password.create({
      userId: session.user.id,
      title,
      username,
      password: encrypted.encryptedText,
      recoveryData: encrypted.recoveryData,
      url,
      notes,
      priorityLevel,
      lastCopied: null
    })

    return NextResponse.json(newPassword)
  } catch (error) {
    console.error('Error creating password:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}