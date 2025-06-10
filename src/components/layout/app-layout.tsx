"use client";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger, // This is usually placed in the Header or where needed
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons/logo';
import { SidebarNav } from './sidebar-nav';
import { Header } from './header';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar'; // Import useSidebar

function CustomSidebarTrigger() {
  const { toggleSidebar, open, isMobile } = useSidebar();
  if (isMobile) return null; // Handled by Header's SidebarTrigger for mobile

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="absolute top-3 right-3 hidden group-data-[collapsible=icon]:hidden md:flex"
      aria-label={open ? "Recolher barra lateral" : "Expandir barra lateral"}
    >
      {open ? <PanelLeftClose /> : <PanelLeftOpen />}
    </Button>
  );
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarHeader className="relative p-4">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <Logo />
            <span className="text-lg font-semibold text-primary group-data-[collapsible=icon]:hidden">
              Controle de Inventário
            </span>
          </div>
          <CustomSidebarTrigger/>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-4 group-data-[collapsible=icon]:hidden">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Controle de Inventário
          </p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 p-4 sm:p-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
