import AppSidebar from '@/components/AppSidebar';
import { LayoutDashboard, BookOpen, HeartPulse } from 'lucide-react';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { href: '/student/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/student/vidyasutra', label: 'VidyaSutra', icon: <BookOpen className="h-5 w-5" /> },
    { href: '/student/swasthyamitra', label: 'SwasthyaMitra', icon: <HeartPulse className="h-5 w-5" /> },
  ];

  return (
    <div className="sm:grid sm:grid-cols-[224px_1fr]">
      <AppSidebar navItems={navItems} role="Student" />
      <main className="flex min-h-screen flex-col">
        {children}
      </main>
    </div>
  );
}
