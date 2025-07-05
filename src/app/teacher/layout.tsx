import AppSidebar from '@/components/AppSidebar';
import { LayoutDashboard, PencilRuler, BrainCircuit, HeartPulse } from 'lucide-react';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { href: '/teacher/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/teacher/vidyasutra', label: 'Generators', icon: <PencilRuler className="h-5 w-5" /> },
    { href: '/teacher/assistant', label: 'Assistant', icon: <BrainCircuit className="h-5 w-5" /> },
    { href: '/teacher/swasthyamitra', label: 'SwasthyaMitra', icon: <HeartPulse className="h-5 w-5" /> },
  ];

  return (
    <div className="sm:grid sm:grid-cols-[224px_1fr]">
      <AppSidebar navItems={navItems} role="Teacher" />
      <main className="flex min-h-screen flex-col">
        {children}
      </main>
    </div>
  );
}
