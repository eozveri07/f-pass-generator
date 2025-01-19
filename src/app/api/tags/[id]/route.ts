import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { Tag } from '@/models/tag'
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

    // İlk olarak tag'i bul
    const tag = await Tag.findOne({
      _id: params.id,
      userId: session.user.id
    })

    if (!tag) {
      return new NextResponse("Not Found", { status: 404 })
    }

    // Tag'i kullanan şifreleri güncelle
    await Password.updateMany(
      { tags: params.id },
      { $pull: { tags: params.id } }
    )

    // Tag'i sil
    await tag.deleteOne()

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting tag:', error)
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
    const { name, color } = body

    const updatedTag = await Tag.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      { name, color },
      { new: true }
    )

    if (!updatedTag) {
      return new NextResponse("Not Found", { status: 404 })
    }

    return NextResponse.json(updatedTag)
  } catch (error) {
    console.error('Error updating tag:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}