import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "@/components/theme-provider";
import { UnifiedAuthProvider } from "@/contexts/unified-auth-context";
import { mock } from "bun:test";

// Mock the API client
const mockApiClient = {
  ApiClient: mock(() => ({
    get: mock(),
    post: mock(),
    put: mock(),
    patch: mock(),
    delete: mock(),
  })),
};

// Mock the entire API module
const mockApi = {
  api: {
    auth: {
      login: mock(),
      register: mock(),
      logout: mock(),
      getProfile: mock(),
    },
    adminAuth: {
      adminLogin: mock(),
      adminRegister: mock(),
      adminLogout: mock(),
      getAdminProfile: mock(),
    },
    users: {
      getUsers: mock(),
      getUser: mock(),
      createUser: mock(),
      updateUser: mock(),
      deleteUser: mock(),
    },
    leads: {
      getLeads: mock(),
      getLead: mock(),
      createLead: mock(),
      updateLead: mock(),
      deleteLead: mock(),
    },
    strategies: {
      getStrategies: mock(),
      getStrategy: mock(),
      createStrategy: mock(),
      updateStrategy: mock(),
      deleteStrategy: mock(),
    },
    bookings: {
      getBookings: mock(),
      getBooking: mock(),
      createBooking: mock(),
      updateBooking: mock(),
      deleteBooking: mock(),
    },
    chat: {
      sendMessage: mock(),
      getChatHistory: mock(),
    },
    promptTemplates: {
      getPromptTemplates: mock(),
      getPromptTemplate: mock(),
      createPromptTemplate: mock(),
      updatePromptTemplate: mock(),
      deletePromptTemplate: mock(),
    },
    status: {
      getSystemStatus: mock(),
    },
    general: {
      getHealth: mock(),
    },
  },
};

const mockApiExports = {
  AuthApi: mock(),
  AdminAuthApi: mock(),
  UsersApi: mock(),
  LeadsApi: mock(),
  StrategiesApi: mock(),
  BookingsApi: mock(),
  ChatApi: mock(),
  PromptTemplatesApi: mock(),
  StatusApi: mock(),
  GeneralApi: mock(),
};

// Mock the logger as default export
const mockLogger = {
  __esModule: true,
  default: {
    info: mock(),
    warn: mock(),
    error: mock(),
    debug: mock(),
  },
};

// Mock the cookies module
const mockCookies = {
  AuthCookies: {
    hasUserTokens: mock(),
    hasAdminTokens: mock(),
    setAccessToken: mock(),
    setRefreshToken: mock(),
    setAdminAccessToken: mock(),
    setAdminRefreshToken: mock(),
    getAdminAccessToken: mock(),
    getAdminRefreshToken: mock(),
    clearUserTokens: mock(),
    clearAdminTokens: mock(),
    clearAll: mock(),
  },
};

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <UnifiedAuthProvider>{children}</UnifiedAuthProvider>
    </ThemeProvider>
  );
};

type CustomRenderOptions = Omit<RenderOptions, "wrapper">;

const customRender = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  return render(ui, {
    wrapper: ({ children }) => <AllTheProviders>{children}</AllTheProviders>,
    ...options,
  });
};

// Re-export everything
export * from "@testing-library/react";

// Override render method
export { customRender as render };

// Common test data
export const mockUser = {
  id: "1",
  email: "test@example.com",
  name: "Test User",
  role: "USER",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockAdminUser = {
  id: "1",
  email: "admin@example.com",
  name: "Admin User",
  role: "ADMIN",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  login: mock(),
  logout: mock(),
  register: mock(),
};

export const mockAdminAuthContext = {
  user: mockAdminUser,
  isAuthenticated: true,
  isLoading: false,
  login: mock(),
  logout: mock(),
  verifyCode: mock(),
};

// Common test helpers
export const waitForLoadingToFinish = () => {
  return new Promise((resolve) => setTimeout(resolve, 0));
};

export const createMockApiResponse = <T,>(data: T, status = 200) => {
  return Promise.resolve({
    data,
    status,
    statusText: "OK",
  });
};

export const createMockApiError = (message: string, status = 400) => {
  return Promise.reject({
    response: {
      data: { message },
      status,
      statusText: "Bad Request",
    },
  });
};

// Export mocks for use in tests
export {
  mockApiClient,
  mockApi,
  mockApiExports,
  mockLogger,
  mockCookies,
};
