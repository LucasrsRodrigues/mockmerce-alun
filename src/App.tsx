import { Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';
import Login from '@/pages/Login';
import ChangePassword from '@/pages/ChangePassword';
import CreateStore from '@/pages/CreateStore';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Inventory from '@/pages/Inventory';
import Orders from '@/pages/Orders';
import Store from '@/pages/Store';
import Teaching from '@/pages/Teaching';
import Profile from '@/pages/Profile';
import Config from '@/pages/Config';

function Protected({ children }: { children: React.ReactNode }) {
  const { student, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (!student) return <Navigate to="/login" replace />;
  if (student.mustChangePassword) return <Navigate to="/trocar-senha" replace />;
  // Aluno sem loja ainda: manda criar a dele antes de acessar o painel.
  if (!student.groupId) return <Navigate to="/criar-loja" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/trocar-senha" element={<ChangePassword />} />
      <Route path="/criar-loja" element={<CreateStore />} />
      <Route element={<Protected><AppShell /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="produtos" element={<Products />} />
        <Route path="estoque" element={<Inventory />} />
        <Route path="pedidos" element={<Orders />} />
        <Route path="loja" element={<Store />} />
        <Route path="ensino" element={<Teaching />} />
        <Route path="perfil" element={<Profile />} />
        <Route path="config" element={<Config />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
