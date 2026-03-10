import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    email: location.state?.email || "",
    password: "",
  });

  const redirectPath =
    typeof location.state?.from === "string"
      ? location.state.from
      : location.state?.from?.pathname || "/my-picks";

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const nextUser = await login(form);

      showToast({
        title: "Logged in",
        description: `Welcome back, ${nextUser.name}.`,
        variant: "success",
      });

      navigate(redirectPath);
    } catch (error) {
      if (error.code === "UserNotConfirmedException") {
        showToast({
          title: "Confirm your account",
          description: "Enter the code from your email to finish sign-up.",
          variant: "danger",
        });

        navigate("/signup", {
          state: {
            mode: "confirm",
            email: form.email,
          },
        });
        return;
      }

      showToast({
        title: "Login failed",
        description: error.message,
        variant: "danger",
      });
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardHeader>
          <CardTitle className="text-2xl uppercase tracking-[0.05em]">
            Log in
          </CardTitle>
          <p className="text-sm text-slate-400">
            Sign in with your Fantasy UFC account.
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
                autoComplete="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e] disabled:opacity-70"
            >
              {loading ? "Logging in..." : "Log in"}
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