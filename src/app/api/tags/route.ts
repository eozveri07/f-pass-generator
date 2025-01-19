// app/api/tags/route.ts
import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { Tag } from '@/models/tag'

export async function GET() {
  try {
    await dbConnect()
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const tags = await Tag.find({ userId: session.user.id })
      .sort({ createdAt: -1 })

    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error fetching tags:', error)
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
    const { name, color } = body

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    const newTag = await Tag.create({
      userId: session.user.id,
      name,
      color: color || "#000000"
    })

    return NextResponse.json(newTag)
  } catch (error) {
    console.error('Error creating tag:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}