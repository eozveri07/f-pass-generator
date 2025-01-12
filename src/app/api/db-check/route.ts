import { NextResponse } from "next/server";
import client from "@/lib/db";

export async function GET() {
    try {
        await client.connect();
        
        await client.db().admin().ping();
        
        await client.close();

        return NextResponse.json({
            status: "success",
            message: "Database connection successful",
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({
            status: "error",
            message: "Database connection failed",
            timestamp: new Date().toISOString(),
            error: {
                name: error.name,
                message: error.message,
                code: error.code
            }
        }, { status: 500 });
    }
}