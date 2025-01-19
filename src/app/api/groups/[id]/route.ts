import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { Group } from '@/models/group'
import { Password } from '@/models/password'

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

    // Önce grubu bul
    const group = await Group.findOne({
      _id: params.id,
      userId: session.user.id
    })

    if (!group) {
      return new NextResponse("Not Found", { status: 404 })
    }

    // Grubu kullanan şifreleri güncelle
    await Password.updateMany(
      { groupId: params.id },
      { $unset: { groupId: "" } }
    )

    // Grubu sil
    await group.deleteOne()

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting group:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
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
    const { name, description } = body

    const updatedGroup = await Group.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      { name, description },
      { new: true }
    )

    if (!updatedGroup) {
      return new NextResponse("Not Found", { status: 404 })
    }

    return NextResponse.json(updatedGroup)
  } catch (error) {
    console.error('Error updating group:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}