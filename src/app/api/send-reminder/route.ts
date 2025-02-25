import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMasterKeyReminder } from "@/app/actions/user";
import { sendEmail } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { email } = await request.json();
    
    // Verify the email matches the session user
    if (email !== session.user.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const reminder = await getMasterKeyReminder(email);
    
    if (!reminder) {
      return new NextResponse("No reminder found", { status: 404 });
    }

    const reminderEmailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #333;">Master Key Reminder</h1>
        <p>You requested your master key reminder. Here it is:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px;"><strong>Your Reminder:</strong> ${reminder}</p>
        </div>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">
          This is an automated message from F-Pass Generator. If you didn't request this reminder, please ignore this email.
        </p>
      </div>
    `;

    const success = await sendEmail({
      to: email,
      subject: "Your Master Key Reminder - F-Pass Generator",
      html: reminderEmailHtml,
    });

    if (!success) {
      return new NextResponse("Failed to send reminder", { status: 500 });
    }

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
} 