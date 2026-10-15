/** Renders text with **highlighted** parts (e.g. word endings in grammar cards). */
export function RichText({ text }: { text: string }) {
  const parts = text.split("**");
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="rounded-sm bg-lichen-soft px-0.5 font-semibold text-brand">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}
