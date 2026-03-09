import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextUser = signup(form);

    showToast({
      title: "Account created",
      description: `Welcome to Fantasy UFC, ${nextUser.name}.`,
      variant: "success",
    });

    navigate("/my-picks");
  };

  return (
    <div className="mx-auto max-w-md">
      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardHeader>
          <CardTitle className="text-2xl uppercase tracking-[0.05em]">
            Create account
          </CardTitle>
          <p className="text-sm text-slate-400">
            Start making picks and tracking your results.
          </p>
        </CardHeader>

        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder="Harv"
              />
            </div>

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
              Create account
            </Button>
          </form>

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