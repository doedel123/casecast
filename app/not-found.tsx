import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="font-serif text-6xl font-semibold text-primary">404</p>
      <h1 className="mt-3 font-serif text-2xl">This page isn&apos;t on the docket</h1>
      <p className="mt-2 text-[14px] text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button render={<Link href="/" />} nativeButton={false} className="mt-6 rounded-full px-6">
        Back to the featured case
      </Button>
    </div>
  );
}
