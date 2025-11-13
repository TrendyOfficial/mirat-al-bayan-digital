import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'editor' | 'author';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, hasRole } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      if (!user) {
        setHasPermission(false);
        return;
      }

      if (requiredRole) {
        const roleCheck = await hasRole(requiredRole);
        setHasPermission(roleCheck);
      } else {
        setHasPermission(true);
      }
    };

    if (!isLoading) {
      checkPermission();
    }
  }, [user, isLoading, requiredRole, hasRole]);

  if (isLoading || hasPermission === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || hasPermission === false) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
