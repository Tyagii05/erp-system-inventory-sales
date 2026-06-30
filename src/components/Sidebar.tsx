import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  ShoppingCart,
  ClipboardList,
  FileText,
  Receipt,
  BarChart3,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} />, roles: ['ADMIN', 'SALES_EXEC', 'PURCHASE_MGR', 'INVENTORY_MGR', 'ACCOUNTANT'] },
  { path: '/products', label: 'Products', icon: <Package size={18} />, roles: ['ADMIN', 'INVENTORY_MGR', 'SALES_EXEC'] },
  { path: '/customers', label: 'Customers', icon: <Users size={18} />, roles: ['ADMIN', 'SALES_EXEC'] },
  { path: '/suppliers', label: 'Suppliers', icon: <Truck size={18} />, roles: ['ADMIN', 'PURCHASE_MGR'] },
  { path: '/sales-orders', label: 'Sales Orders', icon: <ShoppingCart size={18} />, roles: ['ADMIN', 'SALES_EXEC'] },
  { path: '/purchase-orders', label: 'Purchase Orders', icon: <ClipboardList size={18} />, roles: ['ADMIN', 'PURCHASE_MGR'] },
  { path: '/grns', label: 'GRN', icon: <FileText size={18} />, roles: ['ADMIN', 'INVENTORY_MGR', 'PURCHASE_MGR'] },
  { path: '/invoices', label: 'Invoices', icon: <Receipt size={18} />, roles: ['ADMIN', 'ACCOUNTANT', 'SALES_EXEC'] },
  { path: '/reports', label: 'Reports', icon: <BarChart3 size={18} />, roles: ['ADMIN', 'ACCOUNTANT'] },
];

export default function Sidebar() {
  const { user } = useAuth();
  const userRole = user?.role || 'INVENTORY_MGR';

  const allowedItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <nav className="p-3 space-y-1">
      {allowedItems.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
