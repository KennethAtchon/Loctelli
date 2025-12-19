import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/')({
  beforeLoad: () => {
    // Redirect admin root to dashboard
    throw redirect({
      to: '/admin/core/dashboard',
    });
  },
});

