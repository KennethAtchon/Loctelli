import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/lib/utils/envUtils";

/**
 * API Proxy Route
 * 
 * This route proxies all API requests from the frontend to the backend.
 * This avoids CORS issues by making requests server-side.
 * 
 * Flow:
 * 1. Frontend → POST /api/proxy/auth/login (to Next.js server)
 * 2. Next.js proxy → POST https://api.loctelli.com/auth/login (to backend)
 * 
 * Yes, POST requests will show up here - that's correct! The proxy receives
 * whatever method the frontend sends and forwards it to the backend.
 */

// Get backend URL from centralized envUtils
const BACKEND_URL = API_CONFIG.BACKEND_URL;

// Headers to forward from the original request
const FORWARD_HEADERS = [
  "authorization",
  "content-type",
  "x-api-key",
  "x-user-token",
  "accept",
  "accept-language",
];

// Headers to exclude from forwarding
const EXCLUDE_HEADERS = [
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
];

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, "PUT");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, "PATCH");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, "DELETE");
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, "OPTIONS");
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    // Reconstruct the backend path from the catch-all route
    const pathSegments = params.path || [];
    const backendPath = `/${pathSegments.join("/")}`;

    // Get query string if present
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : "";

    // Construct the full backend URL
    const backendUrl = `${BACKEND_URL}${backendPath}${queryString}`;

    // Prepare headers for the backend request
    const headers: HeadersInit = {};

    // Forward relevant headers from the original request
    FORWARD_HEADERS.forEach((headerName) => {
      const headerValue = request.headers.get(headerName);
      if (headerValue) {
        headers[headerName] = headerValue;
      }
    });

    // Add API key if available (server-side only)
    if (API_CONFIG.API_KEY && !headers["x-api-key"]) {
      headers["x-api-key"] = API_CONFIG.API_KEY;
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers,
    };

    // Add body for methods that support it
    if (["POST", "PUT", "PATCH"].includes(method)) {
      // Check if it's FormData
      const contentType = request.headers.get("content-type");
      if (contentType?.includes("multipart/form-data")) {
        // For FormData, we need to get it as FormData
        const formData = await request.formData();
        requestOptions.body = formData;
        // Don't set Content-Type header for FormData - browser will set it with boundary
        delete headers["content-type"];
      } else {
        // For JSON or other content types, get as text and forward
        const body = await request.text();
        if (body) {
          requestOptions.body = body;
        }
      }
    }

    // Make the request to the backend
    const response = await fetch(backendUrl, requestOptions);

    // Get Content-Type header first
    let contentType = response.headers.get("content-type") || "";

    // Prepare response headers first to preserve Content-Type
    const responseHeaders = new Headers();

    // Forward relevant response headers (including Content-Type)
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // Exclude headers that shouldn't be forwarded, but keep content-type
      if (
        !EXCLUDE_HEADERS.includes(lowerKey) &&
        (lowerKey === "content-type" || !lowerKey.startsWith("x-"))
      ) {
        responseHeaders.set(key, value);
      }
    });

    // Get response body based on content type
    let responseBody: BodyInit;
    
    // Check if it's clearly binary data first
    if (
      contentType.includes("application/octet-stream") ||
      contentType.includes("application/pdf") ||
      contentType.includes("image/") ||
      contentType.includes("video/")
    ) {
      // For binary data, use blob
      responseBody = await response.blob();
      if (contentType) {
        responseHeaders.set("content-type", contentType);
      }
    } else {
      // For text-based responses (including JSON), read as text
      const text = await response.text();
      
      // If Content-Type is missing or unclear, try to detect JSON
      if (!contentType || contentType.trim() === "") {
        // Check if response looks like JSON
        const trimmedText = text.trim();
        if (trimmedText.startsWith("{") || trimmedText.startsWith("[")) {
          contentType = "application/json";
        }
      }
      
      if (contentType.includes("application/json")) {
        responseBody = text;
        // Always set Content-Type for JSON responses with proper charset
        responseHeaders.set("content-type", "application/json; charset=utf-8");
        
        // Validate JSON if response is not empty (but don't throw - let client handle)
        if (text && text.trim()) {
          try {
            JSON.parse(text); // Validate it's valid JSON
          } catch (e) {
            console.error("Invalid JSON response from backend:", {
              status: response.status,
              statusText: response.statusText,
              preview: text.substring(0, 200),
              originalContentType: response.headers.get("content-type"),
            });
            // Don't throw - still return the text so client can handle the error
            // The client's safeJsonParse will handle this gracefully
          }
        }
      } else {
        // For other text types, use the text we read
        responseBody = text;
        // If no content-type was set, try to preserve it or set a default
        if (!responseHeaders.has("content-type")) {
          if (contentType) {
            responseHeaders.set("content-type", contentType);
          } else {
            // Default to text/plain if no content type
            responseHeaders.set("content-type", "text/plain; charset=utf-8");
          }
        }
      }
    }

    // Add CORS headers for the frontend
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    responseHeaders.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-API-Key, x-api-key, X-User-Token, x-user-token"
    );

    // Return the response
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

