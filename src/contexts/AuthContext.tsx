import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  userRole: string | null;
  isAdmin: boolean;
  shopName: string | null;
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  isLoading: true,
  userRole: null,
  isAdmin: false,
  shopName: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Single cached query for user role — shared across ProtectedRoute, Layout, etc.
  const { data: roleData } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      return data?.role ?? "viewer";
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Single cached query for shop name — eliminates duplicate fetch in Layout
  const { data: shopName } = useQuery({
    queryKey: ["shop-name", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("settings")
        .select("dealer_name")
        .eq("user_id", user.id)
        .maybeSingle();
      return data?.dealer_name ?? null;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const value = useMemo<AuthState>(
    () => ({
      user,
      session,
      isLoading,
      userRole: roleData ?? null,
      isAdmin: roleData === "admin",
      shopName: shopName ?? null,
    }),
    [user, session, isLoading, roleData, shopName]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
