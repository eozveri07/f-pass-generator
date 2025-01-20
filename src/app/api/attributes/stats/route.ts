// app/api/attributes/stats/route.ts
import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { Password } from '@/models/password'

export async function GET() {
  try {
    await dbConnect()
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const tagStats = await Password.aggregate([
      { $match: { userId: session.user.id } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } }
    ]);

    const groupStats = await Password.aggregate([
      { $match: { userId: session.user.id } },
      { $group: { _id: "$groupId", count: { $sum: 1 } } }
    ]);

    const stats = {
      tags: Object.fromEntries(tagStats.map(item => [item._id, item.count])),
      groups: Object.fromEntries(groupStats.map(item => [item._id, item.count]))
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching attribute stats:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}