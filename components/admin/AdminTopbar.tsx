'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut } from 'lucide-react';

export function AdminTopbar() {
  const router = useRouter();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    const loadSession = async () => {
      try {
        const response = await fetch('/api/admin/auth/session');
        if (!response.ok) return;
        const session = await response.json();
        if (active && session?.user?.role === 'super_admin') {
          setIsSuperAdmin(true);
        }
      } catch {
        // Ignore topbar session fetch errors.
      }
    };
    loadSession();
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/sites" className="text-sm text-gray-500 hover:text-gray-800">
          Dashboard
        </Link>
        {isSuperAdmin && (
          <Link
            href="/admin/qa-step3"
            className="px-3 py-1 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
          >
            Step 3 QA
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-gray-100" aria-label="Notifications">
          <Bell className="w-5 h-5 text-gray-500" />
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
