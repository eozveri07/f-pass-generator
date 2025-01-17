import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { User } from '@/models/user'

export async function POST() {
    try {
      await dbConnect()
      const session = await auth()
      
      if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
      }
  
      const user = await User.findById(session.user.id)
      if (!user?.twoFactorEnabled) {
        return new NextResponse("2FA not enabled", { status: 400 })
      }
  
      user.twoFactorUnlockedAt = null
      await user.save()
  
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error locking 2FA:', error)
      return new NextResponse("Lock failed", { status: 500 })
    }
  }