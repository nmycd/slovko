import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-2xl font-black tracking-tight text-brand">
      <span
        aria-hidden
        className="grid size-9 place-items-center rounded-xl bg-brand text-lg text-white shadow-[0_3px_0_var(--brand-dark)]"
      >
        S
      </span>
      slovko
    </Link>
  );
}
