import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Roles allowed to access this route. Empty = any authenticated user. */
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles = [] }: ProtectedRouteProps) => {
  const { data: userRole, isLoading } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      return { userId: user.id, role: data?.role ?? "viewer" };
    },
    staleTime: 10 * 60 * 1000, // Cache role for 10 minutes
    gcTime: 30 * 60 * 1000,
  });

  if (isLoading) return null;
  if (!userRole) return <Navigate to="/auth" replace />;

  // If specific roles are required, check access
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
