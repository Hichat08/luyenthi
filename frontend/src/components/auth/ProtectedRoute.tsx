import type { UserRole } from "@/types/user";
import { AppLoadingScreen } from "@/components/auth/AppLoadingScreen";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCallback, useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

type ProtectedRouteProps = {
  allowedRoles?: UserRole[];
};

const resolveFallbackPath = (role?: UserRole) => (role === "admin" ? "/admin" : "/home");

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { accessToken, loading, refresh, fetchMe } = useAuthStore();
  const [starting, setStarting] = useState(true);

  const init = useCallback(async () => {
    try {
      const authState = useAuthStore.getState();

      if (!authState.accessToken) {
        await refresh();
      }

      const resolvedState = useAuthStore.getState();

      if (resolvedState.accessToken && (!resolvedState.user || !resolvedState.user.userCode)) {
        await fetchMe();
      }
    } finally {
      setStarting(false);
    }
  }, [fetchMe, refresh]);

  useEffect(() => {
    init();
  }, [init]);

  if (starting || loading) {
    return <AppLoadingScreen message="Đang tải trang..." />;
  }

  if (!accessToken && !useAuthStore.getState().accessToken) {
    return (
      <Navigate
        to="/signin"
        replace
      />
    );
  }

  const user = useAuthStore.getState().user;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={resolveFallbackPath(user.role)}
        replace
      />
    );
  }

  return <Outlet></Outlet>;
};

export default ProtectedRoute;
