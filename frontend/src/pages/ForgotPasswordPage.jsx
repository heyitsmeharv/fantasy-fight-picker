import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ForgotPasswordPage = () => {
  return (
    <div className="mx-auto max-w-md">
      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardHeader>
          <CardTitle className="text-2xl uppercase tracking-[0.05em]">
            Forgot password
          </CardTitle>
          <p className="text-sm text-slate-400">
            Placeholder for the Cognito reset flow.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            This page is intentionally simple for now. Once Cognito is wired in,
            this becomes the real forgot password flow.
          </div>

          <Button
            asChild={false}
            className="w-full rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e]"
            onClick={() => window.history.back()}
          >
            Go back
          </Button>

          <div className="text-sm text-slate-400">
            <Link className="hover:text-white" to="/login">
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;