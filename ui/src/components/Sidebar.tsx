import { useState } from 'react';
import { NavLink } from 'react-router';
import {
  CalendarCheck,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { UserProfile } from '../stores/authStore';
import Avatar from './Avatar';

interface SidebarProps {
  user: UserProfile | null;
}

export default function Sidebar({
  user,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isPrivileged = user?.role === 'admin' || user?.role === 'hrd';
  const displayName = user?.full_name || user?.email || 'Profile';
  const collapseLabel = isCollapsed ? 'Expand sidebar' : 'Minimize sidebar';
  const CollapseIcon = isCollapsed ? ChevronRight : ChevronLeft;

  const navItems = [
    {
      id: 'attendance' as const,
      label: 'Attendance',
      icon: CalendarCheck,
      show: user?.role !== 'admin',
    },
    {
      id: 'employees' as const,
      label: 'Employees',
      icon: Users,
      show: isPrivileged,
    },
  ];

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col bg-supporting-2 border-r border-white/5 transition-all duration-300 ease-in-out select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div
        className={`h-14 flex items-center ${
          isCollapsed ? 'justify-center' : 'justify-end'
        } px-3`}
      >
        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="p-1.5 rounded-lg text-supporting hover:text-secondary hover:bg-white/5 transition cursor-pointer"
          title={collapseLabel}
          aria-label={collapseLabel}
        >
          <CollapseIcon className="w-5 h-5" />
        </button>
      </div>

      <nav className="p-3 space-y-1.5 flex-1">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.id}
                to={`/${item.id}`}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-primary text-secondary shadow-sm'
                    : 'text-supporting hover:text-secondary hover:bg-white/5'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
      </nav>

      <div className="p-3 border-t border-white/5">
        <NavLink
          to="/profile"
          title={isCollapsed ? displayName : undefined}
          className={({ isActive }) => `w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition cursor-pointer ${
            isActive
              ? 'bg-primary text-secondary shadow-sm'
              : 'text-supporting hover:text-secondary hover:bg-white/5'
          } ${isCollapsed ? 'justify-center' : ''}`}
        >
          <Avatar />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary truncate">
                {displayName}
              </p>
              <p className="text-xs text-supporting capitalize truncate">
                {user?.role || 'Member'}
              </p>
            </div>
          )}
        </NavLink>
      </div>
    </aside>
  );
}
