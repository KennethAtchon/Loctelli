import { NextResponse } from "next/server";
import { ENV_CONFIG, API_CONFIG } from "@/lib/utils/envUtils";

export async function GET() {
  return NextResponse.json({
    message: "API test endpoint is working!",
    timestamp: new Date().toISOString(),
    environment: ENV_CONFIG.NODE_ENV,
    apiUrl: API_CONFIG.BACKEND_URL,
  });
}
