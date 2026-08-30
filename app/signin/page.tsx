import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ next }, session] = await Promise.all([searchParams, auth()]);
  if (session?.user) redirect(next?.startsWith("/") ? next : "/account");

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-12">
      <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
        <h1 className="mb-6 text-center font-serif text-2xl">Welcome back</h1>
        <SignInForm next={next?.startsWith("/") ? next : undefined} />
      </div>
    </div>
  );
}
