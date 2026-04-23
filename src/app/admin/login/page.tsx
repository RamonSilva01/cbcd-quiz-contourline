"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContourlineMark } from "@/components/brand/contourline-mark";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = React.useMemo(() => createClient(), []);
  const redirectTo = params.get("redirect") || "/admin";
  const urlError = params.get("error");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(
    urlError === "not_admin"
      ? "Este e-mail não tem acesso ao painel administrativo."
      : null,
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bone-100)] px-6">
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <ContourlineMark variant="full" tone="navy" width={160} height={36} />
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-clinical)]">
          <h1 className="mb-2 font-display text-2xl leading-tight">
            Painel administrativo
          </h1>
          <p className="mb-8 text-sm text-[var(--color-clinical-500)]">
            CBCD 2026 · Contourline
          </p>

          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div>
              <Label htmlFor="email" className="mb-2 block">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="password" className="mb-2 block">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-[var(--radius-md)] border border-[var(--destructive)]/40 bg-[var(--destructive)]/5 p-3 text-sm text-[var(--destructive)]"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--color-clinical-500)]">
          Acesso restrito à equipe Contourline.
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
