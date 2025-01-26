import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import { Password } from '@/models/password'
import { Tag } from '@/models/tag'
import { Group } from '@/models/group'
import { User } from '@/models/user'
import dbConnect from '@/lib/mongoose'

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const userId = session.user.id

    await Promise.all([
      Password.deleteMany({ userId }),
      Group.deleteMany({ userId }),
      Tag.deleteMany({ userId }),
      User.findOneAndDelete({ email: session.user.email })
    ])

    return NextResponse.json({ message: 'Account deleted successfully' })
    
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}