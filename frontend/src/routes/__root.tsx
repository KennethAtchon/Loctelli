import { createRootRoute, Outlet } from '@tanstack/react-router';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from '@/components/theme-provider';
import { UnifiedAuthProvider } from '@/contexts/unified-auth-context';
import { Toaster } from '@/components/ui/sonner';
import { validateEnvironmentVariables } from '@/lib/utils/envUtils';
import logger from '@/lib/logger';

// Validate environment variables on app startup
if (typeof window !== 'undefined') {
  try {
    validateEnvironmentVariables();
    logger.debug('✅ Environment validation passed');
  } catch (error) {
    logger.error('❌ Environment validation failed:', error);
  }
}

export const Route = createRootRoute({
  component: () => (
    <HelmetProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <UnifiedAuthProvider>
          <Outlet />
          <Toaster />
        </UnifiedAuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  ),
});

