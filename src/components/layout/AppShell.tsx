import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, Boxes, ShoppingCart, GraduationCap, Settings, Store, LogOut, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/produtos', label: 'Produtos', icon: Package },
  { to: '/estoque', label: 'Estoque', icon: Boxes },
  { to: '/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { to: '/loja', label: 'Loja', icon: ShoppingBag },
  { to: '/ensino', label: 'Ensino', icon: GraduationCap },
  { to: '/config', label: 'Configurações', icon: Settings },
];

export default function AppShell() {
  const { student, logout } = useAuth();

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[240px_1fr] bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col border-r bg-background">
        <div className="flex h-14 items-center gap-2 border-b px-5 font-semibold">
          <Store className="size-5 text-primary" /> Loja FIAP
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground')
              }
            >
              <item.icon className="size-4" /> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-3 text-xs text-muted-foreground">
          <div className="font-medium text-foreground">{student?.group}</div>
          <div>{student?.name} · {student?.rm}</div>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex flex-col min-w-0">
        <header className="flex h-14 items-center justify-between border-b bg-background px-5">
          <div className="md:hidden flex items-center gap-2 font-semibold"><Store className="size-5 text-primary" /> Loja FIAP</div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right text-sm leading-tight">
              <div className="font-medium">{student?.name}</div>
              <div className="text-xs text-muted-foreground">{student?.group}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} title="Sair"><LogOut className="size-4" /></Button>
          </div>
        </header>
        <main className="flex-1 p-5 md:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
