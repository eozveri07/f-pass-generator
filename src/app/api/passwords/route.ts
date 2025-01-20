import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { Password, PriorityLevel } from '@/models/password'
import { User } from '@/models/user'
import { TOTPService } from '@/lib/totp'
import { Tag } from '@/models/tag'
import { Group } from '@/models/group'

// Define the query type
interface PasswordQuery {
  userId: string;
  groupId?: string;
  tags?: { $in: string[] };
}

export async function GET(req: Request) {
  try {
    await dbConnect()
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const totpToken = searchParams.get('totpToken')
    const groupId = searchParams.get('groupId')
    const tagIds = searchParams.get('tagIds')?.split(',').filter(Boolean)

    const query: PasswordQuery = { userId: session.user.id }

    if (groupId) {
      query.groupId = groupId
    }

    if (tagIds && tagIds.length > 0) {
      query.tags = { $in: tagIds }
    }

    const passwords = await Password.find(query)
      .populate('groupId')
      .populate('tags')
      .select('-__v')
      .sort({ createdAt: -1 })

    const user = await User.findById(session.user.id)
    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    const processedPasswords = passwords.map(pass => {
      if (pass.priorityLevel === PriorityLevel.HIGH) {
        if (!totpToken || !user.twoFactorSecret) {
          return {
            ...pass.toObject(),
            requiresTotp: true
          }
        }

        const isValidToken = TOTPService.verifyToken(totpToken, user.twoFactorSecret)
        if (!isValidToken) {
          return {
            ...pass.toObject(),
            requiresTotp: true
          }
        }
      }

      return {
        ...pass.toObject(),
        requiresTotp: false
      }
    })

    return NextResponse.json(processedPasswords)
  } catch (error) {
    console.error('Error fetching passwords:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(req: Request) {
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

    if (!title || !encryptedData || !iv || !salt) {
      return new NextResponse(
        "Title, encrypted data, IV and salt are required", 
        { status: 400 }
      )
    }

    if (!Object.values(PriorityLevel).includes(priorityLevel)) {
      return new NextResponse("Invalid priority level", { status: 400 })
    }

    if (groupId) {
      const group = await Group.findOne({
        _id: groupId,
        userId: session.user.id
      })
      if (!group) {
        return new NextResponse("Invalid group ID", { status: 400 })
      }
    }

    if (tags && tags.length > 0) {
      const validTags = await Tag.find({
        _id: { $in: tags },
        userId: session.user.id
      })
      if (validTags.length !== tags.length) {
        return new NextResponse("Invalid tag ID(s)", { status: 400 })
      }
    }

    const newPassword = await Password.create({
      userId: session.user.id,
      title,
      username,
      encryptedData,
      iv,
      salt,
      url,
      notes,
      priorityLevel,
      lastCopied: null,
      groupId,
      tags
    })

    const populatedPassword = await Password.findById(newPassword._id)
      .populate('groupId')
      .populate('tags')

    return NextResponse.json(populatedPassword)
  } catch (error) {
    console.error('Error creating password:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}