import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getResults, getViewer, getViewerVote } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * Live results, strictly gated: only viewers who have already voted on this
 * case (or admins) can read the aggregates.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const [viewer, session] = await Promise.all([getViewer(), auth()]);
  const isAdmin = session?.user?.role === "admin";
  if (!isAdmin) {
    const vote = await getViewerVote(id, viewer);
    if (!vote) {
      return NextResponse.json(
        { error: "vote_required", message: "Results unlock after you cast your prediction." },
        { status: 403 },
      );
    }
  }

  const results = await getResults(id);
  return NextResponse.json(results, {
    headers: { "Cache-Control": "no-store" },
  });
}
