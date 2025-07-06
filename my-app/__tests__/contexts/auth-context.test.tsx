import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { api } from '@/lib/api'
import { AuthCookies } from '@/lib/cookies'
import { ApiClient } from '@/lib/api/client'

// Mock the logger
jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockPatch = jest.fn();
const mockDelete = jest.fn();

beforeAll(() => {
  (ApiClient.prototype as any).get = mockGet;
  (ApiClient.prototype as any).post = mockPost;
  (ApiClient.prototype as any).put = mockPut;
  (ApiClient.prototype as any).patch = mockPatch;
  (ApiClient.prototype as any).delete = mockDelete;
});

beforeEach(() => {
  jest.clearAllMocks();
});

// Mock the API
jest.mock('@/lib/api', () => ({
  api: {
    auth: {
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      getProfile: jest.fn(),
    },
  },
}))

// Mock the cookies
jest.mock('@/lib/cookies', () => ({
  AuthCookies: {
    hasUserTokens: jest.fn(),
    setAccessToken: jest.fn(),
    setRefreshToken: jest.fn(),
    clearUserTokens: jest.fn(),
    clearAll: jest.fn(),
  },
}))

// Test component to access auth context
const TestComponent = () => {
  const { user, isLoading, isAuthenticated, login, register, logout } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="user-email">{user?.email || 'no-user'}</div>
      <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>
        Login
      </button>
      <button onClick={() => register({ 
        email: 'new@example.com', 
        password: 'password', 
        name: 'Test User' 
      })}>
        Register
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  const mockApi = api as jest.Mocked<typeof api>
  const mockAuthCookies = AuthCookies as jest.Mocked<typeof AuthCookies>
  
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset timers
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Initial State', () => {
    it('should start with loading state', async () => {
      mockAuthCookies.hasUserTokens.mockReturnValue(false)
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      // Wait for the auth check to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    })

    it('should check for existing tokens on mount', async () => {
      mockAuthCookies.hasUserTokens.mockReturnValue(false)
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(mockAuthCookies.hasUserTokens).toHaveBeenCalled()
      })
    })

    it('should auto-login if tokens exist', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      mockAuthCookies.hasUserTokens.mockReturnValue(true)
      mockApi.auth.getProfile.mockResolvedValue(mockUser)
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
      })
    })

    it('should handle auth check timeout', async () => {
      mockAuthCookies.hasUserTokens.mockReturnValue(true)
      mockApi.auth.getProfile.mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      )
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      // Fast-forward time to trigger timeout
      act(() => {
        jest.advanceTimersByTime(11000) // 11 seconds
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      })
    })
  })

  describe('Login', () => {
    it('should login successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const mockAuthResponse = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: mockUser,
      }
      mockAuthCookies.hasUserTokens.mockReturnValue(false)
      mockApi.auth.login.mockResolvedValue(mockAuthResponse)
      let authContext: any = null
      const TestComponentWithRef = () => {
        const auth = useAuth()
        authContext = auth
        return (
          <div>
            <div data-testid="loading">{auth.isLoading.toString()}</div>
            <div data-testid="authenticated">{auth.isAuthenticated.toString()}</div>
            <div data-testid="user-email">{auth.user?.email || 'no-user'}</div>
          </div>
        )
      }
      render(
        <AuthProvider>
          <TestComponentWithRef />
        </AuthProvider>
      )
      await act(async () => {
        await authContext.login({ email: 'test@example.com', password: 'password' })
      })
      expect(mockApi.auth.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' })
      expect(mockAuthCookies.setAccessToken).toHaveBeenCalledWith('access-token')
      expect(mockAuthCookies.setRefreshToken).toHaveBeenCalledWith('refresh-token')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
    })

    it('should handle login failure', async () => {
      const loginError = new Error('Invalid credentials')
      mockAuthCookies.hasUserTokens.mockReturnValue(false)
      mockApi.auth.login.mockRejectedValue(loginError)
      let authContext: any = null
      const TestComponentWithRef = () => {
        const auth = useAuth()
        authContext = auth
        return <div />
      }
      render(
        <AuthProvider>
          <TestComponentWithRef />
        </AuthProvider>
      )
      await expect(
        act(async () => {
          await authContext.login({ email: 'fail@example.com', password: 'bad' })
        })
      ).rejects.toThrow('Invalid credentials')
      expect(mockApi.auth.login).toHaveBeenCalledWith({ email: 'fail@example.com', password: 'bad' })
    })
  })

  describe('Register', () => {
    it('should register and auto-login successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const mockAuthResponse = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: mockUser,
      }
      mockAuthCookies.hasUserTokens.mockReturnValue(false)
      mockApi.auth.register.mockResolvedValue(undefined)
      mockApi.auth.login.mockResolvedValue(mockAuthResponse)
      let authContext: any = null
      const TestComponentWithRef = () => {
        const auth = useAuth()
        authContext = auth
        return (
          <div>
            <div data-testid="loading">{auth.isLoading.toString()}</div>
            <div data-testid="authenticated">{auth.isAuthenticated.toString()}</div>
            <div data-testid="user-email">{auth.user?.email || 'no-user'}</div>
          </div>
        )
      }
      render(
        <AuthProvider>
          <TestComponentWithRef />
        </AuthProvider>
      )
      await act(async () => {
        await authContext.register({ email: 'test@example.com', password: 'password', name: 'Test User' })
      })
      expect(mockApi.auth.register).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password', name: 'Test User' })
      expect(mockApi.auth.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' })
      expect(mockAuthCookies.setAccessToken).toHaveBeenCalledWith('access-token')
      expect(mockAuthCookies.setRefreshToken).toHaveBeenCalledWith('refresh-token')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
    })

    it('should handle registration failure', async () => {
      const registerError = new Error('Email already exists')
      mockAuthCookies.hasUserTokens.mockReturnValue(false)
      mockApi.auth.register.mockRejectedValue(registerError)
      let authContext: any = null
      const TestComponentWithRef = () => {
        const auth = useAuth()
        authContext = auth
        return <div />
      }
      render(
        <AuthProvider>
          <TestComponentWithRef />
        </AuthProvider>
      )
      await expect(
        act(async () => {
          await authContext.register({ email: 'fail@example.com', password: 'bad', name: 'Fail' })
        })
      ).rejects.toThrow('Email already exists')
      expect(mockApi.auth.register).toHaveBeenCalledWith({ email: 'fail@example.com', password: 'bad', name: 'Fail' })
    })
  })

  describe('Logout', () => {
    it('should logout successfully', async () => {
      mockAuthCookies.hasUserTokens.mockReturnValue(false)
      mockApi.auth.logout.mockResolvedValue(undefined)
      let authContext: any = null
      const TestComponentWithRef = () => {
        const auth = useAuth()
        authContext = auth
        return (
          <div>
            <div data-testid="loading">{auth.isLoading.toString()}</div>
            <div data-testid="authenticated">{auth.isAuthenticated.toString()}</div>
            <div data-testid="user-email">{auth.user?.email || 'no-user'}</div>
          </div>
        )
      }
      render(
        <AuthProvider>
          <TestComponentWithRef />
        </AuthProvider>
      )
      await act(async () => {
        await authContext.logout()
      })
      expect(mockApi.auth.logout).toHaveBeenCalled()
      expect(mockAuthCookies.clearAll).toHaveBeenCalled()
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('user-email')).toHaveTextContent('no-user')
    })

    it('should logout even if API call fails', async () => {
      mockAuthCookies.hasUserTokens.mockReturnValue(false)
      mockApi.auth.logout.mockRejectedValue(new Error('Logout failed'))
      let authContext: any = null
      const TestComponentWithRef = () => {
        const auth = useAuth()
        authContext = auth
        return <div />
      }
      render(
        <AuthProvider>
          <TestComponentWithRef />
        </AuthProvider>
      )
      await act(async () => {
        await authContext.logout()
      })
      expect(mockApi.auth.logout).toHaveBeenCalled()
      expect(mockAuthCookies.clearAll).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should clear tokens on auth errors', async () => {
      const authError = new Error('401 Unauthorized')
      mockAuthCookies.hasUserTokens.mockReturnValue(true)
      mockApi.auth.getProfile.mockRejectedValue(authError)
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(mockAuthCookies.clearUserTokens).toHaveBeenCalled()
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      })
    })

    it('should keep tokens on network errors', async () => {
      const networkError = new Error('Failed to fetch')
      mockAuthCookies.hasUserTokens.mockReturnValue(true)
      mockApi.auth.getProfile.mockRejectedValue(networkError)
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(mockAuthCookies.clearUserTokens).not.toHaveBeenCalled()
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      })
    })
  })

  describe('useAuth Hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useAuth must be used within an AuthProvider')
      
      consoleSpy.mockRestore()
    })
  })
}) 