import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

interface AdminContextValue {
  isAdmin: boolean;
  isLoading: boolean;
  adminRole: string | null;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminRole, setAdminRole] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdmin(false);
        setAdminRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error || !data) {
          setIsAdmin(false);
          setAdminRole(null);
        } else {
          setIsAdmin(true);
          setAdminRole(data.role);
        }
      } catch {
        setIsAdmin(false);
        setAdminRole(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminStatus();
  }, [user]);

  return (
    <AdminContext.Provider value={{ isAdmin, isLoading, adminRole }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
