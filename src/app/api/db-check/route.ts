import dbConnect from '@/lib/mongoose'
import { NextResponse } from 'next/server';

export async function GET() {
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
