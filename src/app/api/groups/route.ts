// app/api/groups/route.ts
import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { Group } from '@/models/group'

export async function GET(req: Request) {
  try {
    await dbConnect()
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const groups = await Group.find({ userId: session.user.id })
      .sort({ createdAt: -1 })

    return NextResponse.json(groups)
  } catch (error) {
    console.error('Error fetching groups:', error)
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
    const { name, description } = body

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    const newGroup = await Group.create({
      userId: session.user.id,
      name,
      description
    })

    return NextResponse.json(newGroup)
  } catch (error) {
    console.error('Error creating group:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}