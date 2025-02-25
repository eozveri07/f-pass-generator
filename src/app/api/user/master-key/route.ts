import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { User } from '@/models/user'
import bc from "bcryptjs"

interface CustomError {
  message: string;
}

export async function POST(request: Request) {  
  try {
    await dbConnect()
    const session = await auth()
    
    console.log('Session data:', session?.user)
    
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { masterKeySalt, reminder } = await request.json()  

    if (!masterKeySalt || masterKeySalt.length !== 6 || !/^\d+$/.test(masterKeySalt)) {
      return new NextResponse("Invalid master key", { status: 400 })
    }

    let user = await User.findOne({ email: session.user.email })
    const masterKey = await bc.hash(masterKeySalt, 10) 

    if (user) {
      user.masterKeyHash = masterKey
      user.masterKeySetAt = new Date()
      user.masterKeyReminder = reminder
      await user.save()
      console.log('Updated user:', user)
    } else {
      user = await User.create({
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        masterKeyHash: masterKey,
        masterKeySetAt: new Date(),
        masterKeyReminder: reminder,
        twoFactorEnabled: false,
      })
      console.log('Created new user:', user)
    }

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error setting master key:', error)
    return new NextResponse(JSON.stringify({ 
      error: (error as CustomError).message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}