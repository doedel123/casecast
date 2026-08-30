import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseExperience } from "@/components/case/case-experience";
import { auth } from "@/lib/auth";
import { getCaseBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const caseRow = await getCaseBySlug(slug);
  if (!caseRow || caseRow.status === "draft") return { title: "Case" };
  return {
    title: caseRow.title,
    description: caseRow.question,
  };
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caseRow = await getCaseBySlug(slug);
  if (!caseRow) notFound();

  if (caseRow.status === "draft") {
    const session = await auth();
    if (session?.user?.role !== "admin") notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-5 md:pt-8">
      {caseRow.status === "draft" && (
        <p className="mb-4 rounded-xl border border-result-amber/40 bg-result-amber/10 px-4 py-2.5 text-[13px] font-medium text-foreground/80">
          Admin preview — this case is a draft and not visible to the public.
        </p>
      )}
      <CaseExperience caseRow={caseRow} />
    </div>
  );
}
