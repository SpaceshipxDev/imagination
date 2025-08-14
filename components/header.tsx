'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: '/manager', label: 'Manager' },
    { href: '/employee', label: 'Employee' }
  ];

  return (
    <header className="border-b bg-white">
      <nav className="max-w-4xl mx-auto flex h-12 items-center gap-6 px-6">
        {navItems.map(item => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm transition-colors hover:text-gray-900 ${
                isActive ? 'text-gray-900 font-medium' : 'text-gray-500'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

