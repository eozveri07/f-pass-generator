import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { User } from '@/models/user'

export async function GET() {
    try {
      await dbConnect()
      const session = await auth()
      
      if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 })
      }
  
      const user = await User.findOne({ email: session.user.email })
  
      return NextResponse.json({ 
        hasMasterKey: !!user?.masterKeyHash
      })
    } catch (error) {
      console.error('Error checking master key status:', error)
      return new NextResponse("Internal Server Error", { status: 500 })
    }
  }