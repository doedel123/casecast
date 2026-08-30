import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "font-serif text-[1.3rem] font-semibold tracking-tight text-foreground",
        className,
      )}
      aria-label="Call the Case home"
    >
      Call<span className="font-normal italic text-foreground/55"> the </span>
      <span className="text-primary">Case</span>
      <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-primary align-[0.12em]" />
    </Link>
  );
}
