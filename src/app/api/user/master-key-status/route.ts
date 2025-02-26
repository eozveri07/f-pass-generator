import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { User } from '@/models/user'

export async function GET() {
  try {
    await dbConnect()
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const user = await User.findOne(
      { email: session.user.email },
      { authSalt: 1, authVerifier: 1 }
    )
    
    if (!user) {
      return NextResponse.json({ hasMasterKey: false })
    }
    
    const hasMasterKey = !!(user && user.authSalt && user.authVerifier)

    return NextResponse.json({ hasMasterKey })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    }, { 
      status: 500 
    })
  }
}