import { AppLoadingScreen } from "@/components/auth/AppLoadingScreen";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

const ProtectedRoute = () => {
  const { accessToken, loading, refresh, fetchMe } = useAuthStore();
  const [starting, setStarting] = useState(true);

  const init = async () => {
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
  };

  useEffect(() => {
    init();
  }, []);

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

  return <Outlet></Outlet>;
};

export default ProtectedRoute;
