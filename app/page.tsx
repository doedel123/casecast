import Link from "next/link";
import { CaseExperience } from "@/components/case/case-experience";
import { getFeaturedCase } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await getFeaturedCase();

  if (!featured) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-24 text-center">
        <h1 className="font-serif text-3xl">No live case right now</h1>
        <p className="mt-3 text-muted-foreground">
          A new case will be featured here soon.{" "}
          <Link href="/cases" className="underline underline-offset-2">
            Browse past cases
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-5 md:pt-8">
      <CaseExperience caseRow={featured} />
      <p className="mt-8 text-center text-[13px] text-muted-foreground">
        Looking for more?{" "}
        <Link
          href="/cases"
          className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
        >
          Browse all cases
        </Link>
      </p>
    </div>
  );
}
