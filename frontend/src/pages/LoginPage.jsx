import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    email: "",
  });

  const redirectPath = location.state?.from || "/my-picks";

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextUser = login(form);

    showToast({
      title: "Logged in",
      description: `Welcome back, ${nextUser.name}.`,
      variant: "success",
    });

    navigate(redirectPath);
  };

  return (
    <div className="mx-auto max-w-md">
      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardHeader>
          <CardTitle className="text-2xl uppercase tracking-[0.05em]">
            Log in
          </CardTitle>
          <p className="text-sm text-slate-400">
            Mock auth for now. We’ll swap this for Cognito later.
          </p>
        </CardHeader>

        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder="you@example.com"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e]"
            >
              Log in
            </Button>
          </form>

          <div className="mt-5 flex flex-col gap-2 text-sm text-slate-400">
            <Link className="hover:text-white" to="/signup">
              Need an account? Sign up
            </Link>
            <Link className="hover:text-white" to="/forgot-password">
              Forgot password?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;