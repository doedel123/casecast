"use server";

import { hash } from "bcryptjs";
import { and, eq, isNull, sql } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureAnonSession, readAnonSessionId } from "@/lib/anon-session";
import { auth, signIn, signOut } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { isMember } from "@/lib/queries";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request-meta";

const registerSchema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
  next: z.string().startsWith("/").optional(),
});

export type AuthActionResult = { error: string } | undefined;

export async function registerUser(
  _prev: AuthActionResult,
  formData: FormData,
): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse({
    name: (formData.get("name") as string) || undefined,
    email: formData.get("email"),
    password: formData.get("password"),
    next: (formData.get("next") as string) || undefined,
  });
  if (!parsed.success) {
    return {
      error:
        "Please enter a valid email address and a password of at least 8 characters.",
    };
  }
  const { name, email, password, next } = parsed.data;

  const meta = await getRequestMeta();
  if (!rateLimit(`register:${meta.ipHash}`, { limit: 5, windowMs: 300_000 })) {
    return { error: "Too many attempts. Please try again in a few minutes." };
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(sql`lower(${schema.users.email}) = ${email}`)
    .limit(1);
  if (existing) {
    return { error: "An account with this email already exists. Try signing in." };
  }

  const passwordHash = await hash(password, 10);
  const [user] = await db
    .insert(schema.users)
    .values({ email, passwordHash, name: name || null })
    .returning();

  // Link this device's anonymous votes to the fresh account.
  const anonId = await readAnonSessionId();
  if (anonId) {
    await db
      .update(schema.votes)
      .set({ userId: user.id })
      .where(
        and(
          eq(schema.votes.anonymousSessionId, anonId),
          isNull(schema.votes.userId),
        ),
      );
    await db
      .update(schema.anonymousSessions)
      .set({ claimedByUserId: user.id, claimedAt: new Date() })
      .where(eq(schema.anonymousSessions.id, anonId));
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { error: "Account created — please sign in." };
  }
  revalidatePath("/", "layout");
  redirect(next ?? "/account");
}

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
  next: z.string().startsWith("/").optional(),
});

export async function signInWithPassword(
  _prev: AuthActionResult,
  formData: FormData,
): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: (formData.get("next") as string) || undefined,
  });
  if (!parsed.success) return { error: "Please enter your email and password." };

  const meta = await getRequestMeta();
  if (!rateLimit(`signin:${meta.ipHash}`, { limit: 10, windowMs: 300_000 })) {
    return { error: "Too many attempts. Please try again in a few minutes." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { error: "Email or password is incorrect." };
  }
  revalidatePath("/", "layout");
  redirect(parsed.data.next ?? "/account");
}

export async function signOutAction() {
  await signOut({ redirect: false });
  revalidatePath("/", "layout");
  redirect("/");
}

export type FollowActionResult =
  | { ok: true; following: boolean }
  | { ok: false; error: "signin_required" | "membership_required" };

export async function toggleFollow(caseId: string): Promise<FollowActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "signin_required" };
  if (!(await isMember(userId))) {
    return { ok: false, error: "membership_required" };
  }
  const db = getDb();
  const [existing] = await db
    .select({ id: schema.caseFollows.id })
    .from(schema.caseFollows)
    .where(
      and(
        eq(schema.caseFollows.userId, userId),
        eq(schema.caseFollows.caseId, caseId),
      ),
    )
    .limit(1);
  if (existing) {
    await db
      .delete(schema.caseFollows)
      .where(eq(schema.caseFollows.id, existing.id));
  } else {
    await db
      .insert(schema.caseFollows)
      .values({ userId, caseId })
      .onConflictDoNothing();
  }
  revalidatePath("/account");
  return { ok: true, following: !existing };
}

/** Keeps the anon cookie alive for pre-registration flows (used by middleware-free setups). */
export async function touchAnonSession() {
  const meta = await getRequestMeta();
  await ensureAnonSession(meta);
}
