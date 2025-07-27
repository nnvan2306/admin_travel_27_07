import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import type { RootState } from "@/store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRouteRole({ children, allowedRoles }: ProtectedRouteProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const loading = useSelector((state: RootState) => state.auth.loading);
  const location = useLocation();

  if (loading) return null;

  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return <Navigate to="/notfound" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
