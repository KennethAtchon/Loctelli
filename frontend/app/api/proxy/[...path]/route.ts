import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/lib/utils/envUtils";

/**
 * API Proxy Route
 *
 * Simple pass-through proxy that forwards requests to the backend.
 * Handles CORS and basic request/response forwarding.
 *
 * Note: BACKEND_URL is accessed at runtime via API_CONFIG.BACKEND_URL getter
 */

// Headers to exclude from request forwarding (would break the backend request)
const REQUEST_EXCLUDE_HEADERS = [
  "host", // Must be the backend's host, not the proxy's
  "connection", // HTTP connection management, handled by fetch
];

// Headers to exclude from response forwarding (would break the client)
const RESPONSE_EXCLUDE_HEADERS = [
  "host", // Must be the proxy's host, not the backend's
  "connection", // HTTP connection management, handled by NextResponse
  "content-length", // Will be recalculated by NextResponse based on actual body
  "transfer-encoding", // HTTP transfer encoding, handled by NextResponse
  "content-encoding", // We decompress the body, so this header is incorrect
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, "PUT");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, "PATCH");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, "DELETE");
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, "OPTIONS");
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    // Build backend URL (accessed at runtime)
    const pathSegments = params.path || [];
    // Remove empty segments and trailing slashes
    const cleanSegments = pathSegments.filter((s) => s !== "");
    const backendPath = `/${cleanSegments.join("/")}`.replace(/\/+$/, "") || "/";
    const queryString = request.nextUrl.searchParams.toString();
    const backendUrl = `${API_CONFIG.BACKEND_URL}${backendPath}${queryString ? `?${queryString}` : ""}`;

    // Forward all request headers except those that would break things
    const headers: HeadersInit = {};
    request.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!REQUEST_EXCLUDE_HEADERS.includes(lowerKey)) {
        headers[key] = value;
      }
    });

    // Add API key if available (server-side only, not exposed to client)
    if (API_CONFIG.API_KEY && !headers["x-api-key"]) {
      headers["x-api-key"] = API_CONFIG.API_KEY;
    }

    // Prepare request
    const requestOptions: RequestInit = { method, headers };

    // Add body for POST/PUT/PATCH
    if (["POST", "PUT", "PATCH"].includes(method)) {
      const contentType = request.headers.get("content-type");
      if (contentType?.includes("multipart/form-data")) {
        requestOptions.body = await request.formData();
        // Don't set Content-Type for FormData - browser will set it with boundary
        delete headers["content-type"];
      } else {
        const body = await request.text();
        if (body) {
          requestOptions.body = body;
        }
      }
    }

    // Make request to backend
    const response = await fetch(backendUrl, requestOptions);

    // Get response body
    const contentType = response.headers.get("content-type") || "";
    let responseBody: BodyInit;
    
    // 304 Not Modified is a successful response (cache hit), not an error
    const isSuccessStatus = response.ok || response.status === 304;
    
    if (
      contentType.includes("application/octet-stream") ||
      contentType.includes("application/pdf") ||
      contentType.includes("image/") ||
      contentType.includes("video/")
    ) {
      // Binary data
      responseBody = await response.blob();
    } else {
      // Text-based responses (including JSON)
      const textBody = await response.text();
      responseBody = textBody;
      
      // Log error responses for debugging (but not 304 Not Modified)
      if (!isSuccessStatus) {
        console.error("Backend error response:", {
          status: response.status,
          statusText: response.statusText,
          url: backendUrl,
          body: textBody,
        });
      }
    }

    // Forward all response headers except those that would break things
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!RESPONSE_EXCLUDE_HEADERS.includes(lowerKey)) {
        responseHeaders.set(key, value);
      }
    });

    // Add CORS headers
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    responseHeaders.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-API-Key, x-api-key"
    );

    // Return response
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      {
        error: "Proxy request failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
