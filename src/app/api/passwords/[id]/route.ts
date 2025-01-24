// app/api/passwords/[id]/route.ts
import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { Password, PriorityLevel } from '@/models/password'
import { Group } from '@/models/group'
import { Tag } from '@/models/tag'

interface PasswordUpdateData {
  title?: string
  username?: string
  encryptedData?: string
  iv?: string
  salt?: string
  url?: string
  notes?: string
  priorityLevel?: PriorityLevel
  groupId?: string | null
  tags?: string[]
  lastCopied?: Date
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

    // Find existing password first
    const existingPassword = await Password.findOne({
      _id: params.id,
      userId: session.user.id
    })

    if (!existingPassword) {
      return new NextResponse("Password not found", { status: 404 })
    }

    let updateData: PasswordUpdateData = {}

    const url = new URL(req.url)
    const isCopyOperation = url.searchParams.has('copy')
    const body = await req.json()

    if (body.action === 'copy') {
      const updatedPassword = await Password.findByIdAndUpdate(
        params.id,
        { $set: { lastCopied: new Date() } },
        { new: true }
      ).populate('groupId').populate('tags')

      return NextResponse.json(updatedPassword)

    } else {
      // Regular update operation
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

      // Validate required fields for normal update
      if (!title) {
        return new NextResponse("Title is required", { status: 400 })
      }

      // Build update data
      updateData = {
        title,
        username,
        url,
        notes
      }

      // Handle encrypted data update
      if (encryptedData && iv && salt) {
        updateData.encryptedData = encryptedData
        updateData.iv = iv
        updateData.salt = salt
      }

      // Validate and set priority level
      if (priorityLevel !== undefined) {
        if (!Object.values(PriorityLevel).includes(priorityLevel)) {
          return new NextResponse("Invalid priority level", { status: 400 })
        }
        updateData.priorityLevel = priorityLevel
      }

      // Validate groupId if provided
      if (groupId !== undefined) {
        if (groupId) {
          const group = await Group.findOne({
            _id: groupId,
            userId: session.user.id
          })
          if (!group) {
            return new NextResponse("Invalid group ID", { status: 400 })
          }
        }
        updateData.groupId = groupId
      }

      // Validate tags if provided
      if (tags !== undefined) {
        if (tags.length > 0) {
          const validTags = await Tag.find({
            _id: { $in: tags },
            userId: session.user.id
          })
          if (validTags.length !== tags.length) {
            return new NextResponse("Invalid tag ID(s)", { status: 400 })
          }
        }
        updateData.tags = tags
      }
    }

    // Perform the update
    const updatedPassword = await Password.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    ).populate('groupId').populate('tags')

    if (!updatedPassword) {
      return new NextResponse("Failed to update password", { status: 500 })
    }

    return NextResponse.json(updatedPassword)

  } catch (error) {
    console.error('Error updating password:', error)
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

    const password = await Password.findOne({
      _id: params.id,
      userId: session.user.id
    })

    if (!password) {
      return new NextResponse("Password not found", { status: 404 })
    }

    await Password.deleteOne({ _id: params.id })

    return new NextResponse(null, { status: 204 })
    
  } catch (error) {
    console.error('Error deleting password:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}