import Link from "next/link";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { MobileMenu } from "@/components/mobile-menu";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/cases", label: "Cases" },
  { href: "/membership", label: "Membership" },
  { href: "/impact", label: "Impact" },
];

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user ?? null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-3 px-4 md:max-w-5xl md:px-6">
        <div className="flex items-center gap-2">
          <MobileMenu
            isSignedIn={Boolean(user)}
            isAdmin={user?.role === "admin"}
          />
          <Logo />
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button
              render={<Link href="/account" />} nativeButton={false}
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              Account
            </Button>
          ) : (
            <Button
              render={<Link href="/signin" />} nativeButton={false}
              size="sm"
              className="rounded-full px-4"
            >
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
