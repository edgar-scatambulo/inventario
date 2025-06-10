
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ScanBarcode,
  FileText,
  Users,
  Settings,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar'; // Assuming sidebar components are in ui
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/equipamentos', label: 'Equipamentos', icon: Package },
  { href: '/setores', label: 'Setores', icon: Warehouse },
  { href: '/conferencia', label: 'Conferência', icon: ScanBarcode },
  { href: '/relatorios', label: 'Relatórios', icon: FileText },
  // { href: '/usuarios', label: 'Usuários', icon: Users }, // Future feature
  // { href: '/configuracoes', label: 'Configurações', icon: Settings }, // Future feature
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) {
    return null; // Don't render sidebar if not logged in (though layout should prevent this)
  }

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.label}>
          <Link href={item.href} asChild>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
              tooltip={item.label}
              aria-label={item.label}
              className="justify-start"
            >
              <span>
                <item.icon className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
              </span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

