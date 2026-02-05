import { beforeAll, afterAll } from "bun:test";

// Mock Next.js router
const mockRouter = {
  push: () => {},
  replace: () => {},
  prefetch: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
};

const mockSearchParams = new URLSearchParams();
const mockPathname = "/";

// Mock Next.js navigation
if (typeof global !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).useRouter = () => mockRouter;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).useSearchParams = () => mockSearchParams;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).usePathname = () => mockPathname;
}

// Mock Next.js image component
if (typeof global !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).nextImage = (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return { type: "img", props };
  };
}

// Mock window.matchMedia
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // deprecated
      removeListener: () => {}, // deprecated
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });
}

// Mock IntersectionObserver
if (typeof global !== "undefined") {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global.IntersectionObserver as any) = global.IntersectionObserver;
}

// Mock ResizeObserver
if (typeof global !== "undefined") {
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global.ResizeObserver as any) = global.ResizeObserver;
}

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

if (typeof beforeAll !== "undefined") {
  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error = (...args: any[]) => {
      if (
        typeof args[0] === "string" &&
        args[0].includes("Warning: ReactDOM.render is no longer supported")
      ) {
        return;
      }
      originalError.call(console, ...args);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.warn = (...args: any[]) => {
      if (
        typeof args[0] === "string" &&
        args[0].includes("Warning: componentWillReceiveProps has been renamed")
      ) {
        return;
      }
      originalWarn.call(console, ...args);
    };
  });

  if (typeof afterAll !== "undefined") {
    afterAll(() => {
      console.error = originalError;
      console.warn = originalWarn;
    });
  }
}
