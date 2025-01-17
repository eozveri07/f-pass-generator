import dbConnect from '@/lib/mongoose'
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    return NextResponse.json({
      message: 'Veritabanına başarıyla bağlanıldı.',
    });
  } catch (error) {
    return NextResponse.json({
      message: 'Veritabanına bağlanılamadı.',
      error: String(error),
    });
  }
}
