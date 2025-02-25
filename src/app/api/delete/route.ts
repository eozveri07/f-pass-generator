import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import { Password } from '@/models/password'
import { User } from '@/models/user'
import dbConnect from '@/lib/mongoose'
import { Device } from "@/models/device"
import mongoose from "mongoose"

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    // Find user
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = user._id

    // Start a transaction for data consistency
    const session_db = await mongoose.startSession()
    session_db.startTransaction()

    try {
      // Delete all related data
      await Promise.all([
        // Delete user's devices
        Device.deleteMany({ userId: userId.toString() }),

        // Delete user's passwords
        Password.deleteMany({ userId: userId.toString() }),

        // Delete account and session data from MongoDB
        mongoose.connection.collection("accounts").deleteMany({ userId: userId }),
        mongoose.connection.collection("sessions").deleteMany({ userId: userId }),

        // Finally delete the user
        User.deleteOne({ _id: userId })
      ])

      await session_db.commitTransaction()
    } catch (error) {
      await session_db.abortTransaction()
      throw error
    } finally {
      session_db.endSession()
    }

    return NextResponse.json({ 
      success: true,
      message: "Account and all associated data have been successfully deleted" 
    }, {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })

  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json(JSON.stringify({ 
      success: false,
      message: "Failed to delete account" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}