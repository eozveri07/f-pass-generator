import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { Password } from '@/models/password'

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

    // Find existing password first
    const existingPassword = await Password.findOne({
      _id: params.id,
      userId: session.user.id
    })

    if (!existingPassword) {
      return new NextResponse("Password not found", { status: 404 })
    }

    // Update lastCopied timestamp
    const updatedPassword = await Password.findByIdAndUpdate(
      params.id,
      { $set: { lastCopied: new Date() } },
      { new: true }
    ).populate('groupId').populate('tags')

    if (!updatedPassword) {
      return new NextResponse("Failed to update password", { status: 500 })
    }

    return NextResponse.json(updatedPassword)
  } catch (error) {
    console.error('Error updating password copy timestamp:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 