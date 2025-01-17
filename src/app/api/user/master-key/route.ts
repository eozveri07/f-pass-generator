import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { User } from '@/models/user'
import bc from "bcryptjs"

// app/api/user/master-key/route.ts
export async function POST() {
    try {
      await dbConnect()
      const session = await auth()
      
      console.log('Session data:', session?.user)
      
      if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 })
      }
  
      const { masterKeySalt } = await req.json()
  
      // Kullanıcıyı bul
      let user = await User.findOne({ email: session.user.email })

      const masterKey = await bc.hash(masterKeySalt , 10) 
  
      // User varsa güncelle, yoksa oluştur
      if (user) {
        user.masterKeyHash = masterKey
        user.masterKeySetAt = new Date()
        await user.save() // save() metodu ile güncelle
        console.log('Updated user:', user)
      } else {
        user = await User.create({
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
          masterKeyHash: masterKey,
          masterKeySetAt: new Date(),
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
      return new NextResponse(JSON.stringify({ error: (error as any).message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }