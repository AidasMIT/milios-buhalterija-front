import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Plus, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Building2,
  BarChart3,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ProfileSwitcher } from '@/components/ProfileSwitcher';
import { useLogout, useMe } from '@/hooks/use-auth';

const navigation = [
  { name: 'Apžvalga', href: '/', icon: LayoutDashboard },
  { name: 'Sąskaitos', href: '/invoices', icon: FileText },
  { name: 'Nauja sąskaita', href: '/invoices/new', icon: Plus },
  { name: 'Įmonės', href: '/companies', icon: Building2 },
  { name: 'Statistika', href: '/statistics', icon: BarChart3 },
  { name: 'Nustatymai', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const logout = useLogout();

  const handleLogout = () => logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) });

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 shadow-card',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className={cn(
          'flex items-center gap-3 border-b border-border px-4 h-16',
          collapsed && 'justify-center px-2'
        )}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Receipt className="h-5 w-5" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-foreground">
              Buhalterija
            </span>
          )}
        </div>

        {/* Profile Switcher */}
        {!collapsed && (
          <div className="border-b border-border p-3">
            <ProfileSwitcher />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User, logout, collapse */}
        <div className="border-t border-border p-3 space-y-2">
          {!collapsed && me?.email && (
            <p className="truncate px-3 text-xs text-muted-foreground" title={me.email}>{me.email}</p>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={cn('w-full justify-start gap-2 text-muted-foreground hover:text-foreground', collapsed && 'justify-center px-2')}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Atsijungti</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn('w-full', collapsed && 'px-2')}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Sutraukti</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
