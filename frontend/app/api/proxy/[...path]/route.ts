import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/lib/utils/envUtils";

/**
 * API Proxy Route
 *
 * Simple pass-through proxy that forwards requests to the backend.
 * Handles CORS and basic request/response forwarding.
 */

const BACKEND_URL = API_CONFIG.BACKEND_URL;

// Headers to forward from the original request
const FORWARD_HEADERS = [
  "authorization",
  "content-type",
  "x-api-key",
  "accept",
  "accept-language",
];

// Headers to exclude from forwarding
const EXCLUDE_HEADERS = [
  "host",
  "connection",
  "content-length",      // Will be recalculated by NextResponse
  "transfer-encoding",
  "content-encoding",   // Remove compression header since we decompress the body
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
    // Build backend URL
    const pathSegments = params.path || [];
    const backendPath = `/${pathSegments.join("/")}`;
    const queryString = request.nextUrl.searchParams.toString();
    const backendUrl = `${BACKEND_URL}${backendPath}${queryString ? `?${queryString}` : ""}`;

    // Prepare headers
    const headers: HeadersInit = {};
    FORWARD_HEADERS.forEach((headerName) => {
      const value = request.headers.get(headerName);
      if (value) headers[headerName] = value;
    });

    // Add API key if available
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
      responseBody = await response.text();
    }

    // Prepare response headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!EXCLUDE_HEADERS.includes(lowerKey)) {
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
