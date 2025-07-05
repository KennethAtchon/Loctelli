import { API_CONFIG } from '../envUtils';

export async function testApiConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: 'API proxy is working correctly' };
    } else {
      return { success: false, message: `API proxy returned status ${response.status}` };
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, message: 'API proxy request timed out' };
      }
      if (error.message.includes('Failed to fetch')) {
        return { success: false, message: 'Cannot connect to API proxy' };
      }
    }
    return { success: false, message: `API proxy connection failed: ${error}` };
  }
}

export async function testAuthEndpoint(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    // We expect a 401 since we're not authenticated, but this confirms the endpoint exists
    if (response.status === 401) {
      return { success: true, message: 'Auth endpoint is accessible through proxy (401 expected)' };
    } else if (response.ok) {
      return { success: true, message: 'Auth endpoint is accessible through proxy' };
    } else {
      return { success: false, message: `Auth endpoint returned status ${response.status}` };
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, message: 'Auth endpoint request timed out' };
      }
      if (error.message.includes('Failed to fetch')) {
        return { success: false, message: 'Cannot connect to auth endpoint through proxy' };
      }
    }
    return { success: false, message: `Auth endpoint connection failed: ${error}` };
  }
}

export async function testHealthEndpoint(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/status/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: `Health check passed through proxy: ${data.status}` };
    } else {
      return { success: false, message: `Health check failed with status ${response.status}` };
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, message: 'Health check request timed out' };
      }
      if (error.message.includes('Failed to fetch')) {
        return { success: false, message: 'Cannot connect to health endpoint through proxy' };
      }
    }
    return { success: false, message: `Health check failed: ${error}` };
  }
} 