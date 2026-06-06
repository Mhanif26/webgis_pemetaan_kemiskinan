import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalAuth } from "@contracts/constants";
import { HandHeart } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState<string>(LocalAuth.defaultAdminEmail);
  const [password, setPassword] = useState<string>(LocalAuth.defaultAdminPassword);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      navigate("/");
    },
    onError: (error) => {
      setErrorMessage(error.message);
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_35%),linear-gradient(180deg,_#f8fafc,_#eef2ff)] p-4">
      <Card className="w-full max-w-md rounded-3xl border-0 shadow-2xl shadow-slate-900/10 backdrop-blur bg-white/90">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <HandHeart className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Masuk ke WebGIS</CardTitle>
          <CardDescription>
            Gunakan akun lokal dari tabel <span className="font-medium">users</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setErrorMessage(null);
              loginMutation.mutate({ identifier, password });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="identifier">Email atau username</Label>
              <Input
                id="identifier"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="admin@local.test"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {errorMessage ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            <Button className="w-full rounded-xl" size="lg" type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600 space-y-1">
            <p className="font-medium text-slate-700">Default akun lokal</p>
            <p>Email: {LocalAuth.defaultAdminEmail}</p>
            <p>Password: {LocalAuth.defaultAdminPassword}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
