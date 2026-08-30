"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const LINKS = [
  { href: "/", label: "Featured case" },
  { href: "/cases", label: "All cases" },
  { href: "/membership", label: "Membership" },
  { href: "/impact", label: "Impact" },
];

const LEGAL = [
  { href: "/legal/editorial-policy", label: "Editorial policy" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
];

export function MobileMenu({
  isSignedIn,
  isAdmin,
}: {
  isSignedIn: boolean;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open menu"
          />
        }
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-background">
        <SheetHeader className="pb-0">
          <SheetTitle className="text-left font-serif text-xl tracking-tight">
            Call<span className="font-normal italic text-foreground/55"> the </span>
            <span className="text-primary">Case</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-foreground/85 transition-colors hover:bg-muted"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={isSignedIn ? "/account" : "/signin"}
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-foreground/85 transition-colors hover:bg-muted"
          >
            {isSignedIn ? "My account" : "Sign in"}
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-foreground/85 transition-colors hover:bg-muted"
            >
              Admin
            </Link>
          )}
          <Separator className="my-3" />
          {LEGAL.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
