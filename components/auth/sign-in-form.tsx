"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { signInWithPassword, type AuthActionResult } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignInForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState<
    AuthActionResult,
    FormData
  >(signInWithPassword, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {state?.error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/8 px-3.5 py-2.5 text-[13px] text-destructive">
          {state.error}
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="h-11"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11"
        />
      </div>
      <Button
        type="submit"
        disabled={isPending}
        className="h-11 w-full rounded-full text-[15px] font-semibold"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
      </Button>
      <p className="text-center text-[13px] text-muted-foreground">
        New to CaseCast?{" "}
        <Link
          href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          className="font-medium text-foreground underline underline-offset-2"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
