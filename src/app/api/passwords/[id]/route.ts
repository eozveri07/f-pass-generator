import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { Password } from '@/models/password'

interface PasswordUpdateData {
  title?: string
  username?: string
  encryptedData?: string
  iv?: string
  salt?: string
  url?: string
  notes?: string
  priorityLevel?: 'high' | 'medium' | 'low'
  groupId?: string | null
  tags?: string[]
}

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
    const { 
      title, 
      username, 
      encryptedData,
      iv,
      salt,
      url, 
      notes,
      priorityLevel,
      groupId,
      tags
    } = body

    const existingPassword = await Password.findOne({
      _id: params.id,
      userId: session.user.id
    })

    if (!existingPassword) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const updateData: PasswordUpdateData = {
      title,
      username,
      url,
      notes
    }

    if (encryptedData && iv && salt) {
      updateData.encryptedData = encryptedData
      updateData.iv = iv
      updateData.salt = salt
    }

    if (priorityLevel !== undefined) {
      updateData.priorityLevel = priorityLevel
    }

    if (groupId !== undefined) {
      updateData.groupId = groupId
    }

    if (tags !== undefined) {
      updateData.tags = tags
    }

    const updatedPassword = await Password.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    ).populate('groupId').populate('tags')

    return NextResponse.json(updatedPassword)
  } catch (error) {
    console.error('Error updating password:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}