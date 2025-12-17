import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "API test endpoint is working!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  });
}
