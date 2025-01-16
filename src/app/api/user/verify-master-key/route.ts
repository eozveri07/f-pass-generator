import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { User } from '@/models/user'

export async function POST(req: Request) {
    try {
      await dbConnect()
      const session = await auth()
      
      if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 })
      }
  
      const { masterKey } = await req.json()
      const user = await User.findOne({ email: session.user.email })
  
      if (!user || user.masterKeyHash !== masterKey) {
        return new NextResponse("Invalid master key", { status: 400 })
      }
  
      return new NextResponse(null, { status: 200 })
    } catch (error) {
      console.error('Error verifying master key:', error)
      return new NextResponse("Internal Server Error", { status: 500 })
    }
  }