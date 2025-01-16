// app/api/auth/2fa/status/route.ts
import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { User } from '@/models/user'

const UNLOCK_DURATION = 5 * 60 * 1000 

export async function GET(req: Request) {
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

    const isUnlocked = user.twoFactorUnlockedAt && 
      (new Date().getTime() - new Date(user.twoFactorUnlockedAt).getTime()) < UNLOCK_DURATION

    return NextResponse.json({ 
      enabled: !!user.twoFactorEnabled && !!user.twoFactorSecret, // Her iki koşulu da kontrol et
      isUnlocked: isUnlocked && !!user.twoFactorEnabled // 2FA aktif değilse kilit durumunu false dön
    })

  } catch (error) {
    console.error('Error checking 2FA status:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}