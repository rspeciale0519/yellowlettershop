import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  DollarSign,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export const adminNavItems: AdminNavItem[] = [
  { name: 'Admin Home', href: '/dashboard/admin', icon: LayoutDashboard },
  { name: 'User Management', href: '/dashboard/admin/users', icon: Users },
  { name: 'Order Management', href: '/dashboard/admin/orders', icon: ShoppingBag },
  { name: 'Pricing Management', href: '/dashboard/admin/pricing', icon: DollarSign },
  { name: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
  { name: 'System Settings', href: '/dashboard/admin/settings', icon: Settings },
];
