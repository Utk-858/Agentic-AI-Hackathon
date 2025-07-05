'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import Logo from '@/components/Logo';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface AppSidebarProps {
  navItems: NavItem[];
  role: 'Student' | 'Teacher';
}

export default function AppSidebar({ navItems, role }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-56 flex-col border-r bg-card sm:sticky sm:top-0 sm:flex">
      <nav className="flex flex-1 flex-col gap-4 px-4 sm:py-5">
        <Link href="/" className="flex items-center gap-2 px-2.5 font-semibold">
          <Logo className="h-8 w-8 text-primary" />
          <span className="font-headline text-xl font-bold">GuruMitra</span>
        </Link>
        <div className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={`${item.href}${pathname.includes('?') ? `?${pathname.split('?')[1]}` : ''}`}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                pathname === item.href && 'bg-muted text-primary'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="mt-auto p-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted hover:text-primary"
        >
          <LogOut className="h-5 w-5" />
          <span>Switch User</span>
        </Link>
      </div>
    </aside>
  );
}
