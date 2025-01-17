import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { Password } from '@/models/password'
import { User } from '@/models/user'
import { EncryptionService } from '@/lib/encryption'

export async function POST() {
  try {
    await dbConnect()
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Yeni recovery key oluştur
    const recoveryKey = EncryptionService.generateRecoveryKey()

    // Kullanıcı için kaydet
    await User.findByIdAndUpdate(session.user.id, {
      recoveryInfo: {
        key: recoveryKey,
        createdAt: new Date(),
        lastUsed: null
      }
    })

    return NextResponse.json({ recoveryKey })
  } catch (error) {
    console.error('Error generating recovery key:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    await dbConnect()
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { recoveryKey, passwordId } = await req.json()

    // Şifreyi bul
    const password = await Password.findOne({
      _id: passwordId,
      userId: session.user.id
    })

    if (!password) {
      return new NextResponse("Password not found", { status: 404 })
    }

    // Recovery key ile şifreyi çöz
    const decrypted = EncryptionService.decrypt(
      {
        encryptedText: password.password,
        recoveryData: password.recoveryData
      },
      recoveryKey,
      true
    )

    // Recovery kullanımını kaydet
    await User.findByIdAndUpdate(session.user.id, {
      'recoveryInfo.lastUsed': new Date()
    })

    return NextResponse.json({ password: decrypted.text })
  } catch (error) {
    console.error('Error recovering password:', error)
    return new NextResponse("Invalid recovery key", { status: 400 })
  }
}