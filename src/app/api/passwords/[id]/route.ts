import { NextResponse } from 'next/server'
import { auth } from "@/auth"
import dbConnect from '@/lib/mongoose'
import { Password } from '@/models/password'
import { User } from '@/models/user'

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
    const { 
      title, 
      username, 
      encryptedData, // Client'da şifrelenmiş veri 
      iv,            // Yeni IV
      salt,          // Yeni salt
      url, 
      notes,
      priorityLevel 
    } = body

    // Mülkiyet kontrolü
    const existingPassword = await Password.findOne({
      _id: params.id,
      userId: session.user.id
    })

    if (!existingPassword) {
      return new NextResponse("Not Found", { status: 404 })
    }

    // Eğer yeni şifre varsa şifrelenmiş veri ve bileşenleri güncelle
    const updateData: any = {
      title,
      username,
      url,
      notes
    }

    if (encryptedData && iv && salt) {
      updateData.encryptedData = encryptedData
      updateData.iv = iv
      updateData.salt = salt
    }

    if (priorityLevel !== undefined) {
      updateData.priorityLevel = priorityLevel
    }

    const updatedPassword = await Password.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    )

    return NextResponse.json(updatedPassword)
  } catch (error) {
    console.error('Error updating password:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// Copy date update endpoint
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Sadece lastCopied tarihini güncelle
    const updatedPassword = await Password.findOneAndUpdate(
      {
        _id: params.id,
        userId: session.user.id
      },
      {
        lastCopied: new Date()
      },
      { new: true }
    )

    if (!updatedPassword) {
      return new NextResponse("Not Found", { status: 404 })
    }

    return NextResponse.json(updatedPassword)
  } catch (error) {
    console.error('Error updating copy date:', error)
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

    const { searchParams } = new URL(req.url)
    const totpToken = searchParams.get('totpToken')

    // HIGH priority şifreleri için 2FA kontrolü
    const password = await Password.findOne({
      _id: params.id,
      userId: session.user.id
    })

    if (!password) {
      return new NextResponse("Not Found", { status: 404 })
    }

    // Eğer yüksek öncelikli şifre ise 2FA kontrolü yap
    if (password.priorityLevel === 'high') {
      const user = await User.findById(session.user.id)
      if (!user?.twoFactorSecret || !totpToken) {
        return new NextResponse("2FA required", { status: 403 })
      }

      // 2FA token'ını kontrol et
      const isValidToken = await import('@/lib/totp')
        .then(({ TOTPService }) => 
          TOTPService.verifyToken(totpToken, user.twoFactorSecret)
        )

      if (!isValidToken) {
        return new NextResponse("Invalid 2FA token", { status: 403 })
      }
    }

    // Şifreyi sil
    await Password.findByIdAndDelete(params.id)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting password:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}