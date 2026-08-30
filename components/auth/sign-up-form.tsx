"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { registerUser, type AuthActionResult } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignUpForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState<
    AuthActionResult,
    FormData
  >(registerUser, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {state?.error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/8 px-3.5 py-2.5 text-[13px] text-destructive">
          {state.error}
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="name">Name (optional)</Label>
        <Input id="name" name="name" autoComplete="name" className="h-11" />
      </div>
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
          autoComplete="new-password"
          required
          minLength={8}
          className="h-11"
        />
        <p className="text-[12px] text-muted-foreground">At least 8 characters.</p>
      </div>
      <Button
        type="submit"
        disabled={isPending}
        className="h-11 w-full rounded-full text-[15px] font-semibold"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
      </Button>
      <p className="text-center text-[12.5px] leading-relaxed text-muted-foreground">
        Predictions you made on this device are added to your new account. By
        continuing you agree to our{" "}
        <Link href="/legal/terms" className="underline underline-offset-2">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/legal/privacy" className="underline underline-offset-2">
          privacy policy
        </Link>
        .
      </p>
      <p className="text-center text-[13px] text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={next ? `/signin?next=${encodeURIComponent(next)}` : "/signin"}
          className="font-medium text-foreground underline underline-offset-2"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
