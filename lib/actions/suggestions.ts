"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { isMember } from "@/lib/queries";
import { rateLimit } from "@/lib/rate-limit";

const suggestionSchema = z.object({
  caseName: z.string().trim().min(3).max(200),
  court: z.string().trim().max(200).optional(),
  reason: z.string().trim().max(1000).optional(),
  sourceUrl: z.string().trim().url().max(500).optional(),
});

export type SuggestCaseResult = { ok: true } | { ok: false; error: string };

export async function suggestCase(input: {
  caseName: string;
  court?: string;
  reason?: string;
  sourceUrl?: string;
}): Promise<SuggestCaseResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "Please sign in first." };
  }
  if (!(await isMember(session.user.id))) {
    return { ok: false, error: "Suggesting cases is a membership feature." };
  }
  const parsed = suggestionSchema.safeParse({
    caseName: input.caseName,
    court: input.court || undefined,
    reason: input.reason || undefined,
    sourceUrl: input.sourceUrl || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please provide a case name (and a valid source URL, if any).",
    };
  }
  if (!rateLimit(`suggest:${session.user.id}`, { limit: 5, windowMs: 86_400_000 })) {
    return { ok: false, error: "You've reached the daily limit of 5 suggestions." };
  }
  await getDb().insert(schema.caseSuggestions).values({
    userId: session.user.id,
    caseName: parsed.data.caseName,
    court: parsed.data.court ?? null,
    reason: parsed.data.reason ?? null,
    sourceUrl: parsed.data.sourceUrl ?? null,
  });
  revalidatePath("/account");
  return { ok: true };
}
