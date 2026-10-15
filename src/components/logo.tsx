import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-serif text-2xl font-medium tracking-tight text-brand">
      <span
        aria-hidden
        className="grid size-9 place-items-center rounded-full bg-lichen text-lg text-brand"
      >
        S
      </span>
      slovko
    </Link>
  );
}
