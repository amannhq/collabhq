// app/(auth)/layout.tsx
import { ReactNode } from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f3f1ea]">
      {/* Brand Header */}
      <header className="border-b border-zinc-200/50 bg-[#f3f1ea]">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900">
              Collab
            </h1>
          </Link>
        </nav>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-6xl">
          {children}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-zinc-200/50 bg-[#f3f1ea]">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-zinc-600">© 2024 Collab. Built for creator-first teams.</p>
        </div>
      </footer>
    </div>
  );
}
