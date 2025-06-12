
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
    return null;
  }

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.label}>
          <Link href={item.href}>
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
              {/* A tag <a> foi removida daqui. Link com asChild cuidará disso. */}
              <span>
                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                <item.icon />
              </span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
