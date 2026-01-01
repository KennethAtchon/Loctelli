import { NextResponse } from "next/server";
import { ENV_CONFIG, API_CONFIG } from "@/lib/utils/envUtils";

export async function GET() {
  // Protect this endpoint - only available when DEBUG is enabled
  if (!ENV_CONFIG.DEBUG) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    message: "API test endpoint is working!",
    timestamp: new Date().toISOString(),
    debug: ENV_CONFIG.DEBUG,
    apiUrl: API_CONFIG.BACKEND_URL,
  });
}
