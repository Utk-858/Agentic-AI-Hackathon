'use client';
import AppSidebar from '@/components/AppSidebar';
import { TeacherStateProvider } from '@/context/TeacherStateContext';
import { LayoutDashboard, PencilRuler, BrainCircuit, HeartPulse, CalendarDays, ScanLine, ClipboardSignature } from 'lucide-react';
import { useState } from 'react';
import { Menu } from 'lucide-react';
export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <div className="flex h-screen overflow-hidden">
        {/* Mobile sidebar */}
        <div
          className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            sm:translate-x-0 sm:static sm:inset-auto sm:shadow-none
          `}
        >
          <AppSidebar navItems={navItems} />
        </div>

        {/* Page content */}
        <div className="flex flex-col flex-1">
          {/* Mobile top bar */}
          <div className="flex items-center justify-between p-4 border-b sm:hidden">
            <button onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold">GuruMitra</h1>
          </div>

          {/* Overlay when sidebar is open */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
              onClick={() => setSidebarOpen(false)}
            ></div>
          )}

          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </TeacherStateProvider>
  );
}
