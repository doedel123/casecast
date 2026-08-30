import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const TABS = [
  { href: "/admin", label: "Cases" },
  { href: "/admin/settings", label: "Charity & donations" },
  { href: "/admin/votes", label: "Vote review" },
  { href: "/admin/audit", label: "Audit log" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin?next=/admin");
  if (session.user.role !== "admin") notFound();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl">Newsroom</h1>
        <nav className="flex flex-wrap gap-1 rounded-full border border-border bg-card p-1">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
