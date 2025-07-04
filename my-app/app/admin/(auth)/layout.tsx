import { ReactNode } from 'react';

interface AdminAuthLayoutProps {
  children: ReactNode;
}

export default function AdminAuthLayout({ children }: AdminAuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {children}
    </div>
  );
} 