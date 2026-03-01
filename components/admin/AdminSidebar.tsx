import Link from 'next/link';
import {
  BookOpen,
  Building2,
  Calendar,
  FileText,
  FolderGit2,
  Image,
  Layers,
  LayoutGrid,
  Settings,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { getSession } from '@/lib/admin/auth';
import { isSuperAdmin } from '@/lib/admin/permissions';

const navigation = [
  { name: 'Sites', href: '/admin/sites', icon: Building2 },
  { name: 'Site Settings', href: '/admin/site-settings', icon: SlidersHorizontal },
  { name: 'Content', href: '/admin/content', icon: FileText },
  { name: 'Services', href: '/admin/services', icon: FileText },
  // { name: 'Conditions', href: '/admin/conditions', icon: FileText }, // TCM-specific — removed for dental
  { name: 'Case Studies', href: '/admin/case-studies', icon: FileText },
  { name: 'Blog Posts', href: '/admin/blog-posts', icon: BookOpen },
  {
    name: 'Master Services',
    href: '/admin/shared-library/master-services',
    icon: FolderGit2,
  },
  {
    name: 'Site Voice Profiles',
    href: '/admin/shared-library/site-voice-profiles',
    icon: FolderGit2,
  },
  { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
  { name: 'Booking Settings', href: '/admin/booking-settings', icon: SlidersHorizontal },
  { name: 'Media', href: '/admin/media', icon: Image },
  { name: 'Components', href: '/admin/components', icon: LayoutGrid },
  { name: 'Variants', href: '/admin/variants', icon: Layers },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export async function AdminSidebar() {
  const session = await getSession();
  const isAdmin = session?.user ? isSuperAdmin(session.user) : false;
  const items = isAdmin ? navigation : navigation.filter((item) => item.name !== 'Users');
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <span className="text-lg font-semibold">Admin Dashboard</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
          >
            <item.icon className="w-4 h-4 text-gray-500" />
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
