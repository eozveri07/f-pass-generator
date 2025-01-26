import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { Device } from '@/models/device'
import { headers } from 'next/headers'

async function getLocationInfo(ip: string) {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`)
    const data = await response.json()
    return {
      city: data.city || 'Unknown',
      country: data.countryCode || 'Unknown',
      timezone: data.timezone || 'UTC'
    }
  } catch (error) {
    return {
      city: 'Unknown',
      country: 'Unknown',
      timezone: 'UTC'
    }
  }
}

export async function GET() {
  try {
    await dbConnect()
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const devices = await Device.find({ userId: session.user.id })
      .sort({ lastActive: -1 })
    
    return NextResponse.json(devices)
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST() {
  try {
    await dbConnect()
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const headersList = headers()
    const userAgent = headersList.get("user-agent") || ""
    const ip = headersList.get("x-forwarded-for")?.split(',')[0] || "unknown"
    const browserInfo = getBrowserInfo(userAgent)
    const deviceType = getUserDeviceType(userAgent)
    const locationInfo = await getLocationInfo(ip)

    // Check for existing device with same browser and IP
    const existingDevice = await Device.findOne({
      userId: session.user.id,
      browser: browserInfo,
      ipAddress: ip
    })

    if (existingDevice) {
      // Update last active time
      existingDevice.lastActive = new Date()
      existingDevice.isCurrentDevice = true
      await existingDevice.save()
      
      // Set other devices as not current
      await Device.updateMany(
        { userId: session.user.id, _id: { $ne: existingDevice._id } },
        { isCurrentDevice: false }
      )
      
      return NextResponse.json(existingDevice)
    }

    // Create new device if none exists
    await Device.updateMany(
      { userId: session.user.id },
      { isCurrentDevice: false }
    )

    const device = await Device.create({
      userId: session.user.id,
      deviceType,
      browser: browserInfo,
      ipAddress: ip,
      city: locationInfo.city,
      country: locationInfo.country,
      timezone: locationInfo.timezone,
      lastActive: new Date(),
      isCurrentDevice: true
    })

    return NextResponse.json(device)
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// Oturumu sonlandır
export async function DELETE(req: Request) {
  try {
    await dbConnect()
    const session = await auth()
    const { searchParams } = new URL(req.url)
    const deviceId = searchParams.get('deviceId')
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const device = await Device.findOneAndDelete({
      _id: deviceId,
      userId: session.user.id
    })

    if (!device) {
      return new NextResponse("Device not found", { status: 404 })
    }

    return NextResponse.json({ message: "Device removed" })
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

function getUserDeviceType(userAgent: string): string {
  // Windows versions
  if (userAgent.includes("Windows")) {
    if (userAgent.includes("Windows NT 10.0")) return "Windows 11/10"
    if (userAgent.includes("Windows NT 6.3")) return "Windows 8.1"
    if (userAgent.includes("Windows NT 6.2")) return "Windows 8"
    if (userAgent.includes("Windows NT 6.1")) return "Windows 7"
    return "Windows"
  }

  // macOS versions
  if (userAgent.includes("Mac OS X")) {
    const version = userAgent.match(/Mac OS X (\d+[._]\d+[._]\d+)/)?.[1]
    if (version) {
      return `macOS ${version.replace(/_/g, '.')}`
    }
    return "macOS"
  }

  // iOS devices
  if (userAgent.includes("iPhone")) {
    const version = userAgent.match(/iPhone OS (\d+_\d+)/)?.[1]
    if (userAgent.includes("iPhone14,")) return "iPhone 13 Series"
    if (userAgent.includes("iPhone15,")) return "iPhone 14 Series"
    if (userAgent.includes("iPhone16,")) return "iPhone 15 Series"
    return `iPhone (iOS ${version?.replace('_', '.')})`
  }

  // Android devices
  if (userAgent.includes("Android")) {
    const version = userAgent.match(/Android (\d+\.?\d*)/)?.[1]
    const model = userAgent.match(/\((.+?)\)/)?.[1].split(';')[1]?.trim()
    return model ? `${model} (Android ${version})` : `Android ${version}`
  }

  return "Other"
}

function getBrowserInfo(userAgent: string): string {
  if (userAgent.includes("Chrome")) return `Chrome ${userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/)?.[1] || ""}`
  if (userAgent.includes("Firefox")) return `Firefox ${userAgent.match(/Firefox\/(\d+\.\d+)/)?.[1] || ""}`
  if (userAgent.includes("Safari")) return `Safari ${userAgent.match(/Version\/(\d+\.\d+)/)?.[1] || ""}`
  return "Other"
}