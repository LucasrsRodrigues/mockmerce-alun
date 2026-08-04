import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getToken, setToken, type Student } from './api';

interface AuthCtx {
  student: Student | null;
  loading: boolean;
  login: (rm: string, password: string) => Promise<boolean>; // retorna mustChangePassword
  logout: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null as any);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (getToken()) {
        try {
          setStudent(await api.auth.me());
        } catch {
          setToken(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (rm: string, password: string) => {
    const res = await api.auth.login(rm, password);
    setToken(res.token);
    setStudent(res.student);
    return res.mustChangePassword;
  };

  const logout = () => {
    setToken(null);
    setStudent(null);
  };

  const refresh = async () => setStudent(await api.auth.me());

  return <Ctx.Provider value={{ student, loading, login, logout, refresh }}>{children}</Ctx.Provider>;
}
