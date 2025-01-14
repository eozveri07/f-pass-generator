// app/api/passwords/[id]/route.ts
import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { Password } from '@/models/password'
import { EncryptionService } from '@/lib/encryption'

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { title, username, password, url, notes } = body

    // Verify ownership
    const existingPassword = await Password.findOne({
      _id: params.id,
      userId: session.user.id
    })

    if (!existingPassword) {
      return new NextResponse("Not Found", { status: 404 })
    }

    // Eğer şifre değiştiyse yeni şifreyi encrypt et
    let encryptedData = existingPassword.password
    let recoveryData = existingPassword.recoveryData

    if (password) {
      const encrypted = EncryptionService.encrypt(password, process.env.ENCRYPTION_KEY!)
      encryptedData = encrypted.encryptedText
      recoveryData = encrypted.recoveryData
    }

    const updatedPassword = await Password.findByIdAndUpdate(
      params.id,
      {
        title,
        username,
        password: encryptedData,
        recoveryData,
        url,
        notes
      },
      { new: true }
    )

    return NextResponse.json(updatedPassword)
  } catch (error) {
    console.error('Error updating password:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// Copy date update endpoint
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Update lastCopied date
    const updatedPassword = await Password.findOneAndUpdate(
      {
        _id: params.id,
        userId: session.user.id
      },
      {
        lastCopied: new Date()
      },
      { new: true }
    )

    if (!updatedPassword) {
      return new NextResponse("Not Found", { status: 404 })
    }

    return NextResponse.json(updatedPassword)
  } catch (error) {
    console.error('Error updating copy date:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const password = await Password.findOneAndDelete({
      _id: params.id,
      userId: session.user.id
    })

    if (!password) {
      return new NextResponse("Not Found", { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting password:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}