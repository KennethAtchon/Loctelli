import { ReactNode } from "react";

interface AdminAuthLayoutProps {
  children: ReactNode;
}

export default function AdminAuthLayout({ children }: AdminAuthLayoutProps) {
  return <div className="">{children}</div>;
}
