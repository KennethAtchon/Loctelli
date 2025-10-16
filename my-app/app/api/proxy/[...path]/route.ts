import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const API_KEY = process.env.API_KEY; // Server-side only, not NEXT_PUBLIC

// Helper function to parse cookies from cookie header
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'DELETE');
}

async function handleRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // Construct the backend URL
    const path = pathSegments.join('/');
    const url = `${BACKEND_URL}/${path}`;

    // Get the search params from the original request
    const searchParams = request.nextUrl.searchParams.toString();
    const fullUrl = searchParams ? `${url}?${searchParams}` : url;

    // Prepare headers - don't set Content-Type by default
    const headers: Record<string, string> = {};

    // Add API key to backend request
    if (API_KEY) {
      headers['x-api-key'] = API_KEY;
    } else {
      logger.error('❌ API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error', message: 'API key not configured' },
        { status: 500 }
      );
    }

    // Forward user authentication headers if present
    // First check for x-user-token header (from direct API calls)
    let userToken = request.headers.get('x-user-token');

    // If no header, check cookies (for browser requests through proxy)
    if (!userToken) {
      const cookies = request.headers.get('cookie');
      if (cookies) {
        // Parse cookies and look for admin tokens first (admin takes precedence)
        const cookieMap = parseCookies(cookies);

        // Check for admin tokens first
        if (cookieMap['admin_access_token']) {
          userToken = cookieMap['admin_access_token'];
          logger.debug('✅ Found admin_access_token in cookies, forwarding to backend');
        }
        // Fall back to regular user token
        else if (cookieMap['access_token']) {
          userToken = cookieMap['access_token'];
          logger.debug('✅ Found access_token in cookies, forwarding to backend');
        } else {
          logger.debug('⚠️ No authentication tokens found in cookies');
        }
      }
    }

    if (userToken) {
      headers['x-user-token'] = userToken;
    }

    // Get the content type from the original request
    const contentType = request.headers.get('content-type');

    // Get request body if it exists
    let body: string | FormData | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        // Check if it's a FormData request (file upload)
        if (contentType?.includes('multipart/form-data')) {
          // For FormData, get it as FormData and let fetch handle the boundary
          body = await request.formData();
          // Don't set Content-Type header - let fetch set it with proper boundary
        } else {
          // For JSON and other requests, get as text and set appropriate content type
          body = await request.text();
          headers['Content-Type'] = contentType || 'application/json';
        }
      } catch {
        // No body to forward
      }
    }

    // Make request to backend
    const response = await fetch(fullUrl, {
      method,
      headers,
      body: body as BodyInit,
    });

    // Get response data
    const responseData = await response.text();
    
    // Try to parse as JSON, fallback to text
    let data;
    try {
      data = JSON.parse(responseData);
    } catch {
      data = responseData;
    }

    // Return response with same status and data
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });

  } catch (error) {
    logger.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to proxy request' },
      { status: 500 }
    );
  }
} 