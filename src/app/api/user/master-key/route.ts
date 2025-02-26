import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { User } from '@/models/user'

interface MasterKeyRequest {
  authSalt: string;
  authVerifier: string;
  reminder?: string;
}

export async function POST(request: Request) {  
  try {
    await dbConnect()
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { authSalt, authVerifier, reminder } = await request.json() as MasterKeyRequest

    if (!authSalt || !authVerifier) {
      return NextResponse.json({ error: 'Geçersiz doğrulama verileri' }, { status: 400 })
    }

    let user = await User.findOne({ email: session.user.email })

    if (user) {
      // Update existing user
      user.authSalt = authSalt
      user.authVerifier = authVerifier
      user.masterKeySetAt = new Date()
      user.masterKeyReminder = reminder
      await user.save()
    } else {
      // Create new user
      user = await User.create({
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        authSalt,
        authVerifier,
        masterKeySetAt: new Date(),
        masterKeyReminder: reminder,
        twoFactorEnabled: false
      })
    }

    return NextResponse.json({ 
      success: true,
      message: "Master key doğrulama verileri başarıyla kaydedildi"
    })

  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    }, { 
      status: 500 
    })
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect()
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { authSalt, authVerifier, reminder } = await request.json() as MasterKeyRequest

    if (!authSalt || !authVerifier) {
      return NextResponse.json({ error: 'Geçersiz doğrulama verileri' }, { status: 400 })
    }

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    // Update master key authentication data
    user.authSalt = authSalt
    user.authVerifier = authVerifier
    user.masterKeySetAt = new Date()
    if (reminder !== undefined) {
      user.masterKeyReminder = reminder
    }
    await user.save()

    return NextResponse.json({ 
      success: true,
      message: "Master key doğrulama verileri başarıyla güncellendi"
    })

  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    }, { 
      status: 500 
    })
  }
}