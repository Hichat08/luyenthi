import { AppLoadingScreen } from "@/components/auth/AppLoadingScreen";
import { SigninForm } from "@/components/auth/signin-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

const SignInPage = () => {
  const navigate = useNavigate();
  const { accessToken, restoreSession } = useAuthStore();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (accessToken) {
      navigate("/home", { replace: true });
      setCheckingSession(false);
      return;
    }

    const tryRestoreSession = async () => {
      const restored = await restoreSession();

      if (restored) {
        navigate("/home", { replace: true });
        return;
      }

      setCheckingSession(false);
    };

    void tryRestoreSession();
  }, [accessToken, navigate, restoreSession]);

  if (checkingSession) {
    return <AppLoadingScreen message="Đang khôi phục phiên đăng nhập" />;
  }

  return (
    <AuthShell className="max-w-[30rem]">
      <SigninForm />
    </AuthShell>
  );
};

export default SignInPage;
