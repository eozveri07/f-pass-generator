import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }

    const testEmailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #333;">Test Email</h1>
        <p>This is a test email from your F-Pass Generator application.</p>
        <p>If you received this email, your email configuration is working correctly!</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">
          Sent from F-Pass Generator Test System
        </p>
      </div>
    `;

    const success = await sendEmail({
      to: email,
      subject: "F-Pass Generator Test Email",
      html: testEmailHtml,
    });

    if (!success) {
      return new NextResponse("Failed to send email", { status: 500 });
    }

    return new NextResponse("Email sent successfully", { status: 200 });
  } catch (error) {
    console.error("Error sending test email:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 