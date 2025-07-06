import AppSidebar from '@/components/AppSidebar';
import { TeacherStateProvider } from '@/context/TeacherStateContext';
import { LayoutDashboard, PencilRuler, BrainCircuit, HeartPulse, CalendarDays, ScanLine, ClipboardSignature } from 'lucide-react';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { href: '/teacher/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/teacher/vidyasutra', label: 'Generators', icon: <PencilRuler className="h-5 w-5" /> },
    { href: '/teacher/assistant', label: 'Assistant', icon: <BrainCircuit className="h-5 w-5" /> },
    { href: '/teacher/chalkboard-scanner', label: 'Scanner', icon: <ScanLine className="h-5 w-5" /> },
    { href: '/teacher/blackboard-designer', label: 'Board Buddy', icon: <ClipboardSignature className="h-5 w-5" /> },
    { href: '/teacher/timetable', label: 'Timetable', icon: <CalendarDays className="h-5 w-5" /> },
    { href: '/teacher/swasthyamitra', label: 'SwasthyaMitra', icon: <HeartPulse className="h-5 w-5" /> },
  ];

  return (
    <TeacherStateProvider>
      <div className="sm:grid sm:grid-cols-[224px_1fr]">
        <AppSidebar navItems={navItems} />
        <main className="flex min-h-screen flex-col">
          {children}
        </main>
      </div>
    </TeacherStateProvider>
  );
}
