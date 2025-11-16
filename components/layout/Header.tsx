'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';

interface HeaderProps {
  orgSlug: string;
  orgName: string;
  userName?: string;
  userEmail?: string;
}

export function Header({ orgSlug, orgName, userName, userEmail }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-6 lg:hidden">
      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <AdminSidebar
            orgSlug={orgSlug}
            orgName={orgName}
            userName={userName}
            userEmail={userEmail}
          />
        </SheetContent>
      </Sheet>

      {/* Organization Name */}
      <div className="flex-1">
        <h2 className="text-lg font-semibold">{orgName}</h2>
      </div>

      {/* Notifications */}
      <Button variant="outline" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
          3
        </span>
        <span className="sr-only">View notifications</span>
      </Button>
    </header>
  );
}
