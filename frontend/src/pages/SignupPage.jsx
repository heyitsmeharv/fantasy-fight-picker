import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const SignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup, confirmSignup, resendSignupCode, login, loading } = useAuth();
  const { showToast } = useToast();

  const initialMode = useMemo(() => {
    return location.state?.mode === "confirm" ? "confirm" : "signup";
  }, [location.state]);

  const [mode, setMode] = useState(initialMode);

  const [form, setForm] = useState({
    name: "",
    email: location.state?.email || "",
    password: "",
    confirmPassword: "",
    confirmationCode: "",
  });

  const handleSignupSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      showToast({
        title: "Passwords do not match",
        description: "Please make sure both password fields are the same.",
        variant: "danger",
      });
      return;
    }

    try {
      const result = await signup({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      if (result.pendingConfirmation) {
        setMode("confirm");

        showToast({
          title: "Check your email",
          description:
            "Your account was created. Enter the confirmation code to finish sign-up.",
          variant: "success",
        });

        return;
      }

      showToast({
        title: "Account created",
        description: `Welcome to Fantasy Fight Picker, ${result.user.name}.`,
        variant: "success",
      });

      navigate("/my-picks");
    } catch (error) {
      if (error.code === "UsernameExistsException") {
        setMode("confirm");
      }

      showToast({
        title: "Sign up failed",
        description: error.message,
        variant: "danger",
      });
    }
  };

  const handleConfirmSubmit = async (event) => {
    event.preventDefault();

    try {
      await confirmSignup({
        email: form.email,
        code: form.confirmationCode,
      });

      showToast({
        title: "Account confirmed",
        description: "Your account is confirmed. Signing you in...",
        variant: "success",
      });

      if (form.password) {
        const nextUser = await login({
          email: form.email,
          password: form.password,
        });

        showToast({
          title: "Logged in",
          description: `Welcome, ${nextUser.name}.`,
          variant: "success",
        });

        navigate("/my-picks");
        return;
      }

      showToast({
        title: "Now log in",
        description: "Your account is confirmed. Use your password to sign in.",
        variant: "success",
      });

      navigate("/login", {
        state: {
          email: form.email,
        },
      });
    } catch (error) {
      showToast({
        title: "Confirmation failed",
        description: error.message,
        variant: "danger",
      });
    }
  };

  const handleResendCode = async () => {
    try {
      await resendSignupCode({
        email: form.email,
      });

      showToast({
        title: "Code resent",
        description: "A new confirmation code has been sent to your email.",
        variant: "success",
      });
    } catch (error) {
      showToast({
        title: "Could not resend code",
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
            {mode === "confirm" ? "Confirm account" : "Create account"}
          </CardTitle>
          <p className="text-sm text-slate-400">
            {mode === "confirm"
              ? "Enter the email code from Cognito to activate your account."
              : "Start making picks and tracking your results."}
          </p>
        </CardHeader>

        <CardContent>
          {mode === "signup" ? (
            <form className="space-y-5" onSubmit={handleSignupSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Name
                </label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                  placeholder="You"
                />
              </div>

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
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Confirm password
                </label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
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
                {loading ? "Creating account..." : "Create account"}
              </Button>

              <div className="text-sm text-slate-400">
                <button
                  type="button"
                  className="hover:text-white"
                  onClick={() => setMode("confirm")}
                >
                  Already have a confirmation code?
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleConfirmSubmit}>
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
                  Confirmation code
                </label>
                <input
                  type="text"
                  required
                  autoComplete="one-time-code"
                  value={form.confirmationCode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      confirmationCode: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                  placeholder="123456"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                  placeholder="Enter your password to auto-login after confirmation"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Optional, but recommended so we can sign you in straight after confirmation.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e] disabled:opacity-70"
              >
                {loading ? "Confirming..." : "Confirm account"}
              </Button>

              <div className="flex flex-col gap-2 text-sm text-slate-400">
                <button
                  type="button"
                  className="text-left hover:text-white"
                  onClick={handleResendCode}
                >
                  Resend code
                </button>

                <button
                  type="button"
                  className="text-left hover:text-white"
                  onClick={() => setMode("signup")}
                >
                  Back to sign up
                </button>
              </div>
            </form>
          )}

          <div className="mt-5 text-sm text-slate-400">
            <Link className="hover:text-white" to="/login">
              Already have an account? Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupPage;