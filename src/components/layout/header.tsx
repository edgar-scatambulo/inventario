"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation';
import { navItemsMap } from './nav-items-map';


export function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const getPageTitle = () => {
    const currentNavItem = navItemsMap.find(item => pathname.startsWith(item.href));
    return currentNavItem ? currentNavItem.label : "Controle de Inventário";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="hidden md:block">
        {/* Optional: A fixed trigger if sidebar is collapsible=offcanvas and you want trigger outside */}
      </div>
      <h1 className="text-xl font-semibold text-foreground">{getPageTitle()}</h1>
      <div className="ml-auto flex items-center gap-4">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={`https://avatar.vercel.sh/${user.username}.png`} alt={user.username} data-ai-hint="user avatar" />
                  <AvatarFallback>
                    {user.username ? user.username.substring(0, 2).toUpperCase() : <UserCircle />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-foreground">
                    {user.username}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    Usuário
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 hover:!text-red-700 focus:!bg-red-100 focus:!text-red-700">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
