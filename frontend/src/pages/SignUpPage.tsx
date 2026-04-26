import { SignupForm } from "@/components/auth/signup-form";
import { AuthShell } from "@/components/auth/auth-shell";

const SignUpPage = () => {
  return (
    <AuthShell className="max-w-[32rem]">
        <SignupForm />
    </AuthShell>
  );
};

export default SignUpPage;
