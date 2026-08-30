export function ContentWarning({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p className="rounded-xl border border-result-amber/30 bg-result-amber/8 px-4 py-3 text-[13px] leading-relaxed text-foreground/75">
      <span className="font-semibold text-foreground/85">Content note: </span>
      {text}
    </p>
  );
}
