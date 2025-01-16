import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { Password, PriorityLevel } from '@/models/password'
import { User } from '@/models/user'
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

    // Şifreleri client'a gönder, şifre çözme işlemi client'da yapılacak
    const processedPasswords = passwords.map(pass => {
      // Eğer priority HIGH ise ve geçerli 2FA token yoksa şifreyi gizle
      if (pass.priorityLevel === PriorityLevel.HIGH) {
        if (!totpToken || !user.twoFactorSecret) {
          return {
            ...pass.toObject(),
            requiresTotp: true
          }
        }

        // 2FA token'ı doğrula
        const isValidToken = TOTPService.verifyToken(totpToken, user.twoFactorSecret)
        if (!isValidToken) {
          return {
            ...pass.toObject(),
            requiresTotp: true
          }
        }
      }

      // Şifrelenmiş veriyi ve diğer bilgileri client'a gönder
      return {
        ...pass.toObject(),
        requiresTotp: false
      }
    })

    return NextResponse.json(processedPasswords)
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
    const { 
      title, 
      username, 
      encryptedData, // Client'da şifrelenmiş veri
      iv,            // Initialization vector
      salt,          // Salt değeri
      url, 
      notes, 
      priorityLevel 
    } = body

    if (!title || !encryptedData || !iv || !salt) {
      return new NextResponse(
        "Title, encrypted data, IV and salt are required", 
        { status: 400 }
      )
    }

    // Priority level validasyonu
    if (!Object.values(PriorityLevel).includes(priorityLevel)) {
      return new NextResponse("Invalid priority level", { status: 400 })
    }

    // Client'dan gelen şifrelenmiş veriyi direkt kaydet
    const newPassword = await Password.create({
      userId: session.user.id,
      title,
      username,
      encryptedData,
      iv,
      salt,
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