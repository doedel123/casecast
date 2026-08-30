export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <h1 className="font-serif text-3xl md:text-4xl">{title}</h1>
      <p className="mt-1.5 text-[12.5px] text-muted-foreground">
        Last updated {updated}
      </p>
      <div className="prose-legal mt-6 space-y-5 text-[14.5px] leading-relaxed text-foreground/85 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:mt-7 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        {children}
      </div>
    </div>
  );
}
