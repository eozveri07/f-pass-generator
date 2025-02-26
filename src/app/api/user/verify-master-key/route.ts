import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { User } from '@/models/user'

export async function POST(request: Request) {
  try {
    await dbConnect()
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const user = await User.findOne(
      { email: session.user.email },
      { authSalt: 1, authVerifier: 1, masterKeyReminder: 1 }
    )
    
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    if (!user.authSalt || !user.authVerifier) {
      return NextResponse.json({ error: 'Master key ayarlanmamış' }, { status: 400 })
    }

    return NextResponse.json({
      authSalt: user.authSalt,
      authVerifier: user.authVerifier
    })

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    }, { 
      status: 500 
    })
  }
}