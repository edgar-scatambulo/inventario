
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
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { href: '/equipamentos', label: 'Equipamentos', icon: Package, adminOnly: false },
  { href: '/setores', label: 'Setores', icon: Warehouse, adminOnly: false },
  { href: '/conferencia', label: 'Conferência', icon: ScanBarcode, adminOnly: false },
  { href: '/relatorios', label: 'Relatórios', icon: FileText, adminOnly: false },
  // { href: '/usuarios', label: 'Usuários', icon: Users, adminOnly: true },
  // { href: '/configuracoes', label: 'Configurações', icon: Settings, adminOnly: true },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (!user) {
    return null;
  }

  const accessibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <SidebarMenu>
      {accessibleNavItems.map((item) => (
        <SidebarMenuItem key={item.label}>
           <SidebarMenuButton
            asChild
            isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
            tooltip={item.label}
            aria-label={item.label}
            className={cn(
              "justify-start",
              "group-data-[collapsible=icon]:justify-center"
            )}
          >
            <Link href={item.href}>
              <span className="flex items-center gap-2">
                <item.icon />
                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
              </span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
