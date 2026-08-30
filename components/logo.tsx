import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "font-serif text-[1.35rem] font-semibold tracking-tight text-foreground",
        className,
      )}
      aria-label="CaseCast home"
    >
      Case<span className="text-primary">Cast</span>
      <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-primary align-[0.12em]" />
    </Link>
  );
}
