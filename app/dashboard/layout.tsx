import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'KΘΦ II — Dashboard' };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
