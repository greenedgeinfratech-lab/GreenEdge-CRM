'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Company', href: '/settings/company' },
  { name: 'Branches', href: '/settings/branches' },
  { name: 'Departments', href: '/settings/departments' },
  { name: 'Designations', href: '/settings/designations' },
  { name: 'Employees', href: '/settings/employees' },
  { name: 'Roles & Permissions', href: '/settings/roles' },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Sidebar */}
      <div className="w-full md:w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 p-4">
        <h2 className="text-xl font-bold mb-4">Settings</h2>
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={classNames(
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
                    : 'text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md'
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 p-6 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
